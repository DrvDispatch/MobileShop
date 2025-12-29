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
     */
    async getWishlist(userId: string) {
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

        // Calculate price drops
        const itemsWithPriceInfo = wishlist.items.map(item => ({
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
     */
    async addToWishlist(userId: string, productId: string) {
        // Check product exists
        const product = await this.prisma.product.findUnique({
            where: { id: productId },
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
    async removeFromWishlist(userId: string, productId: string) {
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
        });

        if (!item) {
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
    async isInWishlist(userId: string, productId: string): Promise<boolean> {
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
        });

        return !!item;
    }

    /**
     * Get wishlist count
     */
    async getWishlistCount(userId: string): Promise<number> {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
            include: { _count: { select: { items: true } } },
        });

        return wishlist?._count.items || 0;
    }

    /**
     * Clear entire wishlist
     */
    async clearWishlist(userId: string) {
        const wishlist = await this.prisma.wishlist.findUnique({
            where: { userId },
        });

        if (!wishlist) {
            return { success: true, message: 'Wishlist already empty' };
        }

        await this.prisma.wishlistItem.deleteMany({
            where: { wishlistId: wishlist.id },
        });

        return { success: true, message: 'Wishlist cleared' };
    }
}
