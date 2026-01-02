/**
 * Order Status Banner Component
 * 
 * Displays prominent status banners based on order status.
 */

import {
    Clock,
    Package,
    CheckCircle,
    XCircle,
    RotateCcw,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/admin/orders/types';
import { formatCurrency } from '@/lib/admin/orders/configs';

interface OrderStatusBannerProps {
    order: Order;
}

export function OrderStatusBanner({ order }: OrderStatusBannerProps) {
    const status = order.status as OrderStatus;

    if (status === 'PENDING') {
        return (
            <div className="bg-yellow-500 text-white px-6 py-4 rounded-xl flex items-center justify-between animate-pulse">
                <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">⚠️ WACHTEND OP BETALING</p>
                        <p className="text-yellow-100 text-sm">Deze bestelling is nog niet betaald</p>
                    </div>
                </div>
                <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
            </div>
        );
    }

    if (status === 'REFUNDED') {
        return (
            <div className="bg-orange-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <RotateCcw className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">💸 TERUGBETAALD</p>
                        <p className="text-orange-100 text-sm">Deze bestelling is volledig terugbetaald</p>
                    </div>
                </div>
                <span className="text-2xl font-bold line-through opacity-75">{formatCurrency(order.total)}</span>
            </div>
        );
    }

    if (status === 'CANCELLED') {
        return (
            <div className="bg-red-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">❌ GEANNULEERD</p>
                        <p className="text-red-100 text-sm">Deze bestelling is geannuleerd</p>
                    </div>
                </div>
                <span className="text-2xl font-bold line-through opacity-75">{formatCurrency(order.total)}</span>
            </div>
        );
    }

    if (status === 'PAID' || status === 'PROCESSING') {
        return (
            <div className="bg-blue-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Package className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">⚡ ACTIE VEREIST</p>
                        <p className="text-blue-100 text-sm">Deze bestelling moet nog verzonden worden</p>
                    </div>
                </div>
                <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
            </div>
        );
    }

    if (status === 'DELIVERED') {
        return (
            <div className="bg-green-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">✅ AFGELEVERD</p>
                        <p className="text-green-100 text-sm">Deze bestelling is succesvol afgeleverd</p>
                    </div>
                </div>
                <span className="text-2xl font-bold">{formatCurrency(order.total)}</span>
            </div>
        );
    }

    // SHIPPED status - no special banner
    return null;
}
