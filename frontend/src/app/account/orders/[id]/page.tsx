"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft, Package, Truck, MapPin, Loader2, CheckCircle, Clock, XCircle,
    RotateCcw, MessageSquare, X
} from "lucide-react";
import { api, getToken } from "@/lib/api";

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface ShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    subtotal?: number;
    shippingCost?: number;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    shippingAddress?: ShippingAddress;
    items: OrderItem[];
    createdAt: string;
    updatedAt: string;
}

const STATUS_CONFIG: Record<string, { color: string; icon: typeof CheckCircle; label: string }> = {
    PENDING: { color: "text-yellow-600", icon: Clock, label: "Wachtend op betaling" },
    PAID: { color: "text-blue-600", icon: CheckCircle, label: "Betaald" },
    PROCESSING: { color: "text-blue-600", icon: Package, label: "Wordt verwerkt" },
    SHIPPED: { color: "text-purple-600", icon: Truck, label: "Verzonden" },
    DELIVERED: { color: "text-green-600", icon: CheckCircle, label: "Afgeleverd" },
    CANCELLED: { color: "text-red-600", icon: XCircle, label: "Geannuleerd" },
    REFUNDED: { color: "text-orange-600", icon: RotateCcw, label: "Terugbetaald" },
};

export default function OrderDetailPage() {
    const params = useParams();
    const orderId = params.id as string;
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refund request modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [refundDescription, setRefundDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) return;

            try {
                const token = getToken();
                if (!token) {
                    setError("Please log in to view order details");
                    setIsLoading(false);
                    return;
                }

                const orderData = await api.getOrderById(orderId);
                setOrder(orderData);
            } catch (err) {
                console.error("Failed to load order:", err);
                setError("Order not found or you don't have permission to view it");
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [orderId]);

    const handleRefundRequest = async () => {
        if (!order || !refundReason.trim()) return;

        setIsSubmitting(true);
        try {
            const token = getToken();
            if (!token) {
                alert("Je moet ingelogd zijn om een terugbetaling aan te vragen");
                return;
            }

            // Use relative path for tenant resolution

            // Get or create session ID - must match chat widget's key
            let sessionId = localStorage.getItem('chat_session_id');
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem('chat_session_id', sessionId);
            }

            // Create a support ticket for the refund request
            const response = await fetch(`/api/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    subject: `Terugbetalingsverzoek - Order #${order.orderNumber}`,
                    initialMessage: `**Terugbetalingsverzoek**\n\nOrder: #${order.orderNumber}\nBedrag: €${Number(order.total).toFixed(2)}\n\n**Reden:** ${refundReason}\n\n**Toelichting:**\n${refundDescription || "Geen aanvullende toelichting opgegeven."}`,
                    category: "REFUND",
                    sessionId,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                console.error("Ticket creation error:", errorData);
                throw new Error(errorData?.message || "Verzoek kon niet worden verzonden");
            }

            setSubmitSuccess(true);
            setRefundReason("");
            setRefundDescription("");
        } catch (err) {
            console.error("Failed to submit refund request:", err);
            alert("Er is iets misgegaan. Probeer het opnieuw of neem contact met ons op.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                </div>
                <Footer />
            </main>
        );
    }

    if (error || !order) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-16 text-center">
                    <Package className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2">{error || "Order not found"}</h2>
                    <Link href="/account/orders" className="text-zinc-900 font-medium hover:underline">
                        ← Back to Orders
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = statusConfig.icon;

    return (
        <main className="min-h-screen bg-zinc-50">
            <Navbar />

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
                        <div className={`flex items-center gap-2 ${statusConfig.color}`}>
                            <StatusIcon className="w-5 h-5" />
                            <span className="font-semibold">{statusConfig.label}</span>
                        </div>
                    </div>
                </div>

                {/* ===== PROMINENT STATUS BANNERS FOR CUSTOMERS ===== */}
                {order.status === "PENDING" && (
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
                                href={`/checkout/pay/${order.id}`}
                                className="bg-white text-yellow-600 font-bold px-6 py-2 rounded-lg hover:bg-yellow-50 transition-colors"
                            >
                                💳 Nu betalen - €{Number(order.total).toFixed(2)}
                            </Link>
                        </div>
                    </div>
                )}

                {order.status === "REFUNDED" && (
                    <div className="bg-orange-500 text-white px-6 py-4 rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                            <RotateCcw className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">💸 Terugbetaald</p>
                                <p className="text-orange-100 text-sm">
                                    Het bedrag van €{Number(order.total).toFixed(2)} is teruggestort naar uw originele betaalmethode
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {order.status === "CANCELLED" && (
                    <div className="bg-red-500 text-white px-6 py-4 rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">❌ Geannuleerd</p>
                                <p className="text-red-100 text-sm">Deze bestelling is geannuleerd</p>
                            </div>
                        </div>
                    </div>
                )}

                {order.status === "SHIPPED" && (
                    <div className="bg-purple-500 text-white px-6 py-4 rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                            <Truck className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">🚚 Onderweg!</p>
                                <p className="text-purple-100 text-sm">Uw pakket is verzonden en onderweg naar u</p>
                            </div>
                        </div>
                    </div>
                )}

                {order.status === "DELIVERED" && (
                    <div className="bg-green-500 text-white px-6 py-4 rounded-xl mb-6">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-8 h-8" />
                            <div>
                                <p className="font-bold text-lg">✅ Afgeleverd</p>
                                <p className="text-green-100 text-sm">Uw bestelling is succesvol afgeleverd</p>
                            </div>
                        </div>
                    </div>
                )}

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
                                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-zinc-100 last:border-0">
                                        <div>
                                            <p className="font-medium text-zinc-900">{item.productName}</p>
                                            <p className="text-sm text-zinc-500">
                                                Qty: {item.quantity} × €{Number(item.unitPrice).toFixed(2)}
                                            </p>
                                        </div>
                                        <p className="font-semibold text-zinc-900">€{Number(item.totalPrice).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Totals */}
                            <div className="mt-6 pt-4 border-t border-zinc-200 space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Subtotal</span>
                                    <span>€{Number(order.subtotal || order.total).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Shipping</span>
                                    <span>€{Number(order.shippingCost || 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-lg font-bold pt-2 border-t border-zinc-100">
                                    <span>Total</span>
                                    <span>€{Number(order.total).toFixed(2)}</span>
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
                                    <p>
                                        {order.shippingAddress.postalCode} {order.shippingAddress.city}
                                    </p>
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

                        {/* Refund Request - Only for delivered/paid orders */}
                        {(order.status === "DELIVERED" || order.status === "PAID" || order.status === "SHIPPED") && (
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
                                    onClick={() => setShowRefundModal(true)}
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
                            <Link
                                href="/contact"
                                className="text-sm font-medium text-zinc-900 hover:underline"
                            >
                                Contact opnemen →
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Refund Request Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => !isSubmitting && setShowRefundModal(false)}
                    />
                    <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
                        {submitSuccess ? (
                            // Success state
                            <div className="text-center py-6">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-xl font-bold text-zinc-900 mb-2">
                                    Verzoek ontvangen!
                                </h2>
                                <p className="text-zinc-600 mb-6">
                                    We hebben je terugbetalingsverzoek ontvangen. Je ontvangt binnen 24-48 uur een reactie per email.
                                </p>
                                <Button
                                    onClick={() => {
                                        setShowRefundModal(false);
                                        setSubmitSuccess(false);
                                    }}
                                >
                                    Sluiten
                                </Button>
                            </div>
                        ) : (
                            // Form state
                            <>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                        <RotateCcw className="w-5 h-5 text-orange-600" />
                                        Terugbetaling aanvragen
                                    </h2>
                                    <button
                                        onClick={() => setShowRefundModal(false)}
                                        className="p-2 hover:bg-zinc-100 rounded-lg"
                                        disabled={isSubmitting}
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    {/* Order info */}
                                    <div className="bg-zinc-50 rounded-lg p-3">
                                        <p className="text-sm text-zinc-500">Order</p>
                                        <p className="font-semibold">#{order.orderNumber}</p>
                                        <p className="text-sm text-zinc-600">Totaal: €{Number(order.total).toFixed(2)}</p>
                                    </div>

                                    {/* Reason selector */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                                            Reden <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            value={refundReason}
                                            onChange={(e) => setRefundReason(e.target.value)}
                                            className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                            disabled={isSubmitting}
                                        >
                                            <option value="">Selecteer een reden...</option>
                                            <option value="Product is beschadigd">Product is beschadigd</option>
                                            <option value="Verkeerd product ontvangen">Verkeerd product ontvangen</option>
                                            <option value="Product voldoet niet aan verwachtingen">Product voldoet niet aan verwachtingen</option>
                                            <option value="Levering vertraagd/nooit ontvangen">Levering vertraagd/nooit ontvangen</option>
                                            <option value="Andere reden">Andere reden</option>
                                        </select>
                                    </div>

                                    {/* Description */}
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                                            Toelichting
                                        </label>
                                        <textarea
                                            value={refundDescription}
                                            onChange={(e) => setRefundDescription(e.target.value)}
                                            placeholder="Beschrijf het probleem in meer detail..."
                                            rows={4}
                                            className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Info box */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-700">
                                        <MessageSquare className="w-4 h-4 inline mr-2" />
                                        Je verzoek wordt als supportticket aangemaakt. We reageren binnen 24-48 uur.
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-3 pt-2">
                                        <Button
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => setShowRefundModal(false)}
                                            disabled={isSubmitting}
                                        >
                                            Annuleren
                                        </Button>
                                        <Button
                                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                                            onClick={handleRefundRequest}
                                            disabled={isSubmitting || !refundReason}
                                        >
                                            {isSubmitting ? (
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
            )}

            <Footer />
        </main>
    );
}
