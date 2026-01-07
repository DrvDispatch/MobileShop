/**
 * @core-only
 * 
 * Contact Page View Model
 * 
 * Provides tenant contact info to the Contact skin page.
 */

'use client';

import { useTenant } from '@/lib/TenantProvider';

export interface ContactPageVM {
    shopName: string;
    email: string;
    phone: string;
    whatsappNumber: string | null;
    whatsappLink: string | null;
    address: {
        line1?: string;
        postalCode?: string;
        city?: string;
    };
    googleMapsLink: string;
    openingHours: Record<string, { open: string; close: string } | null> | null;
    openChatWidget: () => void;
}

export function useContactPageVM(): ContactPageVM {
    const tenant = useTenant();
    const { contact, branding, business } = tenant;

    // Format WhatsApp link
    const formatWhatsAppLink = (num: string | null): string | null => {
        if (!num) return null;
        const cleaned = num.replace(/[^0-9+]/g, '').replace(/^\+/, '');
        return `https://wa.me/${cleaned}?text=Hallo,%20ik%20heb%20een%20vraag...`;
    };

    const address = contact.address as { line1?: string; postalCode?: string; city?: string } || {};
    const addressString = `${address.line1 || ''}, ${address.postalCode || ''} ${address.city || ''}`;
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressString)}`;

    const openChatWidget = () => {
        window.dispatchEvent(new CustomEvent('openChatWidget'));
    };

    return {
        shopName: branding.shopName,
        email: contact.email || '',
        phone: contact.phone || '',
        whatsappNumber: contact.whatsappNumber,
        whatsappLink: formatWhatsAppLink(contact.whatsappNumber),
        address,
        googleMapsLink,
        openingHours: business.openingHours as Record<string, { open: string; close: string } | null> | null,
        openChatWidget,
    };
}
