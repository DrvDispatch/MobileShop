/**
 * Appointment Email Templates Service
 * 
 * Generates HTML email templates for appointment notifications.
 * 
 * IMPORTANT: All tenant-specific branding (shop name, phone, location)
 * must come from TenantBranding parameter. NO hardcoded strings allowed.
 */

import { Injectable } from '@nestjs/common';
import { TenantBranding, formatWhatsAppLink, formatPhoneLink } from '../../utils/tenant-branding';

/**
 * Appointment data for email templates
 */
interface AppointmentData {
    customerName: string;
    appointmentDate: Date;
    timeSlot: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription?: string | null;
    bookedByName?: string | null;
}

/**
 * Reschedule data for new appointment date/time
 */
interface RescheduleData {
    appointmentDate: Date;
    timeSlot: string;
}

@Injectable()
export class AppointmentEmailService {
    /**
     * Format date in Dutch locale
     */
    formatDateNL(date: Date): string {
        return date.toLocaleDateString('nl-BE', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    }

    /**
     * Build location text from branding
     */
    private buildLocationText(branding: TenantBranding): string {
        const parts: string[] = [branding.shopName];
        if (branding.city) {
            parts.push(branding.city);
        }
        return parts.join(', ');
    }

    /**
     * Build WhatsApp contact HTML if available
     */
    private buildWhatsAppHtml(branding: TenantBranding): string {
        const whatsapp = branding.whatsappNumber || branding.phone;
        if (!whatsapp) {
            return '';
        }
        const link = formatWhatsAppLink(whatsapp);
        return `<p>Heeft u vragen? Neem contact met ons op via WhatsApp: <a href="${link}">${whatsapp}</a></p>`;
    }

    /**
     * Build contact list HTML for cancellation emails
     */
    private buildContactListHtml(branding: TenantBranding): string {
        const items: string[] = [];

        const whatsapp = branding.whatsappNumber || branding.phone;
        if (whatsapp) {
            const link = formatWhatsAppLink(whatsapp);
            items.push(`<li>WhatsApp: <a href="${link}">${whatsapp}</a></li>`);
        }

        if (branding.website) {
            items.push(`<li>Website: <a href="${branding.website}">${branding.website.replace(/^https?:\/\//, '')}</a></li>`);
        }

        if (items.length === 0) {
            return '';
        }

        return `<ul>${items.join('')}</ul>`;
    }

    /**
     * Build footer HTML with shop name
     */
    private buildFooterHtml(branding: TenantBranding): string {
        return `<div class="footer">
            <p>${branding.shopName}</p>
        </div>`;
    }

    /**
     * Get confirmation email HTML
     * @param appointment - The appointment details
     * @param branding - Tenant branding from TenantConfig
     * @param bookedByName - If someone else booked this appointment, their name
     */
    getConfirmationEmailHtml(
        appointment: AppointmentData,
        branding: TenantBranding,
        bookedByName?: string
    ): string {
        const dateFormatted = this.formatDateNL(new Date(appointment.appointmentDate));
        const locationText = this.buildLocationText(branding);
        const whatsappHtml = this.buildWhatsAppHtml(branding);
        const footerHtml = this.buildFooterHtml(branding);

        const bookedByNotice = bookedByName
            ? `<div class="detail" style="background: #fef3c7; border: 1px solid #f59e0b;">
                <div class="label">Geboekt door</div>
                <div class="value">${bookedByName}</div>
               </div>`
            : '';

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
            
            ${bookedByNotice}
            
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
            
            <p><strong>Locatie:</strong> ${locationText}</p>
            
            ${whatsappHtml}
        </div>
        ${footerHtml}
    </div>
</body>
</html>
        `;
    }

    /**
     * Get confirmation email HTML for the person who booked on behalf of someone else
     */
    getBookerConfirmationEmailHtml(
        appointment: AppointmentData,
        branding: TenantBranding
    ): string {
        const dateFormatted = this.formatDateNL(new Date(appointment.appointmentDate));
        const locationText = this.buildLocationText(branding);
        const whatsappHtml = this.buildWhatsAppHtml(branding);
        const footerHtml = this.buildFooterHtml(branding);

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #7c3aed; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
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
            <h1>Afspraak Geboekt voor ${appointment.customerName} ✓</h1>
        </div>
        <div class="content">
            <p>Beste ${appointment.bookedByName || 'Klant'},</p>
            <p>U heeft een afspraak geboekt voor <strong>${appointment.customerName}</strong>. Hier zijn de details:</p>
            
            <div class="detail">
                <div class="label">Geboekt voor</div>
                <div class="value">${appointment.customerName}</div>
            </div>
            
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
            
            <p><strong>Locatie:</strong> ${locationText}</p>
            
            <p>We hebben ook een bevestiging verstuurd naar ${appointment.customerName}.</p>
            
            ${whatsappHtml}
        </div>
        ${footerHtml}
    </div>
</body>
</html>
        `;
    }

    /**
     * Get cancellation email HTML
     */
    getCancellationEmailHtml(
        appointment: AppointmentData,
        branding: TenantBranding
    ): string {
        const dateFormatted = this.formatDateNL(new Date(appointment.appointmentDate));
        const contactListHtml = this.buildContactListHtml(branding);
        const footerHtml = this.buildFooterHtml(branding);

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
            
            ${contactListHtml ? `
            <p>Wilt u een nieuwe afspraak maken? Neem gerust contact met ons op:</p>
            ${contactListHtml}
            ` : '<p>Wilt u een nieuwe afspraak maken? Neem gerust contact met ons op via onze website.</p>'}
            
            <p>Onze excuses voor het ongemak.</p>
        </div>
        ${footerHtml}
    </div>
</body>
</html>
        `;
    }

    /**
     * Get reschedule email HTML
     */
    getRescheduleEmailHtml(
        oldAppointment: AppointmentData,
        newAppointment: RescheduleData,
        branding: TenantBranding
    ): string {
        const oldDateFormatted = this.formatDateNL(new Date(oldAppointment.appointmentDate));
        const newDateFormatted = this.formatDateNL(new Date(newAppointment.appointmentDate));
        const locationText = this.buildLocationText(branding);
        const whatsappHtml = this.buildWhatsAppHtml(branding);
        const footerHtml = this.buildFooterHtml(branding);

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
            
            <p><strong>Locatie:</strong> ${locationText}</p>
            
            ${whatsappHtml}
        </div>
        ${footerHtml}
    </div>
</body>
</html>
        `;
    }
}

