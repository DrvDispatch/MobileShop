import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto';

@Injectable()
export class SupportedDevicesService {
    private readonly logger = new Logger(SupportedDevicesService.name);

    constructor(private prisma: PrismaService) { }

    // Get all devices grouped by brand
    async findAll(includeInactive = false) {
        const where = includeInactive ? {} : { isActive: true };

        const devices = await this.prisma.supportedDevice.findMany({
            where,
            orderBy: [
                { brand: 'asc' },
                { sortOrder: 'asc' },
                { model: 'asc' },
            ],
        });

        // Group by brand
        const grouped: Record<string, Array<{ id: string; model: string; isActive: boolean }>> = {};
        for (const device of devices) {
            if (!grouped[device.brand]) {
                grouped[device.brand] = [];
            }
            grouped[device.brand].push({
                id: device.id,
                model: device.model,
                isActive: device.isActive,
            });
        }

        return grouped;
    }

    // Get list of unique brands
    async getBrands() {
        const brands = await this.prisma.supportedDevice.findMany({
            where: { isActive: true },
            select: { brand: true },
            distinct: ['brand'],
            orderBy: { brand: 'asc' },
        });

        return brands.map(b => b.brand);
    }

    // Get models for a specific brand
    async findByBrand(brand: string) {
        return this.prisma.supportedDevice.findMany({
            where: {
                brand,
                isActive: true,
            },
            select: {
                id: true,
                model: true,
            },
            orderBy: [
                { sortOrder: 'asc' },
                { model: 'asc' },
            ],
        });
    }

    // Get all devices as flat list (for admin)
    async findAllFlat() {
        return this.prisma.supportedDevice.findMany({
            orderBy: [
                { brand: 'asc' },
                { sortOrder: 'asc' },
                { model: 'asc' },
            ],
        });
    }

