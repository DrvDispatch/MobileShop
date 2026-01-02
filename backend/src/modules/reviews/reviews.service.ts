import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface CreateReviewDto {
    productId: string;
    rating: number;
    title?: string;
    comment?: string;
    reviewerName: string;
    reviewerEmail: string;
    orderId?: string;
    userId?: string;
}

@Injectable()
export class ReviewsService {
    private readonly logger = new Logger(ReviewsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Create a new review (tenant-scoped via product)
     */
    async createReview(tenantId: string, dto: CreateReviewDto) {
        // Validate rating
        if (dto.rating < 1 || dto.rating > 5) {
            throw new BadRequestException('Rating must be between 1 and 5');
        }

        // Check if product exists AND belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: { id: dto.productId, tenantId },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        // Check if email already reviewed this product
        const existingReview = await this.prisma.productReview.findUnique({
            where: {
                productId_reviewerEmail: {
                    productId: dto.productId,
                    reviewerEmail: dto.reviewerEmail,
                },
            },
        });
        if (existingReview) {
            throw new BadRequestException('You have already reviewed this product');
        }

        // Verify purchase if orderId provided (tenant-scoped)
        let isVerified = false;
        if (dto.orderId) {
            const order = await this.prisma.order.findFirst({
                where: {
                    tenantId,
                    id: dto.orderId,
                    customerEmail: dto.reviewerEmail,
                    status: { in: ['DELIVERED', 'SHIPPED', 'PAID'] },
                    items: { some: { productId: dto.productId } },
                },
            });
            isVerified = !!order;
        }

        return this.prisma.productReview.create({
            data: {
                productId: dto.productId,
                userId: dto.userId,
                reviewerName: dto.reviewerName,
                reviewerEmail: dto.reviewerEmail,
                orderId: dto.orderId,
                isVerified,
                rating: dto.rating,
                title: dto.title,
                comment: dto.comment,
                isApproved: false, // Requires admin approval
            },
        });
    }

    /**
     * Get approved reviews for a product (tenant-scoped via product)
     */
    async getProductReviews(tenantId: string, productId: string) {
        // Verify product belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId },
        });
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        const reviews = await this.prisma.productReview.findMany({
            where: {
                productId,
                isApproved: true,
                isVisible: true,
            },
            orderBy: [
                { isVerified: 'desc' }, // Verified purchases first
                { createdAt: 'desc' },
            ],
        });

        const stats = await this.getProductReviewStats(tenantId, productId);

        return { reviews, stats };
    }

    /**
     * Get review statistics for a product
     */
    async getProductReviewStats(tenantId: string, productId: string) {
        // Verify product belongs to tenant
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId },
        });
        if (!product) {
            return { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        }

        const reviews = await this.prisma.productReview.findMany({
            where: { productId, isApproved: true, isVisible: true },
            select: { rating: true },
        });

        if (reviews.length === 0) {
            return { averageRating: 0, totalReviews: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        }

        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        let sum = 0;
        for (const review of reviews) {
            distribution[review.rating as 1 | 2 | 3 | 4 | 5]++;
            sum += review.rating;
        }

        return {
            averageRating: Math.round((sum / reviews.length) * 10) / 10,
            totalReviews: reviews.length,
            distribution,
        };
    }

    // ========== ADMIN METHODS ==========

    /**
     * Get all reviews for admin (scoped to tenant's products)
     */
    async getAllReviews(tenantId: string, options: {
        page?: number;
        limit?: number;
        status?: 'pending' | 'approved' | 'hidden' | 'all';
        productId?: string;
    }) {
        const { page = 1, limit = 20, status = 'all', productId } = options;
        const skip = (page - 1) * limit;

        // Get all product IDs for this tenant
        const tenantProducts = await this.prisma.product.findMany({
            where: { tenantId },
            select: { id: true },
        });
        const productIds = tenantProducts.map(p => p.id);

        const where: Record<string, unknown> = {
            productId: { in: productIds },
        };
        if (productId) where.productId = productId;
        if (status === 'pending') where.isApproved = false;
        else if (status === 'approved') where.isApproved = true;
        else if (status === 'hidden') where.isVisible = false;

        const [reviews, total] = await Promise.all([
            this.prisma.productReview.findMany({
                where,
                include: {
                    product: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.productReview.count({ where }),
        ]);

        return {
            data: reviews,
            meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
        };
    }

    /**
     * Approve or reject a review (tenant-scoped via product)
     */
    async moderateReview(tenantId: string, reviewId: string, action: 'approve' | 'reject' | 'hide', adminNotes?: string) {
        const review = await this.prisma.productReview.findUnique({
            where: { id: reviewId },
            include: { product: { select: { tenantId: true } } },
        });
        if (!review) throw new NotFoundException('Review not found');
        if (review.product.tenantId !== tenantId) throw new NotFoundException('Review not found');

        const updateData: Record<string, unknown> = { adminNotes };
        if (action === 'approve') {
            updateData.isApproved = true;
            updateData.isVisible = true;
        } else if (action === 'reject') {
            updateData.isApproved = false;
            updateData.isVisible = false;
        } else if (action === 'hide') {
            updateData.isVisible = false;
        }

        return this.prisma.productReview.update({
            where: { id: reviewId },
            data: updateData,
        });
    }

    /**
     * Delete a review (tenant-scoped via product)
     */
    async deleteReview(tenantId: string, reviewId: string) {
        const review = await this.prisma.productReview.findUnique({
            where: { id: reviewId },
            include: { product: { select: { tenantId: true } } },
        });
        if (!review) throw new NotFoundException('Review not found');
        if (review.product.tenantId !== tenantId) throw new NotFoundException('Review not found');

        return this.prisma.productReview.delete({ where: { id: reviewId } });
    }

    /**
     * Get pending review count (tenant-scoped)
     */
    async getPendingCount(tenantId: string): Promise<number> {
        // Get all product IDs for this tenant
        const tenantProducts = await this.prisma.product.findMany({
            where: { tenantId },
            select: { id: true },
        });
        const productIds = tenantProducts.map(p => p.id);

        return this.prisma.productReview.count({
            where: {
                productId: { in: productIds },
                isApproved: false,
                isVisible: true
            },
        });
    }
}
