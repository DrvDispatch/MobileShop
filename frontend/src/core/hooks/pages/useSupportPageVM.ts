/**
 * @core-only
 * 
 * Support Page View Model
 * 
 * Provides tenant info and FAQ data to the Support skin page.
 */

'use client';

import { useTenant } from '@/lib/TenantProvider';

export interface SupportPageVM {
    shopPhone: string | null;
    shopEmail: string | null;
    formattedAddress: string | null;
    openingHours: Record<string, { open: string; close: string } | null> | null;
    formatHoursForCard: () => string;
}

export function useSupportPageVM(): SupportPageVM {
    const tenant = useTenant();
    const { contact, business } = tenant;

    // Format address from tenant config
    const formatAddress = (): string | null => {
        if (!contact.address) return null;
        const addr = contact.address as { line1?: string; city?: string; postalCode?: string };
        if (addr.line1 && addr.city && addr.postalCode) {
            return `${addr.line1}, ${addr.postalCode} ${addr.city}`;
        }
        return null;
    };

    // Format opening hours for card display
    const formatHoursForCard = (): string => {
        const hours = business.openingHours as Record<string, { open: string; close: string } | null> | null;
        if (!hours) return 'Mon-Sat, 9:00-18:00';

        const openDays = Object.entries(hours).filter(([, v]) => v !== null);
        if (openDays.length === 0) return 'Contact for hours';

        const firstOpen = openDays[0][1] as { open: string; close: string };
        return `${firstOpen.open} - ${firstOpen.close}`;
    };

    return {
        shopPhone: contact.phone || contact.whatsappNumber,
        shopEmail: contact.email,
        formattedAddress: formatAddress(),
        openingHours: business.openingHours as Record<string, { open: string; close: string } | null> | null,
        formatHoursForCard,
    };
}
