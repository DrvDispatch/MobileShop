import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import {
    CreateDeviceTypeDto,
    CreateBrandDto,
    CreateRepairDeviceDto,
    CreateServiceTypeDto,
    CreateDeviceServiceDto,
} from './dto';

@Injectable()
export class RepairsService {
    private readonly minioPublicUrl: string;

    constructor(
        private prisma: PrismaService,
        private configService: ConfigService,
    ) {
        this.minioPublicUrl = this.configService.get<string>('MINIO_PUBLIC_URL', 'https://images.smartphoneservice.be');
    }

    private getAssetUrl(relativePath: string | null): string | null {
        if (!relativePath) return null;
        // Convert path like "Apple/iPhone 17 Pro Max/iphone-17-pro-max-front.webp" 
        // to "https://images.smartphoneservice.be/repairs/assets/Apple/iPhone 17 Pro Max/iphone-17-pro-max-front.webp"
        return `${this.minioPublicUrl}/repairs/assets/${relativePath}`;
    }

    private getBrandLogoUrl(brandName: string): string | null {
        // Map brand names to their logo filenames in BrandLogos folder
        // Supports all brands from devices.json
        const logoMap: Record<string, string> = {
            // Original brands
            'Apple': 'Apple-logo-300x166.webp',
            'Samsung': 'Samsung-logo-300x166.webp',
            'Xiaomi': 'Xiaomi-logo-300x166.webp',
            'Huawei': 'Huawei-logo-300x166.webp',
            'Oppo': 'Oppo-logo-300x166.webp',
            'OnePlus': 'Oneplus-logo-300x166.webp',
            'Oneplus': 'Oneplus-logo-300x166.webp', // Alternative casing
            'Google Pixel': 'Google-pixel-logo-300x166.webp',
            'Google': 'Google-logo-300x166.webp',
            'Sony': 'Sony-logo-300x166.webp',
            'Asus': 'Asus-logo-300x166.webp',
            // New brands from expanded devices.json
            'Motorola': 'Motorola-logo-300x166.webp',
            'Nokia': 'Nokia-logo-300x166.webp',
            'Fairphone': 'Fairphone-logo-300x166.webp',
            'Cat': 'Cat-logo-300x166.webp',
            'CAT': 'Cat-logo-300x166.webp', // Alternative casing
            'Lenovo': 'Lenovo-logo-300x166.webp',
        };

        // Try exact match first
        let filename = logoMap[brandName];

        // Fallback: generate filename dynamically for unmapped brands
        if (!filename) {
            const normalizedName = brandName.toLowerCase().replace(/\s+/g, '-');
            filename = `${brandName}-logo-300x166.webp`;
        }

        return `${this.minioPublicUrl}/repairs/assets/BrandLogos/${filename}`;
    }

    // ============================================
    // DEVICE TYPES
    // ============================================

