import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards';
import { UserRole } from '../../generated/prisma/client.js';
import { TenantId } from '../tenant/tenant.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    @Get()
    @ApiOperation({ summary: 'Get all products with filters' })
    @ApiResponse({ status: 200, description: 'List of products with pagination' })
    async findAll(@TenantId() tenantId: string, @Query() query: ProductQueryDto) {
        return this.productsService.findAll(tenantId, query);
    }

    @Get('featured')
    @ApiOperation({ summary: 'Get featured products' })
    @ApiResponse({ status: 200, description: 'List of featured products' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async findFeatured(@TenantId() tenantId: string, @Query('limit') limit?: number) {
        return this.productsService.findFeatured(tenantId, limit);
    }

    @Get('brands')
    @ApiOperation({ summary: 'Get all product brands' })
    @ApiResponse({ status: 200, description: 'List of brand names' })
    async getBrands(@TenantId() tenantId: string) {
        return this.productsService.getBrands(tenantId);
    }

    @Get(':id/related')
    @ApiOperation({ summary: 'Get related products' })
    @ApiResponse({ status: 200, description: 'List of related products' })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    async getRelatedProducts(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Query('limit') limit?: number
    ) {
        return this.productsService.getRelatedProducts(tenantId, id, limit || 8);
    }

    @Get(':idOrSlug')
    @ApiOperation({ summary: 'Get product by ID or slug' })
    @ApiResponse({ status: 200, description: 'Product details' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async findOne(@TenantId() tenantId: string, @Param('idOrSlug') idOrSlug: string) {
        // Check if it looks like a UUID
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        if (isUuid) {
            return this.productsService.findById(tenantId, idOrSlug);
        }
        return this.productsService.findBySlug(tenantId, idOrSlug);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new product (Admin/Staff only)' })
    @ApiResponse({ status: 201, description: 'Product created' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin/Staff only' })
    async create(@TenantId() tenantId: string, @Body() dto: CreateProductDto) {
        return this.productsService.create(tenantId, dto);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a product (Admin/Staff only)' })
    @ApiResponse({ status: 200, description: 'Product updated' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async update(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateProductDto) {
        return this.productsService.update(tenantId, id, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a product (Admin only)' })
    @ApiResponse({ status: 200, description: 'Product deleted' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    @ApiResponse({ status: 404, description: 'Product not found' })
    async delete(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.productsService.delete(tenantId, id);
    }

    @Get('admin/export')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN, UserRole.STAFF)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Export all products to CSV (Admin/Staff only)' })
    @ApiResponse({ status: 200, description: 'CSV data returned' })
    async exportCsv(@TenantId() tenantId: string) {
        const csv = await this.productsService.exportToCsv(tenantId);
        return { csv, filename: `products_${new Date().toISOString().split('T')[0]}.csv` };
    }

    @Post('admin/import')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Import products from CSV (Admin only)' })
    @ApiResponse({ status: 200, description: 'Import results' })
    async importCsv(@TenantId() tenantId: string, @Body() body: { csv: string }) {
        return this.productsService.importFromCsv(tenantId, body.csv);
    }
}

