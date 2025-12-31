import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InvoiceService } from '../invoice/invoice.service';
import Stripe from 'stripe';
import { CreateCheckoutDto, FulfillmentType } from './dto';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private emailService: EmailService,
        private invoiceService: InvoiceService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            this.logger.warn('STRIPE_SECRET_KEY not configured');
        }
        this.stripe = new Stripe(stripeKey || '');
    }

    private generateOrderNumber(): string {
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

        // Validate stock availability for all items
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
        let discountAmount = 0;
        let discountCodeId: string | null = null;
        let discountCode: { id: string; code: string; type: string; value: number } | null = null;

        if (dto.discountCodeId) {
            const discount = await this.prisma.discountCode.findUnique({
                where: { id: dto.discountCodeId },
            });

            if (discount && discount.isActive) {
                const now = new Date();
                const isValid =
                    (!discount.startsAt || now >= discount.startsAt) &&
                    (!discount.expiresAt || now <= discount.expiresAt) &&
                    (!discount.usageLimit || discount.usageCount < discount.usageLimit) &&
                    (!discount.minOrderAmount || subtotal >= Number(discount.minOrderAmount));

                if (isValid) {
                    discountCodeId = discount.id;
                    discountCode = {
                        id: discount.id,
                        code: discount.code,
                        type: discount.type,
                        value: Number(discount.value),
                    };

                    // Calculate discount
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

        // Shipping: €5.95 for Belgium, €9.95 for other EU, €0 for pickup
        let shippingAmount = 0;
        if (dto.fulfillmentType === FulfillmentType.SHIPPING) {
            const country = dto.shippingAddress?.country?.toUpperCase() || 'BE';
            shippingAmount = country === 'BE' ? 5.95 : 9.95;
        }

        // VAT is already included in prices (Belgian standard 21%)
        const taxAmount = 0;
        const total = subtotal - discountAmount + shippingAmount;

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
                discountAmount,
                total,
                customerEmail: dto.customerEmail,
                customerName: dto.customerName,
                customerPhone: dto.customerPhone,
                shippingAddress: dto.shippingAddress ? JSON.parse(JSON.stringify(dto.shippingAddress)) : undefined,
                discountCodeId: discountCodeId,
                items: {
                    create: dto.items.map(item => {
                        const product = products.find(p => p.id === item.productId);
                        return {
                            product: {
                                connect: { id: item.productId }
                            },
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
        const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';

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
                    product_data: {
                        name: 'Verzending',
                    },
                    unit_amount: Math.round(shippingAmount * 100),
                },
                quantity: 1,
            });
        }

        // Create Stripe session with discount if applicable
        // Include tenantId in metadata for debugging and safety validation
        const sessionParams: Stripe.Checkout.SessionCreateParams = {
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: lineItems,
            customer_email: dto.customerEmail,
            metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                discountCodeId: discountCodeId || '',
                tenantId: tenantId,  // Belt & suspenders: explicit tenant binding
            },
            success_url: `${frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${frontendUrl}/cart?cancelled=true`,
        };

        // Apply discount as a coupon in Stripe
        if (discountAmount > 0 && discountCode) {
            // Create a one-time Stripe coupon for this order
            const stripeCoupon = await this.stripe.coupons.create({
                amount_off: Math.round(discountAmount * 100),
                currency: 'eur',
                name: `Korting: ${discountCode.code}`,
                max_redemptions: 1,
                duration: 'once',
            });
            sessionParams.discounts = [{ coupon: stripeCoupon.id }];
        }

        // Try to create Stripe session - if it fails, clean up the order
        try {
            const session = await this.stripe.checkout.sessions.create(sessionParams);

            // Update order with Stripe session ID
            await this.prisma.order.update({
                where: { id: order.id },
                data: { stripeSessionId: session.id },
            });

            return {
                checkoutUrl: session.url!,
                sessionId: session.id,
            };
        } catch (stripeError) {
            // Stripe failed - delete the orphan order to maintain data integrity
            this.logger.error(`Stripe checkout session creation failed: ${stripeError}`);

            try {
                await this.prisma.order.delete({
                    where: { id: order.id },
                });
                this.logger.log(`Cleaned up orphan order ${order.orderNumber} after Stripe failure`);
            } catch (cleanupError) {
                this.logger.error(`Failed to cleanup order ${order.orderNumber}: ${cleanupError}`);
            }

            throw new BadRequestException('Failed to create checkout session. Please try again.');
        }
    }

    async handleStripeWebhook(payload: Buffer, signature: string) {
        const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

        if (!webhookSecret) {
            this.logger.warn('STRIPE_WEBHOOK_SECRET not configured');
            throw new BadRequestException('Webhook not configured');
        }

        let event: Stripe.Event;

        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
            this.logger.log(`Webhook received: ${event.type} (id: ${event.id})`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            this.logger.error(`Webhook signature verification failed: ${message}`);
            throw new BadRequestException('Invalid signature');
        }

        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session;
                this.logger.log(`Processing checkout.session.completed for session: ${session.id}`);
                this.logger.log(`Session metadata: ${JSON.stringify(session.metadata)}`);
                try {
                    await this.handleCheckoutCompleted(session);
                    this.logger.log(`Successfully processed checkout.session.completed`);
                } catch (error) {
                    this.logger.error(`Error in handleCheckoutCompleted: ${error}`);
                    // Still return success to Stripe to avoid retry loops
                }
                break;
            }
            case 'payment_intent.succeeded': {
                this.logger.log('Payment intent succeeded');
                break;
            }
            default:
                this.logger.log(`Unhandled event type: ${event.type}`);
        }

        return { received: true };
    }

    private async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
        const orderId = session.metadata?.orderId;
        if (!orderId) {
            this.logger.error('No orderId in session metadata');
            return;
        }

        // Get the order first to validate tenant consistency
        const existingOrder = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: { id: true, tenantId: true },
        });

        if (!existingOrder) {
            this.logger.error(`Order not found for orderId: ${orderId}`);
            return;
        }

        // Belt & suspenders: validate tenant consistency
        const sessionTenantId = session.metadata?.tenantId;
        if (sessionTenantId && existingOrder.tenantId && sessionTenantId !== existingOrder.tenantId) {
            this.logger.error(
                `CRITICAL: Stripe tenant mismatch! Session tenantId: ${sessionTenantId}, Order tenantId: ${existingOrder.tenantId}`
            );
            throw new Error('Stripe tenant mismatch - possible security issue');
        }

        // Update the order to PAID status
        const order = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                stripePaymentIntentId: session.payment_intent as string,
                paidAt: new Date(),
            },
            include: { items: true },
        });

        this.logger.log(`Order ${orderId} marked as paid (tenant: ${order.tenantId})`);

        // Increment discount code usage if one was applied
        if (order.discountCodeId) {
            try {
                await this.prisma.discountCode.update({
                    where: { id: order.discountCodeId },
                    data: { usageCount: { increment: 1 } },
                });
                this.logger.log(`Incremented usage count for discount code ${order.discountCodeId}`);
            } catch (error) {
                this.logger.error(`Failed to increment discount usage: ${error}`);
            }
        }

        // Send order confirmation email with PDF invoice attached
        try {
            const shippingAddress = order.shippingAddress as {
                line1: string;
                line2?: string;
                city: string;
                postalCode: string;
                country: string;
            } | null;

            // Generate PDF invoice
            let invoicePdf: Buffer | undefined;
            try {
                invoicePdf = await this.invoiceService.generateInvoiceForOrder(order.id);
                this.logger.log(`Invoice PDF generated for order ${order.orderNumber}`);
            } catch (pdfError) {
                this.logger.error(`Failed to generate invoice PDF: ${pdfError}`);
                // Continue without PDF attachment
            }

            await this.emailService.sendOrderConfirmation({
                to: order.customerEmail,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                items: order.items.map(item => ({
                    name: item.productName,
                    quantity: item.quantity,
                    unitPrice: Number(item.unitPrice),
                    totalPrice: Number(item.totalPrice),
                    imageUrl: item.productImage || undefined,
                })),
                subtotal: Number(order.subtotal),
                shippingAmount: Number(order.shippingAmount),
                total: Number(order.total),
                shippingAddress: shippingAddress || undefined,
                fulfillmentType: order.fulfillmentType as 'SHIPPING' | 'PICKUP',
                orderId: order.id,
                invoicePdf,
            });
            this.logger.log(`Order confirmation email sent for order ${order.orderNumber}`);
        } catch (error) {
            this.logger.error(`Failed to send order confirmation email: ${error}`);
        }

        // Update inventory - reduce stock for each item (atomic transaction)
        try {
            await this.prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    // Skip items without productId (shouldn't happen, but safety check)
                    if (!item.productId) {
                        this.logger.warn(`Order item ${item.id} has no productId, skipping stock update`);
                        continue;
                    }

                    // First verify stock is still available (prevent race conditions)
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        select: { stockQty: true, name: true },
                    });

                    if (!product) {
                        throw new Error(`Product ${item.productId} not found`);
                    }

                    if (product.stockQty < item.quantity) {
                        this.logger.error(
                            `Insufficient stock for ${product.name}: needed ${item.quantity}, have ${product.stockQty}`
                        );
                        // Note: We can't reject the order (already paid), but we log this issue
                        // In a production system, this should trigger an admin alert
                    }

                    await tx.product.update({
                        where: { id: item.productId },
                        data: {
                            stockQty: { decrement: item.quantity },
                        },
                    });
                    this.logger.log(`Reduced stock for product ${item.productId} by ${item.quantity}`);
                }
            });
            this.logger.log(`Inventory updated successfully for order ${order.orderNumber}`);
        } catch (error) {
            this.logger.error(`Failed to update inventory: ${error}`);
            // In production: trigger admin notification for manual intervention
        }
    }

    async getOrderBySessionId(tenantId: string, sessionId: string) {
        const order = await this.prisma.order.findFirst({
            where: { tenantId, stripeSessionId: sessionId },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async getOrdersByEmail(tenantId: string, email: string) {
        return this.prisma.order.findMany({
            where: { tenantId, customerEmail: email },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getOrderById(tenantId: string, id: string) {
        // Use findFirst for tenant-scoped lookup (prevents cross-tenant access)
        const order = await this.prisma.order.findFirst({
            where: { tenantId, id },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async getOrderByNumber(tenantId: string, orderNumber: string) {
        // Use findFirst for tenant-scoped lookup (prevents cross-tenant access)
        const order = await this.prisma.order.findFirst({
            where: { tenantId, orderNumber },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Return limited data for public tracking (no admin notes, etc.)
        return {
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customerName,
            total: order.total,
            createdAt: order.createdAt,
            paidAt: order.paidAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            items: order.items.map(item => ({
                id: item.id,
                productName: item.productName,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
            })),
            fulfillmentType: order.fulfillmentType,
        };
    }

    async getAllOrders(tenantId: string) {
        return this.prisma.order.findMany({
            where: { tenantId },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async updateOrder(tenantId: string, id: string, data: { status?: string; adminNotes?: string; trackingNumber?: string; cancellationReason?: string }, adminUser?: { id: string; name: string }) {
        // Verify order belongs to this tenant
        const order = await this.prisma.order.findFirst({ where: { tenantId, id } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const previousStatus = order.status;
        const updateData: Record<string, unknown> = {};

        if (data.status) {
            updateData.status = data.status;
            // Set timestamps based on status
            if (data.status === 'PAID' && !order.paidAt) {
                updateData.paidAt = new Date();
            } else if (data.status === 'SHIPPED' && !order.shippedAt) {
                updateData.shippedAt = new Date();
            } else if (data.status === 'DELIVERED' && !order.deliveredAt) {
                updateData.deliveredAt = new Date();
            }
        }

        if (data.adminNotes !== undefined) {
            updateData.adminNotes = data.adminNotes;
        }

        const updatedOrder = await this.prisma.order.update({
            where: { id },
            data: updateData,
            include: { items: true },
        });

        // Log status change to order history
        if (data.status && data.status !== previousStatus) {
            try {
                await this.prisma.orderStatusHistory.create({
                    data: {
                        orderId: id,
                        previousStatus,
                        newStatus: data.status,
                        changedBy: adminUser?.id || 'admin',
                        changedByName: adminUser?.name || 'Admin',
                        changedByType: 'admin',
                        notes: data.cancellationReason || (data.trackingNumber ? `Tracking: ${data.trackingNumber}` : undefined),
                    },
                });
                this.logger.log(`Status history logged for order ${order.orderNumber}: ${previousStatus} -> ${data.status}`);
            } catch (error) {
                this.logger.error(`Failed to log status history: ${error}`);
            }
        }

        // Send status update email if status changed to a notifiable status
        if (data.status && data.status !== previousStatus) {
            const notifiableStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
            if (notifiableStatuses.includes(data.status)) {
                try {
                    // Auto-generate bpost tracking URL if tracking number is provided
                    let trackingUrl: string | undefined;
                    if (data.trackingNumber) {
                        // bpost Track & Trace URL format
                        trackingUrl = `https://track.bpost.cloud/btr/web/#/search?itemCode=${encodeURIComponent(data.trackingNumber)}&lang=nl`;
                    }

                    await this.emailService.sendOrderStatusUpdate({
                        to: updatedOrder.customerEmail,
                        orderNumber: updatedOrder.orderNumber,
                        customerName: updatedOrder.customerName,
                        newStatus: data.status as 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
                        trackingNumber: data.trackingNumber,
                        trackingUrl, // Now includes the auto-generated bpost URL
                        cancellationReason: data.cancellationReason,
                        orderId: updatedOrder.id,
                    });
                    this.logger.log(`Status update email sent for order ${updatedOrder.orderNumber} (${data.status})`);
                } catch (error) {
                    this.logger.error(`Failed to send status update email: ${error}`);
                }
            }
        }

        return updatedOrder;
    }

    /**
     * Get order status history (tenant-scoped)
     */
    async getOrderStatusHistory(tenantId: string, orderId: string) {
        // First verify order belongs to tenant
        const order = await this.prisma.order.findFirst({ where: { tenantId, id: orderId } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return this.prisma.orderStatusHistory.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    }

    /**
     * Bulk update order status (tenant-scoped)
     */
    async bulkUpdateStatus(tenantId: string, orderIds: string[], status: string, adminUser?: { id: string; name: string }) {
        if (!orderIds || orderIds.length === 0) {
            throw new BadRequestException('No orders specified');
        }

        const validStatuses = ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!validStatuses.includes(status)) {
            throw new BadRequestException(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }

        const results = {
            success: [] as string[],
            failed: [] as { id: string; error: string }[],
        };

        for (const orderId of orderIds) {
            try {
                await this.updateOrder(tenantId, orderId, { status }, adminUser);
                results.success.push(orderId);
            } catch (error) {
                results.failed.push({
                    id: orderId,
                    error: error instanceof Error ? error.message : 'Unknown error',
                });
            }
        }

        this.logger.log(`Bulk status update: ${results.success.length} success, ${results.failed.length} failed`);
        return results;
    }

    /**
     * Generate shipping labels for multiple orders (tenant-scoped)
     */
    async generateBulkLabels(tenantId: string, orderIds: string[]) {
        if (!orderIds || orderIds.length === 0) {
            throw new BadRequestException('No orders specified');
        }

        const orders = await this.prisma.order.findMany({
            where: { tenantId, id: { in: orderIds } },
            include: { items: true },
        });

        if (orders.length === 0) {
            throw new NotFoundException('No orders found');
        }

        // Generate label data for each order
        const labels = orders.map(order => {
            const shippingAddress = order.shippingAddress as {
                line1?: string;
                line2?: string;
                city?: string;
                postalCode?: string;
                country?: string;
            } | null;

            return {
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                address: shippingAddress ? {
                    line1: shippingAddress.line1 || '',
                    line2: shippingAddress.line2 || '',
                    city: shippingAddress.city || '',
                    postalCode: shippingAddress.postalCode || '',
                    country: shippingAddress.country || 'BE',
                } : null,
                items: order.items.map(item => ({
                    name: item.productName,
                    quantity: item.quantity,
                })),
                fulfillmentType: order.fulfillmentType,
            };
        });

        return { labels, count: labels.length };
    }
}