    // Create a new device
    async create(dto: CreateDeviceDto) {
        // Check if already exists
        const existing = await this.prisma.supportedDevice.findUnique({
            where: {
                brand_model: {
                    brand: dto.brand,
                    model: dto.model,
                },
            },
        });

        if (existing) {
            throw new ConflictException(`Device ${dto.brand} ${dto.model} already exists`);
        }

        return this.prisma.supportedDevice.create({
            data: {
                brand: dto.brand,
                model: dto.model,
                isActive: dto.isActive ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }

    // Update a device
    async update(id: string, dto: UpdateDeviceDto) {
        const device = await this.prisma.supportedDevice.findUnique({
            where: { id },
        });

        if (!device) {
            throw new NotFoundException('Device not found');
        }

        return this.prisma.supportedDevice.update({
            where: { id },
            data: dto,
        });
    }

    // Delete a device
    async delete(id: string) {
        const device = await this.prisma.supportedDevice.findUnique({
            where: { id },
        });

        if (!device) {
            throw new NotFoundException('Device not found');
        }

        return this.prisma.supportedDevice.delete({
            where: { id },
        });
    }

    // Bulk create devices
    async bulkCreate(devices: CreateDeviceDto[]) {
        const results = {
            created: 0,
            skipped: 0,
        };

        for (const device of devices) {
            try {
                await this.prisma.supportedDevice.create({
                    data: {
                        brand: device.brand,
                        model: device.model,
                        isActive: device.isActive ?? true,
                        sortOrder: device.sortOrder ?? 0,
                    },
                });
                results.created++;
            } catch (error) {
                // Skip duplicates
                results.skipped++;
            }
        }

        return results;
    }

    // Seed initial devices (all supported brands)
    async seedDevices() {
        const devices: { brand: string; model: string; sortOrder: number }[] = [];
        let sortOrder = 0;

        // ============================================
        // APPLE
        // ============================================
        const iPhoneModels = [
            'iPhone 16 Pro Max', 'iPhone 16 Pro', 'iPhone 16 Plus', 'iPhone 16',
            'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15',
            'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14',
            'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 Mini',
            'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 Mini',
            'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
            'iPhone SE (2022)', 'iPhone SE (2020)',
            'iPhone XS Max', 'iPhone XS', 'iPhone XR', 'iPhone X',
            'iPhone 8 Plus', 'iPhone 8', 'iPhone 7 Plus', 'iPhone 7',
        ];
        for (const model of iPhoneModels) {
            devices.push({ brand: 'Apple', model, sortOrder: sortOrder++ });
        }
        const iPadModels = [
            'iPad Pro 12.9" (2024)', 'iPad Pro 11" (2024)',
            'iPad Pro 12.9" (2022)', 'iPad Pro 11" (2022)',
            'iPad Air (2024)', 'iPad Air (2022)', 'iPad Air (2020)',
            'iPad (10th gen)', 'iPad (9th gen)',
            'iPad mini (2024)', 'iPad mini (2021)',
        ];
        for (const model of iPadModels) {
            devices.push({ brand: 'Apple', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // SAMSUNG
        // ============================================
        sortOrder = 0;
        const samsungModels = [
            // Galaxy S Series
            'Galaxy S25 Ultra', 'Galaxy S25+', 'Galaxy S25',
            'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S24 FE',
            'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
            'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
            'Galaxy S21 Ultra', 'Galaxy S21+', 'Galaxy S21', 'Galaxy S21 FE',
            'Galaxy S20 Ultra', 'Galaxy S20+', 'Galaxy S20', 'Galaxy S20 FE',
            // Galaxy A Series
            'Galaxy A55', 'Galaxy A54', 'Galaxy A53', 'Galaxy A52', 'Galaxy A51',
            'Galaxy A35', 'Galaxy A34', 'Galaxy A33', 'Galaxy A25', 'Galaxy A15', 'Galaxy A14',
            // Galaxy Z Foldables
            'Galaxy Z Fold 6', 'Galaxy Z Fold 5', 'Galaxy Z Fold 4',
            'Galaxy Z Flip 6', 'Galaxy Z Flip 5', 'Galaxy Z Flip 4',
            // Galaxy Tab
            'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9',
            'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8',
        ];
        for (const model of samsungModels) {
            devices.push({ brand: 'Samsung', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // XIAOMI
        // ============================================
        sortOrder = 0;
        const xiaomiModels = [
            'Xiaomi 14 Ultra', 'Xiaomi 14 Pro', 'Xiaomi 14',
            'Xiaomi 13 Ultra', 'Xiaomi 13 Pro', 'Xiaomi 13', 'Xiaomi 13 Lite',
            'Xiaomi 12 Pro', 'Xiaomi 12', 'Xiaomi 12 Lite',
            'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13',
            'Redmi Note 12 Pro+', 'Redmi Note 12 Pro', 'Redmi Note 12',
            'Poco F6 Pro', 'Poco F6', 'Poco X6 Pro', 'Poco X6',
        ];
        for (const model of xiaomiModels) {
            devices.push({ brand: 'Xiaomi', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // ONEPLUS
        // ============================================
        sortOrder = 0;
        const oneplusModels = [
            'OnePlus 12', 'OnePlus 12R',
            'OnePlus 11', 'OnePlus 11R',
            'OnePlus 10 Pro', 'OnePlus 10T',
            'OnePlus Nord 4', 'OnePlus Nord 3', 'OnePlus Nord CE 4',
            'OnePlus Open',
        ];
        for (const model of oneplusModels) {
            devices.push({ brand: 'OnePlus', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // OPPO
        // ============================================
        sortOrder = 0;
        const oppoModels = [
            'OPPO Find X7 Ultra', 'OPPO Find X7',
            'OPPO Find X6 Pro', 'OPPO Find X6',
            'OPPO Reno 11 Pro', 'OPPO Reno 11', 'OPPO Reno 10 Pro+',
            'OPPO A79', 'OPPO A58', 'OPPO A38',
        ];
        for (const model of oppoModels) {
            devices.push({ brand: 'Oppo', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // GOOGLE
        // ============================================
        sortOrder = 0;
        const googleModels = [
            'Pixel 9 Pro XL', 'Pixel 9 Pro', 'Pixel 9', 'Pixel 9 Pro Fold',
            'Pixel 8 Pro', 'Pixel 8', 'Pixel 8a',
            'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a',
            'Pixel 6 Pro', 'Pixel 6', 'Pixel 6a',
            'Pixel Fold',
        ];
        for (const model of googleModels) {
            devices.push({ brand: 'Google', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // HUAWEI
        // ============================================
        sortOrder = 0;
        const huaweiModels = [
            'Huawei Mate 60 Pro+', 'Huawei Mate 60 Pro', 'Huawei Mate 60',
            'Huawei P60 Pro', 'Huawei P60', 'Huawei P60 Art',
            'Huawei Mate 50 Pro', 'Huawei Mate 50',
            'Huawei P50 Pro', 'Huawei P50',
            'Huawei Nova 12 Ultra', 'Huawei Nova 12 Pro', 'Huawei Nova 12',
        ];
        for (const model of huaweiModels) {
            devices.push({ brand: 'Huawei', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // MOTOROLA
        // ============================================
        sortOrder = 0;
        const motorolaModels = [
            'Motorola Edge 50 Ultra', 'Motorola Edge 50 Pro', 'Motorola Edge 50 Fusion',
            'Motorola Edge 40 Pro', 'Motorola Edge 40', 'Motorola Edge 40 Neo',
            'Motorola Razr 50 Ultra', 'Motorola Razr 50', 'Motorola Razr 40 Ultra',
            'Moto G85', 'Moto G84', 'Moto G54', 'Moto G34',
        ];
        for (const model of motorolaModels) {
            devices.push({ brand: 'Motorola', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // NOKIA
        // ============================================
        sortOrder = 0;
        const nokiaModels = [
            'Nokia X30', 'Nokia XR21', 'Nokia G60', 'Nokia G42',
            'Nokia C32', 'Nokia C22', 'Nokia C12',
        ];
        for (const model of nokiaModels) {
            devices.push({ brand: 'Nokia', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // SONY
        // ============================================
        sortOrder = 0;
        const sonyModels = [
            'Sony Xperia 1 VI', 'Sony Xperia 1 V', 'Sony Xperia 1 IV',
            'Sony Xperia 5 V', 'Sony Xperia 5 IV',
            'Sony Xperia 10 VI', 'Sony Xperia 10 V',
        ];
        for (const model of sonyModels) {
            devices.push({ brand: 'Sony', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // FAIRPHONE
        // ============================================
        sortOrder = 0;
        const fairphoneModels = [
            'Fairphone 5', 'Fairphone 4',
        ];
        for (const model of fairphoneModels) {
            devices.push({ brand: 'Fairphone', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // ASUS
        // ============================================
        sortOrder = 0;
        const asusModels = [
            'ASUS ROG Phone 8 Pro', 'ASUS ROG Phone 8',
            'ASUS ROG Phone 7 Ultimate', 'ASUS ROG Phone 7',
            'ASUS Zenfone 11 Ultra', 'ASUS Zenfone 10',
        ];
        for (const model of asusModels) {
            devices.push({ brand: 'Asus', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // CAT
        // ============================================
        sortOrder = 0;
        const catModels = [
            'CAT S75', 'CAT S62 Pro', 'CAT S42 H+',
        ];
        for (const model of catModels) {
            devices.push({ brand: 'Cat', model, sortOrder: sortOrder++ });
        }

        // ============================================
        // LENOVO
        // ============================================
        sortOrder = 0;
        const lenovoModels = [
            'Lenovo Legion Phone Duel 2', 'Lenovo Legion Phone Duel',
            'Lenovo Tab P12 Pro', 'Lenovo Tab P11 Pro',
        ];
        for (const model of lenovoModels) {
            devices.push({ brand: 'Lenovo', model, sortOrder: sortOrder++ });
        }

        // Bulk insert
        const result = await this.bulkCreate(devices);
        this.logger.log(`Seeded devices: ${result.created} created, ${result.skipped} skipped`);
        return result;
    }

    // Import devices from JSON (devices.json format - extracts both smartphones and tablets)
    async importFromJson(data: Record<string, { smartphones?: { name: string }[]; tablets?: { name: string }[] }>) {
        const devices: { brand: string; model: string; sortOrder: number }[] = [];

        for (const [brandName, categories] of Object.entries(data)) {
            let sortOrder = 0;

            // Process smartphones
            if (categories.smartphones?.length) {
                for (const phone of categories.smartphones) {
                    devices.push({
                        brand: brandName,
                        model: phone.name,
                        sortOrder: sortOrder++,
                    });
                }
            }

            // Process tablets (with higher sortOrder so they appear after phones)
            if (categories.tablets?.length) {
                sortOrder = 100; // Tablets start at 100 to group after phones
                for (const tablet of categories.tablets) {
                    devices.push({
                        brand: brandName,
                        model: tablet.name,
                        sortOrder: sortOrder++,
                    });
                }
            }
        }

        this.logger.log(`Importing ${devices.length} devices from JSON...`);
        const result = await this.bulkCreate(devices);
        this.logger.log(`Import complete: ${result.created} created, ${result.skipped} skipped`);

        return {
            ...result,
            total: devices.length,
            breakdown: Object.entries(data).map(([brand, categories]) => ({
                brand,
                smartphones: categories.smartphones?.length || 0,
                tablets: categories.tablets?.length || 0,
            })),
        };
    }
}
