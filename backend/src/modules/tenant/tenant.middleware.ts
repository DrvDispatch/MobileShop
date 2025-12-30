import { Injectable, NestMiddleware, NotFoundException, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../../prisma/prisma.service';

// Extend Express Request to include tenant context
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
        }
    }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
    private readonly logger = new Logger(TenantMiddleware.name);

    // Cache tenant lookups for performance (TTL: 5 minutes)
    private tenantCache = new Map<string, { tenant: Express.Request['tenant']; expiresAt: number }>();
    private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

    constructor(private readonly prisma: PrismaService) { }

    async use(req: Request, res: Response, next: NextFunction) {
        // Extract domain from Host header
        const host = req.get('host');

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
        const cachedEntry = this.tenantCache.get(normalizedDomain);
        if (cachedEntry && cachedEntry.expiresAt > Date.now()) {
            req.tenant = cachedEntry.tenant;
            req.tenantId = cachedEntry.tenant?.id;
            return next();
        }

        try {
            // Look up tenant by domain
            const tenantDomain = await this.prisma.tenantDomain.findUnique({
                where: { domain: normalizedDomain },
                include: {
                    tenant: {
                        include: {
                            config: true
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
                this.logger.warn(`Tenant ${tenantDomain.tenant.slug} is not active (status: ${tenantDomain.tenant.status})`);
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
            this.tenantCache.set(normalizedDomain, {
                tenant: tenantContext,
                expiresAt: Date.now() + this.CACHE_TTL_MS
            });

            // Attach to request
            req.tenant = tenantContext;
            req.tenantId = tenantContext.id;

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
        this.tenantCache.delete(domain);
    }

    // Method to invalidate all cache entries for a tenant
    invalidateTenantCache(tenantId: string) {
        for (const [domain, entry] of this.tenantCache.entries()) {
            if (entry.tenant?.id === tenantId) {
                this.tenantCache.delete(domain);
            }
        }
    }
}
