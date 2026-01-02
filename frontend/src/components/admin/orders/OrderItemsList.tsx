/**
 * Order Items List Component
 * 
 * Displays the order items with pricing breakdown.
 */

import Image from 'next/image';
import { Package } from 'lucide-react';
import type { Order } from '@/lib/admin/orders/types';
import { formatCurrency } from '@/lib/admin/orders/configs';

interface OrderItemsListProps {
    order: Order;
}

export function OrderItemsList({ order }: OrderItemsListProps) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
                <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-zinc-400" />
                    Producten ({order.items.length})
                </h2>
            </div>
            <div className="divide-y divide-zinc-100">
                {order.items.map((item) => (
                    <div key={item.id} className="p-4 flex items-center gap-4">
                        <div className="w-16 h-16 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                            {item.productImage ? (
                                <Image
                                    src={item.productImage}
                                    alt={item.productName}
                                    width={64}
                                    height={64}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-6 h-6 text-zinc-300" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-zinc-900 truncate">{item.productName}</p>
                            <p className="text-sm text-zinc-500">
                                {formatCurrency(item.unitPrice)} × {item.quantity}
                            </p>
                        </div>
                        <p className="font-semibold text-zinc-900">
                            {formatCurrency(item.totalPrice)}
                        </p>
                    </div>
                ))}
            </div>

            {/* Pricing Summary */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Subtotaal</span>
                    <span>{formatCurrency(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                    <span className="text-zinc-500">Verzending</span>
                    <span>
                        {order.shippingAmount > 0
                            ? formatCurrency(order.shippingAmount)
                            : 'Gratis'}
                    </span>
                </div>
                {order.discountAmount && order.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                        <span>Korting</span>
                        <span>-{formatCurrency(order.discountAmount)}</span>
                    </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-3 border-t border-zinc-200">
                    <span>Totaal</span>
                    <span>{formatCurrency(order.total)}</span>
                </div>
            </div>
        </div>
    );
}
