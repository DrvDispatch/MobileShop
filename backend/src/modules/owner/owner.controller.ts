import {
    Controller,
    Get,
    Post,
    Patch,
    Put,
    Delete,
    Param,
    Body,
    Query,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from '../auth/guards';
import { OwnerGuard } from './guards';
import { OwnerService } from './owner.service';
import { TenantFeaturesService, UpdateFeaturesDto } from './tenant-features.service';
import { TenantSeederService } from './tenant-seeder.service';
import { CreateTenantUserDto, ResetTenantUserPasswordDto } from './dto/user.dto';
import type { Request } from 'express';
import { IsString, IsOptional, IsBoolean, IsObject, IsNumber } from 'class-validator';

// DTOs
class CreateTenantDto {
    @IsString()
    name: string;

    @IsString()
    slug: string;
}

class UpdateTenantDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    slug?: string;
}

class AddDomainDto {
    @IsString()
    domain: string;

    @IsBoolean()
    @IsOptional()
    isPrimary?: boolean;
}

class UpdateConfigDto {
    @IsString()
    @IsOptional()
    shopName?: string;

    @IsString()
    @IsOptional()
    logoUrl?: string;

    @IsString()
    @IsOptional()
    primaryColor?: string;

    @IsString()
    @IsOptional()
    secondaryColor?: string;

    @IsString()
    @IsOptional()
    accentColor?: string;

    @IsString()
    @IsOptional()
    borderRadius?: string;

    @IsBoolean()
    @IsOptional()
    darkMode?: boolean;

    @IsString()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    phone?: string;

    @IsString()
    @IsOptional()
    whatsappNumber?: string;

    @IsString()
    @IsOptional()
    locale?: string;

    @IsString()
    @IsOptional()
    currency?: string;

    @IsString()
    @IsOptional()
    timezone?: string;

    @IsObject()
    @IsOptional()
    features?: Record<string, boolean>;
}

