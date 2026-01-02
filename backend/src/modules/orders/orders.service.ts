/**
 * Orders Service (Facade)
 * 
 * Provides unified interface for order operations.
 * Delegates to specialized services for actual implementation.
 */

import { Injectable } from '@nestjs/common';
import { OrderCheckoutService } from './order-checkout.service';
import { OrderWebhookService } from './order-webhook.service';
import { OrderFulfillmentService } from './order-fulfillment.service';
import { CreateCheckoutDto } from './dto';

@Injectable()
export class OrdersService {
    constructor(
        private readonly checkoutService: OrderCheckoutService,
        private readonly webhookService: OrderWebhookService,
        private readonly fulfillmentService: OrderFulfillmentService,
    ) { }

    // ============================================
    // CHECKOUT - Delegates to OrderCheckoutService
    // ============================================

    generateOrderNumber(): string {
        return this.checkoutService.generateOrderNumber();
    }

    createCheckoutSession(tenantId: string, dto: CreateCheckoutDto) {
        return this.checkoutService.createCheckoutSession(tenantId, dto);
    }

    // ============================================
    // WEBHOOKS - Delegates to OrderWebhookService
    // ============================================

    handleStripeWebhook(payload: Buffer, signature: string) {
        return this.webhookService.handleStripeWebhook(payload, signature);
    }

    // ============================================
    // QUERIES - Delegates to OrderFulfillmentService
    // ============================================

    getOrderBySessionId(tenantId: string, sessionId: string) {
        return this.fulfillmentService.getOrderBySessionId(tenantId, sessionId);
    }

    /**
     * Platform-level: Resolve order from Stripe session for checkout success
     * Used by success page resolver to redirect user to correct tenant domain
     */
    resolveOrderFromStripeSession(sessionId: string) {
        return this.fulfillmentService.resolveOrderFromStripeSession(sessionId);
    }

    getOrdersByEmail(tenantId: string, email: string) {
        return this.fulfillmentService.getOrdersByEmail(tenantId, email);
    }

    getOrderById(tenantId: string, id: string) {
        return this.fulfillmentService.getOrderById(tenantId, id);
    }

    getOrderByNumber(tenantId: string, orderNumber: string) {
        return this.fulfillmentService.getOrderByNumber(tenantId, orderNumber);
    }

    getAllOrders(tenantId: string) {
        return this.fulfillmentService.getAllOrders(tenantId);
    }

    // ============================================
    // UPDATES - Delegates to OrderFulfillmentService
    // ============================================

    updateOrder(
        tenantId: string,
        id: string,
        data: { status?: string; adminNotes?: string; trackingNumber?: string; cancellationReason?: string },
        adminUser?: { id: string; name: string }
    ) {
        return this.fulfillmentService.updateOrder(tenantId, id, data, adminUser);
    }

    getOrderStatusHistory(tenantId: string, orderId: string) {
        return this.fulfillmentService.getOrderStatusHistory(tenantId, orderId);
    }

    // ============================================
    // BULK OPERATIONS - Delegates to OrderFulfillmentService
    // ============================================

    bulkUpdateStatus(tenantId: string, orderIds: string[], status: string, adminUser?: { id: string; name: string }) {
        return this.fulfillmentService.bulkUpdateStatus(tenantId, orderIds, status, adminUser);
    }

    generateBulkLabels(tenantId: string, orderIds: string[]) {
        return this.fulfillmentService.generateBulkLabels(tenantId, orderIds);
    }
}