    async getDeviceTypes() {
        return this.prisma.repairDeviceType.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getDeviceTypeBySlug(slug: string) {
        const deviceType = await this.prisma.repairDeviceType.findUnique({
            where: { slug },
            include: { brands: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } } },
        });
        if (!deviceType) throw new NotFoundException('Device type not found');
        return deviceType;
    }

    async createDeviceType(dto: CreateDeviceTypeDto) {
        return this.prisma.repairDeviceType.create({ data: dto });
    }

    async updateDeviceType(id: string, dto: Partial<CreateDeviceTypeDto>) {
        return this.prisma.repairDeviceType.update({ where: { id }, data: dto });
    }

    async deleteDeviceType(id: string) {
        return this.prisma.repairDeviceType.delete({ where: { id } });
    }

    // ============================================
    // BRANDS
    // ============================================

    async getBrands(deviceTypeSlug?: string) {
        const where: { isActive: boolean; deviceType?: { slug: string } } = { isActive: true };
        if (deviceTypeSlug) {
            where.deviceType = { slug: deviceTypeSlug };
        }
        return this.prisma.repairBrand.findMany({
            where,
            include: { deviceType: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getBrandBySlug(slug: string, tenantId?: string) {
        const brand = await this.prisma.repairBrand.findFirst({
            where: { slug, tenantId },
            include: {
                deviceType: true,
                devices: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            },
        });
        if (!brand) throw new NotFoundException('Brand not found');
        return brand;
    }

    async createBrand(dto: CreateBrandDto) {
        return this.prisma.repairBrand.create({ data: dto });
    }

    async updateBrand(id: string, dto: Partial<CreateBrandDto>) {
        return this.prisma.repairBrand.update({ where: { id }, data: dto });
    }

    async deleteBrand(id: string) {
        return this.prisma.repairBrand.delete({ where: { id } });
    }

    // ============================================
    // DEVICES
    // ============================================

    async getDevices(brandSlug?: string) {
        const where: { isActive: boolean; brand?: { slug: string } } = { isActive: true };
        if (brandSlug) {
            where.brand = { slug: brandSlug };
        }
        return this.prisma.repairDevice.findMany({
            where,
            include: { brand: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getDeviceBySlug(slug: string, tenantId?: string) {
        const device = await this.prisma.repairDevice.findFirst({
            where: { slug, tenantId },
            include: {
                brand: { include: { deviceType: true } },
                services: {
                    where: { isActive: true },
                    include: { service: true },
                    orderBy: { sortOrder: 'asc' },
                },
            },
        });
        if (!device) throw new NotFoundException('Device not found');
        return device;
    }

    async createDevice(dto: CreateRepairDeviceDto) {
        return this.prisma.repairDevice.create({ data: dto });
    }

    async updateDevice(id: string, dto: Partial<CreateRepairDeviceDto>) {
        return this.prisma.repairDevice.update({ where: { id }, data: dto });
    }

    async deleteDevice(id: string) {
        return this.prisma.repairDevice.delete({ where: { id } });
    }

    // ============================================
    // SERVICE TYPES
    // ============================================

    async getServiceTypes() {
        return this.prisma.repairServiceType.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async getServiceTypeBySlug(slug: string, tenantId?: string) {
        const serviceType = await this.prisma.repairServiceType.findFirst({
            where: { slug, tenantId },
        });
        if (!serviceType) throw new NotFoundException('Service type not found');
        return serviceType;
    }

    async createServiceType(dto: CreateServiceTypeDto) {
        return this.prisma.repairServiceType.create({ data: dto });
    }

    async updateServiceType(id: string, dto: Partial<CreateServiceTypeDto>) {
        return this.prisma.repairServiceType.update({ where: { id }, data: dto });
    }

    async deleteServiceType(id: string) {
        return this.prisma.repairServiceType.delete({ where: { id } });
    }

    // ============================================
    // DEVICE SERVICES (pricing)
    // ============================================

    async getDeviceServices(deviceSlug: string) {
        return this.prisma.repairDeviceService.findMany({
            where: {
                isActive: true,
                device: { slug: deviceSlug },
            },
            include: { service: true },
            orderBy: { sortOrder: 'asc' },
        });
    }

    async createDeviceService(dto: CreateDeviceServiceDto) {
        return this.prisma.repairDeviceService.create({
            data: dto,
            include: { service: true },
        });
    }

    async updateDeviceService(id: string, dto: Partial<CreateDeviceServiceDto>) {
        return this.prisma.repairDeviceService.update({
            where: { id },
            data: dto,
            include: { service: true },
        });
    }

    async deleteDeviceService(id: string) {
        return this.prisma.repairDeviceService.delete({ where: { id } });
    }

    // ============================================
    // IMPORT FROM JSON (OPTIMIZED)
    // ============================================

    async importFromJson(data: Record<string, { smartphones?: DeviceImport[]; tablets?: DeviceImport[] }>) {
        const stats = { deviceTypes: 2, brands: 0, devices: 0, serviceTypes: 0, deviceServices: 0 };

        // Step 1: Ensure device types exist
        const smartphoneType = await this.prisma.repairDeviceType.upsert({
            where: { slug: 'smartphone' },
            update: {},
            create: { name: 'Smartphone', slug: 'smartphone', sortOrder: 1 },
        });
        const tabletType = await this.prisma.repairDeviceType.upsert({
            where: { slug: 'tablet' },
            update: {},
            create: { name: 'Tablet', slug: 'tablet', sortOrder: 2 },
        });

        // Step 2: Collect ALL unique service types from all devices
        const serviceTypeMap = new Map<string, { name: string; icon: string | null }>();
        for (const categories of Object.values(data)) {
            const allDevices = [...(categories.smartphones || []), ...(categories.tablets || [])];
            for (const device of allDevices) {
                for (const repair of device.repairs || []) {
                    const slug = this.createServiceSlug(repair.name);
                    if (!serviceTypeMap.has(slug)) {
                        serviceTypeMap.set(slug, { name: repair.name, icon: repair.icon_path || null });
                    }
                }
            }
        }

        // Step 3: Bulk create service types (skipDuplicates)
        const serviceTypeData = Array.from(serviceTypeMap.entries()).map(([slug, data]) => ({
            name: data.name,
            slug,
            icon: this.getAssetUrl(data.icon),
        }));

        if (serviceTypeData.length > 0) {
            await this.prisma.repairServiceType.createMany({
                data: serviceTypeData,
                skipDuplicates: true,
            });
            stats.serviceTypes = serviceTypeData.length;
        }

        // Step 4: Fetch all service types into a map for quick lookup
        const allServiceTypes = await this.prisma.repairServiceType.findMany();
        const serviceTypeIdMap = new Map(allServiceTypes.map(st => [st.slug, st.id]));

        // Step 5: Process brands and devices
        for (const [brandName, categories] of Object.entries(data)) {
            const brandSlug = brandName.toLowerCase().replace(/\s+/g, '-');

            // Process smartphones
            if (categories.smartphones?.length) {
                // Find or create brand for this device type
                const brandSlugFull = `${brandSlug}-smartphone`;
                let brand = await this.prisma.repairBrand.findFirst({
                    where: { slug: brandSlugFull, tenantId: null },
                });
                if (!brand) {
                    brand = await this.prisma.repairBrand.create({
                        data: {
                            name: brandName,
                            slug: brandSlugFull,
                            deviceTypeId: smartphoneType.id,
                            logo: this.getBrandLogoUrl(brandName),
                            sortOrder: brandName === 'Apple' ? 1 : 10,
                        },
                    });
                } else {
                    brand = await this.prisma.repairBrand.update({
                        where: { id: brand.id },
                        data: { logo: this.getBrandLogoUrl(brandName) },
                    });
                }
                stats.brands++;

                // Bulk create devices
                const deviceData = categories.smartphones.map(d => ({
                    name: d.name,
                    slug: d.slug,
                    image: this.getAssetUrl(d.images?.[0] || null),
                    brandId: brand.id,
                }));
                await this.prisma.repairDevice.createMany({ data: deviceData, skipDuplicates: true });
                stats.devices += categories.smartphones.length;

                // Fetch created devices for service linking
                const createdDevices = await this.prisma.repairDevice.findMany({
                    where: { brandId: brand.id },
                });
                const deviceIdMap = new Map(createdDevices.map(d => [d.slug, d.id]));

                // Bulk create device services
                await this.createDeviceServices(categories.smartphones, deviceIdMap, serviceTypeIdMap);
            }

            // Process tablets
            if (categories.tablets?.length) {
                // Find or create brand for tablet type
                const brandSlugFull = `${brandSlug}-tablet`;
                let brand = await this.prisma.repairBrand.findFirst({
                    where: { slug: brandSlugFull, tenantId: null },
                });
                if (!brand) {
                    brand = await this.prisma.repairBrand.create({
                        data: {
                            name: brandName,
                            slug: brandSlugFull,
                            deviceTypeId: tabletType.id,
                            logo: this.getBrandLogoUrl(brandName),
                            sortOrder: brandName === 'Apple' ? 1 : 10,
                        },
                    });
                } else {
                    brand = await this.prisma.repairBrand.update({
                        where: { id: brand.id },
                        data: { logo: this.getBrandLogoUrl(brandName) },
                    });
                }
                stats.brands++;

                const deviceData = categories.tablets.map(d => ({
                    name: d.name,
                    slug: d.slug,
                    image: this.getAssetUrl(d.images?.[0] || null),
                    brandId: brand.id,
                }));
                await this.prisma.repairDevice.createMany({ data: deviceData, skipDuplicates: true });
                stats.devices += categories.tablets.length;

                const createdDevices = await this.prisma.repairDevice.findMany({
                    where: { brandId: brand.id },
                });
                const deviceIdMap = new Map(createdDevices.map(d => [d.slug, d.id]));

                await this.createDeviceServices(categories.tablets, deviceIdMap, serviceTypeIdMap);
            }
        }

        return stats;
    }

    private createServiceSlug(name: string): string {
        return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    }

    private async createDeviceServices(
        devices: DeviceImport[],
        deviceIdMap: Map<string, string>,
        serviceTypeIdMap: Map<string, string>,
    ) {
        const deviceServiceData: {
            deviceId: string;
            serviceId: string;
            price: number | null;
            priceText: string | null;
            duration: string | null;
        }[] = [];

        for (const device of devices) {
            const deviceId = deviceIdMap.get(device.slug);
            if (!deviceId) continue;

            for (const repair of device.repairs || []) {
                const serviceSlug = this.createServiceSlug(repair.name);
                const serviceId = serviceTypeIdMap.get(serviceSlug);
                if (!serviceId) continue;

                deviceServiceData.push({
                    deviceId,
                    serviceId,
                    price: repair.price_value,
                    priceText: repair.price_text || null,
                    duration: repair.duration || null,
                });
            }
        }

        if (deviceServiceData.length > 0) {
            await this.prisma.repairDeviceService.createMany({
                data: deviceServiceData,
                skipDuplicates: true,
            });
        }
    }
}

interface DeviceImport {
    name: string;
    slug: string;
    category: string;
    images: string[];
    repairs: {
        name: string;
        duration: string;
        price_text: string;
        price_value: number | null;
        icon_path: string;
    }[];
}

