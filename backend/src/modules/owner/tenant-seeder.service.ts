import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantStatus } from '../../generated/prisma/client.js';
import * as fs from 'fs';
import * as path from 'path';

// Type definitions for devices.json structure
interface DeviceRepair {
    name: string;
    duration: string;
    price_text: string;
    price_value: number | null;
    icon_url: string;
    icon_path: string;
    repair_url: string;
}

interface Device {
    name: string;
    slug: string;
    category: string;
    images: string[];
    source_url: string;
    repairs: DeviceRepair[];
}

interface BrandData {
    smartphones?: Device[];
    tablets?: Device[];
}

interface DevicesJson {
    [brandName: string]: BrandData;
}

@Injectable()
export class TenantSeederService {
    private readonly logger = new Logger(TenantSeederService.name);
    private devicesData: DevicesJson | null = null;

    // MinIO configuration for asset URLs
    private readonly minioPublicUrl: string;
    private readonly minioBucket: string;
    private readonly assetsPrefix: string = 'repairs/assets';

    constructor(
        private readonly prisma: PrismaService,
        private readonly configService: ConfigService,
    ) {
        // Get MinIO configuration from environment
        this.minioPublicUrl = this.configService.get<string>(
            'MINIO_PUBLIC_URL',
            'https://images.servicespulse.com'
        );
        this.minioBucket = this.configService.get<string>(
            'MINIO_BUCKET_PRODUCTS',
            'products'
        );

        this.logger.log(`Asset base URL: ${this.getAssetBaseUrl()}`);
    }

    /**
     * Get the base URL for assets in MinIO
     */
    private getAssetBaseUrl(): string {
        return `${this.minioPublicUrl}/${this.minioBucket}/${this.assetsPrefix}`;
    }

    /**
     * Generate full MinIO URL for an asset path
     * @param relativePath Path relative to assets folder, e.g. "Apple/iPhone 16 Pro/image.webp"
     */
    private getAssetUrl(relativePath: string): string {
        // URL encode the path components properly
        const encodedPath = relativePath
            .split('/')
            .map(segment => encodeURIComponent(segment))
            .join('/');
        return `${this.getAssetBaseUrl()}/${encodedPath}`;
    }

