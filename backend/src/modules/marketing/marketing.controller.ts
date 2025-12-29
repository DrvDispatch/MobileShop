import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { MarketingService } from './marketing.service';
import { SendMarketingEmailDto, UserSegment, SegmentInfoDto, MarketingUserDto } from './dto';

@ApiTags('marketing')
@Controller('marketing')
export class MarketingController {
    constructor(private readonly marketingService: MarketingService) { }

    /**
     * Get all available segments with user counts
     */
    @Get('segments')
    @ApiOperation({ summary: 'Get available user segments with counts' })
    @ApiResponse({ status: 200, type: [SegmentInfoDto] })
    async getSegments(): Promise<SegmentInfoDto[]> {
        return this.marketingService.getSegments();
    }

    /**
     * Get users in a specific segment
     */
    @Get('users')
    @ApiOperation({ summary: 'Get users in a segment (preview)' })
    @ApiQuery({ name: 'segment', enum: UserSegment })
    @ApiQuery({ name: 'limit', required: false })
    @ApiResponse({ status: 200, type: [MarketingUserDto] })
    async getUsersBySegment(
        @Query('segment') segment: UserSegment,
        @Query('limit') limit?: string,
    ): Promise<MarketingUserDto[]> {
        return this.marketingService.getUsersBySegment(
            segment,
            limit ? parseInt(limit) : 50,
        );
    }

    /**
     * Send marketing email to segment
     */
    @Post('send')
    @ApiOperation({ summary: 'Send marketing email to users in segment' })
    async sendMarketingEmail(@Body() dto: SendMarketingEmailDto) {
        return this.marketingService.sendMarketingEmail(dto);
    }

    /**
     * Unsubscribe email (public endpoint)
     */
    @Post('unsubscribe')
    @ApiOperation({ summary: 'Unsubscribe email from marketing' })
    async unsubscribe(
        @Body() body: { email: string; reason?: string },
    ) {
        return this.marketingService.unsubscribe(body.email, body.reason);
    }

    /**
     * Check if email is unsubscribed
     */
    @Get('unsubscribe/check')
    @ApiOperation({ summary: 'Check if email is unsubscribed' })
    async checkUnsubscribe(@Query('email') email: string) {
        const isUnsubscribed = await this.marketingService.isUnsubscribed(email);
        return { email, isUnsubscribed };
    }

    /**
     * Subscribe email to newsletter (public endpoint)
     */
    @Post('subscribe')
    @ApiOperation({ summary: 'Subscribe email to newsletter' })
    async subscribe(@Body() body: { email: string; name?: string }) {
        return this.marketingService.subscribe(body.email, body.name);
    }
}
