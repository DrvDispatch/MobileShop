import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../tenant/tenant.decorator';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('revenue')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get daily revenue data for charts' })
    async getRevenue(@TenantId() tenantId: string, @Query('days') days?: string) {
        const daysNum = parseInt(days || '30', 10);
        return this.analyticsService.getRevenueData(tenantId, daysNum);
    }

    @Get('trends')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get sales trends comparing periods' })
    async getTrends(@TenantId() tenantId: string) {
        return this.analyticsService.getTrends(tenantId);
    }

    @Get('bestsellers')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get bestselling products' })
    async getBestsellers(@TenantId() tenantId: string, @Query('limit') limit?: string) {
        const limitNum = parseInt(limit || '10', 10);
        return this.analyticsService.getBestsellers(tenantId, limitNum);
    }

    @Get('export')
    @Roles('ADMIN')
    @ApiOperation({ summary: 'Export analytics report as CSV' })
    async exportReport(
        @TenantId() tenantId: string,
        @Query('type') type: 'revenue' | 'orders' | 'products' = 'revenue',
        @Query('days') days?: string,
        @Res() res?: Response,
    ) {
        const daysNum = parseInt(days || '30', 10);
        const csv = await this.analyticsService.exportReport(tenantId, type, daysNum);

        if (res) {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=${type}-report-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(csv);
        }

        return csv;
    }
}

