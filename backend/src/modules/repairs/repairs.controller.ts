import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RepairsService } from './repairs.service';
import {
    CreateDeviceTypeDto,
    CreateBrandDto,
    CreateRepairDeviceDto,
    CreateServiceTypeDto,
    CreateDeviceServiceDto,
} from './dto';

@ApiTags('Repairs')
@Controller('repairs')
export class RepairsController {
    constructor(private readonly repairsService: RepairsService) { }

    // ============================================
    // PUBLIC ENDPOINTS (for wizard)
    // ============================================

    @Get('device-types')
    @ApiOperation({ summary: 'Get all active device types' })
    @ApiResponse({ status: 200, description: 'List of device types' })
    async getDeviceTypes() {
        return this.repairsService.getDeviceTypes();
    }

    @Get('device-types/:slug')
    @ApiOperation({ summary: 'Get device type by slug with brands' })
    async getDeviceTypeBySlug(@Param('slug') slug: string) {
        return this.repairsService.getDeviceTypeBySlug(slug);
    }

    @Get('brands')
    @ApiOperation({ summary: 'Get brands, optionally filtered by device type' })
    @ApiQuery({ name: 'deviceType', required: false })
    async getBrands(@Query('deviceType') deviceType?: string) {
        return this.repairsService.getBrands(deviceType);
    }

    @Get('brands/:slug')
    @ApiOperation({ summary: 'Get brand by slug with devices' })
    async getBrandBySlug(@Param('slug') slug: string) {
        return this.repairsService.getBrandBySlug(slug);
    }

    @Get('devices')
    @ApiOperation({ summary: 'Get devices, optionally filtered by brand' })
    @ApiQuery({ name: 'brand', required: false })
    async getDevices(@Query('brand') brand?: string) {
        return this.repairsService.getDevices(brand);
    }

    @Get('devices/:slug')
    @ApiOperation({ summary: 'Get device by slug with services' })
    async getDeviceBySlug(@Param('slug') slug: string) {
        return this.repairsService.getDeviceBySlug(slug);
    }

    @Get('services/:deviceSlug')
    @ApiOperation({ summary: 'Get available repair services for a device' })
    async getDeviceServices(@Param('deviceSlug') deviceSlug: string) {
        return this.repairsService.getDeviceServices(deviceSlug);
    }

    @Get('service-types')
    @ApiOperation({ summary: 'Get all service types' })
    async getServiceTypes() {
        return this.repairsService.getServiceTypes();
    }

    // ============================================
    // ADMIN ENDPOINTS (protected)
    // ============================================

    // Device Types CRUD
    @Post('admin/device-types')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create device type (admin)' })
    async createDeviceType(@Body() dto: CreateDeviceTypeDto) {
        return this.repairsService.createDeviceType(dto);
    }

    @Put('admin/device-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update device type (admin)' })
    async updateDeviceType(@Param('id') id: string, @Body() dto: Partial<CreateDeviceTypeDto>) {
        return this.repairsService.updateDeviceType(id, dto);
    }

    @Delete('admin/device-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete device type (admin)' })
    async deleteDeviceType(@Param('id') id: string) {
        return this.repairsService.deleteDeviceType(id);
    }

    // Brands CRUD
    @Post('admin/brands')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create brand (admin)' })
    async createBrand(@Body() dto: CreateBrandDto) {
        return this.repairsService.createBrand(dto);
    }

    @Put('admin/brands/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update brand (admin)' })
    async updateBrand(@Param('id') id: string, @Body() dto: Partial<CreateBrandDto>) {
        return this.repairsService.updateBrand(id, dto);
    }

    @Delete('admin/brands/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete brand (admin)' })
    async deleteBrand(@Param('id') id: string) {
        return this.repairsService.deleteBrand(id);
    }

    // Devices CRUD
    @Post('admin/devices')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create device (admin)' })
    async createDevice(@Body() dto: CreateRepairDeviceDto) {
        return this.repairsService.createDevice(dto);
    }

    @Put('admin/devices/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update device (admin)' })
    async updateDevice(@Param('id') id: string, @Body() dto: Partial<CreateRepairDeviceDto>) {
        return this.repairsService.updateDevice(id, dto);
    }

    @Delete('admin/devices/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete device (admin)' })
    async deleteDevice(@Param('id') id: string) {
        return this.repairsService.deleteDevice(id);
    }

    // Service Types CRUD
    @Post('admin/service-types')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create service type (admin)' })
    async createServiceType(@Body() dto: CreateServiceTypeDto) {
        return this.repairsService.createServiceType(dto);
    }

    @Put('admin/service-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update service type (admin)' })
    async updateServiceType(@Param('id') id: string, @Body() dto: Partial<CreateServiceTypeDto>) {
        return this.repairsService.updateServiceType(id, dto);
    }

    @Delete('admin/service-types/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service type (admin)' })
    async deleteServiceType(@Param('id') id: string) {
        return this.repairsService.deleteServiceType(id);
    }

    // Device Services CRUD
    @Post('admin/device-services')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create device service pricing (admin)' })
    async createDeviceService(@Body() dto: CreateDeviceServiceDto) {
        return this.repairsService.createDeviceService(dto);
    }

    @Put('admin/device-services/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update device service pricing (admin)' })
    async updateDeviceService(@Param('id') id: string, @Body() dto: Partial<CreateDeviceServiceDto>) {
        return this.repairsService.updateDeviceService(id, dto);
    }

    @Delete('admin/device-services/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete device service pricing (admin)' })
    async deleteDeviceService(@Param('id') id: string) {
        return this.repairsService.deleteDeviceService(id);
    }

    // Import
    @Post('admin/import')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Import devices from JSON data (admin)' })
    async importFromJson(@Body() body: { data: Record<string, unknown> }) {
        return this.repairsService.importFromJson(body.data as any);
    }
}
