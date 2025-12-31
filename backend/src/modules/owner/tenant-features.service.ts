import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantFeature } from '../../generated/prisma/client.js';
import { IsBoolean, IsInt, IsOptional } from 'class-validator';
import { TenantSeederService } from './tenant-seeder.service';

// Default feature values for new tenants
const DEFAULT_FEATURES = {
    // E-Commerce
    ecommerceEnabled: true,
    refurbishedGrading: true,
    wishlistEnabled: true,
    stockNotifications: true,
    couponsEnabled: true,

    // Repairs
    repairsEnabled: true,
    quoteOnRequest: false,
    mailInRepairs: false,
    walkInQueue: false,

    // Tickets
    ticketsEnabled: true,
    liveChatWidget: true,

    // Invoicing
    invoicingEnabled: true,
    vatCalculation: true,
    pdfGeneration: true,

    // Inventory
    inventoryEnabled: true,
    advancedInventory: false,

    // Team
    employeeManagement: false,
    maxAdminUsers: 1,

    // Analytics
    analyticsEnabled: true,
};

export class UpdateFeaturesDto {
    @IsBoolean()
    @IsOptional()
    ecommerceEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    refurbishedGrading?: boolean;

    @IsBoolean()
    @IsOptional()
    wishlistEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    stockNotifications?: boolean;

    @IsBoolean()
    @IsOptional()
    couponsEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    repairsEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    quoteOnRequest?: boolean;

    @IsBoolean()
    @IsOptional()
    mailInRepairs?: boolean;

    @IsBoolean()
    @IsOptional()
    walkInQueue?: boolean;

    @IsBoolean()
    @IsOptional()
    ticketsEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    liveChatWidget?: boolean;

    @IsBoolean()
    @IsOptional()
    invoicingEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    vatCalculation?: boolean;

    @IsBoolean()
    @IsOptional()
    pdfGeneration?: boolean;

    @IsBoolean()
    @IsOptional()
    inventoryEnabled?: boolean;

    @IsBoolean()
    @IsOptional()
    advancedInventory?: boolean;

    @IsBoolean()
    @IsOptional()
    employeeManagement?: boolean;

    @IsInt()
    @IsOptional()
    maxAdminUsers?: number;

    @IsBoolean()
    @IsOptional()
    analyticsEnabled?: boolean;
}

@Injectable()
export class TenantFeaturesService {
    private readonly logger = new Logger(TenantFeaturesService.name);

    constructor(
        private prisma: PrismaService,
        private seederService: TenantSeederService,
    ) { }

    /**
     * Get features for a tenant, creating default if not exists
     */
    async getFeatures(tenantId: string): Promise<TenantFeature> {
        // Verify tenant exists
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException('Tenant not found');
        }

        // Get or create features
        let features = await this.prisma.tenantFeature.findUnique({
            where: { tenantId },
        });

        if (!features) {
            // Create default features for this tenant
            features = await this.prisma.tenantFeature.create({
                data: {
                    tenantId,
                    ...DEFAULT_FEATURES,
                },
            });

            // Auto-seed repair catalog for new tenants with repairs enabled
            if (features.repairsEnabled) {
                this.seedRepairCatalogInBackground(tenantId);
            }
        }

