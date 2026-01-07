'use client';

import useSWR from 'swr';
import type { UIConfig, MarqueeItem } from './ui-config-types';

// API base URL - use relative path so requests go through Next.js rewrite proxy
const API_URL = '/api';

// SWR fetcher
const fetcher = async (url: string): Promise<UIConfig> => {
    const response = await fetch(url, {
        credentials: 'include',
        headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) {
        throw new Error('Failed to fetch UI config');
    }
    return response.json();
};

// ============================================
// Default UI Config (Dutch - REPAIR_SHOP)
// This matches the backend vertical defaults exactly
// ============================================

export const DEFAULT_UI_CONFIG: UIConfig = {
    vertical: 'REPAIR_SHOP',
    marquee: [
        { icon: 'location', text: 'Lokale experts in uw regio' },
        { icon: 'star', text: '4.7 klantbeoordeling' },
        { icon: 'wrench', text: '5 jaar ervaring in reparaties' },
        { icon: 'clock', text: 'Snelle service - vaak dezelfde dag klaar' },
        { icon: 'shield', text: 'Garantie op alle reparaties' },
        { icon: 'package', text: 'Gratis verzending vanaf €50' },
    ] as MarqueeItem[],
    footer: {
        tagline: 'Uw lokale expert voor smartphones, tablets en accessoires. Kwaliteit en service staan bij ons voorop.',
        newsletterTitle: 'Blijf op de hoogte',
        newsletterSubtitle: 'Ontvang als eerste onze aanbiedingen en tips.',
        googleReviewUrl: null,
        googleReviewRating: null,
    },
    formatting: {
        dateLocale: 'nl-BE',
        dateFormat: 'dd MMMM yyyy',
    },
    labels: {
        checkout: {
            couponCode: 'Kortingscode',
            couponPlaceholder: 'KORTINGSCODE',
            apply: 'Toepassen',
            discount: 'Korting',
            confirmationNote: 'Bestellingsbevestiging wordt verzonden naar uw account e-mail',
        },
        booking: {
            stepTitles: {
                deviceType: 'Wat wilt u laten repareren?',
                brand: 'Selecteer uw merk',
                device: 'Selecteer uw toestel',
                repair: 'Selecteer reparatie',
                datetime: 'Kies datum & tijd',
                contact: 'Uw gegevens',
            },
            success: {
                title: 'Afspraak Bevestigd!',
                thanks: 'Bedankt {name}!',
                confirmationText: 'U ontvangt een bevestiging per email op {email}.',
                deviceLabel: 'Toestel:',
                repairLabel: 'Reparatie:',
                priceLabel: 'Prijs:',
                priceOnRequest: 'Op aanvraag',
                dateLabel: 'Datum:',
                timeLabel: 'Tijd:',
                backToHome: 'Terug naar Home',
            },
            navigation: {
                previous: 'Vorige',
                next: 'Volgende',
                confirm: 'Afspraak Bevestigen',
            },
            form: {
                nameLabel: 'Volledige naam',
                namePlaceholder: 'Jan Janssen',
                emailLabel: 'E-mailadres',
                emailPlaceholder: 'jan@voorbeeld.be',
                phoneLabel: 'Telefoonnummer',
                phonePlaceholder: '+32 4XX XX XX XX',
                notesLabel: 'Opmerkingen (optioneel)',
                notesPlaceholder: 'Extra informatie over het probleem...',
            },
            emptyStates: {
                noBrands: 'Geen merken gevonden. Probeer opnieuw.',
                noDevices: 'Geen toestellen gevonden.',
                noDevicesSearch: 'Geen toestellen gevonden voor "{query}"',
                noRepairs: 'Geen reparaties gevonden voor dit toestel.',
            },
            datetime: {
                selectDate: 'Kies een datum',
                selectTime: 'Kies een tijdstip',
            },
            repairSection: {
                repairTitle: '{brand} {device} reparatie',
                selectDamage: 'Klik op jouw type schade en plan je afspraak.',
                onRequest: 'op aanvraag',
            },
            search: {
                placeholder: 'Zoek uw toestel...',
            },
        },
        reviews: {
            title: 'Klantbeoordelingen',
            reviewSingular: 'beoordeling',
            reviewPlural: 'beoordelingen',
            noReviews: 'Nog geen beoordelingen voor dit product',
            beFirst: 'Wees de eerste om een review te schrijven!',
            yourRating: 'Jouw beoordeling',
            name: 'Naam',
            email: 'E-mail',
            reviewTitle: 'Titel',
            reviewBody: 'Review',
            thankYou: 'Bedankt voor je review!',
            submit: 'Review versturen',
            showAll: 'Toon alle {count} beoordelingen',
        },
        nav: {
            devices: 'Toestellen',
            accessories: 'Accessoires',
            repairs: 'Reparaties',
            about: 'Over ons',
            contact: 'Contact',
        },
        auth: {
            myAccount: 'Mijn Account',
            logout: 'Uitloggen',
            login: 'Inloggen',
            register: 'Registreren',
        },
        footer: {
            services: 'Diensten',
            legal: 'Juridisch',
            terms: 'Algemene voorwaarden',
            privacy: 'Privacybeleid',
            returns: 'Retourbeleid',
            emailPlaceholder: 'E-mailadres',
            subscribeButton: 'Aanmelden',
        },
        loading: {
            loading: 'Laden...',
            configError: 'Configuratie Fout',
            retry: 'Opnieuw proberen',
        },
    },
};

// ============================================
// useUIConfig Hook
// ============================================

export interface UseUIConfigResult {
    uiConfig: UIConfig;
    isLoading: boolean;
    error: Error | undefined;
}

/**
 * Hook to fetch and cache UI configuration
 * Returns DEFAULT_UI_CONFIG while loading or on error (Dutch defaults)
 * Cached for 60 seconds to minimize API calls
 */
export function useUIConfig(): UseUIConfigResult {
    const { data, error, isLoading } = useSWR<UIConfig>(
        `${API_URL}/tenant/ui-config`,
        fetcher,
        {
            revalidateOnFocus: false,
            revalidateOnReconnect: false,
            dedupingInterval: 60000, // Cache for 60 seconds
            fallbackData: DEFAULT_UI_CONFIG,
        }
    );

    return {
        uiConfig: data || DEFAULT_UI_CONFIG,
        isLoading,
        error,
    };
}

// ============================================
// Helper Functions
// ============================================

/**
 * Replace template placeholders in strings
 * e.g., "Bedankt {name}!" with {name: "John"} -> "Bedankt John!"
 */
export function interpolate(template: string, values: Record<string, string | number>): string {
    return template.replace(/\{(\w+)\}/g, (_, key) => String(values[key] ?? ''));
}
