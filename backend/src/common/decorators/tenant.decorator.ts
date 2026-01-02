/**
 * Tenant Decorator
 * 
 * Extract tenant ID from request context.
 * Works with TenantMiddleware to provide tenant scoping.
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract tenant ID from request
 * Usage: @Tenant() tenantId: string
 */
export const Tenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext): string => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenantId || request.headers['x-tenant-id'] || 'default';
    },
);

/**
 * Decorator to extract full tenant object from request
 * Usage: @TenantInfo() tenant: TenantData
 */
export const TenantInfo = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant || null;
    },
);
