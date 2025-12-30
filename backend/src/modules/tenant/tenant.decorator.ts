import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the current tenant from the request.
 * Usage: @CurrentTenant() tenant: TenantContext
 */
export const CurrentTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant;
    },
);

/**
 * Decorator to extract just the tenantId from the request.
 * Usage: @TenantId() tenantId: string
 */
export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenantId;
    },
);

/**
 * Type for tenant context attached to requests
 */
export interface TenantContext {
    id: string;
    name: string;
    slug: string;
    status: string;
    config?: TenantConfig;
}

export interface TenantConfig {
    shopName: string;
    logoUrl?: string;
    primaryColor: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    locale: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    openingHours?: Record<string, { open: string; close: string }>;
    timeSlots?: string[];
    closedDays: number[];
    companyName?: string;
    vatNumber?: string;
    invoicePrefix: string;
    googleAnalyticsId?: string;
    cookiebotId?: string;
    seoTitle?: string;
    seoDescription?: string;
}
