import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentTenant, TenantId } from './tenant.decorator';

@ApiTags('Tenant')
@Controller('tenant')
export class TenantController {
    constructor(private readonly tenantService: TenantService) { }

    /**
     * Get current tenant configuration (public - from Host header)
     */
    @Get('config')
    @ApiOperation({ summary: 'Get current tenant configuration' })
    async getCurrentConfig(@Req() req: Request) {
        if (!req.tenantId) {
            return null;
        }
        return this.tenantService.getPublicConfig(req.tenantId);
    }

    /**
     * Get tenant context (includes all public config)
     */
    @Get('context')
    @ApiOperation({ summary: 'Get current tenant context' })
    async getTenantContext(@CurrentTenant() tenant: Express.Request['tenant']) {
        return tenant;
    }

    // ============================================
    // OWNER ONLY ENDPOINTS
    // ============================================

    /**
     * List all tenants (OWNER only)
     */
    @Get('admin/all')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'List all tenants (OWNER only)' })
    async listAllTenants() {
        return this.tenantService.findAll();
    }

    /**
     * Get tenant by ID (OWNER only)
     */
    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get tenant by ID (OWNER only)' })
    async getTenantById(@Param('id') id: string) {
        return this.tenantService.findById(id);
    }

    /**
     * Create a new tenant (OWNER only)
     */
    @Post('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new tenant (OWNER only)' })
    async createTenant(@Body() body: {
        name: string;
        slug: string;
        domain: string;
        config?: {
            shopName: string;
            primaryColor?: string;
            email?: string;
            phone?: string;
            whatsappNumber?: string;
        };
    }) {
        return this.tenantService.create(body);
    }

    /**
     * Update tenant configuration (OWNER only)
     */
    @Put('admin/:id/config')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update tenant configuration (OWNER only)' })
    async updateTenantConfig(
        @Param('id') id: string,
        @Body() config: Record<string, unknown>
    ) {
        return this.tenantService.updateConfig(id, config);
    }

    /**
     * Add domain to tenant (OWNER only)
     */
    @Post('admin/:id/domains')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Add domain to tenant (OWNER only)' })
    async addDomain(
        @Param('id') id: string,
        @Body() body: { domain: string; isPrimary?: boolean }
    ) {
        return this.tenantService.addDomain(id, body.domain, body.isPrimary);
    }

    /**
     * Remove domain from tenant (OWNER only)
     */
    @Delete('admin/domains/:domainId')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Remove domain from tenant (OWNER only)' })
    async removeDomain(@Param('domainId') domainId: string) {
        return this.tenantService.removeDomain(domainId);
    }

    /**
     * Suspend tenant (OWNER only)
     */
    @Post('admin/:id/suspend')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Suspend tenant (OWNER only)' })
    async suspendTenant(@Param('id') id: string) {
        return this.tenantService.suspend(id);
    }

    /**
     * Activate tenant (OWNER only)
     */
    @Post('admin/:id/activate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('OWNER')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Activate tenant (OWNER only)' })
    async activateTenant(@Param('id') id: string) {
        return this.tenantService.activate(id);
    }
}
