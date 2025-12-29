import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private readonly resend: Resend;
    private readonly fromEmail: string;
    private readonly frontendUrl: string;

    constructor(private configService: ConfigService) {
        this.resend = new Resend(this.configService.get<string>('RESEND_API_KEY'));
        this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'SmartphoneService <noreply@send.smartphoneservice.be>';
        this.frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    }

    /**
     * Base email template with modern black & white minimalistic design
     */
    private getEmailTemplate(options: {
        title: string;
        showCheckmark?: boolean;
        content: string;
        footerText?: string;
    }): string {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                    <!-- Card Container -->
                    <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                        <!-- Black Header -->
                        <div style="background: #000000; padding: 32px 40px; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                                ${options.title}${options.showCheckmark ? ' ✓' : ''}
                            </h1>
                        </div>
                        <!-- White Body -->
                        <div style="padding: 32px 40px;">
                            ${options.content}
                        </div>
                        ${options.footerText ? `
                        <!-- Footer -->
                        <div style="padding: 16px 40px 32px; border-top: 1px solid #eee;">
                            <p style="color: #666; font-size: 13px; margin: 0; line-height: 1.5;">
                                ${options.footerText}
                            </p>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Create a detail row with gray label and black value (like in booking confirmation)
     */
    private getDetailRow(label: string, value: string): string {
        return `
            <div style="margin-bottom: 20px; padding-bottom: 20px; border-bottom: 1px solid #f0f0f0;">
                <p style="color: #888; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 6px;">
                    ${label}
                </p>
                <p style="color: #000; font-size: 16px; margin: 0; font-weight: 400;">
                    ${value}
                </p>
            </div>
        `;
    }

    /**
     * Create a CTA button
     */
    private getButton(text: string, url: string, style: 'primary' | 'secondary' = 'primary'): string {
        const bgColor = style === 'primary' ? '#000' : '#fff';
        const textColor = style === 'primary' ? '#fff' : '#000';
        const border = style === 'secondary' ? 'border: 1px solid #000;' : '';

        return `
            <a href="${url}" style="display: inline-block; background: ${bgColor}; color: ${textColor}; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-weight: 500; font-size: 14px; ${border}">
                ${text}
            </a>
        `;
    }

    // Generic email sending method for custom emails
    async sendEmail(options: { to: string; subject: string; html: string }): Promise<boolean> {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: options.html,
            });

            if (error) {
                this.logger.error(`Failed to send email: ${error.message}`);
                return false;
            }

            this.logger.log(`Email sent to ${options.to}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending email: ${error}`);
            return false;
        }
    }

    // Email with attachment support (for PDF invoices, etc.)
    async sendEmailWithAttachment(options: {
        to: string;
        subject: string;
        html: string;
        attachments: Array<{ filename: string; content: Buffer }>;
    }): Promise<boolean> {
        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: options.html,
                attachments: options.attachments,
            });

            if (error) {
                this.logger.error(`Failed to send email with attachment: ${error.message}`);
                return false;
            }

            this.logger.log(`Email with attachment sent to ${options.to}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending email with attachment: ${error}`);
            return false;
        }
    }

    async sendVerificationEmail(email: string, token: string, name: string): Promise<boolean> {
        const verifyUrl = `${this.frontendUrl}/verify-email?token=${token}`;

        const content = `
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Beste ${name},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Bedankt voor uw registratie bij SmartphoneService. Klik op de onderstaande knop om uw email adres te verifiëren.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                ${this.getButton('Email Verifiëren', verifyUrl)}
            </div>
            <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                Als u geen account heeft aangemaakt, kunt u deze email negeren.
            </p>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Verifieer uw email - SmartphoneService',
                html: this.getEmailTemplate({
                    title: 'Email Verificatie',
                    content,
                    footerText: 'Deze link verloopt over 24 uur.',
                }),
            });

            if (error) {
                this.logger.error(`Failed to send verification email: ${error.message}`);
                return false;
            }

            this.logger.log(`Verification email sent to ${email}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending verification email: ${error}`);
            return false;
        }
    }

    async sendPasswordResetEmail(email: string, token: string, name: string): Promise<boolean> {
        const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

        const content = `
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Beste ${name},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                We hebben een verzoek ontvangen om uw wachtwoord te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen.
            </p>
            <div style="text-align: center; margin: 32px 0;">
                ${this.getButton('Wachtwoord Resetten', resetUrl)}
            </div>
            <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                Als u dit verzoek niet heeft gedaan, kunt u deze email negeren. Uw wachtwoord blijft ongewijzigd.
            </p>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Wachtwoord Resetten - SmartphoneService',
                html: this.getEmailTemplate({
                    title: 'Wachtwoord Resetten',
                    content,
                    footerText: 'Deze link verloopt over 1 uur om veiligheidsredenen.',
                }),
            });

            if (error) {
                this.logger.error(`Failed to send password reset email: ${error.message}`);
                return false;
            }

            this.logger.log(`Password reset email sent to ${email}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending password reset email: ${error}`);
            return false;
        }
    }

    async sendWelcomeEmail(email: string, name: string): Promise<boolean> {
        const content = `
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Beste ${name},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Uw email is geverifieerd en uw account is nu actief. Welkom bij SmartphoneService!
            </p>
            ${this.getDetailRow('WAT U KUNT DOEN', 'Bekijk onze refurbished smartphones, boek een reparatie afspraak, of volg uw bestellingen.')}
            <div style="text-align: center; margin: 32px 0;">
                ${this.getButton('Begin met Shoppen', this.frontendUrl)}
            </div>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: email,
                subject: 'Welkom bij SmartphoneService!',
                html: this.getEmailTemplate({
                    title: 'Welkom',
                    showCheckmark: true,
                    content,
                    footerText: 'Vragen? Neem gerust contact met ons op.',
                }),
            });

            if (error) {
                this.logger.error(`Failed to send welcome email: ${error.message}`);
                return false;
            }

            this.logger.log(`Welcome email sent to ${email}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending welcome email: ${error}`);
            return false;
        }
    }

    /**
     * Send feedback request email with star rating
     */
    async sendFeedbackRequestEmail(options: {
        to: string;
        customerName: string;
        token: string;
        sourceType: 'ticket' | 'repair';
        showGoogleReview?: boolean;
    }): Promise<boolean> {
        const ratingUrl = `${this.frontendUrl}/rating/${options.token}`;
        const googleReviewUrl = 'https://maps.app.goo.gl/6bAP4qtykPysRhSF9';
        const unsubscribeUrl = `${this.frontendUrl}/unsubscribe?email=${encodeURIComponent(options.to)}`;

        const sourceLabel = options.sourceType === 'repair' ? 'reparatie' : 'ondersteuning';

        const content = `
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Beste ${options.customerName},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Bedankt voor uw bezoek aan SmartphoneService. We hopen dat u tevreden bent met onze ${sourceLabel}.
            </p>
            ${this.getDetailRow('UW MENING', 'Hoe zou u uw ervaring beoordelen?')}
            
            <!-- Star Rating -->
            <div style="text-align: center; margin: 24px 0;">
                <a href="${ratingUrl}?rating=1" style="text-decoration: none; font-size: 32px; margin: 0 4px;">⭐</a>
                <a href="${ratingUrl}?rating=2" style="text-decoration: none; font-size: 32px; margin: 0 4px;">⭐</a>
                <a href="${ratingUrl}?rating=3" style="text-decoration: none; font-size: 32px; margin: 0 4px;">⭐</a>
                <a href="${ratingUrl}?rating=4" style="text-decoration: none; font-size: 32px; margin: 0 4px;">⭐</a>
                <a href="${ratingUrl}?rating=5" style="text-decoration: none; font-size: 32px; margin: 0 4px;">⭐</a>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
                ${this.getButton('Beoordeling Geven', ratingUrl)}
            </div>
            
            ${options.showGoogleReview ? `
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #eee; text-align: center;">
                <p style="color: #666; font-size: 13px; margin: 0 0 16px;">
                    Heel tevreden? Laat een Google Review achter!
                </p>
                ${this.getButton('Google Review', googleReviewUrl, 'secondary')}
            </div>
            ` : ''}
            
            <p style="color: #999; font-size: 11px; text-align: center; margin: 32px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #999;">Uitschrijven</a> van deze emails
            </p>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: 'Hoe was uw ervaring?',
                html: this.getEmailTemplate({
                    title: 'Uw Feedback',
                    content,
                }),
            });

            if (error) {
                this.logger.error(`Failed to send feedback email: ${error.message}`);
                return false;
            }

            this.logger.log(`Feedback email sent to ${options.to}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending feedback email: ${error}`);
            return false;
        }
    }

    /**
     * Send promotional/marketing email with product showcase
     */
    async sendPromotionalEmail(options: {
        to: string;
        customerName: string;
        subject: string;
        headline: string;
        bodyHtml: string;
        ctaText?: string;
        ctaUrl?: string;
        featuredProducts?: Array<{
            name: string;
            price: string;
            imageUrl?: string;
            productUrl: string;
        }>;
    }): Promise<boolean> {
        const unsubscribeUrl = `${this.frontendUrl}/unsubscribe?email=${encodeURIComponent(options.to)}`;

        // Build products HTML if provided
        let productsHtml = '';
        if (options.featuredProducts && options.featuredProducts.length > 0) {
            productsHtml = `
                <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #eee;">
                    <p style="color: #888; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px;">
                        AANBEVOLEN VOOR U
                    </p>
                    <div style="display: flex; flex-wrap: wrap; gap: 12px;">
                        ${options.featuredProducts.map(p => `
                            <a href="${p.productUrl}" style="text-decoration: none; display: block; flex: 1; min-width: 140px; max-width: 180px; text-align: center; border: 1px solid #eee; border-radius: 8px; padding: 16px;">
                                ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" style="width: 100%; height: 80px; object-fit: contain; margin-bottom: 8px;">` : ''}
                                <p style="color: #000; font-size: 13px; margin: 0 0 4px; font-weight: 500;">${p.name}</p>
                                <p style="color: #000; font-size: 15px; margin: 0; font-weight: 600;">${p.price}</p>
                            </a>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        const content = `
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Beste ${options.customerName},
            </p>
            <div style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                ${options.bodyHtml}
            </div>
            
            ${options.ctaText && options.ctaUrl ? `
            <div style="text-align: center; margin: 32px 0;">
                ${this.getButton(options.ctaText, options.ctaUrl)}
            </div>
            ` : ''}
            
            ${productsHtml}
            
            <p style="color: #999; font-size: 11px; text-align: center; margin: 32px 0 0;">
                <a href="${unsubscribeUrl}" style="color: #999;">Uitschrijven</a> van promotionele emails
            </p>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: options.subject,
                html: this.getEmailTemplate({
                    title: options.headline,
                    content,
                }),
            });

            if (error) {
                this.logger.error(`Failed to send promotional email: ${error.message}`);
                return false;
            }

            this.logger.log(`Promotional email sent to ${options.to}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending promotional email: ${error}`);
            return false;
        }
    }

    /**
     * Check if email is unsubscribed
     */
    async isUnsubscribed(email: string, prisma: any): Promise<boolean> {
        const unsubscribe = await prisma.emailUnsubscribe.findUnique({
            where: { email: email.toLowerCase() },
        });
        return !!unsubscribe;
    }

    /**
     * Send order confirmation email with full order details
     */
    async sendOrderConfirmation(options: {
        to: string;
        orderNumber: string;
        customerName: string;
        items: Array<{
            name: string;
            quantity: number;
            unitPrice: number;
            totalPrice: number;
            imageUrl?: string;
        }>;
        subtotal: number;
        shippingAmount: number;
        total: number;
        shippingAddress?: {
            line1: string;
            line2?: string;
            city: string;
            postalCode: string;
            country: string;
        };
        fulfillmentType: 'SHIPPING' | 'PICKUP';
        orderId: string;
        invoicePdf?: Buffer;
    }): Promise<boolean> {
        // Build items table with product images
        const itemsHtml = options.items.map(item => `
            <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        ${item.imageUrl ? `
                            <img src="${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; background: #f5f5f5;" />
                        ` : `
                            <div style="width: 60px; height: 60px; background: #f5f5f5; border-radius: 8px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: #999; font-size: 20px;">📱</span>
                            </div>
                        `}
                        <div>
                            <p style="margin: 0; color: #000; font-weight: 500;">${item.name}</p>
                            <p style="margin: 4px 0 0; color: #666; font-size: 13px;">Aantal: ${item.quantity}</p>
                        </div>
                    </div>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0; text-align: right; color: #000; font-weight: 500; vertical-align: middle;">
                    €${Number(item.totalPrice).toFixed(2)}
                </td>
            </tr>
        `).join('');

        // Delivery estimate based on country
        const country = options.shippingAddress?.country?.toUpperCase() || 'BE';
        const deliveryEstimate = country === 'BE' ? '2-3 werkdagen' : '5-7 werkdagen';

        // Build address section
        let addressHtml = '';
        if (options.fulfillmentType === 'SHIPPING' && options.shippingAddress) {
            addressHtml = `
                <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="color: #888; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">
                        VERZENDADRES
                    </p>
                    <p style="color: #000; margin: 0; line-height: 1.6;">
                        ${options.customerName}<br>
                        ${options.shippingAddress.line1}<br>
                        ${options.shippingAddress.line2 ? options.shippingAddress.line2 + '<br>' : ''}
                        ${options.shippingAddress.postalCode} ${options.shippingAddress.city}<br>
                        ${this.getCountryName(options.shippingAddress.country)}
                    </p>
                </div>
            `;
        } else {
            addressHtml = `
                <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 24px 0;">
                    <p style="color: #888; font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 8px;">
                        AFHALEN IN WINKEL
                    </p>
                    <p style="color: #000; margin: 0; line-height: 1.6;">
                        Uw bestelling ligt klaar in onze winkel.<br>
                        We sturen u een bericht zodra het klaar is.
                    </p>
                </div>
            `;
        }

        const content = `
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
                Beste ${options.customerName},
            </p>
            <p style="color: #333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                Bedankt voor uw bestelling! We hebben uw betaling ontvangen en uw bestelling wordt nu verwerkt.
            </p>

            <!-- Order Number -->
            <div style="background: #000; color: #fff; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <p style="margin: 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8;">Bestelnummer</p>
                <p style="margin: 8px 0 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">${options.orderNumber}</p>
            </div>

            <!-- Items Table -->
            <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
                <thead>
                    <tr>
                        <th style="text-align: left; padding: 12px 0; border-bottom: 2px solid #000; color: #888; font-size: 11px; font-weight: 500; text-transform: uppercase;">Product</th>
                        <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid #000; color: #888; font-size: 11px; font-weight: 500; text-transform: uppercase;">Prijs</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
            </table>

            <!-- Totals -->
            <div style="margin: 24px 0;">
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #666;">Subtotaal</span>
                    <span style="color: #000;">€${options.subtotal.toFixed(2)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 8px 0;">
                    <span style="color: #666;">Verzendkosten</span>
                    <span style="color: #000;">${options.shippingAmount > 0 ? '€' + options.shippingAmount.toFixed(2) : 'Gratis'}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #000; margin-top: 8px;">
                    <span style="color: #000; font-weight: bold; font-size: 18px;">Totaal</span>
                    <span style="color: #000; font-weight: bold; font-size: 18px;">€${options.total.toFixed(2)}</span>
                </div>
                <p style="color: #888; font-size: 12px; margin: 4px 0 0; text-align: right;">Inclusief 21% BTW</p>
            </div>

            ${addressHtml}

            ${options.fulfillmentType === 'SHIPPING' ? `
            <!-- Delivery Estimate -->
            <div style="background: #e8f5e9; border-radius: 8px; padding: 16px; margin: 24px 0; text-align: center;">
                <p style="color: #2e7d32; margin: 0; font-weight: 500;">
                    🚚 Geschatte levering: ${deliveryEstimate}
                </p>
            </div>
            ` : ''}

            <div style="text-align: center; margin: 32px 0;">
                ${this.getButton('Bekijk Bestelling', `${this.frontendUrl}/account/orders`)}
            </div>

            <p style="color: #888; font-size: 13px; line-height: 1.5; margin: 24px 0 0;">
                Heeft u vragen over uw bestelling? Neem gerust contact met ons op via onze website of antwoord op deze email.
            </p>
        `;

        try {
            // Prepare attachments if invoice PDF is provided
            const attachments = options.invoicePdf ? [{
                filename: `factuur-${options.orderNumber}.pdf`,
                content: options.invoicePdf,
            }] : undefined;

            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: `Bevestiging bestelling #${options.orderNumber} - SmartphoneService`,
                html: this.getEmailTemplate({
                    title: 'Bestelling Bevestigd ✓',
                    showCheckmark: false,
                    content,
                }),
                attachments,
            });

            if (error) {
                this.logger.error(`Failed to send order confirmation email: ${error.message}`);
                return false;
            }

            this.logger.log(`Order confirmation email sent to ${options.to}, order: ${options.orderNumber}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending order confirmation email: ${error}`);
            return false;
        }
    }

    /**
     * Send order status update email
     */
    async sendOrderStatusUpdate(options: {
        to: string;
        orderNumber: string;
        customerName: string;
        newStatus: 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
        trackingNumber?: string;
        trackingUrl?: string;
        cancellationReason?: string;
        orderId: string;
    }): Promise<boolean> {
        const statusConfig = {
            PROCESSING: {
                title: 'Bestelling wordt verwerkt',
                icon: '📦',
                headerColor: '#2563eb', // blue
                description: 'Uw bestelling wordt momenteel verwerkt door ons team. Wij sturen u spoedig een update wanneer uw pakket onderweg is.',
            },
            SHIPPED: {
                title: 'Bestelling verzonden!',
                icon: '🚚',
                headerColor: '#7c3aed', // purple
                description: 'Goed nieuws! Uw bestelling is verzonden en is onderweg naar u.',
            },
            DELIVERED: {
                title: 'Bestelling afgeleverd',
                icon: '✅',
                headerColor: '#059669', // green
                description: 'Uw bestelling is afgeleverd. Wij hopen dat u tevreden bent met uw aankoop!',
            },
            CANCELLED: {
                title: 'Bestelling geannuleerd',
                icon: '❌',
                headerColor: '#dc2626', // red
                description: 'Uw bestelling is geannuleerd. Als er al een betaling is verwerkt, ontvangt u binnen 5-7 werkdagen een terugbetaling.',
            },
        };

        const config = statusConfig[options.newStatus];
        const orderUrl = `${this.frontendUrl}/account/orders`;

        let trackingSection = '';
        if (options.newStatus === 'SHIPPED' && options.trackingNumber) {
            trackingSection = `
                <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="font-weight: 600; margin: 0 0 10px; color: #333;">Track & Trace</p>
                    <p style="margin: 0; color: #666;">Uw trackingnummer: <strong>${options.trackingNumber}</strong></p>
                    ${options.trackingUrl ? `<p style="margin: 10px 0 0;"><a href="${options.trackingUrl}" style="color: #2563eb; text-decoration: underline;">Volg uw pakket →</a></p>` : ''}
                </div>
            `;
        }

        let cancellationSection = '';
        if (options.newStatus === 'CANCELLED' && options.cancellationReason) {
            cancellationSection = `
                <div style="background: #fef2f2; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
                    <p style="font-weight: 600; margin: 0 0 10px; color: #333;">Reden voor annulering</p>
                    <p style="margin: 0; color: #666;">${options.cancellationReason}</p>
                </div>
            `;
        }

        const content = `
            <div style="text-align: center; margin-bottom: 24px;">
                <span style="font-size: 48px;">${config.icon}</span>
            </div>
            <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 16px;">
                Beste ${options.customerName},
            </p>
            <p style="color: #666; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                ${config.description}
            </p>
            ${this.getDetailRow('Bestelnummer', options.orderNumber)}
            ${this.getDetailRow('Status', config.title)}
            ${trackingSection}
            ${cancellationSection}
            <div style="text-align: center; margin: 32px 0;">
                ${this.getButton('Bekijk bestelling', orderUrl)}
            </div>
            <p style="color: #888; font-size: 13px; margin-top: 24px; text-align: center;">
                Heeft u vragen? Neem gerust contact met ons op.
            </p>
        `;

        try {
            const { data, error } = await this.resend.emails.send({
                from: this.fromEmail,
                to: options.to,
                subject: `${config.icon} ${config.title} - Bestelling #${options.orderNumber}`,
                html: `
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
                        <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
                            <div style="background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
                                <div style="background: ${config.headerColor}; padding: 32px 40px; text-align: center;">
                                    <h1 style="color: white; margin: 0; font-size: 22px; font-weight: 600; letter-spacing: -0.5px;">
                                        ${config.title}
                                    </h1>
                                </div>
                                <div style="padding: 32px 40px;">
                                    ${content}
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>
                `,
            });

            if (error) {
                this.logger.error(`Failed to send order status email: ${error.message}`);
                return false;
            }

            this.logger.log(`Order status email sent to ${options.to}, order: ${options.orderNumber}, status: ${options.newStatus}, id: ${data?.id}`);
            return true;
        } catch (error) {
            this.logger.error(`Error sending order status email: ${error}`);
            return false;
        }
    }

    /**
     * Get country name from code
     */
    private getCountryName(code: string): string {
        const countries: Record<string, string> = {
            'BE': 'België',
            'NL': 'Nederland',
            'DE': 'Duitsland',
            'FR': 'Frankrijk',
            'LU': 'Luxemburg',
            'GB': 'Verenigd Koninkrijk',
        };
        return countries[code.toUpperCase()] || code;
    }
}

