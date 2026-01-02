import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TenantId } from '../tenant/tenant.decorator';

@Controller('api/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private wishlistService: WishlistService) { }

    @Get()
    async getWishlist(@TenantId() tenantId: string, @Req() req: { user: { sub: string } }) {
        return this.wishlistService.getWishlist(tenantId, req.user.sub);
    }

    @Get('count')
    async getWishlistCount(@TenantId() tenantId: string, @Req() req: { user: { sub: string } }) {
        const count = await this.wishlistService.getWishlistCount(tenantId, req.user.sub);
        return { count };
    }

    @Get('check/:productId')
    async isInWishlist(
        @TenantId() tenantId: string,
        @Param('productId') productId: string,
        @Req() req: { user: { sub: string } },
    ) {
        const isInWishlist = await this.wishlistService.isInWishlist(tenantId, req.user.sub, productId);
        return { isInWishlist };
    }

    @Post(':productId')
    async addToWishlist(
        @TenantId() tenantId: string,
        @Param('productId') productId: string,
        @Req() req: { user: { sub: string } },
    ) {
        return this.wishlistService.addToWishlist(tenantId, req.user.sub, productId);
    }

    @Delete(':productId')
    async removeFromWishlist(
        @TenantId() tenantId: string,
        @Param('productId') productId: string,
        @Req() req: { user: { sub: string } },
    ) {
        return this.wishlistService.removeFromWishlist(tenantId, req.user.sub, productId);
    }

    @Delete()
    async clearWishlist(@TenantId() tenantId: string, @Req() req: { user: { sub: string } }) {
        return this.wishlistService.clearWishlist(tenantId, req.user.sub);
    }
}
