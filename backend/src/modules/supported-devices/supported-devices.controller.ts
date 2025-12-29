import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SupportedDevicesService } from './supported-devices.service';
import { CreateDeviceDto, UpdateDeviceDto } from './dto';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('devices')
export class SupportedDevicesController {
    constructor(private readonly devicesService: SupportedDevicesService) { }

    // PUBLIC ENDPOINTS (for booking form)

    // Get all active devices grouped by brand
    @Get()
    async findAll(@Query('includeInactive') includeInactive?: string) {
        return this.devicesService.findAll(includeInactive === 'true');
    }

    // Get list of brands
    @Get('brands')
    async getBrands() {
        return this.devicesService.getBrands();
    }

    // Get models for a specific brand
    @Get('brand/:brand')
    async findByBrand(@Param('brand') brand: string) {
        return this.devicesService.findByBrand(brand);
    }

    // ADMIN ENDPOINTS

    // Get all devices as flat list (for admin panel)
    @Get('admin/all')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async findAllFlat() {
        return this.devicesService.findAllFlat();
    }

    // Create a new device
    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async create(@Body() dto: CreateDeviceDto) {
        return this.devicesService.create(dto);
    }

    // Update a device
    @Patch(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async update(@Param('id') id: string, @Body() dto: UpdateDeviceDto) {
        return this.devicesService.update(id, dto);
    }

    // Delete a device
    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async delete(@Param('id') id: string) {
        return this.devicesService.delete(id);
    }

    // Seed devices (admin only)
    @Post('seed')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async seed() {
        return this.devicesService.seedDevices();
    }

    // Import devices from JSON (devices.json format)
    @Post('import')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    async importFromJson(@Body() data: Record<string, { smartphones?: { name: string }[]; tablets?: { name: string }[] }>) {
        return this.devicesService.importFromJson(data);
    }
}
