import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('shipping')
@Controller('shipping')
export class ShippingController {
    constructor(private readonly shippingService: ShippingService) { }

    @Get('zones')
    @ApiOperation({ summary: 'Get all shipping zones' })
    async getZones() {
        return this.shippingService.getZones();
    }

    @Get('zones/:id')
    @ApiOperation({ summary: 'Get shipping zone by ID' })
    async getZone(@Param('id') id: string) {
        return this.shippingService.getZone(id);
    }

    @Post('zones')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create shipping zone' })
    async createZone(@Body() data: {
        name: string;
        countries: string[];
        rate: number;
        freeAbove?: number;
        minDays?: number;
        maxDays?: number;
        carrier?: string;
        isActive?: boolean;
    }) {
        return this.shippingService.createZone(data);
    }

    @Put('zones/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update shipping zone' })
    async updateZone(
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
        return this.shippingService.updateZone(id, data);
    }

    @Delete('zones/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete shipping zone' })
    async deleteZone(@Param('id') id: string) {
        return this.shippingService.deleteZone(id);
    }

    @Get('calculate')
    @ApiOperation({ summary: 'Calculate shipping rate for a country' })
    async calculateShipping(
        @Param('country') country: string,
        @Param('orderTotal') orderTotal: string,
    ) {
        return this.shippingService.calculateShipping(country, parseFloat(orderTotal));
    }
}
