import { Injectable, Logger, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantStatus, DomainVerificationStatus, UserRole, CloudflareDomainStatus } from '../../generated/prisma/client.js';
import { CloudflareService } from '../cloudflare';
import { TenantMiddleware } from '../tenant/tenant.middleware';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnerService {
    private readonly logger = new Logger(OwnerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly cloudflare: CloudflareService,
    ) { }

    // ===== TENANT MANAGEMENT =====

    async findAllTenants() {
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

    async findTenantById(id: string) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id },
            include: {
                domains: true,
                config: true,
                _count: {
                    select: {
                        users: true,
                        products: true,
                        orders: true,
                        appointments: true,
                    }
                }
            }
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        return tenant;
    }

    async createTenant(data: {
        name: string;
        slug: string;
    }) {
        // Check if slug already exists
        const existingSlug = await this.prisma.tenant.findUnique({
            where: { slug: data.slug }
        });

        if (existingSlug) {
            throw new ConflictException('Tenant slug already exists');
        }

        // Create tenant with DRAFT status
        const tenant = await this.prisma.tenant.create({
            data: {
                name: data.name,
                slug: data.slug,
                status: TenantStatus.DRAFT,
            },
            include: {
                domains: true,
                config: true,
            }
        });

        // Auto-seed default CMS pages for new tenant
        await this.seedDefaultCmsPages(tenant.id);

        this.logger.log(`Created new tenant: ${tenant.slug} (${tenant.id})`);
        return tenant;
    }

    /**
     * Seed default CMS pages for a tenant
     * Called automatically when a new tenant is created
     */
    private async seedDefaultCmsPages(tenantId: string) {
        this.logger.log(`Seeding default CMS pages for tenant ${tenantId}`);

        // Create homepage if missing
        await this.prisma.tenantHomepage.upsert({
            where: { tenantId },
            update: {},
            create: { tenantId },
        });

        // Default system pages
        const defaultPages = [
            { slug: 'about', title: 'Over Ons' },
            { slug: 'terms', title: 'Algemene Voorwaarden' },
            { slug: 'privacy', title: 'Privacybeleid' },
            { slug: 'returns', title: 'Retourbeleid' },
        ];

        const emptyTipTapContent = {
            type: 'doc',
            content: [
                {
                    type: 'paragraph',
                    content: [{ type: 'text', text: 'Start editing this page...' }]
                }
            ]
        };

        for (const page of defaultPages) {
            await this.prisma.tenantPage.upsert({
                where: { tenantId_slug: { tenantId, slug: page.slug } },
                update: {},
                create: {
                    tenantId,
                    slug: page.slug,
                    title: page.title,
                    content: emptyTipTapContent,
                    isSystemPage: true,
                    status: 'PUBLISHED',
                    publishedAt: new Date(),
                },
            });
        }

        this.logger.log(`Seeded default CMS pages for tenant ${tenantId}`);
    }

    async updateTenant(id: string, data: Partial<{
        name: string;
        slug: string;
    }>) {
        await this.findTenantById(id); // Ensure exists

        if (data.slug) {
            const existingSlug = await this.prisma.tenant.findFirst({
                where: { slug: data.slug, NOT: { id } }
            });
            if (existingSlug) {
                throw new ConflictException('Tenant slug already exists');
            }
        }

        return this.prisma.tenant.update({
            where: { id },
            data,
            include: { domains: true, config: true }
        });
    }

    async activateTenant(id: string) {
        const tenant = await this.findTenantById(id);

        // Check requirements for activation
        const verifiedDomains = tenant.domains.filter(
            d => d.verificationStatus === DomainVerificationStatus.VERIFIED
        );

        if (verifiedDomains.length === 0) {
            throw new ConflictException('Tenant must have at least one verified domain before activation');
        }

        if (!tenant.config) {
            throw new ConflictException('Tenant must have config before activation');
        }

        const updatedTenant = await this.prisma.tenant.update({
            where: { id },
            data: { status: TenantStatus.ACTIVE },
            include: { domains: true, config: true }
        });

        // Invalidate cache so activation takes effect immediately
        TenantMiddleware.invalidateCache(id);
        this.logger.log(`Cache invalidated for activated tenant ${id}`);

        return updatedTenant;
    }

    async suspendTenant(id: string) {
        await this.findTenantById(id);

        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                status: TenantStatus.SUSPENDED,
                suspendedAt: new Date(),
            },
            include: { domains: true, config: true }
        });

        // Invalidate tenant middleware cache so suspension takes effect immediately
        TenantMiddleware.invalidateCache(id);
        this.logger.log(`Cache invalidated for suspended tenant ${id}`);

        return tenant;
    }

    async archiveTenant(id: string) {
        await this.findTenantById(id);

        const tenant = await this.prisma.tenant.update({
            where: { id },
            data: {
                status: TenantStatus.ARCHIVED,
                archivedAt: new Date(),
            },
            include: { domains: true, config: true }
        });

        // Invalidate tenant middleware cache
        TenantMiddleware.invalidateCache(id);
        this.logger.log(`Cache invalidated for archived tenant ${id}`);

        return tenant;
    }

    // ===== DOMAIN MANAGEMENT =====

    async addDomain(tenantId: string, domain: string, isPrimary = false) {
        await this.findTenantById(tenantId);

        // Check if domain already exists
        const existingDomain = await this.prisma.tenantDomain.findUnique({
            where: { domain }
        });

        if (existingDomain) {
            throw new ConflictException('Domain already registered');
        }

        // If setting as primary, unset other primaries
        if (isPrimary) {
            await this.prisma.tenantDomain.updateMany({
                where: { tenantId, isPrimary: true },
                data: { isPrimary: false }
            });
        }

        // Invalidate any cached tenant lookup for this domain (in case it was previously assigned)
        TenantMiddleware.invalidateCache(domain);

        return this.prisma.tenantDomain.create({
            data: {
                tenantId,
                domain,
                isPrimary,
                verificationStatus: DomainVerificationStatus.PENDING,
            }
        });
    }

    async verifyDomain(tenantId: string, domainId: string) {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain) {
            throw new NotFoundException('Domain not found');
        }

        // In production, implement actual DNS verification here
        // For now, auto-verify for development
        return this.prisma.tenantDomain.update({
            where: { id: domainId },
            data: {
                verificationStatus: DomainVerificationStatus.VERIFIED,
                verifiedAt: new Date(),
            }
        });
    }

    async removeDomain(tenantId: string, domainId: string) {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain) {
            throw new NotFoundException('Domain not found');
        }

        if (domain.isPrimary) {
            throw new ConflictException('Cannot remove primary domain');
        }

        await this.prisma.tenantDomain.delete({
            where: { id: domainId }
        });

        // Invalidate cached tenant lookup for this domain
        TenantMiddleware.invalidateCache(domain.domain);

        return { success: true };
    }

    // ===== CLOUDFLARE DOMAIN AUTOMATION =====

    /**
     * Step 1: Create zone in Cloudflare and get nameservers
     * Returns nameservers that must be set at the registrar
     */
    async setupDomainCloudflare(tenantId: string, domainId: string): Promise<{
        nameservers: string[];
        status: string;
        instructions: string;
    }> {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain) {
            throw new NotFoundException('Domain not found');
        }

        // Check if already set up
        if (domain.cloudflareZoneId) {
            const status = await this.cloudflare.getZoneStatus(domain.cloudflareZoneId);
            return {
                nameservers: domain.nameservers,
                status,
                instructions: status === 'active'
                    ? 'Zone is active. DNS can be configured.'
                    : 'Zone pending. Please update nameservers at your registrar.',
            };
        }

        try {
            // Create zone in Cloudflare
            this.logger.log(`Creating Cloudflare zone for ${domain.domain}`);
            const result = await this.cloudflare.createZone(domain.domain);

            // Update domain record with zone info
            await this.prisma.tenantDomain.update({
                where: { id: domainId },
                data: {
                    cloudflareZoneId: result.zoneId,
                    cloudflareStatus: CloudflareDomainStatus.PENDING,
                    nameservers: result.nameservers,
                    lastCheckedAt: new Date(),
                },
            });

            return {
                nameservers: result.nameservers,
                status: result.status,
                instructions: `Please update your domain's nameservers to: ${result.nameservers.join(', ')}`,
            };
        } catch (error: any) {
            this.logger.error(`Failed to create Cloudflare zone: ${error.message}`);
            await this.prisma.tenantDomain.update({
                where: { id: domainId },
                data: {
                    cloudflareStatus: CloudflareDomainStatus.ERROR,
                    errorMessage: error.message,
                },
            });
            throw new BadRequestException(`Failed to setup domain: ${error.message}`);
        }
    }

    /**
     * Step 2: Check zone status and configure DNS when active
     */
    async checkAndConfigureDomain(tenantId: string, domainId: string): Promise<{
        status: string;
        configured: boolean;
        message: string;
    }> {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain || !domain.cloudflareZoneId) {
            throw new NotFoundException('Domain not found or not set up in Cloudflare');
        }

        try {
            const status = await this.cloudflare.getZoneStatus(domain.cloudflareZoneId);

            // Update last checked
            await this.prisma.tenantDomain.update({
                where: { id: domainId },
                data: { lastCheckedAt: new Date() },
            });

            if (status !== 'active') {
                return {
                    status,
                    configured: false,
                    message: 'Zone not yet active. Please ensure nameservers are updated at registrar.',
                };
            }

            // Zone is active - configure DNS and tunnel
            if (domain.cloudflareStatus !== CloudflareDomainStatus.DNS_CONFIGURED) {
                this.logger.log(`Configuring DNS for ${domain.domain}`);

                // Configure DNS records
                await this.cloudflare.configureDNS(domain.cloudflareZoneId, domain.domain);

                // Add to tunnel ingress
                await this.cloudflare.addDomainToTunnel(domain.domain);

                // Enable SSL
                await this.cloudflare.enableSSL(domain.cloudflareZoneId);

                // Update status and clear any previous error
                await this.prisma.tenantDomain.update({
                    where: { id: domainId },
                    data: {
                        cloudflareStatus: CloudflareDomainStatus.DNS_CONFIGURED,
                        verificationStatus: DomainVerificationStatus.VERIFIED,
                        verifiedAt: new Date(),
                        sslStatus: 'full',
                        errorMessage: null, // Clear any previous error
                    },
                });
            }

            return {
                status: 'active',
                configured: true,
                message: 'Domain is fully configured and live!',
            };
        } catch (error: any) {
            this.logger.error(`Failed to configure domain: ${error.message}`);
            await this.prisma.tenantDomain.update({
                where: { id: domainId },
                data: {
                    cloudflareStatus: CloudflareDomainStatus.ERROR,
                    errorMessage: error.message,
                },
            });
            throw new BadRequestException(`Failed to configure domain: ${error.message}`);
        }
    }

    /**
     * Get Cloudflare status for a domain
     */
    async getDomainCloudflareStatus(tenantId: string, domainId: string) {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain) {
            throw new NotFoundException('Domain not found');
        }

        return {
            domain: domain.domain,
            cloudflareZoneId: domain.cloudflareZoneId,
            cloudflareStatus: domain.cloudflareStatus,
            nameservers: domain.nameservers,
            sslStatus: domain.sslStatus,
            lastCheckedAt: domain.lastCheckedAt,
            errorMessage: domain.errorMessage,
        };
    }

    /**
     * Verify Cloudflare API token is working
     */
    async verifyCloudflareConnection(): Promise<boolean> {
        return this.cloudflare.verifyToken();
    }

    async setPrimaryDomain(tenantId: string, domainId: string) {
        const domain = await this.prisma.tenantDomain.findFirst({
            where: { id: domainId, tenantId }
        });

        if (!domain) {
            throw new NotFoundException('Domain not found');
        }

        // Unset all other primaries for this tenant
        await this.prisma.tenantDomain.updateMany({
            where: { tenantId, isPrimary: true },
            data: { isPrimary: false }
        });

        return this.prisma.tenantDomain.update({
            where: { id: domainId },
            data: { isPrimary: true }
        });
    }

    // ===== CONFIG MANAGEMENT =====

    async updateTenantConfig(tenantId: string, config: Partial<{
        shopName: string;
        logoUrl: string;
        primaryColor: string;
        secondaryColor: string;
        email: string;
        phone: string;
        whatsappNumber: string;
        locale: string;
        currency: string;
        timezone: string;
        features: Record<string, boolean>;
    }>) {
        await this.findTenantById(tenantId);

        // Convert features to JSON string if provided
        const data: any = { ...config };
        if (config.features) {
            data.features = JSON.stringify(config.features);
        }

        return this.prisma.tenantConfig.upsert({
            where: { tenantId },
            update: data,
            create: {
                tenantId,
                shopName: config.shopName || 'New Shop',
                ...data,
            }
        });
    }

    // ===== PLATFORM STATS =====

    async getPlatformStats() {
        const [tenantCount, userCount, orderCount] = await Promise.all([
            this.prisma.tenant.count(),
            this.prisma.user.count({ where: { tenantId: { not: null } } }),
            this.prisma.order.count(),
        ]);

        const tenantsByStatus = await this.prisma.tenant.groupBy({
            by: ['status'],
            _count: { id: true }
        });

        return {
            tenants: {
                total: tenantCount,
                byStatus: tenantsByStatus.reduce((acc, curr) => {
                    acc[curr.status] = curr._count.id;
                    return acc;
                }, {} as Record<string, number>)
            },
            users: userCount,
            orders: orderCount,
        };
    }

    // ===== AUDIT LOGGING =====

    async logOwnerAction(
        ownerId: string,
        action: string,
        targetType: string,
        targetId: string,
        metadata?: Record<string, any>,
        ipAddress?: string,
        userAgent?: string
    ) {
        return this.prisma.ownerAuditLog.create({
            data: {
                ownerId,
                action,
                targetType,
                targetId,
                metadata,
                ipAddress,
                userAgent,
            }
        });
    }

    async getAuditLogs(options?: {
        ownerId?: string;
        action?: string;
        targetType?: string;
        limit?: number;
    }) {
        return this.prisma.ownerAuditLog.findMany({
            where: {
                ownerId: options?.ownerId,
                action: options?.action,
                targetType: options?.targetType,
            },
            orderBy: { createdAt: 'desc' },
            take: options?.limit || 100
        });
    }

    // ===== IMPERSONATION =====

    async listTenantUsers(tenantId: string) {
        await this.findTenantById(tenantId); // Ensure exists

        return this.prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                createdAt: true,
            },
            orderBy: { name: 'asc' }
        });
    }

    async impersonateUser(
        tenantId: string,
        userId: string,
        ownerId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ accessToken: string; user: any; redirectUrl: string }> {
        // Deprecated - use createImpersonationHandoff instead
        throw new Error('Use createImpersonationHandoff instead');
    }

    // ===== IMPERSONATION (Secure Handoff Pattern) =====

    // In-memory storage for impersonation handoff codes (same pattern as OAuth)
    private impersonationHandoffs = new Map<string, {
        tenantId: string;
        userId: string;
        ownerId: string;
        userEmail: string;
        userName: string | null;
        userRole: string;
        expiresAt: number;
    }>();

    /**
     * Create impersonation handoff code (60s TTL)
     * Returns handoff code and redirect URL - no JWT in URL
     */
    async createImpersonationHandoff(
        tenantId: string,
        userId: string,
        ownerId: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<{ handoffCode: string; redirectUrl: string; user: any }> {
        // Verify tenant exists
        const tenant = await this.findTenantById(tenantId);

        // Verify user belongs to tenant
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId }
        });

        if (!user) {
            throw new NotFoundException('User not found in tenant');
        }

        // Generate random handoff code
        const handoffCode = [...Array(32)].map(() =>
            Math.floor(Math.random() * 16).toString(16)
        ).join('');

        // Store handoff data with 60s TTL
        this.impersonationHandoffs.set(handoffCode, {
            tenantId,
            userId,
            ownerId,
            userEmail: user.email,
            userName: user.name,
            userRole: user.role,
            expiresAt: Date.now() + 60 * 1000,
        });

        // Log impersonation start to audit
        await this.logOwnerAction(
            ownerId,
            'IMPERSONATION_START',
            'User',
            userId,
            {
                tenantId,
                tenantName: tenant.name,
                userEmail: user.email,
                userName: user.name,
            },
            ipAddress,
            userAgent
        );

        this.logger.log(`Owner ${ownerId} starting impersonation of ${user.email} in tenant ${tenant.slug}`);

        // Get primary domain for redirect
        const primaryDomain = tenant.domains.find(d => d.isPrimary);
        const domain = primaryDomain?.domain || tenant.domains[0]?.domain;
        const protocol = domain?.includes('localhost') ? 'http' : 'https';
        const redirectUrl = domain ? `${protocol}://${domain}/impersonate?code=${handoffCode}` : '';

        return {
            handoffCode,
            redirectUrl,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        };
    }

    /**
     * Exchange impersonation handoff code for user data
     * Called by auth controller on tenant domain
     */
    getImpersonationHandoff(handoffCode: string): {
        tenantId: string;
        userId: string;
        ownerId: string;
        userEmail: string;
        userName: string | null;
        userRole: string;
    } | null {
        const data = this.impersonationHandoffs.get(handoffCode);

        if (!data) {
            this.logger.warn('Impersonation handoff code not found');
            return null;
        }

        if (Date.now() > data.expiresAt) {
            this.impersonationHandoffs.delete(handoffCode);
            this.logger.warn('Impersonation handoff code expired');
            return null;
        }

        // One-time use - delete after retrieval
        this.impersonationHandoffs.delete(handoffCode);

        return {
            tenantId: data.tenantId,
            userId: data.userId,
            ownerId: data.ownerId,
            userEmail: data.userEmail,
            userName: data.userName,
            userRole: data.userRole,
        };
    }

    // ===== USER MANAGEMENT =====

    async createTenantUser(tenantId: string, data: { name: string; email: string; password?: string; role: 'ADMIN' | 'CUSTOMER' }) {
        // Ensure tenant exists
        await this.findTenantById(tenantId);

        // Check for existing user
        const existingUser = await this.prisma.user.findFirst({
            where: {
                tenantId,
                email: data.email
            }
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists in this tenant');
        }

        const role = data.role === 'ADMIN' ? UserRole.ADMIN : UserRole.CUSTOMER;

        // Hash password or generate random one if not provided
        const plainPassword = data.password || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(plainPassword, 12);

        const user = await this.prisma.user.create({
            data: {
                tenantId,
                email: data.email,
                name: data.name,
                role,
                passwordHash,
                phone: null,
                // Auto-verify email for admin-created users
                emailVerified: new Date(),
            }
        });

        this.logger.log(`Created user ${user.email} (${user.role}) for tenant ${tenantId}`);

        return {
            ...user,
            initialPassword: data.password ? undefined : plainPassword // Return auto-generated password if applicable
        };
    }

    async resetTenantUserPassword(tenantId: string, userId: string, newPassword?: string) {
        // Ensure tenant exists
        await this.findTenantById(tenantId);

        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenantId }
        });

        if (!user) {
            throw new NotFoundException('User not found');
        }

        // Generate or use provided password
        const plainPassword = newPassword || Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
        const passwordHash = await bcrypt.hash(plainPassword, 12);

        await this.prisma.user.update({
            where: { id: userId },
            data: { passwordHash }
        });

        this.logger.log(`Reset password for user ${user.email} (tenant ${tenantId})`);

        return {
            success: true,
            newPassword: newPassword ? undefined : plainPassword // Return auto-generated password if applicable
        };
    }
}

