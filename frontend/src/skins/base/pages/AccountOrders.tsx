'use client';

/**
 * Base Skin - Account Orders List Page
 * 
 * PURE PRESENTATION ONLY
 */

import Link from 'next/link';
import type { AccountOrdersPageVM, OrderListItemVM } from '@core/hooks/pages/useAccountOrdersPageVM';
import { ChevronLeft, Package, Loader2 } from 'lucide-react';

export interface AccountOrdersPageProps {
    vm: AccountOrdersPageVM;
}

function OrderCard({ order }: { order: OrderListItemVM }) {
    const getPriceClass = () => {
        if (order.isRefunded) return "text-orange-600 line-through";
        if (order.isCancelled) return "text-red-400 line-through";
        return "text-zinc-900";
    };

    const getBgClass = () => {
        if (order.isPending) return "bg-yellow-50/50";
        if (order.isRefunded) return "bg-orange-50/50";
        if (order.isCancelled) return "bg-red-50/50 opacity-75";
        return "";
    };

    return (
        <Link
            href={`/account/orders/${order.id}`}
            className={`block p-5 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors border border-zinc-100 border-l-4 ${order.statusConfig.border} ${getBgClass()}`}
        >
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold text-zinc-900">Bestelling #{order.orderNumber}</p>
                    <p className="text-sm text-zinc-500 mt-1">
                        {new Date(order.createdAt).toLocaleDateString("nl-BE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        })}
                    </p>
                    <p className="text-sm text-zinc-500">
                        {order.itemCount} {order.itemCount === 1 ? "product" : "producten"}
                    </p>
                </div>
                <div className="text-right">
                    <div className="flex items-center justify-end gap-2">
                        {order.isPending && <span className="text-yellow-500">⏳</span>}
                        {order.isRefunded && <span className="text-orange-500">💸</span>}
                        <p className={`font-bold text-lg ${getPriceClass()}`}>
                            €{order.total.toFixed(2)}
                        </p>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full font-medium ${order.statusConfig.bg} ${order.statusConfig.text}`}>
                        {order.statusConfig.label}
                    </span>
                </div>
            </div>
            {order.itemCount > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-200">
                    <p className="text-sm text-zinc-600">{order.itemsSummary}</p>
                </div>
            )}
        </Link>
    );
}

export function AccountOrdersPage({ vm }: AccountOrdersPageProps) {
    // Login required
    if (vm.needsLogin) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
                <Package className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">Login Required</h2>
                <p className="text-zinc-600 mb-6">Please log in to view your order history.</p>
                <Link href="/login" className="text-zinc-900 font-medium hover:underline">Log in →</Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/account" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
                    <ChevronLeft className="w-4 h-4" />
                    Back to Account
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900">My Orders</h1>
                {vm.userEmail && (
                    <p className="text-sm text-zinc-500 mt-1">Orders for {vm.userEmail}</p>
                )}
            </div>

            {vm.isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                </div>
            ) : !vm.hasOrders ? (
                <div className="text-center py-16">
                    <Package className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2">No orders yet</h2>
                    <p className="text-zinc-600 mb-6">When you place an order, it will appear here.</p>
                    <Link href="/phones" className="text-zinc-900 font-medium hover:underline">Start shopping →</Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {vm.orders.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}
