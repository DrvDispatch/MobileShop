import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { transformProductImages } from '../../utils/image-url';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) { }

    async getMovements(tenantId: string, params: {
        page: number;
        limit: number;
        productId?: string;
        type?: string;
    }) {
        const { page, limit, productId, type } = params;
        const skip = (page - 1) * limit;

        // Get product IDs for this tenant to filter movements
        const tenantProducts = await this.prisma.product.findMany({
            where: { tenantId },
            select: { id: true },
        });
        const productIds = tenantProducts.map(p => p.id);

        const where: Record<string, unknown> = {
            productId: { in: productIds },
        };
        if (productId) where.productId = productId;
        if (type) where.type = type;

        const [movements, total] = await Promise.all([
            this.prisma.inventoryMovement.findMany({
                where,
                include: {
                    product: {
                        select: { id: true, name: true, sku: true, images: { take: 1 } },
                    },
                    user: {
                        select: { id: true, name: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.inventoryMovement.count({ where }),
        ]);

        return {
            data: movements,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }

    async getLowStockProducts(tenantId: string, threshold: number = 5) {
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
                stockQty: { lte: threshold },
            },
            select: {
                id: true,
                name: true,
                sku: true,
                stockQty: true,
                lowStockThreshold: true,
                images: { take: 1 },
            },
            orderBy: { stockQty: 'asc' },
        });
        return products.map(transformProductImages);
    }

    async getProductsWithStock(tenantId: string) {
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true },
            select: {
                id: true,
                name: true,
                sku: true,
                stockQty: true,
                lowStockThreshold: true,
                price: true,
                images: { take: 1 },
            },
            orderBy: { name: 'asc' },
        });
        return products.map(transformProductImages);
    }

    async adjustStock(
        tenantId: string,
        productId: string,
        quantity: number,
        type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT',
        reason?: string,
    ) {
        return this.prisma.$transaction(async (tx) => {
            // Verify product belongs to tenant
            const product = await tx.product.findFirst({
                where: { tenantId, id: productId },
            });

            if (!product) {
                throw new NotFoundException('Product not found');
            }

            const previousQty = product.stockQty;
            let newQty: number;
            let adjustedQuantity: number;

            switch (type) {
                case 'STOCK_IN':
                    adjustedQuantity = Math.abs(quantity);
                    newQty = previousQty + adjustedQuantity;
                    break;
                case 'STOCK_OUT':
                    adjustedQuantity = -Math.abs(quantity);
                    newQty = Math.max(0, previousQty - Math.abs(quantity));
                    break;
                case 'ADJUSTMENT':
                    newQty = quantity; // Direct set
                    adjustedQuantity = quantity - previousQty;
                    break;
                default:
                    throw new Error('Invalid adjustment type');
            }

            // Update product stock
            await tx.product.update({
                where: { id: productId },
                data: { stockQty: newQty },
            });

            // Create movement record
            const movement = await tx.inventoryMovement.create({
                data: {
                    productId,
                    type,
                    quantity: adjustedQuantity,
                    previousQty,
                    newQty,
                    reason,
                },
                include: {
                    product: {
                        select: { id: true, name: true, sku: true },
                    },
                },
            });

            return movement;
        });
    }

    async getProductHistory(tenantId: string, productId: string) {
        // Verify product belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: { tenantId, id: productId },
        });

        if (!product) {
            throw new NotFoundException('Product not found');
        }

        return this.prisma.inventoryMovement.findMany({
            where: { productId },
            include: {
                user: {
                    select: { id: true, name: true },
                },
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
    }

    async getSummary(tenantId: string) {
        const [totalProducts, lowStock, outOfStock, totalValue] = await Promise.all([
            this.prisma.product.count({ where: { tenantId, isActive: true } }),
            this.prisma.product.count({
                where: {
                    tenantId,
                    isActive: true,
                    stockQty: { gt: 0, lte: 5 },
                },
            }),
            this.prisma.product.count({
                where: {
                    tenantId,
                    isActive: true,
                    stockQty: 0,
                },
            }),
            this.prisma.product.aggregate({
                where: { tenantId, isActive: true },
                _sum: {
                    stockQty: true,
                },
            }),
        ]);

        // Calculate inventory value
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true },
            select: { stockQty: true, price: true },
        });

        const inventoryValue = products.reduce(
            (sum, p) => sum + p.stockQty * Number(p.price),
            0,
        );

        return {
            totalProducts,
            lowStock,
            outOfStock,
            totalUnits: totalValue._sum.stockQty || 0,
            inventoryValue,
        };
    }
}

