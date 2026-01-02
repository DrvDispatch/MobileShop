import { apiClient } from './api-client';
import type {
    Tenant,
    TenantDomain,
    TenantConfig,
    OwnerAuditLog,
    PlatformStats,
    CreateTenantDto,
    UpdateTenantDto,
    AddDomainDto,
    UpdateConfigDto,
    LoginResponse,
} from '@/types';

// User type for impersonation dropdown
export interface TenantUser {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
}

// Impersonation response
export interface ImpersonationResponse {
    handoffCode: string;
    redirectUrl: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}

export const ownerApi = {
    // Authentication
    login: (email: string, password: string) =>
        apiClient.post<LoginResponse>('/api/auth/owner-login', { email, password }),

    logout: () => apiClient.post('/api/auth/logout'),

    // Tenants
    getTenants: () => apiClient.get<Tenant[]>('/api/owner/tenants'),

    getTenant: (id: string) => apiClient.get<Tenant>(`/api/owner/tenants/${id}`),

    createTenant: (data: CreateTenantDto) =>
        apiClient.post<Tenant>('/api/owner/tenants', data),

    updateTenant: (id: string, data: UpdateTenantDto) =>
        apiClient.patch<Tenant>(`/api/owner/tenants/${id}`, data),

    activateTenant: (id: string) =>
        apiClient.post<Tenant>(`/api/owner/tenants/${id}/activate`),

    suspendTenant: (id: string) =>
        apiClient.post<Tenant>(`/api/owner/tenants/${id}/suspend`),

    archiveTenant: (id: string) =>
        apiClient.post<Tenant>(`/api/owner/tenants/${id}/archive`),

    // Domains
    addDomain: (tenantId: string, data: AddDomainDto) =>
        apiClient.post<TenantDomain>(`/api/owner/tenants/${tenantId}/domains`, data),

    verifyDomain: (tenantId: string, domainId: string) =>
        apiClient.post<TenantDomain>(
            `/api/owner/tenants/${tenantId}/domains/${domainId}/verify`
        ),

    setPrimaryDomain: (tenantId: string, domainId: string) =>
        apiClient.post<TenantDomain>(
            `/api/owner/tenants/${tenantId}/domains/${domainId}/set-primary`
        ),

    removeDomain: (tenantId: string, domainId: string) =>
        apiClient.delete(`/api/owner/tenants/${tenantId}/domains/${domainId}`),

    // Cloudflare Domain Automation
    setupDomainCloudflare: (tenantId: string, domainId: string) =>
        apiClient.post<{ nameservers: string[]; status: string; instructions: string }>(
            `/api/owner/tenants/${tenantId}/domains/${domainId}/cloudflare/setup`
        ),

    checkAndConfigureDomain: (tenantId: string, domainId: string) =>
        apiClient.post<{ status: string; configured: boolean; message: string }>(
            `/api/owner/tenants/${tenantId}/domains/${domainId}/cloudflare/configure`
        ),

    getDomainCloudflareStatus: (tenantId: string, domainId: string) =>
        apiClient.get<{
            domain: string;
            cloudflareZoneId: string | null;
            cloudflareStatus: string;
            nameservers: string[];
            sslStatus: string | null;
            lastCheckedAt: string | null;
            errorMessage: string | null;
        }>(`/api/owner/tenants/${tenantId}/domains/${domainId}/cloudflare/status`),

    verifyCloudflareConnection: () =>
        apiClient.get<{ success: boolean; message: string }>('/api/owner/cloudflare/verify'),

    // Config
    updateConfig: (tenantId: string, data: UpdateConfigDto) =>
        apiClient.patch<TenantConfig>(`/api/owner/tenants/${tenantId}/config`, data),

    // Stats & Audit
    getStats: () => apiClient.get<PlatformStats>('/api/owner/stats'),

    getAuditLogs: (params?: { limit?: number; offset?: number }) => {
        const query = new URLSearchParams();
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.offset) query.append('offset', params.offset.toString());
        return apiClient.get<OwnerAuditLog[]>(`/api/owner/audit-logs?${query}`);
    },

    // Impersonation
    getTenantUsers: (tenantId: string) =>
        apiClient.get<TenantUser[]>(`/api/owner/tenants/${tenantId}/users`),

    impersonateUser: (tenantId: string, userId: string) =>
        apiClient.post<ImpersonationResponse>('/api/owner/impersonate', { tenantId, userId }),

    // Feature Control
    getFeatures: (tenantId: string) =>
        apiClient.get<TenantFeatures>(`/api/owner/tenants/${tenantId}/features`),

    updateFeatures: (tenantId: string, features: Partial<TenantFeatures>) =>
        apiClient.patch<TenantFeatures>(`/api/owner/tenants/${tenantId}/features`, features),

    applyPlanTemplate: (tenantId: string, planName: string) =>
        apiClient.post<TenantFeatures>(`/api/owner/tenants/${tenantId}/features/apply-plan`, { planName }),

    // User Management
    createTenantUser: (tenantId: string, data: { name: string; email: string; role: 'ADMIN' | 'CUSTOMER'; password?: string }) =>
        apiClient.post(`/api/owner/tenants/${tenantId}/users`, data),

    resetUserPassword: (tenantId: string, userId: string, password?: string) =>
        apiClient.patch(`/api/owner/tenants/${tenantId}/users/${userId}/password`, { password }),

    // ===== CMS =====

    // Homepage
    getHomepage: (tenantId: string) =>
        apiClient.get<import('@/types').TenantHomepage>(`/api/owner/tenants/${tenantId}/homepage`),

    updateHomepage: (tenantId: string, data: import('@/types').UpdateHomepageDto) =>
        apiClient.patch<import('@/types').TenantHomepage>(`/api/owner/tenants/${tenantId}/homepage`, data),

    // Pages
    listPages: (tenantId: string) =>
        apiClient.get<import('@/types').TenantPageListItem[]>(`/api/owner/tenants/${tenantId}/pages`),

    getPage: (tenantId: string, pageId: string) =>
        apiClient.get<import('@/types').TenantPage>(`/api/owner/tenants/${tenantId}/pages/${pageId}`),

    createPage: (tenantId: string, data: import('@/types').CreatePageDto) =>
        apiClient.post<import('@/types').TenantPage>(`/api/owner/tenants/${tenantId}/pages`, data),

    updatePage: (tenantId: string, pageId: string, data: import('@/types').UpdatePageDto) =>
        apiClient.patch<import('@/types').TenantPage>(`/api/owner/tenants/${tenantId}/pages/${pageId}`, data),

    publishPage: (tenantId: string, pageId: string) =>
        apiClient.post<import('@/types').TenantPage>(`/api/owner/tenants/${tenantId}/pages/${pageId}/publish`),

    unpublishPage: (tenantId: string, pageId: string) =>
        apiClient.post<import('@/types').TenantPage>(`/api/owner/tenants/${tenantId}/pages/${pageId}/unpublish`),

    deletePage: (tenantId: string, pageId: string) =>
        apiClient.delete(`/api/owner/tenants/${tenantId}/pages/${pageId}`),

    seedPages: (tenantId: string) =>
        apiClient.post(`/api/owner/tenants/${tenantId}/pages/seed`),

    // ===== REPAIR CATALOG SEEDING =====

    // Seed tenant with repair catalog
    seedTenant: (tenantId: string) =>
        apiClient.post<{ brands: number; devices: number; serviceTypes: number; deviceServices: number }>(
            `/api/owner/tenants/${tenantId}/seed`
        ),

    // Reseed tenant (clear + seed)
    reseedTenant: (tenantId: string) =>
        apiClient.post<{ brands: number; devices: number; serviceTypes: number; deviceServices: number }>(
            `/api/owner/tenants/${tenantId}/reseed`
        ),

    // Get seeding stats for tenant
    getSeedStats: (tenantId: string) =>
        apiClient.get<{ brands: number; devices: number; serviceTypes: number; deviceServices: number }>(
            `/api/owner/tenants/${tenantId}/seed-stats`
        ),

    // ===== PRODUCT CATALOG SEEDING =====

    // Get available product count for seeding
    getAvailableProductsCount: () =>
        apiClient.get<{ count: number }>('/api/owner/products/available-count'),

    // Seed products for a tenant (count=0 means all)
    seedProducts: (tenantId: string, count: number = 0) =>
        apiClient.post<{ created: number; skipped: number; errors: string[] }>(
            `/api/owner/tenants/${tenantId}/products/seed?count=${count}`
        ),

    // Clear all products for a tenant
    clearProducts: (tenantId: string) =>
        apiClient.delete<{ deleted: number }>(`/api/owner/tenants/${tenantId}/products`),
};

// TenantFeatures type for feature control
export interface TenantFeatures {
    id: string;
    tenantId: string;
    // E-Commerce
    ecommerceEnabled: boolean;
    refurbishedGrading: boolean;
    wishlistEnabled: boolean;
    stockNotifications: boolean;
    couponsEnabled: boolean;
    // Repairs
    repairsEnabled: boolean;
    quoteOnRequest: boolean;
    mailInRepairs: boolean;
    walkInQueue: boolean;
    // Tickets
    ticketsEnabled: boolean;
    liveChatWidget: boolean;
    // Invoicing
    invoicingEnabled: boolean;
    vatCalculation: boolean;
    pdfGeneration: boolean;
    // Inventory
    inventoryEnabled: boolean;
    advancedInventory: boolean;
    // Team
    employeeManagement: boolean;
    maxAdminUsers: number;
    // Analytics
    analyticsEnabled: boolean;
}

