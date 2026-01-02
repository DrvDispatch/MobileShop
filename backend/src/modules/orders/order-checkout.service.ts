/**
 * Order Checkout Service
 * 
 * Handles Stripe checkout session creation.
 * Manages cart validation, discount codes, shipping calculation.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';
import { CreateCheckoutDto, FulfillmentType } from './dto';

@Injectable()
export class OrderCheckoutService {
    private readonly logger = new Logger(OrderCheckoutService.name);
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            this.logger.warn('STRIPE_SECRET_KEY not configured');
        }
        this.stripe = new Stripe(stripeKey || '');
    }

    generateOrderNumber(): string {
        const prefix = 'ND';
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    }

    async createCheckoutSession(tenantId: string, dto: CreateCheckoutDto) {
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Cart is empty');
        }

        // Validate products exist and get current prices (tenant-scoped)
        const productIds = dto.items.map(item => item.productId);
        const products = await this.prisma.product.findMany({
            where: { tenantId, id: { in: productIds }, isActive: true },
        });

        if (products.length !== dto.items.length) {
            throw new BadRequestException('One or more products are not available');
        }

        // Validate stock availability
        const insufficientStock: string[] = [];
        for (const item of dto.items) {
            const product = products.find(p => p.id === item.productId);
            if (product && product.stockQty < item.quantity) {
                insufficientStock.push(
                    `${product.name}: requested ${item.quantity}, only ${product.stockQty} in stock`
                );
            }
        }

        if (insufficientStock.length > 0) {
            throw new BadRequestException(
                `Insufficient stock: ${insufficientStock.join('; ')}`
            );
        }

        // Calculate subtotal
        const subtotal = dto.items.reduce((sum, item) => {
            const product = products.find(p => p.id === item.productId);
            return sum + (Number(product!.price) * item.quantity);
        }, 0);

        // Validate and apply discount code
        const discountResult = await this.calculateDiscount(dto.discountCodeId, subtotal);

        // Shipping: €5.95 for Belgium, €9.95 for other EU, €0 for pickup
        let shippingAmount = 0;
        if (dto.fulfillmentType === FulfillmentType.SHIPPING) {
            const country = dto.shippingAddress?.country?.toUpperCase() || 'BE';
            shippingAmount = country === 'BE' ? 5.95 : 9.95;
        }

        // VAT is already included in prices (Belgian standard 21%)
        const taxAmount = 0;
        const total = subtotal - discountResult.discountAmount + shippingAmount;

        // Create order in database (with tenantId)
        const order = await this.prisma.order.create({
            data: {
                tenantId,
                orderNumber: this.generateOrderNumber(),
                status: 'PENDING',
                fulfillmentType: dto.fulfillmentType || FulfillmentType.SHIPPING,
                subtotal,
                taxAmount,
                shippingAmount,
                discountAmount: discountResult.discountAmount,
                total,
                customerEmail: dto.customerEmail,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                shippingAddress: dto.shippingAddress ? JSON.parse(JSON.stringify(dto.shippingAddress)) : undefined,
                discountCodeId: discountResult.discountCodeId,
                items: {
                    create: dto.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return {
                            product: { connect: { id: item.productId } },
                            productName: product!.name,
                            productSku: product!.sku || null,
                            productImage: item.image || null,
                            quantity: item.quantity,
                            unitPrice: Number(product!.price),
                            totalPrice: Number(product!.price) * item.quantity,
                        };
                    }),
                },
            },
        });

        // Create Stripe checkout session
        const session = await this.createStripeSession(
            order, dto, products, discountResult, shippingAmount, tenantId
        );

        // Update order with Stripe session ID
        await this.prisma.order.update({
            where: { id: order.id },
            data: { stripeSessionId: session.id },
        });

        return {
            checkoutUrl: session.url!,
            sessionId: session.id,
        };
    }

    private async calculateDiscount(discountCodeId: string | undefined, subtotal: number) {
        let discountAmount = 0;
        let discountCode: { id: string; code: string; type: string; value: number } | null = null;

        if (discountCodeId) {
            const discount = await this.prisma.discountCode.findUnique({
                where: { id: discountCodeId },
            });

            if (discount && discount.isActive) {
                const now = new Date();
                const isValid =
                    (!discount.startsAt || now >= discount.startsAt) &&
                    (!discount.expiresAt || now <= discount.expiresAt) &&
                    (!discount.usageLimit || discount.usageCount < discount.usageLimit) &&
                    (!discount.minOrderAmount || subtotal >= Number(discount.minOrderAmount));

                if (isValid) {
                    discountCode = {
                        id: discount.id,
                        code: discount.code,
                        type: discount.type,
                        value: Number(discount.value),
                    };

                    if (discount.type === 'PERCENTAGE') {
                        discountAmount = subtotal * (Number(discount.value) / 100);
                        if (discount.maxDiscount && discountAmount > Number(discount.maxDiscount)) {
                            discountAmount = Number(discount.maxDiscount);
                        }
                    } else {
                        discountAmount = Number(discount.value);
                        if (discountAmount > subtotal) {
                            discountAmount = subtotal;
                        }
                    }
                    discountAmount = Math.round(discountAmount * 100) / 100;
                    this.logger.log(`Applied discount ${discount.code}: -€${discountAmount}`);
                }
            }
        }

        return {
            discountAmount,
            discountCodeId: discountCode?.id || null,
            discountCode,
        };
    }

    private async createStripeSession(
        order: { id: string; orderNumber: string },
        dto: CreateCheckoutDto,
        products: any[],
        discountResult: { discountAmount: number; discountCode: { id: string; code: string } | null },
        shippingAmount: number,
        tenantId: string,
    ): Promise<Stripe.Checkout.Session> {
        // === MULTI-TENANT SaaS ARCHITECTURE ===
        // Stripe success/cancel URLs MUST point to the PLATFORM domain (servicespulse.com)
        // NOT to tenant domains. The platform resolves tenant context and redirects.

        // Get tenant's primary domain for post-payment redirect (stored in metadata)
        const tenantDomain = await this.prisma.tenantDomain.findFirst({
            where: { tenantId, isPrimary: true },
            select: { domain: true },
        });

        // Use explicit Stripe URLs from env, or construct from PLATFORM_FRONTEND_URL
        const platformUrl = this.configService.get<string>('PLATFORM_FRONTEND_URL')
            || this.configService.get<string>('FRONTEND_URL')
            || 'http://localhost:3000';

        const successUrl = this.configService.get<string>('STRIPE_SUCCESS_URL')
            || `${platformUrl}/checkout/success`;
        const cancelUrl = this.configService.get<string>('STRIPE_CANCEL_URL')
            || `${platformUrl}/cart`;

        this.logger.log(`Stripe checkout: successUrl=${successUrl}, tenant=${tenantDomain?.domain || 'none'}`);

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = dto.items.map(item => {
            const product = products.find(p => p.id === item.productId);
            return {
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product!.name,
                        description: product!.description?.substring(0, 500) || undefined,
                    },
                    unit_amount: Math.round(Number(product!.price) * 100),
                },
                quantity: item.quantity,
            };
        });

        // Add shipping if applicable
        if (shippingAmount > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: { name: 'Verzending' },
                    unit_amount: Math.round(shippingAmount * 100),
                },
                quantity: 1,
            });
        }

        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: lineItems,
            customer_email: dto.customerEmail,
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                discountCodeId: discountResult.discountCode?.id || '',
                tenantId: tenantId,
                // Store tenant domain for post-payment redirect resolution
                tenantDomain: tenantDomain?.domain || '',
            },
            // IMPORTANT: Always redirect to PLATFORM domain, not tenant
            // Platform resolves tenant and redirects user to correct shop
            success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${cancelUrl}?cancelled=true`,
        };

        // Apply discount as a coupon in Stripe
        if (discountResult.discountAmount > 0 && discountResult.discountCode) {
            const stripeCoupon = await this.stripe.coupons.create({
                amount_off: Math.round(discountResult.discountAmount * 100),
                currency: 'eur',
                name: `Korting: ${discountResult.discountCode.code}`,
                max_redemptions: 1,
                duration: 'once',
            });
            sessionParams.discounts = [{ coupon: stripeCoupon.id }];
        }

        try {
            return await this.stripe.checkout.sessions.create(sessionParams);
        } catch (stripeError) {
            this.logger.error(`Stripe checkout session creation failed: ${stripeError}`);

            // Clean up orphan order
            try {
                await this.prisma.order.delete({ where: { id: order.id } });
                this.logger.log(`Cleaned up orphan order ${order.orderNumber} after Stripe failure`);
            } catch (cleanupError) {
                this.logger.error(`Failed to cleanup order ${order.orderNumber}: ${cleanupError}`);
            }

            throw new BadRequestException('Failed to create checkout session. Please try again.');
        }
    }
}
