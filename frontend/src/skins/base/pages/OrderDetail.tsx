'use client';

/**
 * Base Skin - Order Detail Page
 * 
 * PURE PRESENTATION ONLY
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { OrderDetailPageVM, OrderItemVM } from '@core/hooks/pages/useOrderDetailPageVM';
import {
    ChevronLeft, Package, Truck, MapPin, Loader2, CheckCircle, Clock, XCircle,
    RotateCcw, MessageSquare, X
} from 'lucide-react';

export interface OrderDetailPageProps {
    vm: OrderDetailPageVM;
}

// Status icon component
function StatusIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case 'clock': return <Clock className={className} />;
        case 'check': return <CheckCircle className={className} />;
        case 'package': return <Package className={className} />;
        case 'truck': return <Truck className={className} />;
        case 'x': return <XCircle className={className} />; 
        case 'rotate': return <RotateCcw className={className} />;
        default: return <Package className={className} />;
    }
}

// Order item row
function OrderItemRow({ item }: { item: OrderItemVM }) {
    return (
        <div className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
            <div>
                <p className="font-medium text-zinc-900">{item.productName}</p>
                <p className="text-sm text-zinc-500">
                    Qty: {item.quantity} × €{item.unitPrice.toFixed(2)}
                </p>
            </div>
            <p className="font-semibold text-zinc-900">€{item.totalPrice.toFixed(2)}</p>
        </div>
    );
}

// Status banner component
function StatusBanner({ status, total, orderId }: { status: string; total: number; orderId: string }) {
    if (status === "PENDING") {
        return (
            <div className="bg-yellow-500 text-white px-6 py-4 rounded-xl mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">⚠️ Wachtend op betaling</p>
                            <p className="text-yellow-100 text-sm">Uw bestelling wordt pas verzonden na ontvangst van betaling</p>
                        </div>
                    </div>
                    <Link
                        href={`/checkout/pay/${orderId}`}
                        className="bg-white text-yellow-600 font-bold px-6 py-2 rounded-lg hover:bg-yellow-50 transition-colors"
                    >
                        💳 Nu betalen - €{total.toFixed(2)}
                    </Link>
                </div>
            </div>
        );
    }

    if (status === "REFUNDED") {
        return (
            <div className="bg-orange-500 text-white px-6 py-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                    <RotateCcw className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">💸 Terugbetaald</p>
                        <p className="text-orange-100 text-sm">
                            Het bedrag van €{total.toFixed(2)} is teruggestort naar uw originele betaalmethode
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "CANCELLED") {
        return (
            <div className="bg-red-500 text-white px-6 py-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                    <XCircle className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">❌ Geannuleerd</p>
                        <p className="text-red-100 text-sm">Deze bestelling is geannuleerd</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "SHIPPED") {
        return (
            <div className="bg-purple-500 text-white px-6 py-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                    <Truck className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">🚚 Onderweg!</p>
                        <p className="text-purple-100 text-sm">Uw pakket is verzonden en onderweg naar u</p>
                    </div>
                </div>
            </div>
        );
    }

    if (status === "DELIVERED") {
        return (
            <div className="bg-green-500 text-white px-6 py-4 rounded-xl mb-6">
                <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8" />
                    <div>
                        <p className="font-bold text-lg">✅ Afgeleverd</p>
                        <p className="text-green-100 text-sm">Uw bestelling is succesvol afgeleverd</p>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}

// Refund modal
function RefundModal({ vm }: { vm: OrderDetailPageVM }) {
    if (!vm.showRefundModal || !vm.order) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={vm.onCloseRefundModal} />
            <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                {vm.submitSuccess ? (
                    <div className="text-center py-6">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <h2 className="text-xl font-bold text-zinc-900 mb-2">Verzoek ontvangen!</h2>
                        <p className="text-zinc-600 mb-6">
                            We hebben je terugbetalingsverzoek ontvangen. Je ontvangt binnen 24-48 uur een reactie per email.
                        </p>
                        <Button onClick={vm.onResetRefundSuccess}>Sluiten</Button>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                                Terugbetaling aanvragen
                            </h2>
                            <button
                                onClick={vm.onCloseRefundModal}
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                                disabled={vm.isSubmitting}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-zinc-50 rounded-lg p-3">
                                <p className="text-sm text-zinc-500">Order</p>
                                <p className="font-semibold">#{vm.order.orderNumber}</p>
                                <p className="text-sm text-zinc-600">Totaal: €{vm.order.total.toFixed(2)}</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Reden <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={vm.refundReason}
                                    onChange={(e) => vm.onRefundReasonChange(e.target.value)}
                                    className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    disabled={vm.isSubmitting}
                                >
                                    <option value="">Selecteer een reden...</option>
                                    <option value="Product is beschadigd">Product is beschadigd</option>
                                    <option value="Verkeerd product ontvangen">Verkeerd product ontvangen</option>
                                    <option value="Product voldoet niet aan verwachtingen">Product voldoet niet aan verwachtingen</option>
                                    <option value="Levering vertraagd/nooit ontvangen">Levering vertraagd/nooit ontvangen</option>
                                    <option value="Andere reden">Andere reden</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Toelichting</label>
                                <textarea
                                    value={vm.refundDescription}
                                    onChange={(e) => vm.onRefundDescriptionChange(e.target.value)}
                                    placeholder="Beschrijf het probleem in meer detail..."
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                    disabled={vm.isSubmitting}
                                />
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                                <MessageSquare className="w-4 h-4 inline mr-2" />
                                Je verzoek wordt als supportticket aangemaakt. We reageren binnen 24-48 uur.
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" className="flex-1" onClick={vm.onCloseRefundModal} disabled={vm.isSubmitting}>
                                    Annuleren
                                </Button>
                                <Button
                                    className="flex-1 bg-orange-600 hover:bg-orange-700"
                                    onClick={vm.onSubmitRefund}
                                    disabled={vm.isSubmitting || !vm.refundReason}
                                >
                                    {vm.isSubmitting ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verzenden...</>
                                    ) : (
                                        <>Verzoek indienen</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export function OrderDetailPage({ vm }: OrderDetailPageProps) {
    // Loading
    if (vm.isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        );
    }

    // Error
    if (vm.error || !vm.order) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
                <Package className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                <h2 className="text-xl font-semibold text-zinc-900 mb-2">{vm.error || "Order not found"}</h2>
                <Link href="/account/orders" className="text-zinc-900 font-medium hover:underline">
                    ← Back to Orders
                </Link>
            </div>
        );
    }

    const { order } = vm;

    return (
        <>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account/orders" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Orders
                    </Link>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900">Order #{order.orderNumber}</h1>
                            <p className="text-sm text-zinc-500 mt-1">
                                Placed on {new Date(order.createdAt).toLocaleDateString("nl-BE", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}
                            </p>
                        </div>
                        <div className={`flex items-center gap-2 ${order.statusConfig.color}`}>
                            <StatusIcon type={order.statusConfig.iconType} className="w-5 h-5" />
                            <span className="font-semibold">{order.statusConfig.label}</span>
                        </div>
                    </div>
                </div>

                {/* Status Banner */}
                <StatusBanner status={order.status} total={order.total} orderId={order.id} />

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Order Items */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5 text-zinc-400" />
                                Order Items
                            </h2>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <OrderItemRow key={item.id} item={item} />
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-6 pt-4 border-t border-zinc-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Subtotal</span>
                                    <span>€{order.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Shipping</span>
                                    <span>€{order.shippingCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-100">
                                    <span>Total</span>
                                    <span>€{order.total.toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-zinc-500">All prices include 21% VAT</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Shipping Address */}
                        {order.shippingAddress && (
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-zinc-400" />
                                    Shipping Address
                                </h3>
                                <div className="text-sm text-zinc-600 space-y-1">
                                    <p className="font-medium text-zinc-900">{order.customerName}</p>
                                    <p>{order.shippingAddress.line1}</p>
                                    {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                                    <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                                    <p>{order.shippingAddress.country}</p>
                                </div>
                            </div>
                        )}

                        {/* Contact Info */}
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-3">Contact Information</h3>
                            <div className="text-sm text-zinc-600 space-y-1">
                                <p>{order.customerEmail}</p>
                                {order.customerPhone && <p>{order.customerPhone}</p>}
                            </div>
                        </div>

                        {/* Refund Request */}
                        {order.canRequestRefund && (
                            <div className="bg-orange-50 rounded-xl p-6 border border-orange-200">
                                <h3 className="text-sm font-semibold text-orange-800 mb-2 flex items-center gap-2">
                                    <RotateCcw className="w-4 h-4" />
                                    Terugbetaling aanvragen
                                </h3>
                                <p className="text-sm text-orange-700 mb-3">
                                    Niet tevreden? Vraag een terugbetaling aan binnen 14 dagen.
                                </p>
                                <Button
                                    size="sm"
                                    className="w-full bg-orange-600 hover:bg-orange-700"
                                    onClick={vm.onOpenRefundModal}
                                >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Terugbetaling aanvragen
                                </Button>
                            </div>
                        )}

                        {/* Need Help */}
                        <div className="bg-zinc-100 rounded-xl p-6">
                            <h3 className="text-sm font-semibold text-zinc-900 mb-2">Hulp nodig?</h3>
                            <p className="text-sm text-zinc-600 mb-3">
                                Heb je vragen over je bestelling? Neem contact met ons op.
                            </p>
                            <Link href="/contact" className="text-sm font-medium text-zinc-900 hover:underline">
                                Contact opnemen →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Modal */}
            <RefundModal vm={vm} />
        </>
    );
}