@ApiTags('Owner')
@ApiBearerAuth()
@Controller('owner')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class OwnerController {
    constructor(
        private readonly ownerService: OwnerService,
        private readonly featuresService: TenantFeaturesService,
        private readonly seederService: TenantSeederService,
        private readonly jwtService: JwtService,
    ) { }

    // ===== TENANTS =====

    @Get('tenants')
    @ApiOperation({ summary: 'List all tenants' })
    async listTenants() {
        return this.ownerService.findAllTenants();
    }

    @Post('tenants')
    @ApiOperation({ summary: 'Create new tenant' })
    async createTenant(
        @Body() dto: CreateTenantDto,
        @Req() req: Request
    ) {
        const tenant = await this.ownerService.createTenant(dto);

        // Log action
        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'CREATE_TENANT',
            'TENANT',
            tenant.id,
            { name: dto.name, slug: dto.slug },
            req.ip,
            req.headers['user-agent']
        );

        return tenant;
    }

    @Get('tenants/:id')
    @ApiOperation({ summary: 'Get tenant by ID' })
    async getTenant(@Param('id') id: string) {
        return this.ownerService.findTenantById(id);
    }

    @Patch('tenants/:id')
    @ApiOperation({ summary: 'Update tenant' })
    async updateTenant(
        @Param('id') id: string,
        @Body() dto: UpdateTenantDto,
        @Req() req: Request
    ) {
        const tenant = await this.ownerService.updateTenant(id, dto);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'UPDATE_TENANT',
            'TENANT',
            id,
            dto,
            req.ip,
            req.headers['user-agent']
        );

        return tenant;
    }

    @Post('tenants/:id/activate')
    @ApiOperation({ summary: 'Activate tenant' })
    async activateTenant(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        const tenant = await this.ownerService.activateTenant(id);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'ACTIVATE_TENANT',
            'TENANT',
            id,
            undefined,
            req.ip,
            req.headers['user-agent']
        );

        return tenant;
    }

    @Post('tenants/:id/suspend')
    @ApiOperation({ summary: 'Suspend tenant' })
    async suspendTenant(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        const tenant = await this.ownerService.suspendTenant(id);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'SUSPEND_TENANT',
            'TENANT',
            id,
            undefined,
            req.ip,
            req.headers['user-agent']
        );

        return tenant;
    }

    @Post('tenants/:id/archive')
    @ApiOperation({ summary: 'Archive tenant (soft delete)' })
    async archiveTenant(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        const tenant = await this.ownerService.archiveTenant(id);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'ARCHIVE_TENANT',
            'TENANT',
            id,
            undefined,
            req.ip,
            req.headers['user-agent']
        );

        return tenant;
    }

    // ===== REPAIR CATALOG SEEDING =====

    @Post('tenants/:id/seed')
    @ApiOperation({ summary: 'Seed tenant with repair catalog from devices.json' })
    @ApiResponse({ status: 200, description: 'Seeding statistics' })
    async seedTenant(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        const result = await this.seederService.seedRepairCatalog(id);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'SEED_TENANT',
            'TENANT',
            id,
            result,
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

    @Post('tenants/:id/reseed')
    @ApiOperation({ summary: 'Clear and reseed tenant repair catalog' })
    @ApiResponse({ status: 200, description: 'Seeding statistics' })
    async reseedTenant(
        @Param('id') id: string,
        @Req() req: Request
    ) {
        // Clear existing repair data first
        await this.seederService.clearRepairData(id);

        // Reseed
        const result = await this.seederService.seedRepairCatalog(id);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'RESEED_TENANT',
            'TENANT',
            id,
            result,
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

    @Get('tenants/:id/seed-stats')
    @ApiOperation({ summary: 'Get tenant seeding statistics' })
    async getSeedStats(@Param('id') id: string) {
        return this.seederService.getSeedingStats(id);
    }

    // ===== DOMAINS =====

    @Post('tenants/:id/domains')
    @ApiOperation({ summary: 'Add domain to tenant' })
    async addDomain(
        @Param('id') tenantId: string,
        @Body() dto: AddDomainDto,
        @Req() req: Request
    ) {
        const domain = await this.ownerService.addDomain(tenantId, dto.domain, dto.isPrimary);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'ADD_DOMAIN',
            'DOMAIN',
            domain.id,
            { tenantId, domain: dto.domain },
            req.ip,
            req.headers['user-agent']
        );

        return domain;
    }

    @Post('tenants/:id/domains/:domainId/verify')
    @ApiOperation({ summary: 'Verify domain ownership' })
    async verifyDomain(
        @Param('id') tenantId: string,
        @Param('domainId') domainId: string,
        @Req() req: Request
    ) {
        const domain = await this.ownerService.verifyDomain(tenantId, domainId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'VERIFY_DOMAIN',
            'DOMAIN',
            domainId,
            { tenantId, domain: domain.domain },
            req.ip,
            req.headers['user-agent']
        );

        return domain;
    }

    @Post('tenants/:id/domains/:domainId/set-primary')
    @ApiOperation({ summary: 'Set domain as primary' })
    async setPrimaryDomain(
        @Param('id') tenantId: string,
        @Param('domainId') domainId: string,
        @Req() req: Request
    ) {
        const domain = await this.ownerService.setPrimaryDomain(tenantId, domainId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'SET_PRIMARY_DOMAIN',
            'DOMAIN',
            domainId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return domain;
    }

    @Delete('tenants/:id/domains/:domainId')
    @HttpCode(HttpStatus.NO_CONTENT)
    @ApiOperation({ summary: 'Remove domain from tenant' })
    async removeDomain(
        @Param('id') tenantId: string,
        @Param('domainId') domainId: string,
        @Req() req: Request
    ) {
        await this.ownerService.removeDomain(tenantId, domainId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'REMOVE_DOMAIN',
            'DOMAIN',
            domainId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );
    }

    // ===== CLOUDFLARE DOMAIN AUTOMATION =====

    @Post('tenants/:id/domains/:domainId/cloudflare/setup')
    @ApiOperation({ summary: 'Setup domain in Cloudflare (creates zone, returns nameservers)' })
    async setupDomainCloudflare(
        @Param('id') tenantId: string,
        @Param('domainId') domainId: string,
        @Req() req: Request
    ) {
        const result = await this.ownerService.setupDomainCloudflare(tenantId, domainId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'CLOUDFLARE_SETUP_DOMAIN',
            'DOMAIN',
            domainId,
            { tenantId, nameservers: result.nameservers },
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

    @Post('tenants/:id/domains/:domainId/cloudflare/configure')
    @ApiOperation({ summary: 'Check zone status and configure DNS when active' })
    async configureDomainCloudflare(
        @Param('id') tenantId: string,
        @Param('domainId') domainId: string,
        @Req() req: Request
    ) {
        const result = await this.ownerService.checkAndConfigureDomain(tenantId, domainId);

        if (result.configured) {
            await this.ownerService.logOwnerAction(
                (req as any).user.sub || (req as any).user.id,
                'CLOUDFLARE_DNS_CONFIGURED',
                'DOMAIN',
                domainId,
                { tenantId },
                req.ip,
                req.headers['user-agent']
            );
        }

        return result;
    }

    @Get('tenants/:id/domains/:domainId/cloudflare/status')
    @ApiOperation({ summary: 'Get Cloudflare status for a domain' })
    async getDomainCloudflareStatus(
        @Param('id') tenantId: string,
        @Param('domainId') domainId: string
    ) {
        return this.ownerService.getDomainCloudflareStatus(tenantId, domainId);
    }

    @Get('cloudflare/verify')
    @ApiOperation({ summary: 'Verify Cloudflare API connection' })
    async verifyCloudflareConnection() {
        const isValid = await this.ownerService.verifyCloudflareConnection();
        return {
            success: isValid,
            message: isValid ? 'Cloudflare API token is valid' : 'Cloudflare API token verification failed'
        };
    }

    // ===== CONFIG =====

    @Patch('tenants/:id/config')
    @ApiOperation({ summary: 'Update tenant config' })
    async updateConfig(
        @Param('id') tenantId: string,
        @Body() dto: UpdateConfigDto,
        @Req() req: Request
    ) {
        const config = await this.ownerService.updateTenantConfig(tenantId, dto);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'UPDATE_CONFIG',
            'CONFIG',
            config.id,
            { tenantId, fields: Object.keys(dto) },
            req.ip,
            req.headers['user-agent']
        );

        return config;
    }

    // ===== STATS =====

    @Get('stats')
    @ApiOperation({ summary: 'Get platform-wide stats' })
    async getStats() {
        return this.ownerService.getPlatformStats();
    }

    // ===== AUDIT LOGS =====

    @Get('audit-logs')
    @ApiOperation({ summary: 'Get owner audit logs' })
    async getAuditLogs(
        @Query('action') action?: string,
        @Query('targetType') targetType?: string,
        @Query('limit') limit?: string
    ) {
        return this.ownerService.getAuditLogs({
            action,
            targetType,
            limit: limit ? parseInt(limit, 10) : undefined
        });
    }

    // ===== IMPERSONATION =====

    @Post('impersonate')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Start impersonation of a tenant user' })
    @ApiResponse({ status: 200, description: 'Returns handoff code and redirect URL for secure impersonation' })
    async impersonateUser(
        @Body() body: { tenantId: string; userId: string },
        @Req() req: Request
    ) {
        const ownerId = (req as any).user?.sub || 'unknown';
        const ipAddress = req.ip || req.headers['x-forwarded-for']?.toString();
        const userAgent = req.headers['user-agent'];

        // Returns handoff code (not JWT) - same secure pattern as OAuth
        return this.ownerService.createImpersonationHandoff(
            body.tenantId,
            body.userId,
            ownerId,
            ipAddress,
            userAgent
        );
    }

    @Get('tenants/:id/users')
    @ApiOperation({ summary: 'List users for a tenant (for impersonation dropdown)' })
    async listTenantUsers(@Param('id') tenantId: string) {
        return this.ownerService.listTenantUsers(tenantId);
    }

    // ===== FEATURE CONTROL =====

    @Get('tenants/:id/features')
    @ApiOperation({ summary: 'Get feature flags for a tenant' })
    async getFeatures(@Param('id') tenantId: string) {
        return this.featuresService.getFeatures(tenantId);
    }

    @Get('tenants/:id/features/summary')
    @ApiOperation({ summary: 'Get feature summary grouped by module' })
    async getFeatureSummary(@Param('id') tenantId: string) {
        return this.featuresService.getFeatureSummary(tenantId);
    }

    @Patch('tenants/:id/features')
    @ApiOperation({ summary: 'Update feature flags for a tenant' })
    async updateFeatures(
        @Param('id') tenantId: string,
        @Body() dto: UpdateFeaturesDto,
        @Req() req: Request
    ) {
        const result = await this.featuresService.updateFeatures(tenantId, dto);

        // Log action
        await this.ownerService.logOwnerAction(
            (req as any).user?.sub || 'unknown',
            'UPDATE_FEATURES',
            'TENANT',
            tenantId,
            dto,
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

    @Post('tenants/:id/features/apply-plan')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Apply a plan template to a tenant' })
    async applyPlanTemplate(
        @Param('id') tenantId: string,
        @Body() body: { planName: string },
        @Req() req: Request
    ) {
        const result = await this.featuresService.applyPlanTemplate(tenantId, body.planName);

        // Log action
        await this.ownerService.logOwnerAction(
            (req as any).user?.sub || 'unknown',
            'APPLY_PLAN_TEMPLATE',
            'TENANT',
            tenantId,
            { planName: body.planName },
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

    // ===== USER MANAGEMENT =====

    @Post('tenants/:id/users')
    @ApiOperation({ summary: 'Create a new user for a tenant (e.g. Admin)' })
    @ApiResponse({ status: 201, description: 'User created' })
    async createTenantUser(
        @Param('id') tenantId: string,
        @Body() dto: CreateTenantUserDto,
        @Req() req: Request
    ) {
        const result = await this.ownerService.createTenantUser(tenantId, dto);

        // Log action
        await this.ownerService.logOwnerAction(
            (req as any).user?.sub || 'unknown',
            'CREATE_USER',
            'USER',
            result.id,
            { tenantId, userEmail: dto.email, role: dto.role },
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

    @Patch('tenants/:id/users/:userId/password')
    @ApiOperation({ summary: 'Reset password for a tenant user' })
    @ApiResponse({ status: 200, description: 'Password reset successful' })
    async resetUserPassword(
        @Param('id') tenantId: string,
        @Param('userId') userId: string,
        @Body() dto: ResetTenantUserPasswordDto,
        @Req() req: Request
    ) {
        const result = await this.ownerService.resetTenantUserPassword(tenantId, userId, dto.password);

        // Log action
        await this.ownerService.logOwnerAction(
            (req as any).user?.sub || 'unknown',
            'RESET_PASSWORD',
            'USER',
            userId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return result;
    }

}

