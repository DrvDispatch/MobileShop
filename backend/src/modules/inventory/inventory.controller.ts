import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantId } from '../tenant/tenant.decorator';

@ApiTags('inventory')
@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Get('movements')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get inventory movements with pagination' })
    async getMovements(
        @TenantId() tenantId: string,
        @Query('page') page = '1',
        @Query('limit') limit = '20',
        @Query('productId') productId?: string,
        @Query('type') type?: string,
    ) {
        return this.inventoryService.getMovements(tenantId, {
            page: parseInt(page),
            limit: parseInt(limit),
            productId,
            type,
        });
    }

    @Get('low-stock')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get products with low stock' })
    async getLowStockProducts(
        @TenantId() tenantId: string,
        @Query('threshold') threshold = '5',
    ) {
        return this.inventoryService.getLowStockProducts(tenantId, parseInt(threshold));
    }

    @Get('products')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get all products with stock info' })
    async getProductsWithStock(@TenantId() tenantId: string) {
        return this.inventoryService.getProductsWithStock(tenantId);
    }

    @Post('adjust')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Adjust stock for a product' })
    async adjustStock(
        @TenantId() tenantId: string,
        @Body() body: {
            productId: string;
            quantity: number;
            type: 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
            reason?: string;
        },
    ) {
        return this.inventoryService.adjustStock(
            tenantId,
            body.productId,
            body.quantity,
            body.type,
            body.reason,
        );
    }

    @Get('product/:id/history')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get inventory history for a product' })
    async getProductHistory(
        @TenantId() tenantId: string,
        @Param('id') productId: string,
    ) {
        return this.inventoryService.getProductHistory(tenantId, productId);
    }

    @Get('summary')
    @Roles('ADMIN', 'STAFF')
    @ApiOperation({ summary: 'Get inventory summary stats' })
    async getSummary(@TenantId() tenantId: string) {
        return this.inventoryService.getSummary(tenantId);
    }
}

