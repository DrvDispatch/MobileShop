import { Controller, Get, Post, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('api/wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private wishlistService: WishlistService) { }

    @Get()
    async getWishlist(@Req() req: { user: { sub: string } }) {
        return this.wishlistService.getWishlist(req.user.sub);
    }

    @Get('count')
    async getWishlistCount(@Req() req: { user: { sub: string } }) {
        const count = await this.wishlistService.getWishlistCount(req.user.sub);
        return { count };
    }

    @Get('check/:productId')
    async isInWishlist(
        @Param('productId') productId: string,
        @Req() req: { user: { sub: string } },
    ) {
        const isInWishlist = await this.wishlistService.isInWishlist(req.user.sub, productId);
        return { isInWishlist };
    }

    @Post(':productId')
    async addToWishlist(
        @Param('productId') productId: string,
        @Req() req: { user: { sub: string } },
    ) {
        return this.wishlistService.addToWishlist(req.user.sub, productId);
    }

    @Delete(':productId')
    async removeFromWishlist(
        @Param('productId') productId: string,
        @Req() req: { user: { sub: string } },
    ) {
        return this.wishlistService.removeFromWishlist(req.user.sub, productId);
    }

    @Delete()
    async clearWishlist(@Req() req: { user: { sub: string } }) {
        return this.wishlistService.clearWishlist(req.user.sub);
    }
}
