export enum TenantStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    ARCHIVED = 'ARCHIVED',
}

export enum DomainVerificationStatus {
    PENDING = 'PENDING',
    VERIFIED = 'VERIFIED',
    FAILED = 'FAILED',
}

export enum CloudflareDomainStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    DNS_CONFIGURED = 'DNS_CONFIGURED',
    ERROR = 'ERROR',
}

export interface Tenant {
    id: string;
    name: string;
    slug: string;
    status: TenantStatus;
    createdAt: string;
    updatedAt: string;
    suspendedAt?: string;
    archivedAt?: string;
    onboardingStatus?: Record<string, boolean>;
    domains?: TenantDomain[];
    config?: TenantConfig;
}

export interface TenantDomain {
    id: string;
    tenantId: string;
    domain: string;
    isPrimary: boolean;
    verificationStatus: DomainVerificationStatus;
    verificationToken?: string;
    verifiedAt?: string;
    createdAt: string;
    updatedAt: string;
    // Cloudflare fields
    cloudflareZoneId?: string;
    cloudflareStatus: CloudflareDomainStatus;
    nameservers: string[];
    sslStatus?: string;
    lastCheckedAt?: string;
    errorMessage?: string;
}

export interface TenantConfig {
    id: string;
    tenantId: string;
    shopName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    borderRadius?: string;
    darkMode?: boolean;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    locale?: string;
    currency?: string;
    timezone?: string;
    features?: Record<string, boolean>;
    createdAt: string;
    updatedAt: string;
}

export interface OwnerAuditLog {
    id: string;
    ownerId: string;
    action: string;
    targetType: string;
    targetId: string;
    metadata?: Record<string, unknown>;
    ipAddress?: string;
    userAgent?: string;
    createdAt: string;
    owner?: {
        id: string;
        email: string;
        name?: string;
    };
}

export interface PlatformStats {
    totalTenants: number;
    activeTenants: number;
    suspendedTenants: number;
    draftTenants: number;
    archivedTenants: number;
    totalDomains: number;
    verifiedDomains: number;
    recentAuditLogs: OwnerAuditLog[];
}

export interface CreateTenantDto {
    name: string;
    slug: string;
}

export interface UpdateTenantDto {
    name?: string;
    slug?: string;
}

export interface AddDomainDto {
    domain: string;
}

export interface UpdateConfigDto {
    shopName?: string;
    logoUrl?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    borderRadius?: string;
    darkMode?: boolean;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    locale?: string;
    currency?: string;
    timezone?: string;
    features?: Record<string, boolean>;
}

export interface OwnerUser {
    id: string;
    email: string;
    name?: string;
    role: 'OWNER';
}

export interface LoginResponse {
    access_token: string;
    user: OwnerUser;
}

// ===== CMS Types =====

export enum CmsStatus {
    DRAFT = 'DRAFT',
    PUBLISHED = 'PUBLISHED',
}

export interface TenantHomepage {
    id: string;
    tenantId: string;
    heroTitle: string;
    heroSubtitle: string;
    heroDescription?: string;
    heroImageUrl?: string;
    heroCta1Text: string;
    heroCta1Link: string;
    heroCta2Text?: string;
    heroCta2Link?: string;
    trustBadge1: string;
    trustBadge2: string;
    trustBadge3: string;
    conversionTitle?: string;
    conversionFeature1?: string;
    conversionFeature2?: string;
    conversionFeature3?: string;
    showConversionStrip: boolean;
    showServices: boolean;
    status: CmsStatus;
    createdAt: string;
    updatedAt: string;
}

export interface TenantPage {
    id: string;
    tenantId: string;
    slug: string;
    title: string;
    content: object; // TipTap JSON
    seoTitle?: string;
    seoDescription?: string;
    showInNav: boolean;
    navOrder: number;
    isSystemPage: boolean;
    status: CmsStatus;
    publishedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TenantPageListItem {
    id: string;
    slug: string;
    title: string;
    status: CmsStatus;
    isSystemPage: boolean;
    showInNav: boolean;
    navOrder: number;
    publishedAt?: string;
    updatedAt: string;
}

export interface CreatePageDto {
    slug: string;
    title: string;
    content?: object;
    seoTitle?: string;
    seoDescription?: string;
    showInNav?: boolean;
    navOrder?: number;
}

export interface UpdatePageDto {
    title?: string;
    content?: object;
    seoTitle?: string;
    seoDescription?: string;
    showInNav?: boolean;
    navOrder?: number;
}

export interface UpdateHomepageDto {
    heroTitle?: string;
    heroSubtitle?: string;
    heroDescription?: string;
    heroImageUrl?: string;
    heroCta1Text?: string;
    heroCta1Link?: string;
    heroCta2Text?: string;
    heroCta2Link?: string;
    trustBadge1?: string;
    trustBadge2?: string;
    trustBadge3?: string;
    conversionTitle?: string;
    conversionFeature1?: string;
    conversionFeature2?: string;
    conversionFeature3?: string;
    showConversionStrip?: boolean;
    showServices?: boolean;
    status?: CmsStatus;
}

