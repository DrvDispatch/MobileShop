import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { FeedbackService } from '../feedback/feedback.service';
import { SmsService } from '../sms/sms.service';
import { AppointmentEmailService } from './appointment-email.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentStatus } from './dto';
import { getTenantBranding } from '../../utils/tenant-branding';

@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);

    // Default fallbacks if not configured in TenantConfig
    private readonly DEFAULT_TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    private readonly DEFAULT_CLOSED_DAYS = [0]; // Sunday

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private feedbackService: FeedbackService,
        private smsService: SmsService,
        private appointmentEmailService: AppointmentEmailService,
    ) { }

    /**
     * Fetch business hours config from TenantConfig
     * Falls back to defaults if not configured
     */
    private async getBusinessConfig(tenantId: string): Promise<{ timeSlots: string[]; closedDays: number[] }> {
        const config = await this.prisma.tenantConfig.findUnique({
            where: { tenantId },
            select: { timeSlots: true, closedDays: true },
        });

        return {
            timeSlots: (config?.timeSlots as string[]) || this.DEFAULT_TIME_SLOTS,
            closedDays: config?.closedDays || this.DEFAULT_CLOSED_DAYS,
        };
    }

    async create(tenantId: string, dto: CreateAppointmentDto, bookerInfo?: { bookerEmail?: string; bookerName?: string }) {
        // Fetch tenant-specific business config
        const { timeSlots, closedDays } = await this.getBusinessConfig(tenantId);

        // Parse the date
        const appointmentDate = new Date(dto.appointmentDate);

        // Check if the day is not a closed day
        if (closedDays.includes(appointmentDate.getDay())) {
            throw new ConflictException('We are closed on this day');
        }

        // Check if slot is valid
        if (!timeSlots.includes(dto.timeSlot)) {
            throw new ConflictException('Invalid time slot');
        }

        // Check if slot is available (tenant-scoped)
        const existing = await this.prisma.appointment.findFirst({
            where: {
                tenantId,
                appointmentDate,
                timeSlot: dto.timeSlot,
                status: { not: 'CANCELLED' }, // Only consider non-cancelled appointments
            },
        });

        if (existing) {
            throw new ConflictException('This time slot is already booked');
        }

        // Check if booker is different from customer
        const isDifferentBooker = bookerInfo?.bookerEmail &&
            bookerInfo.bookerEmail.toLowerCase() !== dto.customerEmail.toLowerCase();

        // Create the appointment (with tenantId and optional booker info)
        const appointment = await this.prisma.appointment.create({
            data: {
                tenantId,
                customerName: dto.customerName,
                customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone,
                // Only store booker info if different from customer
                bookedByEmail: isDifferentBooker ? bookerInfo.bookerEmail : undefined,
                bookedByName: isDifferentBooker ? bookerInfo.bookerName : undefined,
                deviceBrand: dto.deviceBrand,
                deviceModel: dto.deviceModel,
                repairType: dto.repairType,
                problemDescription: dto.problemDescription,
                damageImageUrl: dto.damageImageUrl,
                appointmentDate,
                timeSlot: dto.timeSlot,
                status: AppointmentStatus.CONFIRMED,
            },
        });

        // Fetch tenant branding for emails
        const branding = await getTenantBranding(this.prisma, tenantId);

        // Send confirmation email(s)
        try {
            // Always send to customer
            await this.emailService.sendEmail({
                to: dto.customerEmail,
                subject: `Afspraak Bevestigd - ${branding.shopName}`,
                html: this.appointmentEmailService.getConfirmationEmailHtml(
                    appointment,
                    branding,
                    isDifferentBooker ? bookerInfo.bookerName : undefined
                ),
            });
            this.logger.log(`Confirmation email sent to ${dto.customerEmail}`);

            // If booked by someone else, also send to booker
            if (isDifferentBooker && bookerInfo.bookerEmail) {
                await this.emailService.sendEmail({
                    to: bookerInfo.bookerEmail,
                    subject: `Afspraak Bevestigd - ${branding.shopName}`,
                    html: this.appointmentEmailService.getBookerConfirmationEmailHtml(appointment, branding),
                });
                this.logger.log(`Booker confirmation email sent to ${bookerInfo.bookerEmail}`);
            }
        } catch (error) {
            this.logger.error(`Failed to send confirmation email: ${error.message}`);
        }

        return appointment;
    }

    async findAll(tenantId: string, params?: { status?: AppointmentStatus; startDate?: Date; endDate?: Date }) {
        const where: { tenantId: string; status?: AppointmentStatus; appointmentDate?: { gte?: Date; lte?: Date } } = { tenantId };

        if (params?.status) {
            where.status = params.status;
        }

        if (params?.startDate || params?.endDate) {
            where.appointmentDate = {};
            if (params?.startDate) {
                where.appointmentDate.gte = params.startDate;
            }
            if (params?.endDate) {
                where.appointmentDate.lte = params.endDate;
            }
        }

        return this.prisma.appointment.findMany({
            where,
            orderBy: [
                { appointmentDate: 'asc' },
                { timeSlot: 'asc' },
            ],
        });
    }

    /**
     * Find appointments where user is either the customer OR the booker
     */
    async findByUserEmail(tenantId: string, email: string) {
        return this.prisma.appointment.findMany({
            where: {
                tenantId,
                OR: [
                    { customerEmail: email },
                    { bookedByEmail: email },
                ],
            },
            orderBy: [
                { appointmentDate: 'desc' },
                { timeSlot: 'desc' },
            ],
        });
    }

    async findOne(tenantId: string, id: string) {
        // Use findFirst for tenant-scoped lookup (prevents cross-tenant access)
        const appointment = await this.prisma.appointment.findFirst({
            where: { tenantId, id },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        return appointment;
    }

    async update(tenantId: string, id: string, dto: UpdateAppointmentDto) {
        const appointment = await this.findOne(tenantId, id);

        // Check if rescheduling (date or time changed)
        const isRescheduling = (dto.appointmentDate && dto.appointmentDate !== appointment.appointmentDate.toISOString().split('T')[0]) ||
            (dto.timeSlot && dto.timeSlot !== appointment.timeSlot);

        // If rescheduling, check availability (tenant-scoped)
        if (isRescheduling) {
            const newDate = dto.appointmentDate ? new Date(dto.appointmentDate) : appointment.appointmentDate;
            const newSlot = dto.timeSlot || appointment.timeSlot;

            const existing = await this.prisma.appointment.findFirst({
                where: {
                    tenantId,
                    appointmentDate: newDate,
                    timeSlot: newSlot,
                    id: { not: id },
                },
            });

            if (existing) {
                throw new ConflictException('Dit tijdslot is al geboekt');
            }
        }

        // Prepare update data
        const updateData = {
            ...dto,
            ...(dto.appointmentDate ? { appointmentDate: new Date(dto.appointmentDate) } : {}),
        };

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: updateData,
        });

        // Fetch tenant branding for email templates
        const branding = await getTenantBranding(this.prisma, tenantId);

        // Helper function to format date
        const formatDate = (date: Date) => date.toLocaleDateString('nl-BE', {
            weekday: 'long', day: 'numeric', month: 'long',
        });

        // Send feedback request email + SMS if status changed to COMPLETED
        if (dto.status === AppointmentStatus.COMPLETED && appointment.status !== AppointmentStatus.COMPLETED) {
            try {
                await this.feedbackService.createAndSendFeedbackRequest(tenantId, {
                    sourceType: 'repair',
                    repairTicketId: appointment.id,
                    customerEmail: appointment.customerEmail,
                    customerName: appointment.customerName,
                });
                this.logger.log(`Feedback request sent to ${appointment.customerEmail} for appointment ${appointment.id}`);
            } catch (error) {
                this.logger.error(`Failed to send feedback request for appointment: ${error.message}`);
            }
            // Note: Completion uses email only, no SMS
        }

        // Send cancellation email + SMS if status changed to CANCELLED
        if (dto.status === AppointmentStatus.CANCELLED && appointment.status !== AppointmentStatus.CANCELLED) {
            try {
                await this.emailService.sendEmail({
                    to: appointment.customerEmail,
                    subject: `Afspraak Geannuleerd - ${branding.shopName}`,
                    html: this.appointmentEmailService.getCancellationEmailHtml(appointment, branding),
                });
                this.logger.log(`Cancellation email sent to ${appointment.customerEmail}`);
            } catch (error) {
                this.logger.error(`Failed to send cancellation email: ${error.message}`);
            }

            // Send cancellation SMS
            try {
                await this.smsService.sendAppointmentCancellation({
                    to: appointment.customerPhone,
                    branding,
                    customerName: appointment.customerName,
                    date: formatDate(appointment.appointmentDate),
                    time: appointment.timeSlot,
                    device: `${appointment.deviceBrand} ${appointment.deviceModel}`,
                });
                this.logger.log(`Cancellation SMS sent to ${appointment.customerPhone}`);
            } catch (error) {
                this.logger.error(`Failed to send cancellation SMS: ${error.message}`);
            }
        }

        // Send reschedule email + SMS if date/time changed
        if (isRescheduling) {
            try {
                await this.emailService.sendEmail({
                    to: appointment.customerEmail,
                    subject: `Afspraak Verplaatst - ${branding.shopName}`,
                    html: this.appointmentEmailService.getRescheduleEmailHtml(appointment, updated, branding),
                });
                this.logger.log(`Reschedule email sent to ${appointment.customerEmail}`);
            } catch (error) {
                this.logger.error(`Failed to send reschedule email: ${error.message}`);
            }

            // Send reschedule SMS
            try {
                await this.smsService.sendAppointmentReschedule({
                    to: appointment.customerPhone,
                    branding,
                    customerName: appointment.customerName,
                    oldDate: formatDate(appointment.appointmentDate),
                    oldTime: appointment.timeSlot,
                    newDate: formatDate(updated.appointmentDate),
                    newTime: updated.timeSlot,
                    device: `${appointment.deviceBrand} ${appointment.deviceModel}`,
                });
                this.logger.log(`Reschedule SMS sent to ${appointment.customerPhone}`);
            } catch (error) {
                this.logger.error(`Failed to send reschedule SMS: ${error.message}`);
            }
        }

        return updated;
    }

    async remove(tenantId: string, id: string) {
        await this.findOne(tenantId, id); // Check exists and belongs to tenant

        return this.prisma.appointment.delete({
            where: { id },
        });
    }

    async getAvailableSlots(tenantId: string, dateStr: string) {
        // Fetch tenant-specific business config
        const { timeSlots, closedDays } = await this.getBusinessConfig(tenantId);

        const date = new Date(dateStr);

        // Check if closed day
        if (closedDays.includes(date.getDay())) {
            return { date: dateStr, slots: [], closed: true };
        }

        // Get booked slots for this date (tenant-scoped)
        const bookedAppointments = await this.prisma.appointment.findMany({
            where: {
                tenantId,
                appointmentDate: date,
                status: { not: AppointmentStatus.CANCELLED },
            },
            select: { timeSlot: true },
        });

        const bookedSlots = bookedAppointments.map((a: { timeSlot: string }) => a.timeSlot);
        const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

        return {
            date: dateStr,
            slots: availableSlots,
            closed: false,
        };
    }
}
