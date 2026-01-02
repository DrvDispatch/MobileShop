import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RefundStatus, RefundReason, Prisma } from '../../generated/prisma/client.js';
import Stripe from 'stripe';
import { CreateRefundDto, UpdateRefundDto, RefundListQueryDto } from './dto';

@Injectable()
export class RefundsService {
    private readonly logger = new Logger(RefundsService.name);
    private stripe: Stripe;

    constructor(private prisma: PrismaService) {
        this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '');
    }

    /**
     * Create a new refund request (does not process yet) - tenant-scoped via order
     */
    async createRefund(tenantId: string, dto: CreateRefundDto, adminId?: string) {
        // Get the order (tenant-scoped)
        const order = await this.prisma.order.findFirst({
            where: { tenantId, id: dto.orderId },
            include: { refunds: true },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Check if order has been paid
        if (!order.stripePaymentIntentId) {
            throw new BadRequestException('Order has no payment to refund');
        }

        // Check total refunded amount
        const totalRefunded = order.refunds
            .filter(r => r.status === 'SUCCEEDED')
            .reduce((sum, r) => sum + Number(r.amount), 0);

        const maxRefundable = Number(order.total) - totalRefunded;

        if (dto.amount > maxRefundable) {
            throw new BadRequestException(
                `Cannot refund more than €${maxRefundable.toFixed(2)}. Already refunded: €${totalRefunded.toFixed(2)}`
            );
        }

        // Create the refund record
        const refund = await this.prisma.refund.create({
            data: {
                orderId: dto.orderId,
                amount: dto.amount,
                reason: dto.reason,
                reasonText: dto.reasonText,
                adminNotes: dto.adminNotes,
                returnRequired: dto.returnRequired || false,
                processedBy: adminId,
                status: 'PENDING',
            },
            include: {
                order: {
                    select: { orderNumber: true },
                },
            },
        });

        this.logger.log(`Created refund ${refund.id} for order ${order.orderNumber}`);
        return refund;
    }

    /**
     * Process a pending refund via Stripe (tenant-scoped via order)
     */
    async processRefund(tenantId: string, refundId: string) {
        const refund = await this.prisma.refund.findFirst({
            where: { id: refundId, order: { tenantId } },
            include: { order: true },
        });

        if (!refund) {
            throw new NotFoundException('Refund not found');
        }

        if (refund.status !== 'PENDING') {
            throw new BadRequestException(`Refund is already ${refund.status.toLowerCase()}`);
        }

        if (!refund.order.stripePaymentIntentId) {
            throw new BadRequestException('Order has no Stripe payment to refund');
        }

        // Update status to processing
        await this.prisma.refund.update({
            where: { id: refundId },
            data: { status: 'PROCESSING' },
        });

        try {
            // Map our reason to Stripe's reason
            const stripeReason = this.mapReasonToStripe(refund.reason);

            // Create Stripe refund
            const stripeRefund = await this.stripe.refunds.create({
                payment_intent: refund.order.stripePaymentIntentId,
                amount: Math.round(Number(refund.amount) * 100), // Convert to cents
                reason: stripeReason,
                metadata: {
                    refund_id: refund.id,
                    order_number: refund.order.orderNumber,
                },
            });

            // Update refund with Stripe info
            const updatedRefund = await this.prisma.refund.update({
                where: { id: refundId },
                data: {
                    status: stripeRefund.status === 'succeeded' ? 'SUCCEEDED' : 'PROCESSING',
                    stripeRefundId: stripeRefund.id,
                    stripeChargeId: stripeRefund.charge as string,
                    processedAt: new Date(),
                },
                include: {
                    order: {
                        select: { orderNumber: true },
                    },
                },
            });

            // If fully refunded, update order status
            await this.checkAndUpdateOrderStatus(refund.orderId);

            this.logger.log(`Processed refund ${refundId}: Stripe refund ${stripeRefund.id}`);
            return updatedRefund;

        } catch (error) {
            // Handle Stripe error
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';

            await this.prisma.refund.update({
                where: { id: refundId },
                data: {
                    status: 'FAILED',
                    failedAt: new Date(),
                    failureReason: errorMessage,
                },
            });

            this.logger.error(`Failed to process refund ${refundId}: ${errorMessage}`);
            throw new BadRequestException(`Stripe refund failed: ${errorMessage}`);
        }
    }

    /**
     * Cancel a pending refund (tenant-scoped via order)
     */
    async cancelRefund(tenantId: string, refundId: string) {
        const refund = await this.prisma.refund.findFirst({
            where: { id: refundId, order: { tenantId } },
        });

        if (!refund) {
            throw new NotFoundException('Refund not found');
        }

        if (refund.status !== 'PENDING') {
            throw new BadRequestException(`Cannot cancel a refund that is ${refund.status.toLowerCase()}`);
        }

        return this.prisma.refund.update({
            where: { id: refundId },
            data: { status: 'CANCELLED' },
            include: {
                order: {
                    select: { orderNumber: true },
                },
            },
        });
    }

    /**
     * Update refund (notes, return status) - tenant-scoped via order
     */
    async updateRefund(tenantId: string, refundId: string, dto: UpdateRefundDto) {
        const refund = await this.prisma.refund.findFirst({
            where: { id: refundId, order: { tenantId } },
        });

        if (!refund) {
            throw new NotFoundException('Refund not found');
        }

        return this.prisma.refund.update({
            where: { id: refundId },
            data: {
                adminNotes: dto.adminNotes,
                returnReceived: dto.returnReceived,
                returnTrackingNumber: dto.returnTrackingNumber,
            },
            include: {
                order: {
                    select: { orderNumber: true },
                },
            },
        });
    }

    /**
     * Get refund by ID (tenant-scoped via order)
     */
    async getRefund(tenantId: string, refundId: string) {
        const refund = await this.prisma.refund.findFirst({
            where: { id: refundId, order: { tenantId } },
            include: {
                order: {
                    select: {
                        orderNumber: true,
                        customerName: true,
                        customerEmail: true,
                        total: true,
                    },
                },
            },
        });

        if (!refund) {
            throw new NotFoundException('Refund not found');
        }

        return refund;
    }

    /**
     * Get refunds for an order (tenant-scoped via order)
     */
    async getRefundsByOrder(tenantId: string, orderId: string) {
        return this.prisma.refund.findMany({
            where: { orderId, order: { tenantId } },
            orderBy: { createdAt: 'desc' },
        });
    }

    /**
     * Get all refunds with filters (tenant-scoped via order)
     */
    async getAllRefunds(tenantId: string, query: RefundListQueryDto) {
        const { status, orderId, page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const where: Prisma.RefundWhereInput = {
            order: { tenantId },
        };
        if (status) where.status = status;
        if (orderId) where.orderId = orderId;

        const [refunds, total] = await Promise.all([
            this.prisma.refund.findMany({
                where,
                include: {
                    order: {
                        select: {
                            orderNumber: true,
                            customerName: true,
                            customerEmail: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.refund.count({ where }),
        ]);

        return {
            data: refunds,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    /**
     * Get refund statistics (tenant-scoped via order)
     */
    async getRefundStats(tenantId: string) {
        const tenantFilter = { order: { tenantId } };

        const [pending, processing, succeeded, failed] = await Promise.all([
            this.prisma.refund.count({ where: { ...tenantFilter, status: 'PENDING' } }),
            this.prisma.refund.count({ where: { ...tenantFilter, status: 'PROCESSING' } }),
            this.prisma.refund.count({ where: { ...tenantFilter, status: 'SUCCEEDED' } }),
            this.prisma.refund.count({ where: { ...tenantFilter, status: 'FAILED' } }),
        ]);

        const totalRefunded = await this.prisma.refund.aggregate({
            where: { ...tenantFilter, status: 'SUCCEEDED' },
            _sum: { amount: true },
        });

        return {
            pending,
            processing,
            succeeded,
            failed,
            totalRefundedAmount: Number(totalRefunded._sum.amount || 0),
        };
    }

    /**
     * Map our refund reason to Stripe's
     */
    private mapReasonToStripe(reason: RefundReason): 'duplicate' | 'fraudulent' | 'requested_by_customer' {
        switch (reason) {
            case 'DUPLICATE':
                return 'duplicate';
            case 'FRAUDULENT':
                return 'fraudulent';
            default:
                return 'requested_by_customer';
        }
    }

    /**
     * Check if order is fully refunded and update status
     */
    private async checkAndUpdateOrderStatus(orderId: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { refunds: true },
        });

        if (!order) return;

        const totalRefunded = order.refunds
            .filter(r => r.status === 'SUCCEEDED')
            .reduce((sum, r) => sum + Number(r.amount), 0);

        // If fully refunded, update order status
        if (totalRefunded >= Number(order.total)) {
            await this.prisma.order.update({
                where: { id: orderId },
                data: { status: 'REFUNDED' },
            });
            this.logger.log(`Order ${order.orderNumber} marked as REFUNDED`);
        }
    }
}
