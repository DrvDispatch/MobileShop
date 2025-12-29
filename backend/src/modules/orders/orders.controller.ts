import { Controller, Post, Body, Get, Query, Param, Req, Headers, Patch } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request } from 'express';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto, CheckoutResponseDto, OrderResponseDto, UpdateOrderDto } from './dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post('checkout')
    @ApiOperation({ summary: 'Create Stripe checkout session' })
    @ApiResponse({ status: 201, description: 'Checkout session created', type: CheckoutResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid cart or products unavailable' })
    async createCheckout(@Body() dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
        return this.ordersService.createCheckoutSession(dto);
    }

    @Post('webhook')
    @ApiOperation({ summary: 'Stripe webhook handler' })
    @ApiResponse({ status: 200, description: 'Webhook processed' })
    async handleWebhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('stripe-signature') signature: string,
    ) {
        const payload = req.rawBody;
        if (!payload) {
            return { received: false, error: 'No raw body' };
        }
        return this.ordersService.handleStripeWebhook(payload, signature);
    }

    @Get('by-session')
    @ApiOperation({ summary: 'Get order by Stripe session ID' })
    @ApiQuery({ name: 'sessionId', required: true })
    @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async getOrderBySession(@Query('sessionId') sessionId: string) {
        return this.ordersService.getOrderBySessionId(sessionId);
    }

    @Get('admin/all')
    @ApiOperation({ summary: 'Get all orders (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Orders list', type: [OrderResponseDto] })
    async getAdminOrders() {
        return this.ordersService.getAllOrders();
    }

    @Get('my-orders')
    @ApiOperation({ summary: 'Get orders by customer email' })
    @ApiQuery({ name: 'email', required: true })
    @ApiResponse({ status: 200, description: 'Orders list', type: [OrderResponseDto] })
    async getMyOrders(@Query('email') email: string) {
        return this.ordersService.getOrdersByEmail(email);
    }

    @Get('track/:orderNumber')
    @ApiOperation({ summary: 'Track order by order number (public)' })
    @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async trackOrder(@Param('orderNumber') orderNumber: string) {
        return this.ordersService.getOrderByNumber(orderNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async getOrder(@Param('id') id: string) {
        return this.ordersService.getOrderById(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update order (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Order updated', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
        return this.ordersService.updateOrder(id, dto);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Get order status history' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Order status history' })
    async getOrderHistory(@Param('id') id: string) {
        return this.ordersService.getOrderStatusHistory(id);
    }

    @Patch('bulk/status')
    @ApiOperation({ summary: 'Bulk update order status (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Bulk update results' })
    async bulkUpdateStatus(@Body() body: { orderIds: string[]; status: string }) {
        return this.ordersService.bulkUpdateStatus(body.orderIds, body.status);
    }

    @Post('bulk/labels')
    @ApiOperation({ summary: 'Generate shipping labels for multiple orders (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Label data for selected orders' })
    async generateBulkLabels(@Body() body: { orderIds: string[] }) {
        return this.ordersService.generateBulkLabels(body.orderIds);
    }
}

