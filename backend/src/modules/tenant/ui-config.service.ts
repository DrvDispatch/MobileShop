import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Define TenantVertical locally to avoid import issues
type TenantVertical = 'REPAIR_SHOP' | 'BARBER' | 'CAR_WASH' | 'BIKE_REPAIR' | 'GENERAL_SERVICE';

// ============================================
// UI Configuration Types
// ============================================

export interface MarqueeItem {
    icon: 'location' | 'star' | 'wrench' | 'clock' | 'shield' | 'package';
    text: string;
}

export interface CheckoutLabels {
    couponCode: string;
    couponPlaceholder: string;
    apply: string;
    discount: string;
    confirmationNote: string;
}

export interface BookingLabels {
    stepTitles: {
        deviceType: string;
        brand: string;
        device: string;
        repair: string;
        datetime: string;
        contact: string;
    };
    success: {
        title: string;
        thanks: string;
        confirmationText: string;
        deviceLabel: string;
        repairLabel: string;
        priceLabel: string;
        priceOnRequest: string;
        dateLabel: string;
        timeLabel: string;
        backToHome: string;
    };
    navigation: {
        previous: string;
        next: string;
        confirm: string;
    };
    form: {
        nameLabel: string;
        namePlaceholder: string;
        emailLabel: string;
        emailPlaceholder: string;
        phoneLabel: string;
        phonePlaceholder: string;
        notesLabel: string;
        notesPlaceholder: string;
    };
    emptyStates: {
        noBrands: string;
        noDevices: string;
        noDevicesSearch: string;
        noRepairs: string;
    };
    datetime: {
        selectDate: string;
        selectTime: string;
    };
    repairSection: {
        repairTitle: string;
        selectDamage: string;
        onRequest: string;
    };
    search: {
        placeholder: string;
    };
}

export interface ReviewLabels {
    title: string;
    reviewSingular: string;
    reviewPlural: string;
    noReviews: string;
    beFirst: string;
    yourRating: string;
    name: string;
    email: string;
    reviewTitle: string;
    reviewBody: string;
    thankYou: string;
    submit: string;
    showAll: string;
}

export interface NavLabels {
    devices: string;
    accessories: string;
    repairs: string;
    about: string;
    contact: string;
}

export interface AuthLabels {
    myAccount: string;
    logout: string;
    login: string;
    register: string;
}

export interface FooterLabels {
    services: string;
    legal: string;
    terms: string;
    privacy: string;
    returns: string;
    emailPlaceholder: string;
    subscribeButton: string;
}

export interface LoadingLabels {
    loading: string;
    configError: string;
    retry: string;
}

export interface PublicUIConfig {
    vertical: TenantVertical;
    marquee: MarqueeItem[];
    footer: {
        tagline: string;
        newsletterTitle: string;
        newsletterSubtitle: string;
        googleReviewUrl: string | null;
        googleReviewRating: string | null;
    };
    formatting: {
        dateLocale: string;
        dateFormat: string;
    };
    labels: {
        checkout: CheckoutLabels;
        booking: BookingLabels;
        reviews: ReviewLabels;
        nav: NavLabels;
        auth: AuthLabels;
        footer: FooterLabels;
        loading: LoadingLabels;
    };
}

// ============================================
// Vertical Defaults
// Dutch defaults for REPAIR_SHOP (current behavior)
// ============================================

