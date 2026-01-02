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
