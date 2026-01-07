/**
 * @core-only
 * About (Over Ons) Page View Model
 */

'use client';

import { useTenant } from '@/lib/TenantProvider';

export interface StatVM {
    value: string;
    label: string;
    iconType: string;
}

export interface ValueVM {
    iconType: string;
    title: string;
    description: string;
}

export interface AboutPageVM {
    storeName: string;
    phone: string;
    address: { line1?: string; postalCode?: string; city?: string };
    whatsappLink: string | null;
    openingHours: Record<string, { open: string; close: string } | null> | null;
    stats: StatVM[];
    values: ValueVM[];
    services: string[];
}

export function useAboutPageVM(): AboutPageVM {
    const tenant = useTenant();
    const { contact, branding, business } = tenant;

    const formatWhatsAppLink = (num: string | null): string | null => {
        if (!num) return null;
        const cleaned = num.replace(/[^0-9+]/g, '').replace(/^\+/, '');
        return `https://wa.me/${cleaned}?text=Hallo,%20ik%20wil%20graag%20meer%20informatie...`;
    };

    const stats: StatVM[] = [
        { value: "5+", label: "Jaar ervaring", iconType: "clock" },
        { value: "10.000+", label: "Tevreden klanten", iconType: "users" },
        { value: "15.000+", label: "Reparaties", iconType: "wrench" },
        { value: "4.7/5", label: "Google score", iconType: "star" }
    ];

    const values: ValueVM[] = [
        { iconType: "shield", title: "Kwaliteit eerst", description: "Wij gebruiken alleen originele en A-kwaliteit onderdelen voor elke reparatie. Geen compromissen." },
        { iconType: "heart", title: "Klantgericht", description: "Uw tevredenheid staat centraal. Van advies tot nazorg, wij staan voor u klaar." },
        { iconType: "clock", title: "Snelle service", description: "De meeste reparaties zijn binnen 60 minuten klaar. Wachten kan in onze gezellige wachtruimte." },
        { iconType: "award", title: "Garantie", description: "1 jaar garantie op al onze reparaties. Zekerheid en vertrouwen voor onze klanten." }
    ];

    const services = [
        "Smartphone reparaties (scherm, batterij, oplaadpoort, etc.)",
        "Tablet reparaties",
        "Verkoop van nieuwe en refurbished toestellen",
        "Accessoires en beschermhoesjes",
        "Data recovery en backup",
        "Softwareondersteuning"
    ];

    return {
        storeName: branding.shopName,
        phone: contact.phone || '',
        address: (contact.address as { line1?: string; postalCode?: string; city?: string }) || {},
        whatsappLink: formatWhatsAppLink(contact.whatsappNumber),
        openingHours: business.openingHours as Record<string, { open: string; close: string } | null> | null,
        stats,
        values,
        services,
    };
}
