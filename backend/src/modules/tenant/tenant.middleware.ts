import { Injectable, NestMiddleware, NotFoundException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

// Extend Express Request to include tenant context
// Feature flags type for request context
export interface TenantFeatures {
    ecommerceEnabled: boolean;
    refurbishedGrading: boolean;
    wishlistEnabled: boolean;
    stockNotifications: boolean;
    couponsEnabled: boolean;
    repairsEnabled: boolean;
    quoteOnRequest: boolean;
    mailInRepairs: boolean;
    walkInQueue: boolean;
    ticketsEnabled: boolean;
    liveChatWidget: boolean;
    invoicingEnabled: boolean;
    vatCalculation: boolean;
    pdfGeneration: boolean;
    inventoryEnabled: boolean;
    advancedInventory: boolean;
    employeeManagement: boolean;
    maxAdminUsers: number;
    analyticsEnabled: boolean;
}

// Default features (used when no TenantFeature record exists)
export const DEFAULT_FEATURES: TenantFeatures = {
    ecommerceEnabled: true,
    refurbishedGrading: true,
    wishlistEnabled: true,
    stockNotifications: true,
    couponsEnabled: true,
    repairsEnabled: true,
    quoteOnRequest: false,
    mailInRepairs: false,
    walkInQueue: false,
    ticketsEnabled: true,
    liveChatWidget: true,
    invoicingEnabled: true,
    vatCalculation: true,
    pdfGeneration: true,
    inventoryEnabled: true,
    advancedInventory: false,
    employeeManagement: false,
    maxAdminUsers: 1,
    analyticsEnabled: true,
};

declare global {
    namespace Express {
        interface Request {
            tenant?: {
                id: string;
                name: string;
                slug: string;
                status: string;
                config?: {
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
                };
            };
            tenantId?: string;
            features?: TenantFeatures;  // Feature flags for current tenant
        }
    }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantMiddleware.name);

    // Cache tenant lookups for performance (TTL: 5 minutes)
    // Static so it can be invalidated from OwnerService when tenant status changes
    private static tenantCache = new Map<string, { tenant: Express.Request['tenant']; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    constructor(private readonly prisma: PrismaService) { }

    /**
     * Invalidate cache for a specific domain or all domains for a tenant
     * Call this when tenant status changes (suspend, activate, archive)
     */
    static invalidateCache(domainOrTenantId?: string): void {
        if (!domainOrTenantId) {
            // Clear all cache
            TenantMiddleware.tenantCache.clear();
            return;
        }

        // Try to find and delete by domain or tenantId
        for (const [domain, entry] of TenantMiddleware.tenantCache.entries()) {
            if (domain === domainOrTenantId || entry.tenant?.id === domainOrTenantId) {
                TenantMiddleware.tenantCache.delete(domain);
            }
        }
    }

    async use(req: Request, res: Response, next: NextFunction) {
        // Skip tenant resolution for owner panel routes (platform-level)
        // Use originalUrl because req.path is stripped by Express when using global prefix
        const path = req.originalUrl?.split('?')[0] || req.path || req.url.split('?')[0];

        // Check for owner routes - handles both /owner/* and /api/owner/* patterns
        // Also skip logout to allow cleanup for suspended tenants
        // Skip Google OAuth routes (platform-level, not tenant-specific)
        // Skip Stripe checkout redirects (platform-level, resolves tenant and redirects)
        const skipPaths = [
            '/owner', '/api/owner',
            '/auth/owner-login', '/api/auth/owner-login',
            '/auth/logout', '/api/auth/logout',
            '/auth/google', '/api/auth/google',  // OAuth initiation + callback
            '/orders/webhook', '/api/orders/webhook',  // Stripe webhooks
            '/orders/checkout-success', '/api/orders/checkout-success',  // Stripe success redirect
            '/orders/checkout-cancel', '/api/orders/checkout-cancel',    // Stripe cancel redirect
            '/orders/resolve-session', '/api/orders/resolve-session',    // Session resolver
        ];

        if (skipPaths.some(p => path.startsWith(p) || path === p)) {
            return next();
        }

        // Extract domain from Host header (prefer x-forwarded-host for proxied requests)
        const host = req.get('x-forwarded-host') || req.get('host');

        if (!host) {
            this.logger.warn('No host header found in request');
            return res.status(400).json({
                statusCode: 400,
                message: 'Missing Host header',
                error: 'Bad Request'
            });
        }

        // Normalize domain: lowercase, strip port, strip www prefix
        const normalizedDomain = this.normalizeDomain(host);

        if (!normalizedDomain) {
            return res.status(400).json({
                statusCode: 400,
                message: 'Invalid Host header',
                error: 'Bad Request'
            });
        }

        // Check cache first
        const cachedEntry = TenantMiddleware.tenantCache.get(normalizedDomain);
        if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
            // CRITICAL: Still enforce status check even from cache
            if (cachedEntry.tenant?.status !== 'ACTIVE') {
                const status = cachedEntry.tenant?.status;
                this.logger.warn(`Cached tenant ${cachedEntry.tenant?.slug} is not active (status: ${status})`);

                // Invalidate cache so next request re-fetches from DB
                TenantMiddleware.tenantCache.delete(normalizedDomain);

                if (status === 'SUSPENDED') {
                    return res.status(403).json({
                        statusCode: 403,
                        message: 'This account has been suspended',
                        error: 'Tenant Suspended',
                        code: 'TENANT_SUSPENDED'
                    });
                }

                return res.status(503).json({
                    statusCode: 503,
                    message: 'This shop is temporarily unavailable',
                    error: 'Service Unavailable'
                });
            }

            req.tenant = cachedEntry.tenant;
            req.tenantId = cachedEntry.tenant?.id;
            return next();
        }

        try {
            // Look up tenant by domain with config and features
            const tenantDomain = await this.prisma.tenantDomain.findUnique({
                where: { domain: normalizedDomain },
                include: {
                    tenant: {
                        include: {
                            config: true,
                            features: true  // Load TenantFeature for request context
                        }
                    }
                }
            });

            if (!tenantDomain) {
                this.logger.warn(`No tenant found for domain: ${normalizedDomain}`);
                return res.status(404).json({
                    statusCode: 404,
                    message: `Tenant not configured for domain: ${normalizedDomain}`,
                    error: 'Not Found'
                });
            }

            if (tenantDomain.tenant.status !== 'ACTIVE') {
                const status = tenantDomain.tenant.status;
                this.logger.warn(`Tenant ${tenantDomain.tenant.slug} is not active (status: ${status})`);

                // SUSPENDED: Return 403 with specific error code for frontend handling
                if (status === 'SUSPENDED') {
                    return res.status(403).json({
                        statusCode: 403,
                        message: 'This account has been suspended',
                        error: 'Tenant Suspended',
                        code: 'TENANT_SUSPENDED'
                    });
                }

                // ARCHIVED or other: Return 503 Service Unavailable
                return res.status(503).json({
                    statusCode: 503,
                    message: 'This shop is temporarily unavailable',
                    error: 'Service Unavailable'
                });
            }

            // Build tenant context with config
            const tenantContext: Express.Request['tenant'] = {
                id: tenantDomain.tenant.id,
                name: tenantDomain.tenant.name,
                slug: tenantDomain.tenant.slug,
                status: tenantDomain.tenant.status,
                config: tenantDomain.tenant.config ? {
                    shopName: tenantDomain.tenant.config.shopName,
                    logoUrl: tenantDomain.tenant.config.logoUrl || undefined,
                    primaryColor: tenantDomain.tenant.config.primaryColor,
                    email: tenantDomain.tenant.config.email || undefined,
                    phone: tenantDomain.tenant.config.phone || undefined,
                    whatsappNumber: tenantDomain.tenant.config.whatsappNumber || undefined,
                    locale: tenantDomain.tenant.config.locale,
                    currency: tenantDomain.tenant.config.currency,
                    currencySymbol: tenantDomain.tenant.config.currencySymbol,
                    timezone: tenantDomain.tenant.config.timezone,
                    openingHours: tenantDomain.tenant.config.openingHours as Record<string, { open: string; close: string }> | undefined,
                    timeSlots: tenantDomain.tenant.config.timeSlots as string[] | undefined,
                    closedDays: tenantDomain.tenant.config.closedDays,
                    companyName: tenantDomain.tenant.config.companyName || undefined,
                    vatNumber: tenantDomain.tenant.config.vatNumber || undefined,
                    invoicePrefix: tenantDomain.tenant.config.invoicePrefix,
                    googleAnalyticsId: tenantDomain.tenant.config.googleAnalyticsId || undefined,
                    cookiebotId: tenantDomain.tenant.config.cookiebotId || undefined,
                    seoTitle: tenantDomain.tenant.config.seoTitle || undefined,
                    seoDescription: tenantDomain.tenant.config.seoDescription || undefined,
                } : undefined
            };

            // Cache the result
            TenantMiddleware.tenantCache.set(normalizedDomain, {
                tenant: tenantContext,
                expiresAt: Date.now() + this.CACHE_TTL_MS
            });

            // Attach to request
            req.tenant = tenantContext;
            req.tenantId = tenantContext.id;

            // Attach features to request (use defaults if no TenantFeature record)
            const tenantFeatures = tenantDomain.tenant.features;
            req.features = tenantFeatures ? {
                ecommerceEnabled: tenantFeatures.ecommerceEnabled,
                refurbishedGrading: tenantFeatures.refurbishedGrading,
                wishlistEnabled: tenantFeatures.wishlistEnabled,
                stockNotifications: tenantFeatures.stockNotifications,
                couponsEnabled: tenantFeatures.couponsEnabled,
                repairsEnabled: tenantFeatures.repairsEnabled,
                quoteOnRequest: tenantFeatures.quoteOnRequest,
                mailInRepairs: tenantFeatures.mailInRepairs,
                walkInQueue: tenantFeatures.walkInQueue,
                ticketsEnabled: tenantFeatures.ticketsEnabled,
                liveChatWidget: tenantFeatures.liveChatWidget,
                invoicingEnabled: tenantFeatures.invoicingEnabled,
                vatCalculation: tenantFeatures.vatCalculation,
                pdfGeneration: tenantFeatures.pdfGeneration,
                inventoryEnabled: tenantFeatures.inventoryEnabled,
                advancedInventory: tenantFeatures.advancedInventory,
                employeeManagement: tenantFeatures.employeeManagement,
                maxAdminUsers: tenantFeatures.maxAdminUsers,
                analyticsEnabled: tenantFeatures.analyticsEnabled,
            } : DEFAULT_FEATURES;

            next();
        } catch (error) {
            this.logger.error(`Error resolving tenant for domain ${normalizedDomain}:`, error);
            return res.status(500).json({
                statusCode: 500,
                message: 'Unable to resolve tenant',
                error: 'Internal Server Error'
            });
        }
    }

    /**
     * Normalize domain: lowercase, strip port, strip www. prefix
     */
    private normalizeDomain(host: string): string | null {
        try {
            let domain = host.toLowerCase().trim();

            // Remove port if present
            domain = domain.split(':')[0];

            // Remove leading www.
            if (domain.startsWith('www.')) {
                domain = domain.substring(4);
            }

            // Remove trailing dot (DNS artifact)
            if (domain.endsWith('.')) {
                domain = domain.slice(0, -1);
            }

            return domain || null;
        } catch {
            return null;
        }
    }

    // Method to invalidate cache for a specific domain (call after tenant updates)
    invalidateCache(domain: string) {
        TenantMiddleware.tenantCache.delete(domain);
    }

    // Method to invalidate all cache entries for a tenant
    invalidateTenantCache(tenantId: string) {
        for (const [domain, entry] of TenantMiddleware.tenantCache.entries()) {
            if (entry.tenant?.id === tenantId) {
                TenantMiddleware.tenantCache.delete(domain);
            }
        }
    }
}
