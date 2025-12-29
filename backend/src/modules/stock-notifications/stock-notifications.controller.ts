import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { StockNotificationsService } from './stock-notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('api/stock-notifications')
export class StockNotificationsController {
    constructor(private stockNotificationsService: StockNotificationsService) { }

    // ========== PUBLIC ENDPOINTS ==========

    @Post('subscribe')
    async subscribe(
        @Body() body: { email: string; productId: string },
        @Req() req?: { user?: { sub: string } },
    ) {
        return this.stockNotificationsService.subscribe(
            body.email,
            body.productId,
            req?.user?.sub,
        );
    }

    @Post('unsubscribe')
    async unsubscribe(@Body() body: { email: string; productId: string }) {
        return this.stockNotificationsService.unsubscribe(body.email, body.productId);
    }

    @Get('check/:productId')
    async isSubscribed(
        @Param('productId') productId: string,
        @Query('email') email: string,
    ) {
        const isSubscribed = await this.stockNotificationsService.isSubscribed(email, productId);
        return { isSubscribed };
    }

    // ========== ADMIN ENDPOINTS ==========

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async getAllSubscriptions(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('productId') productId?: string,
        @Query('notified') notified?: string,
    ) {
        return this.stockNotificationsService.getAllSubscriptions({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
            productId,
            notified: notified !== undefined ? notified === 'true' : undefined,
        });
    }

    @Get('admin/waiting-counts')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('ADMIN', 'STAFF')
    async getWaitingCounts() {
        return this.stockNotificationsService.getWaitingCounts();
    }
}
