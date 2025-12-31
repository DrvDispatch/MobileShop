import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantMiddleware } from './tenant.middleware';

@Injectable()
export class TenantService {
    private readonly logger = new Logger(TenantService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly tenantMiddleware: TenantMiddleware,
    ) { }

    /**
     * Get all tenants (OWNER only)
     */
    async findAll() {
        return this.prisma.tenant.findMany({
            include: {
                domains: true,
                config: true,
                _count: {
                    select: {
                        users: true,
                        products: true,
                        orders: true,
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Get a tenant by ID
     */
    async findById(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                domains: true,
                config: true,
            }
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return tenant;
    }

    /**
     * Get tenant by slug
     */
    async findBySlug(slug: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { slug },
            include: {
                domains: true,
                config: true,
            }
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return tenant;
    }

    /**
     * Get the primary domain for a tenant (for email links)
     * Falls back to any domain if no primary found
     */
    async getPrimaryDomain(tenantId: string): Promise<string> {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: {
                tenantId,
                isPrimary: true,
            },
            select: { domain: true },
        });

        if (!domain) {
            // Fallback: get any domain for this tenant
            const anyDomain = await this.prisma.tenantDomain.findFirst({
                where: { tenantId },
                select: { domain: true },
            });

            if (anyDomain) {
                return anyDomain.domain;
            }

            // Ultimate fallback
            this.logger.warn(`No domain found for tenant ${tenantId}, using fallback`);
            return 'localhost:3000';
        }

        return domain.domain;
    }

    /**
     * Get the full URL for a tenant domain (with protocol)
     */
    async getFullDomainUrl(tenantId: string): Promise<string> {
        const domain = await this.getPrimaryDomain(tenantId);

        // localhost domains use http, production domains use https
        const isLocalhost = domain.includes('localhost') || domain.startsWith('127.');
        const protocol = isLocalhost ? 'http' : 'https';

        return `${protocol}://${domain}`;
    }

    /**
     * Create a new tenant
     */
    async create(data: {
        name: string;
        slug: string;
        domain: string;
        config?: {
            shopName: string;
            primaryColor?: string;
            email?: string;
            phone?: string;
            whatsappNumber?: string;
        };
    }) {
        // Check if slug already exists
        const existingSlug = await this.prisma.tenant.findUnique({
            where: { slug: data.slug }
        });

        if (existingSlug) {
            throw new ConflictException('Tenant slug already exists');
        }

        // Check if domain already exists
        const existingDomain = await this.prisma.tenantDomain.findUnique({
            where: { domain: data.domain }
        });

        if (existingDomain) {
            throw new ConflictException('Domain already registered');
        }

        // Create tenant with domain and config
        const tenant = await this.prisma.tenant.create({
            data: {
                name: data.name,
                slug: data.slug,
                status: 'ACTIVE',
                domains: {
                    create: {
                        domain: data.domain,
                        isPrimary: true,
                    }
                },
                config: data.config ? {
                    create: {
                        shopName: data.config.shopName,
                        primaryColor: data.config.primaryColor || '#7c3aed',
                        email: data.config.email,
                        phone: data.config.phone,
                        whatsappNumber: data.config.whatsappNumber,
                    }
                } : undefined,
            },
            include: {
                domains: true,
                config: true,
            }
        });

        this.logger.log(`Created new tenant: ${tenant.slug} (${tenant.id})`);

        return tenant;
    }

    /**
     * Update tenant configuration
     */
    async updateConfig(tenantId: string, config: Partial<{
        shopName: string;
        logoUrl: string;
        primaryColor: string;
        email: string;
        phone: string;
        whatsappNumber: string;
        locale: string;
        currency: string;
        timezone: string;
        openingHours: Record<string, { open: string; close: string }>;
        timeSlots: string[];
        closedDays: number[];
        companyName: string;
        vatNumber: string;
        invoicePrefix: string;
        googleAnalyticsId: string;
        cookiebotId: string;
        seoTitle: string;
        seoDescription: string;
    }>) {
        const tenant = await this.findById(tenantId);

        const updatedConfig = await this.prisma.tenantConfig.upsert({
            where: { tenantId },
            update: config,
            create: {
                tenantId,
                shopName: config.shopName || tenant.name,
                ...config,
            }
        });

        // Invalidate cache for all domains of this tenant
        this.tenantMiddleware.invalidateTenantCache(tenantId);

        return updatedConfig;
    }

    /**
     * Add a domain to a tenant
     */
    async addDomain(tenantId: string, domain: string, isPrimary = false) {
        // Check if domain already exists
        const existingDomain = await this.prisma.tenantDomain.findUnique({
            where: { domain }
        });

        if (existingDomain) {
            throw new ConflictException('Domain already registered');
        }

        // If setting as primary, unset current primary
        if (isPrimary) {
            await this.prisma.tenantDomain.updateMany({
                where: { tenantId, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        const newDomain = await this.prisma.tenantDomain.create({
            data: {
                tenantId,
                domain,
                isPrimary,
            }
        });

        this.logger.log(`Added domain ${domain} to tenant ${tenantId}`);

        return newDomain;
    }

    /**
     * Remove a domain from a tenant
     */
    async removeDomain(domainId: string) {
        const domain = await this.prisma.tenantDomain.findUnique({
            where: { id: domainId },
            include: { tenant: { include: { domains: true } } }
        });

        if (!domain) {
            throw new NotFoundException('Domain not found');
        }

        // Don't allow removing the last domain
        if (domain.tenant.domains.length === 1) {
            throw new ConflictException('Cannot remove the last domain from a tenant');
        }

        await this.prisma.tenantDomain.delete({
            where: { id: domainId }
        });

        // Invalidate cache for this domain
        this.tenantMiddleware.invalidateCache(domain.domain);

        this.logger.log(`Removed domain ${domain.domain} from tenant ${domain.tenantId}`);
    }

    /**
     * Suspend a tenant
     */
    async suspend(tenantId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { status: 'SUSPENDED' }
        });

        // Invalidate all cached entries for this tenant
        this.tenantMiddleware.invalidateTenantCache(tenantId);

        this.logger.log(`Suspended tenant: ${tenant.slug}`);

        return tenant;
    }

    /**
     * Activate a tenant
     */
    async activate(tenantId: string) {
        const tenant = await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { status: 'ACTIVE' }
        });

        // Invalidate all cached entries for this tenant
        this.tenantMiddleware.invalidateTenantCache(tenantId);

        this.logger.log(`Activated tenant: ${tenant.slug}`);

        return tenant;
    }

    /**
     * Get public tenant config (for frontend TenantProvider)
     * Returns a structured config object for runtime tenant customization
     */
    async getPublicConfig(tenantId: string) {
        const config = await this.prisma.tenantConfig.findUnique({
            where: { tenantId },
            select: {
                shopName: true,
                logoUrl: true,
                primaryColor: true,
                secondaryColor: true,
                accentColor: true,
                borderRadius: true,
                darkMode: true,
                email: true,
                phone: true,
                whatsappNumber: true,
                address: true,
                locale: true,
                currency: true,
                currencySymbol: true,
                openingHours: true,
                timeSlots: true,
                closedDays: true,
                googleAnalyticsId: true,
                cookiebotId: true,
                seoTitle: true,
                seoDescription: true,
            }
        });

        if (!config) {
            return null;
        }

        // Return structured config for frontend consumption
        return {
            tenantId,
            branding: {
                shopName: config.shopName,
                logoUrl: config.logoUrl,
                primaryColor: config.primaryColor,
                secondaryColor: config.secondaryColor,
                accentColor: config.accentColor,
                borderRadius: config.borderRadius,
                darkMode: config.darkMode,
            },
            contact: {
                email: config.email,
                phone: config.phone,
                whatsappNumber: config.whatsappNumber,
                address: config.address,
            },
            locale: {
                locale: config.locale,
                currency: config.currency,
                currencySymbol: config.currencySymbol,
            },
            business: {
                openingHours: config.openingHours,
                timeSlots: config.timeSlots,
                closedDays: config.closedDays,
            },
            integrations: {
                googleAnalyticsId: config.googleAnalyticsId,
                cookiebotId: config.cookiebotId,
            },
            seo: {
                title: config.seoTitle,
                description: config.seoDescription,
            },
        };
    }
}
