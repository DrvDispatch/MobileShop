import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
    constructor(private readonly shippingService: ShippingService) { }

    @Get('zones')
    @ApiOperation({ summary: 'Get all shipping zones' })
    async getZones(@TenantId() tenantId: string) {
        return this.shippingService.getZones(tenantId);
    }

    @Get('zones/:id')
    @ApiOperation({ summary: 'Get shipping zone by ID' })
    async getZone(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.shippingService.getZone(tenantId, id);
    }

    @Post('zones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create shipping zone' })
    async createZone(
        @TenantId() tenantId: string,
        @Body() data: {
            name: string;
            countries: string[];
            rate: number;
            freeAbove?: number;
            minDays?: number;
            maxDays?: number;
            carrier?: string;
            isActive?: boolean;
        }
    ) {
        return this.shippingService.createZone(tenantId, data);
    }

    @Put('zones/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update shipping zone' })
    async updateZone(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Body() data: {
            name?: string;
            countries?: string[];
            rate?: number;
            freeAbove?: number;
            minDays?: number;
            maxDays?: number;
            carrier?: string;
            isActive?: boolean;
            sortOrder?: number;
        },
    ) {
        return this.shippingService.updateZone(tenantId, id, data);
    }

    @Delete('zones/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete shipping zone' })
    async deleteZone(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.shippingService.deleteZone(tenantId, id);
    }

    @Get('calculate')
    @ApiOperation({ summary: 'Calculate shipping rate for a country' })
    async calculateShipping(
        @TenantId() tenantId: string,
        @Query('country') country: string,
        @Query('orderTotal') orderTotal: string,
    ) {
        return this.shippingService.calculateShipping(tenantId, country, parseFloat(orderTotal));
    }
}
