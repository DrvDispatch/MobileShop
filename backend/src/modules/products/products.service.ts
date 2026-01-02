import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { Prisma } from '../../generated/prisma/client.js';
import { transformProductImages } from '../../utils/image-url';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(tenantId: string, query: ProductQueryDto) {
        const {
            category,
            brand,
            condition,
            featured,
            search,
            minPrice,
            maxPrice,
            sortBy = 'sortOrder',  // Default to flagship-first sorting
            sortOrder = 'asc',
            page = 1,
            limit = 12,
        } = query;

        const where: Prisma.ProductWhereInput = {
            tenantId,
            isActive: true,
        };

        // Category filter (by id or slug)
        if (category) {
            where.OR = [
                { categoryId: category },
                { category: { slug: category } },
            ];
        }

        // Brand filter
        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }

        // Condition filter
        if (condition) {
            where.condition = condition;
        }

        // Featured filter
        if (featured !== undefined) {
            where.isFeatured = featured;
        }

        // Search filter
        if (search) {
            where.AND = [
                {
                    OR: [
                        { name: { contains: search, mode: 'insensitive' } },
                        { description: { contains: search, mode: 'insensitive' } },
                        { brand: { contains: search, mode: 'insensitive' } },
                        { sku: { contains: search, mode: 'insensitive' } },
                    ],
                },
            ];
        }

        // Price filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            where.price = {};
            if (minPrice !== undefined) {
                where.price.gte = minPrice;
            }
            if (maxPrice !== undefined) {
                where.price.lte = maxPrice;
            }
        }

        // Count total items
        const total = await this.prisma.product.count({ where });

        // Get products
        const products = await this.prisma.product.findMany({
            where,
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            orderBy: { [sortBy]: sortOrder },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            data: products.map(transformProductImages),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async findFeatured(tenantId: string, limit = 4) {
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
                isFeatured: true,
            },
            include: {
                category: {
                    select: { id: true, name: true, slug: true },
                },
                images: {
                    where: { isPrimary: true },
                    take: 1,
                },
            },
            orderBy: { sortOrder: 'asc' },
            take: limit,
        });
        return products.map(transformProductImages);
    }

    async findBySlug(tenantId: string, slug: string) {
        // Use findFirst for tenant-scoped lookup (findUnique doesn't support composite conditions)
        const product = await this.prisma.product.findFirst({
            where: { tenantId, slug },
            include: {
                category: true,
                images: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return transformProductImages(product);
    }

    async findById(tenantId: string, id: string) {
        // Use findFirst to ensure product belongs to this tenant (prevents cross-tenant access)
        const product = await this.prisma.product.findFirst({
            where: { tenantId, id },
            include: {
                category: true,
                images: {
                    orderBy: { order: 'asc' },
                },
            },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return transformProductImages(product);
    }

    async create(tenantId: string, dto: CreateProductDto) {
        // Generate slug if not provided
        const slug = dto.slug || this.generateSlug(dto.name);

        // Extract imageUrls before creating product
        const { imageUrls, ...productData } = dto;

        const product = await this.prisma.product.create({
            data: {
                tenantId,
                ...productData,
                slug,
                price: dto.price,
                compareAtPrice: dto.compareAtPrice,
                costPrice: dto.costPrice,
            },
            include: {
                category: true,
                images: true,
            },
        });

        // Create ProductImage records if imageUrls provided
        if (imageUrls && imageUrls.length > 0) {
            await this.prisma.productImage.createMany({
                data: imageUrls.map((url, index) => ({
                    productId: product.id,
                    url,
                    isPrimary: index === 0,
                    order: index,
                })),
            });

            // Re-fetch to include images
            return this.findById(tenantId, product.id);
        }

        return product;
    }

    async update(tenantId: string, id: string, dto: UpdateProductDto) {
        // Check if product exists AND belongs to this tenant
        await this.findById(tenantId, id);

        // Extract imageUrls before updating product
        const { imageUrls, ...productData } = dto;

        await this.prisma.product.update({
            where: { id },
            data: {
                ...productData,
                price: dto.price,
                compareAtPrice: dto.compareAtPrice,
                costPrice: dto.costPrice,
            },
        });

        // Add new images if imageUrls provided
        if (imageUrls && imageUrls.length > 0) {
            // Get current max order
            const existingImages = await this.prisma.productImage.findMany({
                where: { productId: id },
                orderBy: { order: 'desc' },
                take: 1,
            });
            const maxOrder = existingImages.length > 0 ? existingImages[0].order : -1;
            const hasPrimary = await this.prisma.productImage.count({
                where: { productId: id, isPrimary: true },
            });

            await this.prisma.productImage.createMany({
                data: imageUrls.map((url, index) => ({
                    productId: id,
                    url,
                    isPrimary: hasPrimary === 0 && index === 0,
                    order: maxOrder + 1 + index,
                })),
            });
        }

        return this.findById(tenantId, id);
    }

    async delete(tenantId: string, id: string) {
        // Check if product exists AND belongs to this tenant
        await this.findById(tenantId, id);

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async getBrands(tenantId: string) {
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true, brand: { not: null } },
            select: { brand: true },
            distinct: ['brand'],
        });

        return products.map((p) => p.brand).filter(Boolean);
    }

    /**
     * Get related products based on:
     * 1. Same brand (different model) - Primary recommendations
     * 2. Similar price range (±25%) from other brands - Secondary
     */
    async getRelatedProducts(tenantId: string, productId: string, limit = 8) {
        // Get the current product (with tenant check)
        const product = await this.prisma.product.findFirst({
            where: { tenantId, id: productId },
            select: { id: true, brand: true, price: true, name: true },
        });

        if (!product) {
            return [];
        }

        const priceNum = Number(product.price);
        const minPrice = priceNum * 0.75;
        const maxPrice = priceNum * 1.25;

        // Get products from same brand (different model)
        const sameBrandProducts = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
                brand: product.brand,
                id: { not: productId },
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { sortOrder: 'asc' },
            take: Math.ceil(limit / 2),
        });

        // Get products from other brands in similar price range
        const otherBrandProducts = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
                brand: { not: product.brand },
                id: { not: productId },
                price: { gte: minPrice, lte: maxPrice },
            },
            include: {
                category: { select: { id: true, name: true, slug: true } },
                images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { sortOrder: 'asc' },
            take: limit - sameBrandProducts.length,
        });

        // Combine and transform
        const allProducts = [...sameBrandProducts, ...otherBrandProducts];
        return allProducts.slice(0, limit).map(transformProductImages);
    }

    private generateSlug(name: string): string {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
}

