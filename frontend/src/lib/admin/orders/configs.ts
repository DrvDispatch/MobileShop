/**
 * Order Detail Configs
 * 
 * Status configurations, helper functions, and constants for order detail page.
 */

import {
    Clock,
    CheckCircle,
    Package,
    Truck,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import type { StatusConfig, StatusOption, OrderStatus, TimelineStep, Order } from './types';

// ============================================
// STATUS CONFIGURATIONS
// ============================================

export const ORDER_STATUS_CONFIG: Record<OrderStatus, StatusConfig> = {
    PENDING: {
        icon: Clock,
        color: 'text-yellow-600',
        bg: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        label: 'In afwachting van betaling'
    },
    PAID: {
        icon: CheckCircle,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Betaald'
    },
    PROCESSING: {
        icon: Package,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        borderColor: 'border-blue-200',
        label: 'Wordt verwerkt'
    },
    SHIPPED: {
        icon: Truck,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        borderColor: 'border-purple-200',
        label: 'Verzonden'
    },
    DELIVERED: {
        icon: CheckCircle,
        color: 'text-green-600',
        bg: 'bg-green-50',
        borderColor: 'border-green-200',
        label: 'Afgeleverd'
    },
    CANCELLED: {
        icon: XCircle,
        color: 'text-red-600',
        bg: 'bg-red-50',
        borderColor: 'border-red-200',
        label: 'Geannuleerd'
    },
    REFUNDED: {
        icon: RotateCcw,
        color: 'text-orange-600',
        bg: 'bg-orange-50',
        borderColor: 'border-orange-200',
        label: 'Terugbetaald'
    },
};

export const ORDER_STATUS_OPTIONS: StatusOption[] = [
    { value: 'PENDING', label: 'In afwachting' },
    { value: 'PAID', label: 'Betaald' },
    { value: 'PROCESSING', label: 'Verwerken' },
    { value: 'SHIPPED', label: 'Verzonden' },
    { value: 'DELIVERED', label: 'Afgeleverd' },
    { value: 'CANCELLED', label: 'Geannuleerd' },
    { value: 'REFUNDED', label: 'Terugbetaald' },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Format date with optional time
 */
export function formatDate(dateString: string | undefined | null, includeTime = false): string {
    if (!dateString) return '—';
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return date.toLocaleDateString('nl-NL', options);
}

/**
 * Copy text to clipboard
 */
export function copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text);
}

/**
 * Format currency in EUR
 */
export function formatCurrency(amount: number): string {
    return `€${Number(amount).toFixed(2)}`;
}

/**
 * Get timeline steps from order
 */
export function getOrderTimeline(order: Order): TimelineStep[] {
    return [
        { label: 'Besteld', date: order.createdAt, completed: true },
        { label: 'Betaald', date: order.paidAt, completed: !!order.paidAt },
        { label: 'Verzonden', date: order.shippedAt, completed: !!order.shippedAt },
        { label: 'Afgeleverd', date: order.deliveredAt, completed: !!order.deliveredAt },
    ];
}

/**
 * Get status config with fallback
 */
export function getStatusConfig(status: string): StatusConfig {
    return ORDER_STATUS_CONFIG[status as OrderStatus] || ORDER_STATUS_CONFIG.PENDING;
}

/**
 * Check if order needs action (PAID or PROCESSING)
 */
export function orderNeedsAction(status: OrderStatus): boolean {
    return status === 'PAID' || status === 'PROCESSING';
}

/**
 * Check if order is completed
 */
export function orderIsCompleted(status: OrderStatus): boolean {
    return status === 'DELIVERED';
}

/**
 * Check if order is problematic (cancelled, refunded)
 */
export function orderIsProblematic(status: OrderStatus): boolean {
    return status === 'CANCELLED' || status === 'REFUNDED';
}
