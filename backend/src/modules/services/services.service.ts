import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '../../generated/prisma/client.js';
import {
    CreateServiceCategoryDto,
    UpdateServiceCategoryDto,
    CreateServiceDto,
    UpdateServiceDto,
} from './dto';

/**
 * ServicesService - Vertical-Agnostic Service Catalog
 * 
 * Manages Service and ServiceCategory tables for any vertical.
 * The category tree supports:
 * - Flat lists (depth=0 only, e.g. barbershop services)
 * - One-level hierarchy (e.g. carwash packages)
 * - Multi-level hierarchy (e.g. mobile repair: Type → Brand → Model)
 */
@Injectable()
export class ServicesService {
    constructor(private prisma: PrismaService) { }

    // ============================================
    // PUBLIC METHODS (for booking wizard)
    // ============================================

    /**
     * Get the complete service catalog for a tenant
     * Returns category tree with services attached
     */
    async getServiceCatalog(tenantId: string) {
        // Get all categories with their services
        const categories = await this.prisma.serviceCategory.findMany({
            where: { tenantId, isActive: true },
            include: {
                services: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        services: {
                            where: { isActive: true },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
            orderBy: { sortOrder: 'asc' },
        });

        // Filter to only root categories (depth=0)
        const rootCategories = categories.filter(c => c.parentId === null);

        // Also get services without categories (flat list)
        const uncategorizedServices = await this.prisma.service.findMany({
            where: { tenantId, categoryId: null, isActive: true },
            orderBy: { sortOrder: 'asc' },
        });

        return {
            categories: rootCategories,
            services: uncategorizedServices,
        };
    }

    /**
     * Get services for a specific category (and optionally its children)
     */
    async getServicesByCategory(tenantId: string, categorySlug: string) {
        const category = await this.prisma.serviceCategory.findUnique({
            where: {
                tenantId_slug: { tenantId, slug: categorySlug },
            },
            include: {
                services: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                },
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    include: {
                        services: {
                            where: { isActive: true },
                            orderBy: { sortOrder: 'asc' },
                        },
                    },
                },
            },
        });

        if (!category) {
            throw new NotFoundException(`Category '${categorySlug}' not found`);
        }

        return category;
    }

    /**
     * Get a single service by slug
     */
    async getServiceBySlug(tenantId: string, serviceSlug: string) {
        const service = await this.prisma.service.findUnique({
            where: {
                tenantId_slug: { tenantId, slug: serviceSlug },
            },
            include: {
                category: true,
            },
        });

        if (!service) {
            throw new NotFoundException(`Service '${serviceSlug}' not found`);
        }

        return service;
    }

    /**
     * Get booking flow configuration for a tenant
     */
    async getBookingFlowConfig(tenantId: string) {
        const config = await this.prisma.bookingFlowConfig.findUnique({
            where: { tenantId },
        });

        // Return default config if not set
        if (!config) {
            return {
                steps: ['select_service', 'select_time', 'contact'],
                terminology: null,
            };
        }

        return config;
    }

    // ============================================
    // ADMIN METHODS (for service management)
    // ============================================

    /**
     * Get all categories for admin (including inactive)
     */
    async getCategories(tenantId: string) {
        return this.prisma.serviceCategory.findMany({
            where: { tenantId },
            include: {
                services: true,
                _count: { select: { services: true, children: true } },
            },
            orderBy: [{ depth: 'asc' }, { sortOrder: 'asc' }],
        });
    }

    /**
     * Create a new category
     */
    async createCategory(tenantId: string, dto: CreateServiceCategoryDto) {
        // Calculate depth based on parent
        let depth = 0;
        if (dto.parentId) {
            const parent = await this.prisma.serviceCategory.findUnique({
                where: { id: dto.parentId },
            });
            if (parent) {
                depth = parent.depth + 1;
            }
        }

        return this.prisma.serviceCategory.create({
            data: {
                tenantId,
                ...dto,
                depth,
            },
        });
    }

    /**
     * Update a category
     */
    async updateCategory(id: string, dto: UpdateServiceCategoryDto) {
        return this.prisma.serviceCategory.update({
            where: { id },
            data: dto,
        });
    }

    /**
     * Delete a category
     */
    async deleteCategory(id: string) {
        return this.prisma.serviceCategory.delete({
            where: { id },
        });
    }

    /**
     * Get all services for admin (including inactive)
     */
    async getServices(tenantId: string) {
        return this.prisma.service.findMany({
            where: { tenantId },
            include: {
                category: true,
            },
            orderBy: { sortOrder: 'asc' },
        });
    }

    /**
     * Create a new service
     */
    async createService(tenantId: string, dto: CreateServiceDto) {
        return this.prisma.service.create({
            data: {
                tenantId,
                ...dto,
            },
        });
    }

    /**
     * Update a service
     */
    async updateService(id: string, dto: UpdateServiceDto) {
        return this.prisma.service.update({
            where: { id },
            data: dto,
        });
    }

    /**
     * Delete a service
     */
    async deleteService(id: string) {
        return this.prisma.service.delete({
            where: { id },
        });
    }

    /**
     * Save or update booking flow configuration
     */
    async saveBookingFlowConfig(
        tenantId: string,
        config: { steps: string[]; terminology?: Record<string, string> },
    ) {
        return this.prisma.bookingFlowConfig.upsert({
            where: { tenantId },
            create: {
                tenantId,
                steps: config.steps,
                terminology: config.terminology || Prisma.JsonNull,
            },
            update: {
                steps: config.steps,
                terminology: config.terminology || Prisma.JsonNull,
            },
        });
    }
}
