import {
    Controller,
    Get,
    Put,
    Post,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import {
    SettingDto,
    UpdateSettingDto,
    CreateSettingDto,
    ShippingZoneDto,
    CreateShippingZoneDto,
    UpdateShippingZoneDto,
    PublicSettingsDto,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogService } from '../audit-logs/audit-log.service';
import type { Request } from 'express';

@ApiTags('Settings')
@Controller('settings')
export class SettingsController {
    constructor(
        private readonly settingsService: SettingsService,
        private readonly auditLogService: AuditLogService,
    ) { }

    private async logAction(
        req: Request,
        action: 'CREATE' | 'UPDATE' | 'DELETE',
        entityType: string,
        entityName: string,
        description: string,
        oldValue?: Record<string, unknown>,
        newValue?: Record<string, unknown>,
    ) {
        const user = (req as any).user;
        await this.auditLogService.log({
            userId: user?.sub || 'unknown',
            userName: user?.email || 'unknown',
            userRole: user?.role || 'unknown',
            action,
            entityType,
            entityName,
            description,
            oldValue,
            newValue,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
    }

    // ============================================
    // PUBLIC ENDPOINTS (no auth required)
    // ============================================

    @Get('public')
    @ApiOperation({ summary: 'Get public settings for frontend' })
    @ApiResponse({ status: 200, type: PublicSettingsDto })
    async getPublicSettings(): Promise<PublicSettingsDto> {
        return this.settingsService.getPublicSettings();
    }

    @Get('shipping-zones')
    @ApiOperation({ summary: 'Get active shipping zones' })
    @ApiResponse({ status: 200, type: [ShippingZoneDto] })
    async getShippingZones() {
        return this.settingsService.getAllShippingZones();
    }

    @Get('shipping-zones/for-country')
    @ApiOperation({ summary: 'Get shipping zone for a specific country' })
    @ApiQuery({ name: 'country', description: 'ISO country code (e.g., BE)' })
    @ApiResponse({ status: 200, type: ShippingZoneDto })
    async getShippingZoneForCountry(@Query('country') country: string) {
        return this.settingsService.getShippingZoneForCountry(country);
    }

    // ============================================
    // ADMIN ENDPOINTS (require auth + ADMIN role)
    // ============================================

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all settings (Admin only)' })
    @ApiResponse({ status: 200, type: [SettingDto] })
    async getAllSettings() {
        return this.settingsService.getAllSettings();
    }

    @Get(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get a specific setting by key (Admin only)' })
    @ApiResponse({ status: 200, type: SettingDto })
    async getSetting(@Param('key') key: string) {
        return this.settingsService.getSetting(key);
    }

    @Put(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update or create a setting (Admin only)' })
    @ApiResponse({ status: 200, type: SettingDto })
    async upsertSetting(
        @Param('key') key: string,
        @Body() dto: UpdateSettingDto,
        @Req() req: Request,
    ) {
        const oldValue = await this.settingsService.getSetting(key);
        const result = await this.settingsService.upsertSetting(key, dto);

        await this.logAction(
            req,
            oldValue ? 'UPDATE' : 'CREATE',
            'Setting',
            key,
            `${oldValue ? 'Updated' : 'Created'} setting: ${key}`,
            oldValue ? { value: oldValue.value } : undefined,
            { value: dto.value },
        );

        return result;
    }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new setting (Admin only)' })
    @ApiResponse({ status: 201, type: SettingDto })
    async createSetting(@Body() dto: CreateSettingDto, @Req() req: Request) {
        const result = await this.settingsService.createSetting(dto);

        await this.logAction(
            req,
            'CREATE',
            'Setting',
            dto.key,
            `Created setting: ${dto.key}`,
            undefined,
            { key: dto.key, value: dto.value },
        );

        return result;
    }

    @Delete(':key')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a setting (Admin only)' })
    async deleteSetting(@Param('key') key: string, @Req() req: Request) {
        const oldValue = await this.settingsService.getSetting(key);
        const result = await this.settingsService.deleteSetting(key);

        await this.logAction(
            req,
            'DELETE',
            'Setting',
            key,
            `Deleted setting: ${key}`,
            oldValue ? { key, value: oldValue.value } : undefined,
        );

        return result;
    }

    // ============================================
    // ADMIN SHIPPING ZONE ENDPOINTS
    // ============================================

    @Get('shipping-zones/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all shipping zones including inactive (Admin only)' })
    @ApiResponse({ status: 200, type: [ShippingZoneDto] })
    async getAllShippingZonesAdmin() {
        return this.settingsService.getAllShippingZones(true);
    }

    @Post('shipping-zones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a shipping zone (Admin only)' })
    @ApiResponse({ status: 201, type: ShippingZoneDto })
    async createShippingZone(@Body() dto: CreateShippingZoneDto, @Req() req: Request) {
        const result = await this.settingsService.createShippingZone(dto);

        await this.logAction(
            req,
            'CREATE',
            'ShippingZone',
            dto.name,
            `Created shipping zone: ${dto.name}`,
            undefined,
            dto as unknown as Record<string, unknown>,
        );

        return result;
    }

    @Put('shipping-zones/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a shipping zone (Admin only)' })
    @ApiResponse({ status: 200, type: ShippingZoneDto })
    async updateShippingZone(
        @Param('id') id: string,
        @Body() dto: UpdateShippingZoneDto,
        @Req() req: Request,
    ) {
        const result = await this.settingsService.updateShippingZone(id, dto);

        await this.logAction(
            req,
            'UPDATE',
            'ShippingZone',
            result.name,
            `Updated shipping zone: ${result.name}`,
            undefined,
            dto as unknown as Record<string, unknown>,
        );

        return result;
    }

    @Delete('shipping-zones/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a shipping zone (Admin only)' })
    async deleteShippingZone(@Param('id') id: string, @Req() req: Request) {
        const result = await this.settingsService.deleteShippingZone(id);

        await this.logAction(
            req,
            'DELETE',
            'ShippingZone',
            id,
            `Deleted shipping zone: ${id}`,
        );

        return result;
    }
}

