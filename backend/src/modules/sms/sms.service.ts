import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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
        this.defaultSender = this.configService.get<string>('CLICKSEND_SENDER_ID') || 'SmartphoneSvc';
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
                    source: 'smartphoneservice',
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
     */
    async sendAppointmentConfirmation(options: {
        to: string;
        customerName: string;
        date: string;
        time: string;
        device: string;
        repairType?: string;
    }): Promise<SmsResult> {
        const message = `BEVESTIGD - SmartphoneService

Beste ${options.customerName},

Datum: ${options.date}
Tijd: ${options.time}
Toestel: ${options.device}
Reparatie: ${options.repairType || 'Reparatie'}

Locatie: Antwerpen
Tel: 0465 638 106`;
        return this.sendSms({ to: options.to, message });
    }

    /**
     * Send appointment reschedule SMS
     */
    async sendAppointmentReschedule(options: {
        to: string;
        customerName: string;
        oldDate: string;
        oldTime: string;
        newDate: string;
        newTime: string;
        device?: string;
    }): Promise<SmsResult> {
        const message = `VERPLAATST - SmartphoneService

Beste ${options.customerName},

Uw afspraak is verplaatst.

Was: ${options.oldDate} om ${options.oldTime}
Nieuw: ${options.newDate} om ${options.newTime}${options.device ? `
Toestel: ${options.device}` : ''}

Locatie: Antwerpen
Vragen? 0465 638 106`;
        return this.sendSms({ to: options.to, message });
    }

    /**
     * Send appointment cancellation SMS
     */
    async sendAppointmentCancellation(options: {
        to: string;
        customerName: string;
        date: string;
        time: string;
        device?: string;
    }): Promise<SmsResult> {
        const message = `GEANNULEERD - SmartphoneService

Beste ${options.customerName},

Uw afspraak is geannuleerd.

Datum: ${options.date}
Tijd: ${options.time}${options.device ? `
Toestel: ${options.device}` : ''}

Nieuwe afspraak? 0465 638 106
www.smartphoneservice.be`;
        return this.sendSms({ to: options.to, message });
    }

    /**
     * Send appointment completion SMS with feedback link
     */
    async sendAppointmentCompleted(options: {
        to: string;
        customerName: string;
        feedbackUrl?: string;
    }): Promise<SmsResult> {
        let message = `Beste ${options.customerName}, uw reparatie is voltooid! Uw toestel is klaar voor afhaling bij SmartphoneService.`;
        if (options.feedbackUrl) {
            message += ` Laat een beoordeling achter: ${options.feedbackUrl}`;
        }
        return this.sendSms({ to: options.to, message });
    }

    /**
     * Send order status update SMS
     */
    async sendOrderStatusUpdate(options: {
        to: string;
        customerName: string;
        orderNumber: string;
        status: string;
        trackingUrl?: string;
    }): Promise<SmsResult> {
        let message = `Beste ${options.customerName}, uw bestelling ${options.orderNumber} is nu: ${options.status}.`;
        if (options.trackingUrl) {
            message += ` Track: ${options.trackingUrl}`;
        }
        return this.sendSms({ to: options.to, message });
    }
}
