import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { FeedbackService } from './feedback.service';
import { SubmitRatingDto, FeedbackResponseDto } from './dto';
import { TenantId } from '../tenant/tenant.decorator';

@ApiTags('feedback')
@Controller('feedback')
export class FeedbackController {
    constructor(private readonly feedbackService: FeedbackService) { }

    /**
     * Get feedback details by token (public - for rating page)
     * Token is proof of authority, no tenant context needed
     */
    @Get(':token')
    @ApiOperation({ summary: 'Get feedback details by token' })
    @ApiResponse({ status: 200, description: 'Feedback details' })
    async getFeedback(@Param('token') token: string) {
        return this.feedbackService.getFeedbackByToken(token);
    }

    /**
     * Submit a rating (public - for rating page)
     * Token is proof of authority, no tenant context needed
     */
    @Post(':token/rate')
    @ApiOperation({ summary: 'Submit a rating' })
    @ApiResponse({ status: 200, description: 'Rating submitted successfully' })
    async submitRating(
        @Param('token') token: string,
        @Body() dto: SubmitRatingDto,
    ) {
        return this.feedbackService.submitRating(token, dto);
    }

    /**
     * Get all ratings (admin only - tenant scoped)
     */
    @Get()
    @ApiOperation({ summary: 'Get all ratings (admin)' })
    async getAllRatings(
        @TenantId() tenantId: string,
        @Query('sourceType') sourceType?: string,
        @Query('limit') limit?: string,
    ) {
        return this.feedbackService.getAllRatings(tenantId, {
            sourceType,
            limit: limit ? parseInt(limit) : undefined,
        });
    }

    /**
     * Get average rating stats (admin - tenant scoped)
     */
    @Get('stats/average')
    @ApiOperation({ summary: 'Get average rating statistics' })
    async getAverageRating(
        @TenantId() tenantId: string,
        @Query('sourceType') sourceType?: string,
    ) {
        return this.feedbackService.getAverageRating(tenantId, sourceType);
    }
}

