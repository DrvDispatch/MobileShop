import { Controller, Post, Body, Get, Query, Param, Req, Headers, Patch, Res } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { OrdersService } from './orders.service';
import { CreateCheckoutDto, CheckoutResponseDto, OrderResponseDto, UpdateOrderDto } from './dto';
import { TenantId } from '../tenant/tenant.decorator';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post('checkout')
    @ApiOperation({ summary: 'Create Stripe checkout session' })
    @ApiResponse({ status: 201, description: 'Checkout session created', type: CheckoutResponseDto })
    @ApiResponse({ status: 400, description: 'Invalid cart or products unavailable' })
    async createCheckout(@TenantId() tenantId: string, @Body() dto: CreateCheckoutDto): Promise<CheckoutResponseDto> {
        return this.ordersService.createCheckoutSession(tenantId, dto);
    }

    // NOTE: Webhook handler does NOT use @TenantId() - it's excluded from tenant middleware.
    // Tenant context is derived from the order which was created with tenantId during checkout.
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
    async getOrderBySession(@TenantId() tenantId: string, @Query('sessionId') sessionId: string) {
        return this.ordersService.getOrderBySessionId(tenantId, sessionId);
    }

    /**
     * CHECKOUT SUCCESS REDIRECT (Platform-level)
     * 
     * This is the endpoint Stripe redirects to after successful payment.
     * It resolves the tenant from the Stripe session and issues a 302 redirect
     * to the tenant's actual success page.
     * 
     * Flow: 
     *   1. Stripe payment completes
     *   2. Stripe redirects to: api.servicespulse.com/api/orders/checkout-success?session_id=...
     *   3. This endpoint resolves tenant domain from session
     *   4. 302 redirect to: https://smartphoneservice.be/checkout/success?orderId=...
     *   5. User sees confirmation on their actual shop
     */
    @Get('checkout-success')
    @ApiOperation({ summary: 'Stripe checkout success redirect handler' })
    @ApiQuery({ name: 'session_id', required: true })
    @ApiResponse({ status: 302, description: 'Redirects to tenant success page' })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async handleCheckoutSuccessRedirect(
        @Query('session_id') sessionId: string,
        @Res() res: Response,
    ) {
        try {
            const resolved = await this.ordersService.resolveOrderFromStripeSession(sessionId);

            // Determine redirect URL
            let redirectUrl: string;
            if (resolved.tenantDomain) {
                // Redirect to tenant's success page
                redirectUrl = `https://${resolved.tenantDomain}/checkout/success?orderId=${resolved.orderId}`;
            } else {
                // Fallback: no tenant domain configured, use order ID in current domain
                redirectUrl = `/checkout/success?orderId=${resolved.orderId}`;
            }

            return res.redirect(302, redirectUrl);
        } catch {
            // If order not found, redirect to generic error
            return res.redirect(302, '/checkout/error?reason=order_not_found');
        }
    }

    /**
     * CHECKOUT CANCEL REDIRECT (Platform-level)
     * 
     * Stripe redirects here when user cancels payment.
     * For now, just redirect to the referrer or a generic cart page.
     * In a multi-tenant setup, we could derive tenant from the session if available.
     */
    @Get('checkout-cancel')
    @ApiOperation({ summary: 'Stripe checkout cancel redirect handler' })
    @ApiResponse({ status: 302, description: 'Redirects back to cart' })
    handleCheckoutCancelRedirect(
        @Req() req: Request,
        @Res() res: Response,
    ) {
        // Try to get referer to redirect back to the tenant's cart
        const referer = req.headers.referer || req.headers.origin;
        if (referer) {
            return res.redirect(302, `${referer}/cart?cancelled=true`);
        }
        // Fallback - just show a message
        return res.redirect(302, '/cart?cancelled=true');
    }

    /**
     * Platform-level endpoint: Resolve order from Stripe session for checkout success
     * 
     * Returns minimal order info + tenant domain for the success page to redirect
     * This endpoint is NOT tenant-scoped - it's used by the platform success resolver
     * to route the user back to their tenant's success page
     * 
     * Flow: Stripe → Platform /checkout/success → resolves tenant → redirects to tenant domain
     */
    @Get('resolve-session/:sessionId')
    @ApiOperation({ summary: 'Resolve order from Stripe session for checkout redirect' })
    @ApiResponse({ status: 200, description: 'Order resolved with tenant info' })
    @ApiResponse({ status: 404, description: 'Order not found for session' })
    async resolveOrderFromSession(@Param('sessionId') sessionId: string) {
        return this.ordersService.resolveOrderFromStripeSession(sessionId);
    }

    @Get('admin/all')
    @ApiOperation({ summary: 'Get all orders (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Orders list', type: [OrderResponseDto] })
    async getAdminOrders(@TenantId() tenantId: string) {
        return this.ordersService.getAllOrders(tenantId);
    }

    @Get('my-orders')
    @ApiOperation({ summary: 'Get orders by customer email' })
    @ApiQuery({ name: 'email', required: true })
    @ApiResponse({ status: 200, description: 'Orders list', type: [OrderResponseDto] })
    async getMyOrders(@TenantId() tenantId: string, @Query('email') email: string) {
        return this.ordersService.getOrdersByEmail(tenantId, email);
    }

    @Get('track/:orderNumber')
    @ApiOperation({ summary: 'Track order by order number (public)' })
    @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async trackOrder(@TenantId() tenantId: string, @Param('orderNumber') orderNumber: string) {
        return this.ordersService.getOrderByNumber(tenantId, orderNumber);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get order by ID' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Order found', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async getOrder(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.ordersService.getOrderById(tenantId, id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update order (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Order updated', type: OrderResponseDto })
    @ApiResponse({ status: 404, description: 'Order not found' })
    async updateOrder(@TenantId() tenantId: string, @Param('id') id: string, @Body() dto: UpdateOrderDto) {
        return this.ordersService.updateOrder(tenantId, id, dto);
    }

    @Get(':id/history')
    @ApiOperation({ summary: 'Get order status history' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Order status history' })
    async getOrderHistory(@TenantId() tenantId: string, @Param('id') id: string) {
        return this.ordersService.getOrderStatusHistory(tenantId, id);
    }

    @Patch('bulk/status')
    @ApiOperation({ summary: 'Bulk update order status (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Bulk update results' })
    async bulkUpdateStatus(@TenantId() tenantId: string, @Body() body: { orderIds: string[]; status: string }) {
        return this.ordersService.bulkUpdateStatus(tenantId, body.orderIds, body.status);
    }

    @Post('bulk/labels')
    @ApiOperation({ summary: 'Generate shipping labels for multiple orders (admin only)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 200, description: 'Label data for selected orders' })
    async generateBulkLabels(@TenantId() tenantId: string, @Body() body: { orderIds: string[] }) {
        return this.ordersService.generateBulkLabels(tenantId, body.orderIds);
    }
}

