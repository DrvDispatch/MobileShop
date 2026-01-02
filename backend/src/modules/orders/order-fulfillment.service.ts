/**
 * Order Fulfillment Service
 * 
 * Handles order queries, status updates, bulk operations.
 * Manages order lifecycle after payment.
 */

import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrderFulfillmentService {
    private readonly logger = new Logger(OrderFulfillmentService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    // ============================================
    // ORDER QUERIES
    // ============================================

    /**
     * Get order by Stripe session ID (tenant-scoped)
     */
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

    /**
     * Platform-level: Resolve order from Stripe session for checkout success redirect
     * Returns order + tenant domain for the success page resolver
     * NOT tenant-scoped (used by platform to route to correct tenant)
     */
    async resolveOrderFromStripeSession(sessionId: string) {
        const order = await this.prisma.order.findFirst({
            where: { stripeSessionId: sessionId },
            select: {
                id: true,
                orderNumber: true,
                status: true,
                customerName: true,
                total: true,
                tenantId: true,
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found for session');
        }

        // Get tenant's primary domain for redirect
        let tenantDomain: string | null = null;
        if (order.tenantId) {
            const domain = await this.prisma.tenantDomain.findFirst({
                where: { tenantId: order.tenantId, isPrimary: true },
                select: { domain: true },
            });
            tenantDomain = domain?.domain || null;
        }

        return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            customerName: order.customerName,
            total: order.total,
            tenantId: order.tenantId,
            tenantDomain: tenantDomain,
        };
    }

    async getOrdersByEmail(tenantId: string, email: string) {
        return this.prisma.order.findMany({
            where: { tenantId, customerEmail: email },
            include: { items: true },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getOrderById(tenantId: string, id: string) {
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
        const order = await this.prisma.order.findFirst({
            where: { tenantId, orderNumber },
            include: { items: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Return limited data for public tracking
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

    // ============================================
    // ORDER UPDATES
    // ============================================

    async updateOrder(
        tenantId: string,
        id: string,
        data: { status?: string; adminNotes?: string; trackingNumber?: string; cancellationReason?: string },
        adminUser?: { id: string; name: string }
    ) {
        const order = await this.prisma.order.findFirst({ where: { tenantId, id } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }

        const previousStatus = order.status;
        const updateData: Record<string, unknown> = {};

        if (data.status) {
            updateData.status = data.status;
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

        // Log status change to history
        if (data.status && data.status !== previousStatus) {
            await this.logStatusChange(id, previousStatus, data.status, adminUser, data.trackingNumber, data.cancellationReason);
        }

        // Send status update email
        if (data.status && data.status !== previousStatus) {
            await this.sendStatusUpdateEmail(updatedOrder, data.status, data.trackingNumber, data.cancellationReason);
        }

        return updatedOrder;
    }

    private async logStatusChange(
        orderId: string,
        previousStatus: string,
        newStatus: string,
        adminUser?: { id: string; name: string },
        trackingNumber?: string,
        cancellationReason?: string,
    ) {
        try {
            await this.prisma.orderStatusHistory.create({
                data: {
                    orderId,
                    previousStatus,
                    newStatus,
                    changedBy: adminUser?.id || 'admin',
                    changedByName: adminUser?.name || 'Admin',
                    changedByType: 'admin',
                    notes: cancellationReason || (trackingNumber ? `Tracking: ${trackingNumber}` : undefined),
                },
            });
            this.logger.log(`Status history logged for order: ${previousStatus} -> ${newStatus}`);
        } catch (error) {
            this.logger.error(`Failed to log status history: ${error}`);
        }
    }

    private async sendStatusUpdateEmail(
        order: any,
        newStatus: string,
        trackingNumber?: string,
        cancellationReason?: string,
    ) {
        const notifiableStatuses = ['PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
        if (!notifiableStatuses.includes(newStatus)) return;

        try {
            let trackingUrl: string | undefined;
            if (trackingNumber) {
                trackingUrl = `https://track.bpost.cloud/btr/web/#/search?itemCode=${encodeURIComponent(trackingNumber)}&lang=nl`;
            }

            await this.emailService.sendOrderStatusUpdate({
                to: order.customerEmail,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                newStatus: newStatus as 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED',
                trackingNumber,
                trackingUrl,
                cancellationReason,
                orderId: order.id,
            });
            this.logger.log(`Status update email sent for order ${order.orderNumber} (${newStatus})`);
        } catch (error) {
            this.logger.error(`Failed to send status update email: ${error}`);
        }
    }

    // ============================================
    // ORDER HISTORY
    // ============================================

    async getOrderStatusHistory(tenantId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({ where: { tenantId, id: orderId } });
        if (!order) {
            throw new NotFoundException('Order not found');
        }
        return this.prisma.orderStatusHistory.findMany({
            where: { orderId },
            orderBy: { createdAt: 'asc' },
        });
    }

    // ============================================
    // BULK OPERATIONS
    // ============================================

    async bulkUpdateStatus(
        tenantId: string,
        orderIds: string[],
        status: string,
        adminUser?: { id: string; name: string }
    ) {
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