        return features;
    }

    /**
     * Update features for a tenant
     */
    async updateFeatures(tenantId: string, dto: UpdateFeaturesDto): Promise<TenantFeature> {
        // Get current features to detect if repairs is being enabled
        const currentFeatures = await this.getFeatures(tenantId);
        const repairsWasDisabled = !currentFeatures.repairsEnabled;
        const repairsBeingEnabled = dto.repairsEnabled === true;

        // Update features
        const updatedFeatures = await this.prisma.tenantFeature.update({
            where: { tenantId },
            data: dto,
        });

        // Auto-seed repair catalog if repairs feature is being enabled for first time
        if (repairsWasDisabled && repairsBeingEnabled) {
            // Check if already seeded
            const existingDevices = await this.prisma.repairDevice.count({
                where: { tenantId },
            });

            if (existingDevices === 0) {
                this.seedRepairCatalogInBackground(tenantId);
            }
        }

        return updatedFeatures;
    }

    /**
     * Seed repair catalog in background (non-blocking)
     */
    private seedRepairCatalogInBackground(tenantId: string): void {
        this.logger.log(`Starting background repair catalog seeding for tenant ${tenantId}`);

        // Run in background - don't await
        this.seederService.seedRepairCatalog(tenantId)
            .then(result => {
                this.logger.log(`Background seeding complete for ${tenantId}: ${result.devices} devices, ${result.deviceServices} services`);
            })
            .catch(error => {
                this.logger.error(`Background seeding failed for ${tenantId}: ${error.message}`);
            });
    }

    /**
     * Get features for current tenant (tenant-side API)
     * Used by frontend to determine what to show
     */
    async getFeaturesForTenant(tenantId: string): Promise<TenantFeature> {
        return this.getFeatures(tenantId);
    }

    /**
     * Apply a plan template to a tenant
     * Plan templates are predefined feature bundles
     */
    async applyPlanTemplate(tenantId: string, planName: string): Promise<TenantFeature> {
        const plans: Record<string, UpdateFeaturesDto> = {
            starter: {
                ecommerceEnabled: false,
                repairsEnabled: true,
                ticketsEnabled: false,
                invoicingEnabled: true,
                inventoryEnabled: false,
                employeeManagement: false,
                maxAdminUsers: 1,
            },
            professional: {
                ecommerceEnabled: true,
                repairsEnabled: true,
                ticketsEnabled: true,
                invoicingEnabled: true,
                inventoryEnabled: true,
                employeeManagement: false,
                maxAdminUsers: 3,
            },
            enterprise: {
                ecommerceEnabled: true,
                repairsEnabled: true,
                ticketsEnabled: true,
                invoicingEnabled: true,
                inventoryEnabled: true,
                advancedInventory: true,
                employeeManagement: true,
                maxAdminUsers: 10,
            },
        };

        const planFeatures = plans[planName.toLowerCase()];
        if (!planFeatures) {
            throw new NotFoundException(`Plan "${planName}" not found`);
        }

        return this.updateFeatures(tenantId, planFeatures);
    }

    /**
     * Get feature summary for display (grouped by module)
     */
    async getFeatureSummary(tenantId: string): Promise<{
        ecommerce: { enabled: boolean; subFeatures: Record<string, boolean> };
        repairs: { enabled: boolean; subFeatures: Record<string, boolean> };
        tickets: { enabled: boolean; subFeatures: Record<string, boolean> };
        invoicing: { enabled: boolean; subFeatures: Record<string, boolean> };
        inventory: { enabled: boolean; subFeatures: Record<string, boolean> };
        team: { enabled: boolean; maxUsers: number };
        analytics: { enabled: boolean };
    }> {
        const features = await this.getFeatures(tenantId);

        return {
            ecommerce: {
                enabled: features.ecommerceEnabled,
                subFeatures: {
                    refurbishedGrading: features.refurbishedGrading,
                    wishlist: features.wishlistEnabled,
                    stockNotifications: features.stockNotifications,
                    coupons: features.couponsEnabled,
                },
            },
            repairs: {
                enabled: features.repairsEnabled,
                subFeatures: {
                    quoteOnRequest: features.quoteOnRequest,
                    mailInRepairs: features.mailInRepairs,
                    walkInQueue: features.walkInQueue,
                },
            },
            tickets: {
                enabled: features.ticketsEnabled,
                subFeatures: {
                    liveChat: features.liveChatWidget,
                },
            },
            invoicing: {
                enabled: features.invoicingEnabled,
                subFeatures: {
                    vatCalculation: features.vatCalculation,
                    pdfGeneration: features.pdfGeneration,
                },
            },
            inventory: {
                enabled: features.inventoryEnabled,
                subFeatures: {
                    advanced: features.advancedInventory,
                },
            },
            team: {
                enabled: features.employeeManagement,
                maxUsers: features.maxAdminUsers,
            },
            analytics: {
                enabled: features.analyticsEnabled,
            },
        };
    }
}
