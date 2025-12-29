import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class StockNotificationsService {
    private readonly logger = new Logger(StockNotificationsService.name);
    private readonly frontendUrl: string;

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private configService: ConfigService,
    ) {
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    /**
     * Subscribe to back-in-stock notification
     */
    async subscribe(email: string, productId: string, userId?: string) {
        // Check product exists and is out of stock
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.stockQty > 0) {
            throw new BadRequestException('Product is already in stock');
        }

        // Check if already subscribed
        const existing = await this.prisma.stockNotification.findUnique({
            where: {
                productId_email: { productId, email },
            },
        });

        if (existing) {
            if (existing.isNotified) {
                // Reset if they want to be notified again
                await this.prisma.stockNotification.update({
                    where: { id: existing.id },
                    data: { isNotified: false, notifiedAt: null },
                });
                return { success: true, message: 'Re-subscribed to notifications' };
            }
            throw new BadRequestException('Already subscribed');
        }

        await this.prisma.stockNotification.create({
            data: { email, productId, userId },
        });

        this.logger.log(`Stock notification subscription: ${email} for product ${productId}`);
        return { success: true, message: 'Subscribed to stock notifications' };
    }

    /**
     * Unsubscribe from notification
     */
    async unsubscribe(email: string, productId: string) {
        const subscription = await this.prisma.stockNotification.findUnique({
            where: {
                productId_email: { productId, email },
            },
        });

        if (!subscription) {
            throw new NotFoundException('Subscription not found');
        }

        await this.prisma.stockNotification.delete({
            where: { id: subscription.id },
        });

        return { success: true, message: 'Unsubscribed from notifications' };
    }

    /**
     * Check if user is subscribed
     */
    async isSubscribed(email: string, productId: string): Promise<boolean> {
        const subscription = await this.prisma.stockNotification.findUnique({
            where: {
                productId_email: { productId, email },
            },
        });

        return !!subscription && !subscription.isNotified;
    }

    /**
     * Send notifications when product is back in stock
     * Called from inventory/products service when stock increases
     */
    async notifySubscribers(productId: string): Promise<number> {
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
            include: {
                images: { where: { isPrimary: true }, take: 1 },
            },
        });

        if (!product || product.stockQty === 0) {
            return 0;
        }

        // Get pending subscribers
        const subscribers = await this.prisma.stockNotification.findMany({
            where: {
                productId,
                isNotified: false,
            },
        });

        if (subscribers.length === 0) {
            return 0;
        }

        const productUrl = `${this.frontendUrl}/products/${product.slug}`;
        const imageUrl = product.images[0]?.url;

        let sentCount = 0;

        for (const sub of subscribers) {
            try {
                // Send email
                const sent = await this.emailService.sendEmail({
                    to: sub.email,
                    subject: `📦 ${product.name} is weer op voorraad!`,
                    html: this.getBackInStockEmailHtml(product.name, productUrl, Number(product.price), imageUrl),
                });

                if (sent) {
                    await this.prisma.stockNotification.update({
                        where: { id: sub.id },
                        data: { isNotified: true, notifiedAt: new Date() },
                    });
                    sentCount++;
                }
            } catch (error) {
                this.logger.error(`Failed to send stock notification to ${sub.email}: ${error}`);
            }
        }

        this.logger.log(`Sent ${sentCount} back-in-stock notifications for ${product.name}`);
        return sentCount;
    }

    private getBackInStockEmailHtml(productName: string, productUrl: string, price: number, imageUrl?: string): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px 40px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600;">
                                Goed nieuws! 🎉
                            </h1>
                        </div>
                        <div style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 24px;">
                                <span style="font-size: 48px;">📦</span>
                            </div>
                            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px; text-align: center;">
                                Het product waar u op wachtte is weer beschikbaar!
                            </p>
                            ${imageUrl ? `
                                <div style="text-align: center; margin: 24px 0;">
                                    <img src="${imageUrl}" alt="${productName}" style="max-width: 200px; border-radius: 8px;" />
                                </div>
                            ` : ''}
                            <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                                <p style="font-weight: 600; margin: 0 0 8px; color: #333; font-size: 18px;">${productName}</p>
                                <p style="color: #10b981; font-size: 24px; font-weight: bold; margin: 0;">€${price.toFixed(2)}</p>
                            </div>
                            <div style="text-align: center; margin: 32px 0;">
                                <a href="${productUrl}" style="display: inline-block; background: #000; color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">
                                    Nu bekijken →
                                </a>
                            </div>
                            <p style="color: #888; font-size: 13px; margin-top: 24px; text-align: center;">
                                Wees er snel bij, want de voorraad is beperkt!
                            </p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    // ========== ADMIN METHODS ==========

    /**
     * Get all subscriptions (admin)
     */
    async getAllSubscriptions(options: {
        page?: number;
        limit?: number;
        productId?: string;
        notified?: boolean;
    }) {
        const { page = 1, limit = 50, productId, notified } = options;
        const skip = (page - 1) * limit;

        const where: Record<string, unknown> = {};
        if (productId) where.productId = productId;
        if (notified !== undefined) where.isNotified = notified;

        const [subscriptions, total] = await Promise.all([
            this.prisma.stockNotification.findMany({
                where,
                include: {
                    product: { select: { id: true, name: true, stockQty: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.stockNotification.count({ where }),
        ]);

        return {
            data: subscriptions,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Get waiting count per product (admin dashboard)
     */
    async getWaitingCounts() {
        const counts = await this.prisma.stockNotification.groupBy({
            by: ['productId'],
            where: { isNotified: false },
            _count: { id: true },
        });

        // Get product names
        const productIds = counts.map(c => c.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true, stockQty: true },
        });

        return counts.map(count => {
            const product = products.find(p => p.id === count.productId);
            return {
                productId: count.productId,
                productName: product?.name || 'Unknown',
                stockQty: product?.stockQty || 0,
                waitingCount: count._count.id,
            };
        });
    }
}
