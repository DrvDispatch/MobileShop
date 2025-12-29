import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateProductDto, UpdateProductDto, ProductQueryDto } from './dto';
import { Prisma } from '../../generated/prisma/client.js';
import { transformProductImages } from '../../utils/image-url';

@Injectable()
export class ProductsService {
    constructor(private readonly prisma: PrismaService) { }

    async findAll(query: ProductQueryDto) {
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

    async findFeatured(limit = 4) {
        const products = await this.prisma.product.findMany({
            where: {
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

    async findBySlug(slug: string) {
        const product = await this.prisma.product.findUnique({
            where: { slug },
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

    async findById(id: string) {
        const product = await this.prisma.product.findUnique({
            where: { id },
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

    async create(dto: CreateProductDto) {
        // Generate slug if not provided
        const slug = dto.slug || this.generateSlug(dto.name);

        // Extract imageUrls before creating product
        const { imageUrls, ...productData } = dto;

        const product = await this.prisma.product.create({
            data: {
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
            return this.findById(product.id);
        }

        return product;
    }

    async update(id: string, dto: UpdateProductDto) {
        // Check if product exists
        await this.findById(id);

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

        return this.findById(id);
    }

    async delete(id: string) {
        // Check if product exists
        await this.findById(id);

        return this.prisma.product.delete({
            where: { id },
        });
    }

    async getBrands() {
        const products = await this.prisma.product.findMany({
            where: { isActive: true, brand: { not: null } },
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
    async getRelatedProducts(productId: string, limit = 8) {
        // Get the current product
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
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

    /**
     * Export all products to CSV format
     */
    async exportToCsv(): Promise<string> {
        const products = await this.prisma.product.findMany({
            include: {
                category: { select: { name: true, slug: true } },
                images: { where: { isPrimary: true }, take: 1 },
            },
            orderBy: { name: 'asc' },
        });

        const headers = [
            'id', 'name', 'slug', 'sku', 'brand', 'price', 'compareAtPrice', 'costPrice',
            'stockQty', 'condition', 'productType', 'storage', 'color', 'batteryHealth',
            'deviceGrade', 'category', 'isActive', 'isFeatured', 'sortOrder', 'description',
            'imageUrl'
        ];

        const rows = products.map(p => [
            p.id,
            this.escapeCsv(p.name),
            p.slug,
            p.sku || '',
            p.brand || '',
            p.price.toString(),
            p.compareAtPrice?.toString() || '',
            p.costPrice?.toString() || '',
            p.stockQty.toString(),
            p.condition,
            p.productType,
            p.storage || '',
            p.color || '',
            p.batteryHealth?.toString() || '',
            p.deviceGrade || '',
            p.category?.slug || '',
            p.isActive ? 'true' : 'false',
            p.isFeatured ? 'true' : 'false',
            p.sortOrder.toString(),
            this.escapeCsv(p.description || ''),
            p.images[0]?.url || '',
        ]);

        const csvLines = [
            headers.join(','),
            ...rows.map(row => row.join(',')),
        ];

        return csvLines.join('\n');
    }

    /**
     * Import products from CSV data
     */
    async importFromCsv(csvData: string): Promise<{ created: number; updated: number; errors: string[] }> {
        const lines = csvData.trim().split('\n');
        if (lines.length < 2) {
            throw new Error('CSV must have headers and at least one row');
        }

        const headers = lines[0].split(',').map(h => h.trim());
        const results = { created: 0, updated: 0, errors: [] as string[] };

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCsvLine(lines[i]);
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

            try {
                const productData = {
                    name: row.name,
                    slug: row.slug || this.generateSlug(row.name),
                    sku: row.sku || null,
                    brand: row.brand || null,
                    price: parseFloat(row.price) || 0,
                    compareAtPrice: row.compareAtPrice ? parseFloat(row.compareAtPrice) : null,
                    costPrice: row.costPrice ? parseFloat(row.costPrice) : null,
                    stockQty: parseInt(row.stockQty) || 0,
                    condition: (row.condition as 'NEW' | 'USED' | 'REFURBISHED') || 'REFURBISHED',
                    productType: (row.productType as 'PHONE' | 'PART' | 'ACCESSORY') || 'PHONE',
                    storage: row.storage || null,
                    color: row.color || null,
                    batteryHealth: row.batteryHealth ? parseInt(row.batteryHealth) : null,
                    deviceGrade: row.deviceGrade as 'A_PLUS' | 'A' | 'B' | 'C' | null || null,
                    isActive: row.isActive === 'true',
                    isFeatured: row.isFeatured === 'true',
                    sortOrder: parseInt(row.sortOrder) || 0,
                    description: row.description || null,
                };

                // Check if product exists by ID or slug
                const existingById = row.id ? await this.prisma.product.findUnique({ where: { id: row.id } }) : null;
                const existingBySlug = !existingById && productData.slug ?
                    await this.prisma.product.findUnique({ where: { slug: productData.slug } }) : null;

                if (existingById) {
                    await this.prisma.product.update({
                        where: { id: row.id },
                        data: productData,
                    });
                    results.updated++;
                } else if (existingBySlug) {
                    await this.prisma.product.update({
                        where: { slug: productData.slug },
                        data: productData,
                    });
                    results.updated++;
                } else {
                    await this.prisma.product.create({ data: productData });
                    results.created++;
                }
            } catch (error) {
                results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }

        return results;
    }

    private escapeCsv(value: string): string {
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
    }

    private parseCsvLine(line: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current);
        return result;
    }
}
