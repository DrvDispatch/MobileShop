import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { SendMarketingEmailDto, UserSegment, SegmentInfoDto, MarketingUserDto } from './dto';

@Injectable()
export class MarketingService {
    private readonly logger = new Logger(MarketingService.name);

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
    ) { }

    /**
     * Get all available segments with user counts
     */
    async getSegments(): Promise<SegmentInfoDto[]> {
        const [allCount, customersCount, appointmentCount, unsubscribedCount] = await Promise.all([
            // All users with email
            this.prisma.user.count({
                where: { email: { not: '' } },
            }),
            // Customers who have made orders
            this.prisma.user.count({
                where: {
                    email: { not: '' },
                    orders: { some: {} },
                },
            }),
            // Users with completed appointments (using Appointment with COMPLETED status)
            this.prisma.appointment.findMany({
                where: {
                    status: 'COMPLETED',
                    customerEmail: { not: '' },
                },
                select: { customerEmail: true },
                distinct: ['customerEmail'],
            }).then(results => results.length),
            // Unsubscribed users
            this.prisma.emailUnsubscribe.count(),
        ]);

        return [
            { segment: UserSegment.ALL, label: 'Alle gebruikers', count: allCount },
            { segment: UserSegment.CUSTOMERS, label: 'Klanten met bestellingen', count: customersCount },
            { segment: UserSegment.APPOINTMENT_COMPLETED, label: 'Afgeronde reparaties', count: appointmentCount },
            { segment: UserSegment.UNSUBSCRIBED, label: 'Uitgeschreven', count: unsubscribedCount },
        ];
    }

    /**
     * Get users in a specific segment
     */
    async getUsersBySegment(segment: UserSegment, limit = 100): Promise<MarketingUserDto[]> {
        let users: MarketingUserDto[] = [];

        switch (segment) {
            case UserSegment.ALL:
                const allUsers = await this.prisma.user.findMany({
                    where: { email: { not: '' } },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        createdAt: true,
                        _count: { select: { orders: true } },
                    },
                    take: limit,
                });
                users = allUsers.map(u => ({
                    id: u.id,
                    email: u.email,
                    name: u.name,
                    phone: u.phone || undefined,
                    orderCount: u._count.orders,
                }));
                break;

            case UserSegment.CUSTOMERS:
                const customers = await this.prisma.user.findMany({
                    where: {
                        email: { not: '' },
                        orders: { some: {} },
                    },
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        phone: true,
                        orders: {
                            orderBy: { createdAt: 'desc' },
                            select: { createdAt: true, total: true },
                        },
                    },
                    take: limit,
                });
                users = customers.map(u => {
                    const totalSpent = u.orders.reduce((sum, o) => sum + Number(o.total || 0), 0);
                    return {
                        id: u.id,
                        email: u.email,
                        name: u.name,
                        phone: u.phone || undefined,
                        lastOrder: u.orders[0]?.createdAt,
                        orderCount: u.orders.length,
                        totalSpent: Math.round(totalSpent * 100) / 100,
                    };
                });
                break;

            case UserSegment.APPOINTMENT_COMPLETED:
                // Get unique emails from completed appointments with device info
                const completedAppointments = await this.prisma.appointment.findMany({
                    where: {
                        status: 'COMPLETED',
                        customerEmail: { not: '' },
                    },
                    select: {
                        id: true,
                        customerEmail: true,
                        customerName: true,
                        customerPhone: true,
                        deviceBrand: true,
                        deviceModel: true,
                        repairType: true,
                        appointmentDate: true,
                    },
                    orderBy: { appointmentDate: 'desc' },
                    distinct: ['customerEmail'],
                    take: limit,
                });
                users = completedAppointments.map((a) => ({
                    id: a.id,
                    email: a.customerEmail,
                    name: a.customerName,
                    phone: a.customerPhone || undefined,
                    deviceBrand: a.deviceBrand,
                    deviceModel: a.deviceModel,
                    repairType: a.repairType,
                    lastAppointment: a.appointmentDate || undefined,
                }));
                break;

            case UserSegment.UNSUBSCRIBED:
                const unsubscribed = await this.prisma.emailUnsubscribe.findMany({
                    select: {
                        id: true,
                        email: true,
                        reason: true,
                        createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                });
                users = unsubscribed.map(u => ({
                    id: u.id,
                    email: u.email,
                    name: u.reason || 'Geen reden opgegeven',
                    unsubscribedAt: u.createdAt,
                }));
                break;
        }

        return users;
    }

    /**
     * Send marketing email to users
     */
    async sendMarketingEmail(dto: SendMarketingEmailDto): Promise<{
        success: boolean;
        sent: number;
        failed: number;
        errors: string[];
    }> {
        let recipients: { email: string; name: string }[] = [];

        // If specific email provided, just send to that one
        if (dto.specificEmail) {
            recipients = [{ email: dto.specificEmail, name: dto.specificEmail.split('@')[0] }];
        } else {
            // Get users from segment
            const users = await this.getUsersBySegment(dto.segment, 1000);
            recipients = users.map(u => ({ email: u.email, name: u.name }));
        }

        // Filter out unsubscribed emails
        const unsubscribedEmails = await this.prisma.emailUnsubscribe.findMany({
            where: {
                email: { in: recipients.map(r => r.email.toLowerCase()) },
            },
            select: { email: true },
        });
        const unsubscribedSet = new Set(unsubscribedEmails.map(u => u.email.toLowerCase()));
        recipients = recipients.filter(r => !unsubscribedSet.has(r.email.toLowerCase()));

        this.logger.log(`Sending marketing email to ${recipients.length} recipients (segment: ${dto.segment})`);

        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        // Send emails (in batches for Resend)
        for (const recipient of recipients) {
            try {
                const success = await this.emailService.sendPromotionalEmail({
                    to: recipient.email,
                    customerName: recipient.name,
                    subject: dto.subject,
                    headline: dto.headline,
                    bodyHtml: dto.bodyHtml,
                    ctaText: dto.ctaText,
                    ctaUrl: dto.ctaUrl,
                    featuredProducts: dto.featuredProducts,
                });

                if (success) {
                    sent++;
                } else {
                    failed++;
                    errors.push(`Failed to send to ${recipient.email}`);
                }

                // Small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (error) {
                failed++;
                errors.push(`Error sending to ${recipient.email}: ${error.message}`);
            }
        }

        this.logger.log(`Marketing email complete: ${sent} sent, ${failed} failed`);

        return {
            success: failed === 0,
            sent,
            failed,
            errors: errors.slice(0, 10), // Limit error messages
        };
    }

    /**
     * Add email to unsubscribe list
     */
    async unsubscribe(email: string, reason?: string): Promise<{ success: boolean }> {
        try {
            // Find existing unsubscribe record (tenantId is null for global/legacy)
            const existing = await this.prisma.emailUnsubscribe.findFirst({
                where: { email: email.toLowerCase(), tenantId: null }
            });

            if (existing) {
                await this.prisma.emailUnsubscribe.update({
                    where: { id: existing.id },
                    data: { reason },
                });
            } else {
                await this.prisma.emailUnsubscribe.create({
                    data: {
                        email: email.toLowerCase(),
                        reason,
                    },
                });
            }
            this.logger.log(`Email ${email} unsubscribed`);
            return { success: true };
        } catch (error) {
            this.logger.error(`Failed to unsubscribe ${email}: ${error.message}`);
            return { success: false };
        }
    }

    /**
     * Check if email is unsubscribed
     */
    async isUnsubscribed(email: string): Promise<boolean> {
        // Using findFirst since email uniqueness is now per-tenant
        const record = await this.prisma.emailUnsubscribe.findFirst({
            where: { email: email.toLowerCase(), tenantId: null },
        });
        return !!record;
    }

    /**
     * Subscribe email to newsletter
     * Creates a user if not exists, or just returns success if already exists
     */
    async subscribe(email: string, name?: string): Promise<{ success: boolean; message: string }> {
        try {
            const normalizedEmail = email.toLowerCase().trim();

            // Check if unsubscribed - if so, remove from unsubscribe list
            const unsubscribeRecord = await this.prisma.emailUnsubscribe.findFirst({
                where: { email: normalizedEmail, tenantId: null },
            });

            if (unsubscribeRecord) {
                await this.prisma.emailUnsubscribe.delete({
                    where: { id: unsubscribeRecord.id },
                });
                this.logger.log(`Email ${email} re-subscribed (removed from unsubscribe list)`);
            }

            // Check if user already exists (using findFirst since email uniqueness is per-tenant)
            const existingUser = await this.prisma.user.findFirst({
                where: { email: normalizedEmail, tenantId: null },
            });

            if (existingUser) {
                this.logger.log(`Email ${email} already subscribed`);
                return { success: true, message: 'Je bent al ingeschreven!' };
            }

            // Create new user with just email (no password required for newsletter)
            await this.prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: name || normalizedEmail.split('@')[0],
                    passwordHash: null, // No password - user can set later if they want an account
                },
            });

            this.logger.log(`Email ${email} subscribed to newsletter`);
            return { success: true, message: 'Bedankt voor je inschrijving!' };
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            this.logger.error(`Failed to subscribe ${email}: ${errorMessage}`);
            return { success: false, message: 'Er is iets misgegaan. Probeer later opnieuw.' };
        }
    }
}
