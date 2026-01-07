import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import type { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ServicesService } from './services.service';
import {
    CreateServiceCategoryDto,
    UpdateServiceCategoryDto,
    CreateServiceDto,
    UpdateServiceDto,
} from './dto';

/**
 * ServicesController - Vertical-Agnostic Service Catalog API
 * 
 * Public endpoints for booking wizard:
 * - GET /services/catalog - Full service catalog with categories
 * - GET /services/categories/:slug - Category with services
 * - GET /services/:slug - Single service
 * - GET /services/booking-flow - Booking flow configuration
 * 
 * Admin endpoints for service management (protected)
 */
@ApiTags('Services')
@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    // ============================================
    // PUBLIC ENDPOINTS (for booking wizard)
    // ============================================

    @Get('catalog')
    @ApiOperation({ summary: 'Get complete service catalog for current tenant' })
    @ApiResponse({ status: 200, description: 'Service catalog with categories and services' })
    async getServiceCatalog(@Req() req: Request) {
        if (!req.tenantId) {
            return { categories: [], services: [] };
        }
        return this.servicesService.getServiceCatalog(req.tenantId);
    }

    @Get('categories/:slug')
    @ApiOperation({ summary: 'Get category by slug with services' })
    async getCategoryBySlug(@Req() req: Request, @Param('slug') slug: string) {
        if (!req.tenantId) {
            return null;
        }
        return this.servicesService.getServicesByCategory(req.tenantId, slug);
    }

    @Get('by-slug/:slug')
    @ApiOperation({ summary: 'Get service by slug' })
    async getServiceBySlug(@Req() req: Request, @Param('slug') slug: string) {
        if (!req.tenantId) {
            return null;
        }
        return this.servicesService.getServiceBySlug(req.tenantId, slug);
    }

    @Get('booking-flow')
    @ApiOperation({ summary: 'Get booking flow configuration for current tenant' })
    @ApiResponse({ status: 200, description: 'Booking flow steps and terminology' })
    async getBookingFlowConfig(@Req() req: Request) {
        if (!req.tenantId) {
            // Return default 3-step flow
            return {
                steps: ['select_service', 'select_time', 'contact'],
                terminology: null,
            };
        }
        return this.servicesService.getBookingFlowConfig(req.tenantId);
    }

    // ============================================
    // ADMIN ENDPOINTS (protected)
    // ============================================

    // Categories CRUD
    @Get('admin/categories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all categories (admin)' })
    async getCategories(@Req() req: Request) {
        if (!req.tenantId) {
            return [];
        }
        return this.servicesService.getCategories(req.tenantId);
    }

    @Post('admin/categories')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create category (admin)' })
    async createCategory(@Req() req: Request, @Body() dto: CreateServiceCategoryDto) {
        if (!req.tenantId) {
            throw new Error('Tenant context required');
        }
        return this.servicesService.createCategory(req.tenantId, dto);
    }

    @Put('admin/categories/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update category (admin)' })
    async updateCategory(@Param('id') id: string, @Body() dto: UpdateServiceCategoryDto) {
        return this.servicesService.updateCategory(id, dto);
    }

    @Delete('admin/categories/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete category (admin)' })
    async deleteCategory(@Param('id') id: string) {
        return this.servicesService.deleteCategory(id);
    }

    // Services CRUD
    @Get('admin/list')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all services (admin)' })
    async getServices(@Req() req: Request) {
        if (!req.tenantId) {
            return [];
        }
        return this.servicesService.getServices(req.tenantId);
    }

    @Post('admin/services')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create service (admin)' })
    async createService(@Req() req: Request, @Body() dto: CreateServiceDto) {
        if (!req.tenantId) {
            throw new Error('Tenant context required');
        }
        return this.servicesService.createService(req.tenantId, dto);
    }

    @Put('admin/services/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update service (admin)' })
    async updateService(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
        return this.servicesService.updateService(id, dto);
    }

    @Delete('admin/services/:id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete service (admin)' })
    async deleteService(@Param('id') id: string) {
        return this.servicesService.deleteService(id);
    }

    // Booking Flow Config
    @Put('admin/booking-flow')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Save booking flow configuration (admin)' })
    async saveBookingFlowConfig(
        @Req() req: Request,
        @Body() body: { steps: string[]; terminology?: Record<string, string> },
    ) {
        if (!req.tenantId) {
            throw new Error('Tenant context required');
        }
        return this.servicesService.saveBookingFlowConfig(req.tenantId, body);
    }
}
