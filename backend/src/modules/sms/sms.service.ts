import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TenantBranding, formatAddress, truncateForSmsSender } from '../../utils/tenant-branding';

interface SendSmsOptions {
    to: string;
    message: string;
    from?: string;
}

interface SmsResult {
    success: boolean;
    messageId?: string;
    error?: string;
}

@Injectable()
export class SmsService {
    private readonly logger = new Logger(SmsService.name);
    private readonly apiUrl = 'https://rest.clicksend.com/v3';
    private readonly username: string;
    private readonly apiKey: string;
    private readonly defaultSender: string;

    constructor(private configService: ConfigService) {
        this.username = this.configService.get<string>('CLICKSEND_USERNAME') || '';
        this.apiKey = this.configService.get<string>('CLICKSEND_API_KEY') || '';
        // Platform default sender - tenant-specific sender is passed per message
        this.defaultSender = this.configService.get<string>('CLICKSEND_SENDER_ID') || 'ServicePulse';
    }

    private getAuthHeader(): string {
        return 'Basic ' + Buffer.from(`${this.username}:${this.apiKey}`).toString('base64');
    }

    /**
     * Send an SMS message
     */
    async sendSms(options: SendSmsOptions): Promise<SmsResult> {
        if (!this.username || !this.apiKey) {
            this.logger.warn('ClickSend credentials not configured, skipping SMS');
            return { success: false, error: 'SMS not configured' };
        }

        // Format phone number - ensure it has country code
        let phoneNumber = options.to.replace(/\s/g, '');
        if (!phoneNumber.startsWith('+')) {
            // Assume Belgian number if no country code
            if (phoneNumber.startsWith('0')) {
                phoneNumber = '+32' + phoneNumber.substring(1);
            } else {
                phoneNumber = '+32' + phoneNumber;
            }
        }

        const payload = {
            messages: [
                {
                    source: 'servicepulse',  // Platform identifier, not tenant
                    to: phoneNumber,
                    body: options.message,
                    from: options.from || this.defaultSender,
                }
            ]
        };

        try {
            const response = await fetch(`${this.apiUrl}/sms/send`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': this.getAuthHeader(),
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.response_code === 'SUCCESS') {
                const message = data.data?.messages?.[0];
                this.logger.log(`SMS sent to ${phoneNumber}, message_id: ${message?.message_id}`);
                return {
                    success: true,
                    messageId: message?.message_id,
                };
            } else {
                this.logger.error(`Failed to send SMS: ${data.response_msg}`);
                return {
                    success: false,
                    error: data.response_msg,
                };
            }
        } catch (error) {
            this.logger.error(`SMS send error: ${error.message}`);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    /**
     * Send appointment confirmation SMS
     * Uses TenantBranding for shop name, phone, and location
     */
    async sendAppointmentConfirmation(options: {
        to: string;
        branding: TenantBranding;
        customerName: string;
        date: string;
        time: string;
        device: string;
        repairType?: string;
    }): Promise<SmsResult> {
        const { branding } = options;
        const location = formatAddress(branding.address) || branding.city;
        const phone = branding.phone || branding.whatsappNumber;

        const message = `BEVESTIGD - ${branding.shopName}

Beste ${options.customerName},

Datum: ${options.date}
Tijd: ${options.time}
Toestel: ${options.device}
Reparatie: ${options.repairType || 'Reparatie'}
${location ? `\nLocatie: ${location}` : ''}${phone ? `\nTel: ${phone}` : ''}`;

        return this.sendSms({
            to: options.to,
            message,
            from: truncateForSmsSender(branding.shopName),
        });
    }

    /**
     * Send appointment reschedule SMS
     */
    async sendAppointmentReschedule(options: {
        to: string;
        branding: TenantBranding;
        customerName: string;
        oldDate: string;
        oldTime: string;
        newDate: string;
        newTime: string;
        device?: string;
    }): Promise<SmsResult> {
        const { branding } = options;
        const phone = branding.phone || branding.whatsappNumber;

        const message = `VERPLAATST - ${branding.shopName}

Beste ${options.customerName},

Uw afspraak is verplaatst.

Was: ${options.oldDate} om ${options.oldTime}
Nieuw: ${options.newDate} om ${options.newTime}${options.device ? `
Toestel: ${options.device}` : ''}
${phone ? `\nVragen? ${phone}` : ''}`;

        return this.sendSms({
            to: options.to,
            message,
            from: truncateForSmsSender(branding.shopName),
        });
    }

    /**
     * Send appointment cancellation SMS
     */
    async sendAppointmentCancellation(options: {
        to: string;
        branding: TenantBranding;
        customerName: string;
        date: string;
        time: string;
        device?: string;
    }): Promise<SmsResult> {
        const { branding } = options;
        const phone = branding.phone || branding.whatsappNumber;
        const website = branding.website;

        const message = `GEANNULEERD - ${branding.shopName}

Beste ${options.customerName},

Uw afspraak is geannuleerd.

Datum: ${options.date}
Tijd: ${options.time}${options.device ? `
Toestel: ${options.device}` : ''}
${phone ? `\nNieuwe afspraak? ${phone}` : ''}${website ? `\n${website}` : ''}`;

        return this.sendSms({
            to: options.to,
            message,
            from: truncateForSmsSender(branding.shopName),
        });
    }

    /**
     * Send appointment completion SMS with feedback link
     */
    async sendAppointmentCompleted(options: {
        to: string;
        branding: TenantBranding;
        customerName: string;
        feedbackUrl?: string;
    }): Promise<SmsResult> {
        const { branding } = options;

        let message = `Beste ${options.customerName}, uw reparatie is voltooid! Uw toestel is klaar voor afhaling bij ${branding.shopName}.`;
        if (options.feedbackUrl) {
            message += ` Laat een beoordeling achter: ${options.feedbackUrl}`;
        }

        return this.sendSms({
            to: options.to,
            message,
            from: truncateForSmsSender(branding.shopName),
        });
    }

    /**
     * Send order status update SMS
     */
    async sendOrderStatusUpdate(options: {
        to: string;
        branding: TenantBranding;
        customerName: string;
        orderNumber: string;
        status: string;
        trackingUrl?: string;
    }): Promise<SmsResult> {
        const { branding } = options;

        let message = `Beste ${options.customerName}, uw bestelling ${options.orderNumber} is nu: ${options.status}.`;
        if (options.trackingUrl) {
            message += ` Track: ${options.trackingUrl}`;
        }

        return this.sendSms({
            to: options.to,
            message,
            from: truncateForSmsSender(branding.shopName),
        });
    }
}