const REPAIR_SHOP_DEFAULTS: PublicUIConfig = {
    vertical: 'REPAIR_SHOP' as TenantVertical,
    marquee: [
        { icon: 'location', text: 'Lokale experts in uw regio' },
        { icon: 'star', text: '4.7 klantbeoordeling' },
        { icon: 'wrench', text: '5 jaar ervaring in reparaties' },
        { icon: 'clock', text: 'Snelle service - vaak dezelfde dag klaar' },
        { icon: 'shield', text: 'Garantie op alle reparaties' },
        { icon: 'package', text: 'Gratis verzending vanaf €50' },
    ],
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

// Future verticals can be added here
const VERTICAL_DEFAULTS: Record<TenantVertical, PublicUIConfig> = {
    REPAIR_SHOP: REPAIR_SHOP_DEFAULTS,
    BARBER: { ...REPAIR_SHOP_DEFAULTS, vertical: 'BARBER' as TenantVertical },
    CAR_WASH: { ...REPAIR_SHOP_DEFAULTS, vertical: 'CAR_WASH' as TenantVertical },
    BIKE_REPAIR: { ...REPAIR_SHOP_DEFAULTS, vertical: 'BIKE_REPAIR' as TenantVertical },
    GENERAL_SERVICE: { ...REPAIR_SHOP_DEFAULTS, vertical: 'GENERAL_SERVICE' as TenantVertical },
};

@Injectable()
export class UIConfigService {
    private readonly logger = new Logger(UIConfigService.name);

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Get public UI configuration for a tenant
     * Merges tenant-specific overrides with vertical defaults
     */
    async getPublicUIConfig(tenantId: string): Promise<PublicUIConfig> {
        const config = await this.prisma.tenantUIConfig.findUnique({
            where: { tenantId },
        });

        // Get defaults for tenant's vertical (or REPAIR_SHOP if none set)
        const vertical = config?.vertical || 'REPAIR_SHOP';
        const defaults = this.getVerticalDefaults(vertical);

        if (!config) {
            this.logger.debug(`No UIConfig found for tenant ${tenantId}, returning defaults for ${vertical}`);
            return defaults;
        }

        // Merge tenant-specific overrides with defaults
        return this.mergeWithDefaults(config, defaults);
    }

    /**
     * Get default configuration for a vertical
     */
    getVerticalDefaults(vertical: TenantVertical): PublicUIConfig {
        return VERTICAL_DEFAULTS[vertical] || REPAIR_SHOP_DEFAULTS;
    }

    /**
     * Merge tenant-specific config with vertical defaults
     * Tenant values override defaults where present
     */
    private mergeWithDefaults(
        config: {
            vertical: TenantVertical;
            marqueeItems: unknown;
            footerTagline: string | null;
            newsletterTitle: string | null;
            newsletterSubtitle: string | null;
            googleReviewUrl: string | null;
            googleReviewRating: string | null;
            dateLocale: string;
            dateFormat: string;
            checkoutLabels: unknown;
            bookingLabels: unknown;
            reviewLabels: unknown;
            navLabels: unknown;
            authLabels: unknown;
            footerLabels: unknown;
        },
        defaults: PublicUIConfig,
    ): PublicUIConfig {
        return {
            vertical: config.vertical,
            marquee: (config.marqueeItems as MarqueeItem[]) || defaults.marquee,
            footer: {
                tagline: config.footerTagline || defaults.footer.tagline,
                newsletterTitle: config.newsletterTitle || defaults.footer.newsletterTitle,
                newsletterSubtitle: config.newsletterSubtitle || defaults.footer.newsletterSubtitle,
                googleReviewUrl: config.googleReviewUrl,
                googleReviewRating: config.googleReviewRating,
            },
            formatting: {
                dateLocale: config.dateLocale || defaults.formatting.dateLocale,
                dateFormat: config.dateFormat || defaults.formatting.dateFormat,
            },
            labels: {
                checkout: this.mergeLabels(config.checkoutLabels, defaults.labels.checkout),
                booking: this.mergeLabels(config.bookingLabels, defaults.labels.booking) as BookingLabels,
                reviews: this.mergeLabels(config.reviewLabels, defaults.labels.reviews),
                nav: this.mergeLabels(config.navLabels, defaults.labels.nav),
                auth: this.mergeLabels(config.authLabels, defaults.labels.auth),
                footer: this.mergeLabels(config.footerLabels, defaults.labels.footer),
                loading: defaults.labels.loading, // Loading labels are always from defaults
            },
        };
    }

    /**
     * Deep merge label objects, preferring tenant values
     */
    private mergeLabels<T>(tenantLabels: unknown, defaultLabels: T): T {
        if (!tenantLabels || typeof tenantLabels !== 'object') {
            return defaultLabels;
        }

        // Deep merge for nested objects
        const result = { ...defaultLabels };
        for (const key of Object.keys(defaultLabels as object)) {
            const typedKey = key as keyof T;
            const tenantValue = (tenantLabels as Record<string, unknown>)[key];
            const defaultValue = (defaultLabels as Record<string, unknown>)[key];

            if (tenantValue !== undefined && tenantValue !== null) {
                if (typeof tenantValue === 'object' && typeof defaultValue === 'object' && !Array.isArray(tenantValue)) {
                    // Recursively merge nested objects
                    (result as Record<string, unknown>)[key] = this.mergeLabels(tenantValue, defaultValue);
                } else {
                    (result as Record<string, unknown>)[key] = tenantValue;
                }
            }
        }
        return result;
    }

    /**
     * Create or update UI config for a tenant (OWNER only)
     */
    async upsertUIConfig(
        tenantId: string,
        data: Partial<{
            vertical: TenantVertical;
            marqueeItems: MarqueeItem[];
            footerTagline: string;
            newsletterTitle: string;
            newsletterSubtitle: string;
            googleReviewUrl: string;
            googleReviewRating: string;
            dateLocale: string;
            dateFormat: string;
            checkoutLabels: Partial<CheckoutLabels>;
            bookingLabels: Partial<BookingLabels>;
            reviewLabels: Partial<ReviewLabels>;
            navLabels: Partial<NavLabels>;
            authLabels: Partial<AuthLabels>;
            footerLabels: Partial<FooterLabels>;
        }>,
    ) {
        // Build prisma-compatible data object, casting JSON fields appropriately
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prismaData: Record<string, any> = {};

        if (data.vertical !== undefined) prismaData.vertical = data.vertical;
        if (data.marqueeItems !== undefined) prismaData.marqueeItems = data.marqueeItems;
        if (data.footerTagline !== undefined) prismaData.footerTagline = data.footerTagline;
        if (data.newsletterTitle !== undefined) prismaData.newsletterTitle = data.newsletterTitle;
        if (data.newsletterSubtitle !== undefined) prismaData.newsletterSubtitle = data.newsletterSubtitle;
        if (data.googleReviewUrl !== undefined) prismaData.googleReviewUrl = data.googleReviewUrl;
        if (data.googleReviewRating !== undefined) prismaData.googleReviewRating = data.googleReviewRating;
        if (data.dateLocale !== undefined) prismaData.dateLocale = data.dateLocale;
        if (data.dateFormat !== undefined) prismaData.dateFormat = data.dateFormat;
        if (data.checkoutLabels !== undefined) prismaData.checkoutLabels = data.checkoutLabels;
        if (data.bookingLabels !== undefined) prismaData.bookingLabels = data.bookingLabels;
        if (data.reviewLabels !== undefined) prismaData.reviewLabels = data.reviewLabels;
        if (data.navLabels !== undefined) prismaData.navLabels = data.navLabels;
        if (data.authLabels !== undefined) prismaData.authLabels = data.authLabels;
        if (data.footerLabels !== undefined) prismaData.footerLabels = data.footerLabels;

        return this.prisma.tenantUIConfig.upsert({
            where: { tenantId },
            update: prismaData,
            create: {
                tenantId,
                ...prismaData,
            },
        });
    }
}
