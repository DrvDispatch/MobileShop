import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { GoogleReviewsService } from './google-reviews.service';
import type { CreateReviewDto } from './reviews.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { TenantId } from '../tenant/tenant.decorator';

@Controller('api/reviews')
export class ReviewsController {
    constructor(
        private reviewsService: ReviewsService,
        private googleReviewsService: GoogleReviewsService,
    ) { }

    // ========== PUBLIC ENDPOINTS ==========

    /**
     * Get reviews for a product (public, only approved)
     */
    @Get('product/:productId')
    async getProductReviews(@TenantId() tenantId: string, @Param('productId') productId: string) {
        return this.reviewsService.getProductReviews(tenantId, productId);
    }

    /**
     * Submit a review (authenticated users get linked)
     */
    @Post()
    async createReview(
        @TenantId() tenantId: string,
        @Body() dto: CreateReviewDto,
        @Req() req?: { user?: { sub: string } },
    ) {
        // If user is authenticated, link the review
        const userId = req?.user?.sub;
        return this.reviewsService.createReview(tenantId, { ...dto, userId });
    }

    // ========== ADMIN ENDPOINTS ==========

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async getAllReviews(
        @TenantId() tenantId: string,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('status') status?: 'pending' | 'approved' | 'hidden' | 'all',
        @Query('productId') productId?: string,
    ) {
        return this.reviewsService.getAllReviews(tenantId, {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
            productId,
        });
    }

    @Get('admin/pending-count')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async getPendingCount(@TenantId() tenantId: string) {
        const count = await this.reviewsService.getPendingCount(tenantId);
        return { count };
    }

    @Patch('admin/:id/moderate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async moderateReview(
        @TenantId() tenantId: string,
        @Param('id') id: string,
        @Body() body: { action: 'approve' | 'reject' | 'hide'; adminNotes?: string },
    ) {
        return this.reviewsService.moderateReview(tenantId, id, body.action, body.adminNotes);
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async deleteReview(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.reviewsService.deleteReview(tenantId, id);
    }

    // ========== GOOGLE REVIEWS ENDPOINTS ==========
    // Note: Google Reviews are global (not tenant-scoped) - they're synced from external source

    /**
     * Get Google Reviews sync status
     */
    @Get('google/status')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async getGoogleSyncStatus() {
        return this.googleReviewsService.getSyncStatus();
    }

    /**
     * Get all synced Google reviews
     */
    @Get('google')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async getGoogleReviews(@Query('visibleOnly') visibleOnly?: string) {
        return this.googleReviewsService.getGoogleReviews({
            visibleOnly: visibleOnly === 'true',
        });
    }

    /**
     * Sync reviews from Google Places
     */
    @Post('google/sync')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN')
    async syncGoogleReviews(@Body() body: { placeId: string }) {
        return this.googleReviewsService.syncGoogleReviews(body.placeId);
    }

    /**
     * Toggle Google review visibility
     */
    @Patch('google/:id/visibility')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async toggleGoogleReviewVisibility(@Param('id') id: string) {
        return this.googleReviewsService.toggleVisibility(id);
    }
}
