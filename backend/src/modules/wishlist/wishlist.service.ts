import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class WishlistService {
    private readonly logger = new Logger(WishlistService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Get or create wishlist for a user
     */
    private async getOrCreateWishlist(userId: string) {
        let wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
        });

        if (!wishlist) {
            wishlist = await this.prisma.wishlist.create({
                data: { userId },
            });
        }

        return wishlist;
    }

    /**
     * Get user's wishlist with product details
     * Products are implicitly tenant-scoped via user's tenantId
     */
    async getWishlist(tenantId: string, userId: string) {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                images: { where: { isPrimary: true }, take: 1 },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!wishlist) {
            return { items: [], totalItems: 0 };
        }

        // Filter items to only include products from the current tenant
        const tenantItems = wishlist.items.filter(item =>
            item.product.tenantId === tenantId
        );

        // Calculate price drops
        const itemsWithPriceInfo = tenantItems.map(item => ({
            id: item.id,
            productId: item.productId,
            addedAt: item.createdAt,
            priceWhenAdded: Number(item.priceWhenAdded),
            currentPrice: Number(item.product.price),
            priceDrop: Number(item.priceWhenAdded) - Number(item.product.price),
            hasPriceDrop: Number(item.product.price) < Number(item.priceWhenAdded),
            product: {
                id: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                price: Number(item.product.price),
                stockQty: item.product.stockQty,
                isActive: item.product.isActive,
                condition: item.product.condition,
                image: item.product.images[0]?.url || null,
            },
        }));

        return {
            items: itemsWithPriceInfo,
            totalItems: itemsWithPriceInfo.length,
        };
    }

    /**
     * Add product to wishlist
     * Product must belong to the same tenant
     */
    async addToWishlist(tenantId: string, userId: string, productId: string) {
        // Check product exists AND belongs to the tenant
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const wishlist = await this.getOrCreateWishlist(userId);

        // Check if already in wishlist
        const existing = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId,
                },
            },
        });

        if (existing) {
            throw new BadRequestException('Product already in wishlist');
        }

        await this.prisma.wishlistItem.create({
            data: {
                wishlistId: wishlist.id,
                productId,
                priceWhenAdded: product.price,
            },
        });

        return { success: true, message: 'Product added to wishlist' };
    }

    /**
     * Remove product from wishlist
     */
    async removeFromWishlist(tenantId: string, userId: string, productId: string) {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
        });

        if (!wishlist) {
            throw new NotFoundException('Wishlist not found');
        }

        const item = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId,
                },
            },
            include: {
                product: { select: { tenantId: true } },
            },
        });

        if (!item) {
            throw new NotFoundException('Product not in wishlist');
        }

        // Verify product belongs to tenant
        if (item.product.tenantId !== tenantId) {
            throw new NotFoundException('Product not in wishlist');
        }

        await this.prisma.wishlistItem.delete({
            where: { id: item.id },
        });

        return { success: true, message: 'Product removed from wishlist' };
    }

    /**
     * Check if product is in wishlist
     */
    async isInWishlist(tenantId: string, userId: string, productId: string): Promise<boolean> {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
        });

        if (!wishlist) return false;

        const item = await this.prisma.wishlistItem.findUnique({
            where: {
                wishlistId_productId: {
                    wishlistId: wishlist.id,
                    productId,
                },
            },
            include: {
                product: { select: { tenantId: true } },
            },
        });

        // Only return true if product belongs to the tenant
        return !!item && item.product.tenantId === tenantId;
    }

    /**
     * Get wishlist count (for current tenant's products only)
     */
    async getWishlistCount(tenantId: string, userId: string): Promise<number> {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: { select: { tenantId: true } },
                    },
                },
            },
        });

        if (!wishlist) return 0;

        // Count only items for products belonging to this tenant
        return wishlist.items.filter(item => item.product.tenantId === tenantId).length;
    }

    /**
     * Clear entire wishlist (only for current tenant's products)
     */
    async clearWishlist(tenantId: string, userId: string) {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, tenantId: true } },
                    },
                },
            },
        });

        if (!wishlist) {
            return { success: true, message: 'Wishlist already empty' };
        }

        // Only delete items for products belonging to this tenant
        const tenantItemIds = wishlist.items
            .filter(item => item.product.tenantId === tenantId)
            .map(item => item.id);

        if (tenantItemIds.length > 0) {
            await this.prisma.wishlistItem.deleteMany({
                where: { id: { in: tenantItemIds } },
            });
        }

        return { success: true, message: 'Wishlist cleared' };
    }
}
