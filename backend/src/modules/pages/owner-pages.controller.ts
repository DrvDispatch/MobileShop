import {
    Controller,
    Get,
    Post,
    Patch,
    Delete,
    Param,
    Body,
    UseGuards,
    Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PagesService } from './pages.service';
import { JwtAuthGuard } from '../auth/guards';
import { OwnerGuard } from '../owner/guards';
import { OwnerService } from '../owner/owner.service';
import type { Request } from 'express';
import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { CmsStatus } from '../../generated/prisma/client.js';

// DTOs
class CreatePageDto {
    @IsString()
    slug: string;

    @IsString()
    title: string;

    @IsObject()
    @IsOptional()
    content?: object;

    @IsString()
    @IsOptional()
    seoTitle?: string;

    @IsString()
    @IsOptional()
    seoDescription?: string;

    @IsBoolean()
    @IsOptional()
    showInNav?: boolean;

    @IsNumber()
    @IsOptional()
    navOrder?: number;
}

class UpdatePageDto {
    @IsString()
    @IsOptional()
    title?: string;

    @IsObject()
    @IsOptional()
    content?: object;

    @IsString()
    @IsOptional()
    seoTitle?: string;

    @IsString()
    @IsOptional()
    seoDescription?: string;

    @IsBoolean()
    @IsOptional()
    showInNav?: boolean;

    @IsNumber()
    @IsOptional()
    navOrder?: number;
}

class UpdateHomepageDto {
    @IsString()
    @IsOptional()
    heroTitle?: string;

    @IsString()
    @IsOptional()
    heroSubtitle?: string;

    @IsString()
    @IsOptional()
    heroDescription?: string;

    @IsString()
    @IsOptional()
    heroImageUrl?: string;

    @IsString()
    @IsOptional()
    heroCta1Text?: string;

    @IsString()
    @IsOptional()
    heroCta1Link?: string;

    @IsString()
    @IsOptional()
    heroCta2Text?: string;

    @IsString()
    @IsOptional()
    heroCta2Link?: string;

    @IsString()
    @IsOptional()
    trustBadge1?: string;

    @IsString()
    @IsOptional()
    trustBadge2?: string;

    @IsString()
    @IsOptional()
    trustBadge3?: string;

    @IsString()
    @IsOptional()
    conversionTitle?: string;

    @IsString()
    @IsOptional()
    conversionFeature1?: string;

    @IsString()
    @IsOptional()
    conversionFeature2?: string;

    @IsString()
    @IsOptional()
    conversionFeature3?: string;

    @IsBoolean()
    @IsOptional()
    showConversionStrip?: boolean;

    @IsBoolean()
    @IsOptional()
    showServices?: boolean;

    @IsString()
    @IsOptional()
    status?: CmsStatus;
}

/**
 * Owner CMS endpoints for managing tenant pages
 */
@ApiTags('Pages (Owner)')
@ApiBearerAuth()
@Controller('owner/tenants/:tenantId')
@UseGuards(JwtAuthGuard, OwnerGuard)
export class OwnerPagesController {
    constructor(
        private readonly pagesService: PagesService,
        private readonly ownerService: OwnerService,
    ) { }

    // ===== HOMEPAGE =====

    @Get('homepage')
    @ApiOperation({ summary: 'Get homepage for a tenant (owner view)' })
    async getHomepage(@Param('tenantId') tenantId: string) {
        return this.pagesService.getHomepageForOwner(tenantId);
    }

    @Patch('homepage')
    @ApiOperation({ summary: 'Update homepage' })
    async updateHomepage(
        @Param('tenantId') tenantId: string,
        @Body() dto: UpdateHomepageDto,
        @Req() req: Request
    ) {
        const homepage = await this.pagesService.updateHomepage(tenantId, dto);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'UPDATE_HOMEPAGE',
            'HOMEPAGE',
            homepage.id,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return homepage;
    }

    // ===== PAGES =====

    @Get('pages')
    @ApiOperation({ summary: 'List all pages for a tenant' })
    async listPages(@Param('tenantId') tenantId: string) {
        return this.pagesService.listPagesForOwner(tenantId);
    }

    @Get('pages/:pageId')
    @ApiOperation({ summary: 'Get a specific page' })
    async getPage(
        @Param('tenantId') tenantId: string,
        @Param('pageId') pageId: string
    ) {
        // Try by ID first (most common case from editor)
        let page = await this.pagesService.getPageById(tenantId, pageId);

        // If not found by ID, try by slug
        if (!page) {
            page = await this.pagesService.getPageBySlugForOwner(tenantId, pageId);
        }

        if (!page) {
            throw new Error(`Page with ID or slug "${pageId}" not found`);
        }

        return page;
    }

    @Post('pages')
    @ApiOperation({ summary: 'Create a new page' })
    async createPage(
        @Param('tenantId') tenantId: string,
        @Body() dto: CreatePageDto,
        @Req() req: Request
    ) {
        const page = await this.pagesService.createPage(tenantId, dto);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'CREATE_PAGE',
            'PAGE',
            page.id,
            { tenantId, slug: dto.slug },
            req.ip,
            req.headers['user-agent']
        );

        return page;
    }

    @Patch('pages/:pageId')
    @ApiOperation({ summary: 'Update a page' })
    async updatePage(
        @Param('tenantId') tenantId: string,
        @Param('pageId') pageId: string,
        @Body() dto: UpdatePageDto,
        @Req() req: Request
    ) {
        const page = await this.pagesService.updatePage(tenantId, pageId, dto);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'UPDATE_PAGE',
            'PAGE',
            pageId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return page;
    }

    @Post('pages/:pageId/publish')
    @ApiOperation({ summary: 'Publish a page' })
    async publishPage(
        @Param('tenantId') tenantId: string,
        @Param('pageId') pageId: string,
        @Req() req: Request
    ) {
        const page = await this.pagesService.publishPage(tenantId, pageId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'PUBLISH_PAGE',
            'PAGE',
            pageId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return page;
    }

    @Post('pages/:pageId/unpublish')
    @ApiOperation({ summary: 'Unpublish a page (set to draft)' })
    async unpublishPage(
        @Param('tenantId') tenantId: string,
        @Param('pageId') pageId: string,
        @Req() req: Request
    ) {
        const page = await this.pagesService.unpublishPage(tenantId, pageId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'UNPUBLISH_PAGE',
            'PAGE',
            pageId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return page;
    }

    @Delete('pages/:pageId')
    @ApiOperation({ summary: 'Delete a page' })
    async deletePage(
        @Param('tenantId') tenantId: string,
        @Param('pageId') pageId: string,
        @Req() req: Request
    ) {
        await this.pagesService.deletePage(tenantId, pageId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'DELETE_PAGE',
            'PAGE',
            pageId,
            { tenantId },
            req.ip,
            req.headers['user-agent']
        );

        return { success: true };
    }

    @Post('pages/seed')
    @ApiOperation({ summary: 'Seed default pages for a tenant' })
    async seedPages(
        @Param('tenantId') tenantId: string,
        @Req() req: Request
    ) {
        await this.pagesService.seedDefaultPages(tenantId);

        await this.ownerService.logOwnerAction(
            (req as any).user.sub || (req as any).user.id,
            'SEED_PAGES',
            'TENANT',
            tenantId,
            {},
            req.ip,
            req.headers['user-agent']
        );

        return { success: true };
    }
}
