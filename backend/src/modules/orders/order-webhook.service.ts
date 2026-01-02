/**
 * Order Webhook Service
 * 
 * Handles Stripe webhook events.
 * Processes checkout completion, payment confirmation, inventory updates.
 */

import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { InvoiceService } from '../invoice/invoice.service';
import Stripe from 'stripe';

@Injectable()
export class OrderWebhookService {
    private readonly logger = new Logger(OrderWebhookService.name);
    private stripe: Stripe;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
        private emailService: EmailService,
        private invoiceService: InvoiceService,
    ) {
        const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
        this.stripe = new Stripe(stripeKey || '');
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
                try {
                    await this.handleCheckoutCompleted(session);
                    this.logger.log(`Successfully processed checkout.session.completed`);
                } catch (error) {
                    this.logger.error(`Error in handleCheckoutCompleted: ${error}`);
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

    async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
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

        // Validate tenant consistency
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

        // Increment discount code usage
        await this.incrementDiscountUsage(order.discountCodeId);

        // Send confirmation email with PDF invoice
        await this.sendConfirmationEmail(order);

        // Update inventory
        await this.updateInventory(order);
    }

    private async incrementDiscountUsage(discountCodeId: string | null) {
        if (!discountCodeId) return;

        try {
            await this.prisma.discountCode.update({
                where: { id: discountCodeId },
                data: { usageCount: { increment: 1 } },
            });
            this.logger.log(`Incremented usage count for discount code ${discountCodeId}`);
        } catch (error) {
            this.logger.error(`Failed to increment discount usage: ${error}`);
        }
    }

    private async sendConfirmationEmail(order: any) {
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
            }

            await this.emailService.sendOrderConfirmation({
                to: order.customerEmail,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                items: order.items.map((item: any) => ({
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
    }

    private async updateInventory(order: any) {
        try {
            await this.prisma.$transaction(async (tx) => {
                for (const item of order.items) {
                    if (!item.productId) {
                        this.logger.warn(`Order item ${item.id} has no productId, skipping stock update`);
                        continue;
                    }

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
                    }

                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stockQty: { decrement: item.quantity } },
                    });
                    this.logger.log(`Reduced stock for product ${item.productId} by ${item.quantity}`);
                }
            });
            this.logger.log(`Inventory updated successfully for order ${order.orderNumber}`);
        } catch (error) {
            this.logger.error(`Failed to update inventory: ${error}`);
        }
    }
}
