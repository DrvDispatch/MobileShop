import { Controller, Get, Query, UseGuards, Res, Req } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportTaxService } from './export-tax.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AuditLogService } from '../audit-logs/audit-log.service';
import { TenantId } from '../tenant/tenant.decorator';
import type { Response, Request } from 'express';

@Controller('export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
export class ExportController {
    constructor(
        private exportService: ExportService,
        private exportTaxService: ExportTaxService,
        private auditLogService: AuditLogService,
    ) { }

    private async logExport(tenantId: string, req: Request, exportType: string, filters?: Record<string, unknown>) {
        const user = (req as any).user;
        await this.auditLogService.log({
            tenantId,
            userId: user?.sub || 'unknown',
            userName: user?.email || 'unknown',
            userRole: user?.role || 'unknown',
            action: 'EXPORT',
            entityType: 'Export',
            entityName: exportType,
            description: `Exported ${exportType}`,
            metadata: filters,
            ipAddress: req.ip,
            userAgent: req.headers['user-agent'],
        });
    }

    @Get('orders')
    async exportOrders(
        @TenantId() tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status') status?: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const csv = await this.exportService.exportOrders(tenantId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
            status,
        });

        await this.logExport(tenantId, req!, 'orders', { startDate, endDate, status });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=bestellingen-${new Date().toISOString().split('T')[0]}.csv`);
        return csv;
    }

    @Get('products')
    async exportProducts(
        @TenantId() tenantId: string,
        @Query('includeInactive') includeInactive?: string,
        @Query('lowStockOnly') lowStockOnly?: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const csv = await this.exportService.exportProducts(tenantId, {
            includeInactive: includeInactive === 'true',
            lowStockOnly: lowStockOnly === 'true',
        });

        await this.logExport(tenantId, req!, 'products', { includeInactive, lowStockOnly });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=producten-${new Date().toISOString().split('T')[0]}.csv`);
        return csv;
    }

    @Get('customers')
    async exportCustomers(
        @TenantId() tenantId: string,
        @Query('includeInactive') includeInactive?: string,
        @Query('vipOnly') vipOnly?: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const csv = await this.exportService.exportCustomers(tenantId, {
            includeInactive: includeInactive === 'true',
            vipOnly: vipOnly === 'true',
        });

        await this.logExport(tenantId, req!, 'customers', { includeInactive, vipOnly });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=klanten-${new Date().toISOString().split('T')[0]}.csv`);
        return csv;
    }

    @Get('refunds')
    async exportRefunds(
        @TenantId() tenantId: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const csv = await this.exportService.exportRefunds(tenantId, {
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });

        await this.logExport(tenantId, req!, 'refunds', { startDate, endDate });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=terugbetalingen-${new Date().toISOString().split('T')[0]}.csv`);
        return csv;
    }

    @Get('reviews')
    async exportReviews(
        @TenantId() tenantId: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const csv = await this.exportService.exportReviews(tenantId);

        await this.logExport(tenantId, req!, 'reviews');

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=reviews-${new Date().toISOString().split('T')[0]}.csv`);
        return csv;
    }

    // ============================================
    // BELGIAN TAX EXPORTS (Boekhoudkundig)
    // ============================================

    @Get('btw-aangifte')
    async exportBTWAangifte(
        @TenantId() tenantId: string,
        @Query('quarter') quarter: string,
        @Query('year') year: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const q = parseInt(quarter, 10) || 4;
        const y = parseInt(year, 10) || new Date().getFullYear();

        const csv = await this.exportTaxService.exportBTWAangifte(tenantId, q, y);

        await this.logExport(tenantId, req!, 'btw-aangifte', { quarter: q, year: y });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=btw-aangifte-Q${q}-${y}.csv`);
        return csv;
    }

    @Get('accountant')
    async exportAccountantReport(
        @TenantId() tenantId: string,
        @Query('quarter') quarter: string,
        @Query('year') year: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const q = parseInt(quarter, 10) || 4;
        const y = parseInt(year, 10) || new Date().getFullYear();

        const csv = await this.exportTaxService.exportAccountantReport(tenantId, q, y);

        await this.logExport(tenantId, req!, 'accountant-report', { quarter: q, year: y });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=boekhouding-Q${q}-${y}.csv`);
        return csv;
    }

    @Get('annual-summary')
    async exportAnnualSummary(
        @TenantId() tenantId: string,
        @Query('year') year: string,
        @Res({ passthrough: true }) res?: Response,
        @Req() req?: Request,
    ) {
        const y = parseInt(year, 10) || new Date().getFullYear();

        const csv = await this.exportTaxService.exportAnnualSummary(tenantId, y);

        await this.logExport(tenantId, req!, 'annual-summary', { year: y });

        res!.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res!.setHeader('Content-Disposition', `attachment; filename=jaaroverzicht-${y}.csv`);
        return csv;
    }
}
