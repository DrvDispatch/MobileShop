// Public tenant configuration types
// Matches the structure returned by GET /api/tenant/config

export interface TenantBranding {
    shopName: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string | null;
    accentColor: string | null;
    borderRadius: string;
    darkMode: boolean;
}

export interface TenantContact {
    email: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    address: Record<string, unknown> | null;
}

export interface TenantLocale {
    locale: string;
    currency: string;
    currencySymbol: string;
}

export interface TenantBusiness {
    openingHours: Record<string, unknown> | null;
    timeSlots: unknown[] | null;
    closedDays: unknown[] | null;
}

export interface TenantIntegrations {
    googleAnalyticsId: string | null;
    cookiebotId: string | null;
}

export interface TenantSeo {
    title: string | null;
    description: string | null;
}

export interface PublicTenantConfig {
    tenantId: string;
    branding: TenantBranding;
    contact: TenantContact;
    locale: TenantLocale;
    business: TenantBusiness;
    integrations: TenantIntegrations;
    seo: TenantSeo;
}
