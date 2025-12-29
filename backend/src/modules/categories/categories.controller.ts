import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';
import { Roles } from '../auth/decorators';
import { RolesGuard } from '../auth/guards';
import { UserRole } from '../../generated/prisma/client.js';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all categories' })
    @ApiResponse({ status: 200, description: 'List of categories' })
    async findAll() {
        return this.categoriesService.findAll();
    }

    @Get(':idOrSlug')
    @ApiOperation({ summary: 'Get category by ID or slug' })
    @ApiResponse({ status: 200, description: 'Category details' })
    @ApiResponse({ status: 404, description: 'Category not found' })
    async findOne(@Param('idOrSlug') idOrSlug: string) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

        if (isUuid) {
            return this.categoriesService.findById(idOrSlug);
        }
        return this.categoriesService.findBySlug(idOrSlug);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new category (Admin only)' })
    @ApiResponse({ status: 201, description: 'Category created' })
    async create(@Body() data: { name: string; slug?: string; description?: string; parentId?: string }) {
        return this.categoriesService.create(data);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a category (Admin only)' })
    @ApiResponse({ status: 200, description: 'Category updated' })
    async update(@Param('id') id: string, @Body() data: { name?: string; slug?: string; description?: string; isActive?: boolean }) {
        return this.categoriesService.update(id, data);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles(UserRole.ADMIN)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a category (Admin only)' })
    @ApiResponse({ status: 200, description: 'Category deleted' })
    async delete(@Param('id') id: string) {
        return this.categoriesService.delete(id);
    }
}
