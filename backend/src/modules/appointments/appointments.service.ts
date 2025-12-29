import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { FeedbackService } from '../feedback/feedback.service';
import { SmsService } from '../sms/sms.service';
import { CreateAppointmentDto, UpdateAppointmentDto, AppointmentStatus } from './dto';

@Injectable()
export class AppointmentsService {
    private readonly logger = new Logger(AppointmentsService.name);

    // Business hours configuration
    private readonly TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
    private readonly CLOSED_DAYS = [0]; // Sunday

    constructor(
        private prisma: PrismaService,
        private emailService: EmailService,
        private feedbackService: FeedbackService,
        private smsService: SmsService,
    ) { }

    async create(dto: CreateAppointmentDto) {
        // Parse the date
        const appointmentDate = new Date(dto.appointmentDate);

        // Check if the day is not a closed day
        if (this.CLOSED_DAYS.includes(appointmentDate.getDay())) {
            throw new ConflictException('We are closed on this day');
        }

        // Check if slot is valid
        if (!this.TIME_SLOTS.includes(dto.timeSlot)) {
            throw new ConflictException('Invalid time slot');
        }

        // Check if slot is available
        const existing = await this.prisma.appointment.findUnique({
            where: {
                appointmentDate_timeSlot: {
                    appointmentDate,
                    timeSlot: dto.timeSlot,
                },
            },
        });

        if (existing) {
            throw new ConflictException('This time slot is already booked');
        }

        // Create the appointment
        const appointment = await this.prisma.appointment.create({
            data: {
                customerName: dto.customerName,
                customerEmail: dto.customerEmail,
                customerPhone: dto.customerPhone,
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

        // Send confirmation email
        try {
            await this.emailService.sendEmail({
                to: dto.customerEmail,
                subject: 'Afspraak Bevestigd - SmartphoneService',
                html: this.getConfirmationEmailHtml(appointment),
            });
            this.logger.log(`Confirmation email sent to ${dto.customerEmail}`);
        } catch (error) {
            this.logger.error(`Failed to send confirmation email: ${error.message}`);
        }

        return appointment;
    }

    async findAll(params?: { status?: AppointmentStatus; startDate?: Date; endDate?: Date }) {
        const where: any = {};

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

    async findByUserEmail(email: string) {
        return this.prisma.appointment.findMany({
            where: {
                customerEmail: email,
            },
            orderBy: [
                { appointmentDate: 'desc' },
                { timeSlot: 'desc' },
            ],
        });
    }

    async findOne(id: string) {
        const appointment = await this.prisma.appointment.findUnique({
            where: { id },
        });

        if (!appointment) {
            throw new NotFoundException('Appointment not found');
        }

        return appointment;
    }

    async update(id: string, dto: UpdateAppointmentDto) {
        const appointment = await this.findOne(id);

        // Check if rescheduling (date or time changed)
        const isRescheduling = (dto.appointmentDate && dto.appointmentDate !== appointment.appointmentDate.toISOString().split('T')[0]) ||
            (dto.timeSlot && dto.timeSlot !== appointment.timeSlot);

        // If rescheduling, check availability
        if (isRescheduling) {
            const newDate = dto.appointmentDate ? new Date(dto.appointmentDate) : appointment.appointmentDate;
            const newSlot = dto.timeSlot || appointment.timeSlot;

            const existing = await this.prisma.appointment.findFirst({
                where: {
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
        const updateData: any = { ...dto };
        if (dto.appointmentDate) {
            updateData.appointmentDate = new Date(dto.appointmentDate);
        }

        const updated = await this.prisma.appointment.update({
            where: { id },
            data: updateData,
        });

        // Helper function to format date
        const formatDate = (date: Date) => date.toLocaleDateString('nl-BE', {
            weekday: 'long', day: 'numeric', month: 'long',
        });

        // Send feedback request email + SMS if status changed to COMPLETED
        if (dto.status === AppointmentStatus.COMPLETED && appointment.status !== AppointmentStatus.COMPLETED) {
            try {
                await this.feedbackService.createAndSendFeedbackRequest({
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
                    subject: 'Afspraak Geannuleerd - SmartphoneService',
                    html: this.getCancellationEmailHtml(appointment),
                });
                this.logger.log(`Cancellation email sent to ${appointment.customerEmail}`);
            } catch (error) {
                this.logger.error(`Failed to send cancellation email: ${error.message}`);
            }

            // Send cancellation SMS
            try {
                await this.smsService.sendAppointmentCancellation({
                    to: appointment.customerPhone,
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
                    subject: 'Afspraak Verplaatst - SmartphoneService',
                    html: this.getRescheduleEmailHtml(appointment, updated),
                });
                this.logger.log(`Reschedule email sent to ${appointment.customerEmail}`);
            } catch (error) {
                this.logger.error(`Failed to send reschedule email: ${error.message}`);
            }

            // Send reschedule SMS
            try {
                await this.smsService.sendAppointmentReschedule({
                    to: appointment.customerPhone,
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

    async remove(id: string) {
        await this.findOne(id); // Check exists

        return this.prisma.appointment.delete({
            where: { id },
        });
    }

    async getAvailableSlots(dateStr: string) {
        const date = new Date(dateStr);

        // Check if closed day
        if (this.CLOSED_DAYS.includes(date.getDay())) {
            return { date: dateStr, slots: [], closed: true };
        }

        // Get booked slots for this date
        const bookedAppointments = await this.prisma.appointment.findMany({
            where: {
                appointmentDate: date,
                status: { not: AppointmentStatus.CANCELLED },
            },
            select: { timeSlot: true },
        });

        const bookedSlots = bookedAppointments.map((a: { timeSlot: string }) => a.timeSlot);
        const availableSlots = this.TIME_SLOTS.filter(slot => !bookedSlots.includes(slot));

        return {
            date: dateStr,
            slots: availableSlots,
            closed: false,
        };
    }

    private getConfirmationEmailHtml(appointment: any): string {
        const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString('nl-BE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #71717a; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; color: #18181b; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Afspraak Bevestigd ✓</h1>
        </div>
        <div class="content">
            <p>Beste ${appointment.customerName},</p>
            <p>Uw afspraak is bevestigd. Hier zijn de details:</p>
            
            <div class="detail">
                <div class="label">Datum & Tijd</div>
                <div class="value">${dateFormatted} om ${appointment.timeSlot}</div>
            </div>
            
            <div class="detail">
                <div class="label">Toestel</div>
                <div class="value">${appointment.deviceBrand} ${appointment.deviceModel}</div>
            </div>
            
            <div class="detail">
                <div class="label">Reparatie Type</div>
                <div class="value">${appointment.repairType}</div>
            </div>
            
            ${appointment.problemDescription ? `
            <div class="detail">
                <div class="label">Beschrijving</div>
                <div class="value">${appointment.problemDescription}</div>
            </div>
            ` : ''}
            
            <p><strong>Locatie:</strong> SmartphoneService, Antwerpen</p>
            
            <p>Heeft u vragen? Neem contact met ons op via WhatsApp: <a href="https://wa.me/32465638106">+32 465 638 106</a></p>
        </div>
        <div class="footer">
            <p>SmartphoneService - Premium Mobile Technology</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private getCancellationEmailHtml(appointment: any): string {
        const dateFormatted = new Date(appointment.appointmentDate).toLocaleDateString('nl-BE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #71717a; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; color: #18181b; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
        .cta-button { display: inline-block; background: #18181b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 16px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Afspraak Geannuleerd ✕</h1>
        </div>
        <div class="content">
            <p>Beste ${appointment.customerName},</p>
            <p>Helaas moeten wij u mededelen dat uw afspraak is geannuleerd.</p>
            
            <div class="detail">
                <div class="label">Oorspronkelijke Datum & Tijd</div>
                <div class="value">${dateFormatted} om ${appointment.timeSlot}</div>
            </div>
            
            <div class="detail">
                <div class="label">Toestel</div>
                <div class="value">${appointment.deviceBrand} ${appointment.deviceModel}</div>
            </div>
            
            <div class="detail">
                <div class="label">Reparatie Type</div>
                <div class="value">${appointment.repairType}</div>
            </div>
            
            <p>Wilt u een nieuwe afspraak maken? Neem gerust contact met ons op:</p>
            <ul>
                <li>WhatsApp: <a href="https://wa.me/32465638106">+32 465 638 106</a></li>
                <li>Website: <a href="https://smartphoneservice.be/repair">smartphoneservice.be/repair</a></li>
            </ul>
            
            <p>Onze excuses voor het ongemak.</p>
        </div>
        <div class="footer">
            <p>SmartphoneService - Premium Mobile Technology</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    private getRescheduleEmailHtml(oldAppointment: any, newAppointment: any): string {
        const oldDateFormatted = new Date(oldAppointment.appointmentDate).toLocaleDateString('nl-BE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
        const newDateFormatted = new Date(newAppointment.appointmentDate).toLocaleDateString('nl-BE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .detail { margin: 10px 0; padding: 10px; background: white; border-radius: 4px; }
        .label { font-weight: bold; color: #71717a; font-size: 12px; text-transform: uppercase; }
        .value { font-size: 16px; color: #18181b; }
        .old { text-decoration: line-through; color: #dc2626; }
        .new { color: #16a34a; font-weight: bold; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Afspraak Verplaatst 📅</h1>
        </div>
        <div class="content">
            <p>Beste ${oldAppointment.customerName},</p>
            <p>Uw afspraak is verplaatst naar een nieuw tijdstip.</p>
            
            <div class="detail">
                <div class="label">Oude Datum & Tijd</div>
                <div class="value old">${oldDateFormatted} om ${oldAppointment.timeSlot}</div>
            </div>
            
            <div class="detail">
                <div class="label">Nieuwe Datum & Tijd</div>
                <div class="value new">${newDateFormatted} om ${newAppointment.timeSlot}</div>
            </div>
            
            <div class="detail">
                <div class="label">Toestel</div>
                <div class="value">${oldAppointment.deviceBrand} ${oldAppointment.deviceModel}</div>
            </div>
            
            <div class="detail">
                <div class="label">Reparatie Type</div>
                <div class="value">${oldAppointment.repairType}</div>
            </div>
            
            <p><strong>Locatie:</strong> SmartphoneService, Antwerpen</p>
            
            <p>Heeft u vragen? Neem contact met ons op via WhatsApp: <a href="https://wa.me/32465638106">+32 465 638 106</a></p>
        </div>
        <div class="footer">
            <p>SmartphoneService - Premium Mobile Technology</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}

