/**
 * Order Types
 * 
 * Type definitions for orders module.
 * Aligned with Prisma schema: Order, OrderItem, OrderStatus, RefundStatus, RefundReason
 */

import type React from 'react';

// ============================================
// DATABASE ENUMS (from Prisma schema)
// ============================================

export type OrderStatus =
    | 'PENDING'
    | 'PAID'
    | 'PROCESSING'
    | 'SHIPPED'
    | 'DELIVERED'
    | 'CANCELLED'
    | 'REFUNDED';

export type FulfillmentType = 'SHIPPING' | 'PICKUP';

export type RefundStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'CANCELLED';

export type RefundReason =
    | 'DUPLICATE'
    | 'FRAUDULENT'
    | 'REQUESTED_BY_CUSTOMER'
    | 'DEFECTIVE_PRODUCT'
    | 'WRONG_PRODUCT'
    | 'SHIPPING_DAMAGE'
    | 'OTHER';

// ============================================
// ORDER INTERFACES
// ============================================

export interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    productSku?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productId?: string;
}

export interface ShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    fulfillmentType: FulfillmentType;

    // Pricing
    subtotal: number;
    taxAmount: number;
    shippingAmount: number;
    discountAmount?: number;
    total: number;

    // Customer info
    customerEmail: string;
    customerName: string;
    customerPhone?: string;

    // Addresses
    shippingAddress?: ShippingAddress;
    billingAddress?: ShippingAddress;

    // Stripe
    stripeSessionId?: string;
    stripePaymentIntentId?: string;

    // Tracking
    trackingNumber?: string;

    // Notes
    notes?: string;
    adminNotes?: string;

    // Timestamps
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;

    // Relations
    items: OrderItem[];
}

// Summary order (for list view)
export interface OrderSummary {
    id: string;
    orderNumber: string;
    status: OrderStatus;
    total: number;
    createdAt: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    fulfillmentType?: FulfillmentType;
    paidAt?: string;
    items: { productName: string; quantity: number; price: number }[];
}

// ============================================
// STATUS CONFIGURATIONS
// ============================================

export interface StatusConfig {
    icon: React.ElementType;
    color: string;
    bg: string;
    borderColor: string;
    label: string;
}

export interface StatusOption {
    value: OrderStatus;
    label: string;
}

// ============================================
// REFUND TYPES
// ============================================

export interface CreateRefundDto {
    orderId: string;
    amount: number;
    reason: RefundReason;
    reasonText?: string;
    adminNotes?: string;
    returnRequired: boolean;
}

export interface Refund {
    id: string;
    orderId: string;
    stripeRefundId?: string;
    amount: number;
    currency: string;
    status: RefundStatus;
    reason: RefundReason;
    reasonText?: string;
    processedBy?: string;
    adminNotes?: string;
    returnRequired: boolean;
    returnReceived: boolean;
    returnTrackingNumber?: string;
    createdAt: string;
    processedAt?: string;
    failedAt?: string;
    failureReason?: string;
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface UpdateOrderDto {
    status?: OrderStatus;
    trackingNumber?: string;
    adminNotes?: string;
    cancellationReason?: string;
}

export interface OrderStatusHistory {
    id: string;
    orderId: string;
    previousStatus: OrderStatus;
    newStatus: OrderStatus;
    changedBy?: string;
    reason?: string;
    createdAt: string;
}

// ============================================
// TIMELINE TYPES
// ============================================

export interface TimelineStep {
    label: string;
    date: string | undefined;
    completed: boolean;
}

// ============================================
// REASON LABELS
// ============================================

export const REFUND_REASON_OPTIONS: { value: RefundReason; label: string }[] = [
    { value: 'REQUESTED_BY_CUSTOMER', label: 'Klantverzoek' },
    { value: 'DEFECTIVE_PRODUCT', label: 'Defect product' },
    { value: 'WRONG_PRODUCT', label: 'Verkeerd product' },
    { value: 'SHIPPING_DAMAGE', label: 'Transportschade' },
    { value: 'DUPLICATE', label: 'Dubbele betaling' },
    { value: 'FRAUDULENT', label: 'Fraude' },
    { value: 'OTHER', label: 'Anders' },
];
