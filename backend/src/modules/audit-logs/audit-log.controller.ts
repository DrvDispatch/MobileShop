import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuditAction } from '@prisma/client';
import type { Response } from 'express';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AuditLogController {
    constructor(private auditLogService: AuditLogService) { }

    @Get()
    async getLogs(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('userId') userId?: string,
        @Query('action') action?: AuditAction,
        @Query('entityType') entityType?: string,
        @Query('entityId') entityId?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        return this.auditLogService.getLogs({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            userId,
            action,
            entityType,
            entityId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
    }

    @Get('entity')
    async getEntityHistory(
        @Query('type') entityType: string,
        @Query('id') entityId: string,
    ) {
        return this.auditLogService.getEntityHistory(entityType, entityId);
    }

    @Get('export')
    async exportLogs(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('entityType') entityType?: string,
        @Res({ passthrough: true }) res?: Response,
    ) {
        const csv = await this.auditLogService.exportLogs({
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            entityType,
        });

        res!.setHeader('Content-Type', 'text/csv');
        res!.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
        return csv;
    }
}
