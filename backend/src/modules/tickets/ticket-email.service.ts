/**
 * Ticket Email Templates Service
 * 
 * Generates HTML email templates for ticket notifications.
 * Centralized location for all ticket-related email templates.
 */

import { Injectable } from '@nestjs/common';

export interface TicketMessage {
    sender: string;
    message: string;
    createdAt: Date;
}

export interface TenantBranding {
    shopName: string;
    phone?: string;
    whatsappNumber?: string;
    tagline?: string;  // e.g., "Premium Mobile Technology" or "Bike Repair Experts"
}

@Injectable()
export class TicketEmailService {
    /**
     * Get ticket confirmation email HTML
     */
    getTicketConfirmationHtml(
        ticket: {
            caseId: string;
            customerName: string;
            subject: string;
        },
        branding: TenantBranding
    ): string {
        const phone = branding.phone || branding.whatsappNumber || '';
        const phoneLink = phone ? `<a href="tel:${phone.replace(/\s/g, '')}">${phone}</a>` : 'onze website';

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #18181b; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .case-id { font-size: 24px; font-weight: bold; color: #18181b; text-align: center; padding: 20px; background: white; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket Ontvangen ✓</h1>
        </div>
        <div class="content">
            <p>Beste ${ticket.customerName},</p>
            <p>Bedankt voor uw bericht! Wij hebben uw vraag ontvangen en zullen zo snel mogelijk reageren.</p>
            
            <div class="case-id">
                Case ID: ${ticket.caseId}
            </div>
            
            <p><strong>Onderwerp:</strong> ${ticket.subject}</p>
            
            <p>U kunt op elk moment terugkeren naar onze website om uw gesprek voort te zetten.</p>
            
            ${phone ? `<p>Heeft u dringend hulp nodig? Bel ons op ${phoneLink} of stuur een WhatsApp.</p>` : ''}
        </div>
        <div class="footer">
            <p>${branding.shopName}${branding.tagline ? ` - ${branding.tagline}` : ''}</p>
        </div>
    </div>
</body>
</html>
        `;
    }

    /**
     * Get ticket closure email HTML with full message transcript
     */
    getTicketClosureEmailHtml(
        ticket: {
            caseId: string;
            customerName: string;
            subject: string;
            messages: TicketMessage[];
        },
        branding: TenantBranding
    ): string {
        const phone = branding.phone || branding.whatsappNumber || '';
        const whatsapp = branding.whatsappNumber || branding.phone || '';

        // Format the conversation transcript
        const messagesHtml = ticket.messages.map((msg) => {
            const time = new Date(msg.createdAt).toLocaleString('nl-BE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
            const isCustomer = msg.sender === 'customer';
            // Replace bot sender name with shop name - check for 'bot' or legacy 'Bot' suffix
            const isBot = msg.sender === 'bot' || msg.sender.toLowerCase().endsWith(' bot');
            const senderName = isBot
                ? `${branding.shopName} Bot`
                : (isCustomer ? ticket.customerName : msg.sender);

            return `
                <div style="margin: 10px 0; padding: 12px; background: ${isCustomer ? '#e0f2fe' : '#f0fdf4'}; border-radius: 8px; border-left: 4px solid ${isCustomer ? '#0284c7' : '#16a34a'};">
                    <div style="font-weight: bold; color: ${isCustomer ? '#0284c7' : '#16a34a'}; font-size: 12px; margin-bottom: 4px;">
                        ${senderName} - ${time}
                    </div>
                    <div style="color: #333;">${msg.message}</div>
                </div>
            `;
        }).join('');

        // Build contact list dynamically
        const contactItems: string[] = [];
        if (whatsapp) {
            contactItems.push(`<li>WhatsApp: <a href="https://wa.me/${whatsapp.replace(/[^0-9]/g, '')}">${whatsapp}</a></li>`);
        }
        if (phone) {
            contactItems.push(`<li>Telefoon: <a href="tel:${phone.replace(/\s/g, '')}">${phone}</a></li>`);
        }
        const contactHtml = contactItems.length > 0
            ? `<ul>${contactItems.join('')}</ul>`
            : '';

        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f4f4f5; padding: 20px; border-radius: 0 0 8px 8px; }
        .case-id { font-size: 20px; font-weight: bold; color: #18181b; text-align: center; padding: 16px; background: white; border-radius: 8px; margin: 20px 0; }
        .transcript { background: white; padding: 16px; border-radius: 8px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #71717a; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Ticket Afgehandeld ✓</h1>
        </div>
        <div class="content">
            <p>Beste ${ticket.customerName},</p>
            <p>Uw supportticket is afgehandeld. Hieronder vindt u een volledig overzicht van het gesprek.</p>
            
            <div class="case-id">
                Case ID: ${ticket.caseId}
            </div>
            
            <p><strong>Onderwerp:</strong> ${ticket.subject}</p>
            
            <div class="transcript">
                <h3 style="margin-top: 0; color: #18181b;">Gespreksoverzicht</h3>
                ${messagesHtml}
            </div>
            
            <p>Heeft u nog vragen of een nieuw probleem? U kunt altijd een nieuw ticket aanmaken op onze website${contactHtml ? ' of ons contacteren via:' : '.'}</p>
            ${contactHtml}
            
            <p>Bedankt voor uw vertrouwen in ${branding.shopName}!</p>
        </div>
        <div class="footer">
            <p>${branding.shopName}${branding.tagline ? ` - ${branding.tagline}` : ''}</p>
            <p style="font-size: 10px; color: #a1a1aa;">Dit is een automatisch gegenereerde email. U kunt dit bewaren als referentie voor uw administratie.</p>
        </div>
    </div>
</body>
</html>
        `;
    }
}