    /**
     * Seed a tenant with full repair catalog from devices.json
     * This creates per-tenant copies of all devices, brands, and services
     */
    async seedRepairCatalog(tenantId: string): Promise<{
        brands: number;
        devices: number;
        serviceTypes: number;
        deviceServices: number;
    }> {
        this.logger.log(`Starting repair catalog seeding for tenant ${tenantId}`);

        // Verify tenant exists
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });

        if (!tenant) {
            throw new NotFoundException(`Tenant ${tenantId} not found`);
        }

        // Update tenant status to SEEDING
        await this.prisma.tenant.update({
            where: { id: tenantId },
            data: { status: TenantStatus.SEEDING },
        });

        try {
            // Load devices.json if not already loaded
            await this.loadDevicesData();

            if (!this.devicesData) {
                throw new Error('Failed to load devices.json');
            }

            // Get or create global device types (Smartphone, Tablet)
            const deviceTypes = await this.ensureDeviceTypes();

            // Collect all unique service types from devices
            const allServiceTypes = this.extractAllServiceTypes();

            // Create per-tenant service types
            const serviceTypeMap = await this.createServiceTypes(tenantId, allServiceTypes);

            // Seed brands and devices per tenant
            let brandsCreated = 0;
            let devicesCreated = 0;
            let deviceServicesCreated = 0;

            for (const [brandName, brandData] of Object.entries(this.devicesData)) {
                // Create brand for this tenant
                const brand = await this.createBrand(tenantId, brandName, deviceTypes);
                brandsCreated++;

                // Seed smartphones
                if (brandData.smartphones) {
                    for (const device of brandData.smartphones) {
                        const createdDevice = await this.createDevice(tenantId, brand.id, device);
                        devicesCreated++;

                        // Create device services with pricing
                        for (const repair of device.repairs) {
                            await this.createDeviceService(
                                tenantId,
                                createdDevice.id,
                                repair,
                                serviceTypeMap
                            );
                            deviceServicesCreated++;
                        }
                    }
                }

                // Seed tablets
                if (brandData.tablets) {
                    for (const device of brandData.tablets) {
                        const createdDevice = await this.createDevice(tenantId, brand.id, device);
                        devicesCreated++;

                        for (const repair of device.repairs) {
                            await this.createDeviceService(
                                tenantId,
                                createdDevice.id,
                                repair,
                                serviceTypeMap
                            );
                            deviceServicesCreated++;
                        }
                    }
                }
            }

            // Update tenant status to ACTIVE
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { status: TenantStatus.ACTIVE },
            });

            const result = {
                brands: brandsCreated,
                devices: devicesCreated,
                serviceTypes: serviceTypeMap.size,
                deviceServices: deviceServicesCreated,
            };

            this.logger.log(`Seeding complete for tenant ${tenantId}: ${JSON.stringify(result)}`);
            return result;

        } catch (error) {
            // On error, set tenant back to DRAFT
            await this.prisma.tenant.update({
                where: { id: tenantId },
                data: { status: TenantStatus.DRAFT },
            });
            throw error;
        }
    }

    /**
     * Load devices.json from project root
     */
    private async loadDevicesData(): Promise<void> {
        if (this.devicesData) return;

        const devicesPath = path.resolve(process.cwd(), '..', 'devices.json');
        this.logger.log(`Loading devices.json from ${devicesPath}`);

        if (!fs.existsSync(devicesPath)) {
            throw new Error(`devices.json not found at ${devicesPath}`);
        }

        const content = fs.readFileSync(devicesPath, 'utf-8');
        this.devicesData = JSON.parse(content);
        this.logger.log(`Loaded ${Object.keys(this.devicesData!).length} brands from devices.json`);
    }

    /**
     * Ensure global device types exist (Smartphone, Tablet)
     */
    private async ensureDeviceTypes(): Promise<Map<string, string>> {
        const types = [
            { name: 'Smartphone', slug: 'smartphone', sortOrder: 1 },
            { name: 'Tablet', slug: 'tablet', sortOrder: 2 },
        ];

        const typeMap = new Map<string, string>();

        for (const type of types) {
            const existing = await this.prisma.repairDeviceType.findUnique({
                where: { slug: type.slug },
            });

            if (existing) {
                typeMap.set(type.slug, existing.id);
            } else {
                const created = await this.prisma.repairDeviceType.create({
                    data: type,
                });
                typeMap.set(type.slug, created.id);
            }
        }

        return typeMap;
    }

    /**
     * Extract all unique service types from devices.json
     */
    private extractAllServiceTypes(): Map<string, { name: string; iconPath: string }> {
        const serviceTypes = new Map<string, { name: string; iconPath: string }>();

        if (!this.devicesData) return serviceTypes;

        for (const brandData of Object.values(this.devicesData)) {
            const allDevices = [...(brandData.smartphones || []), ...(brandData.tablets || [])];

            for (const device of allDevices) {
                for (const repair of device.repairs) {
                    const slug = this.slugify(repair.name);
                    if (!serviceTypes.has(slug)) {
                        serviceTypes.set(slug, {
                            name: repair.name,
                            iconPath: repair.icon_path,
                        });
                    }
                }
            }
        }

        return serviceTypes;
    }

    /**
     * Create per-tenant service types
     */
    private async createServiceTypes(
        tenantId: string,
        serviceTypes: Map<string, { name: string; iconPath: string }>
    ): Promise<Map<string, string>> {
        const serviceTypeMap = new Map<string, string>();
        let sortOrder = 1;

        for (const [slug, data] of serviceTypes) {
            // Check if already exists for this tenant
            const existing = await this.prisma.repairServiceType.findUnique({
                where: { tenantId_slug: { tenantId, slug } },
            });

            if (existing) {
                serviceTypeMap.set(slug, existing.id);
            } else {
                // Generate MinIO URL for icon
                const iconUrl = data.iconPath
                    ? this.getAssetUrl(data.iconPath)
                    : null;

                const created = await this.prisma.repairServiceType.create({
                    data: {
                        tenantId,
                        name: data.name,
                        slug,
                        icon: iconUrl,
                        sortOrder: sortOrder++,
                    },
                });
                serviceTypeMap.set(slug, created.id);
            }
        }

        return serviceTypeMap;
    }

    /**
     * Create a brand for this tenant
     */
    private async createBrand(
        tenantId: string,
        brandName: string,
        deviceTypes: Map<string, string>
    ): Promise<{ id: string }> {
        const slug = this.slugify(brandName);

        // Check if already exists
        const existing = await this.prisma.repairBrand.findUnique({
            where: { tenantId_slug: { tenantId, slug } },
        });

        if (existing) {
            return { id: existing.id };
        }

        // Get smartphone device type (default for brands)
        const deviceTypeId = deviceTypes.get('smartphone')!;

        // Generate logo URL - MinIO path: BrandLogos/Apple-logo-300x166.webp
        const logoUrl = this.getAssetUrl(`BrandLogos/${brandName}-logo-300x166.webp`);

        const brand = await this.prisma.repairBrand.create({
            data: {
                tenantId,
                name: brandName,
                slug,
                logo: logoUrl,
                deviceTypeId,
            },
        });

        return { id: brand.id };
    }

    /**
     * Create a device for this tenant
     */
    private async createDevice(
        tenantId: string,
        brandId: string,
        device: Device
    ): Promise<{ id: string }> {
        // Check if already exists
        const existing = await this.prisma.repairDevice.findUnique({
            where: { tenantId_slug: { tenantId, slug: device.slug } },
        });

        if (existing) {
            return { id: existing.id };
        }

        // Generate MinIO URL from first image
        const imageUrl = device.images.length > 0
            ? this.getAssetUrl(device.images[0])
            : null;

        const created = await this.prisma.repairDevice.create({
            data: {
                tenantId,
                name: device.name,
                slug: device.slug,
                image: imageUrl,
                brandId,
            },
        });

        return { id: created.id };
    }

    /**
     * Create a device service (repair option with pricing)
     */
    private async createDeviceService(
        tenantId: string,
        deviceId: string,
        repair: DeviceRepair,
        serviceTypeMap: Map<string, string>
    ): Promise<void> {
        const serviceSlug = this.slugify(repair.name);
        const serviceId = serviceTypeMap.get(serviceSlug);

        if (!serviceId) {
            this.logger.warn(`Service type not found for: ${repair.name}`);
            return;
        }

        // Check if already exists
        const existing = await this.prisma.repairDeviceService.findUnique({
            where: {
                tenantId_deviceId_serviceId: {
                    tenantId,
                    deviceId,
                    serviceId,
                },
            },
        });

        if (existing) return;

        await this.prisma.repairDeviceService.create({
            data: {
                tenantId,
                deviceId,
                serviceId,
                price: repair.price_value,
                priceText: repair.price_text,
                duration: repair.duration,
            },
        });
    }

    /**
     * Convert name to URL-safe slug
     */
    private slugify(text: string): string {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .trim();
    }

    /**
     * Get seeding statistics for a tenant
     */
    async getSeedingStats(tenantId: string): Promise<{
        brands: number;
        devices: number;
        serviceTypes: number;
        deviceServices: number;
    }> {
        const [brands, devices, serviceTypes, deviceServices] = await Promise.all([
            this.prisma.repairBrand.count({ where: { tenantId } }),
            this.prisma.repairDevice.count({ where: { tenantId } }),
            this.prisma.repairServiceType.count({ where: { tenantId } }),
            this.prisma.repairDeviceService.count({ where: { tenantId } }),
        ]);

        return { brands, devices, serviceTypes, deviceServices };
    }

    /**
     * Clear all repair data for a tenant (for re-seeding)
     */
    async clearRepairData(tenantId: string): Promise<void> {
        this.logger.log(`Clearing repair data for tenant ${tenantId}`);

        // Delete in order to respect foreign keys
        await this.prisma.repairDeviceService.deleteMany({ where: { tenantId } });
        await this.prisma.repairDevice.deleteMany({ where: { tenantId } });
        await this.prisma.repairBrand.deleteMany({ where: { tenantId } });
        await this.prisma.repairServiceType.deleteMany({ where: { tenantId } });

        this.logger.log(`Repair data cleared for tenant ${tenantId}`);
    }
}
