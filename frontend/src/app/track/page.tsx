"use client";

import { useState } from "react";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { Search, Package, Clock, Truck, CheckCircle, XCircle, Loader2, AlertCircle, MapPin } from "lucide-react";

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface OrderStatus {
    orderNumber: string;
    status: string;
    customerName: string;
    total: number;
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    items: OrderItem[];
    fulfillmentType: string;
}

const STATUS_CONFIG = {
    PENDING: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-50", label: "In afwachting van betaling" },
    PAID: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-50", label: "Betaald" },
    PROCESSING: { icon: Package, color: "text-blue-500", bg: "bg-blue-50", label: "Wordt verwerkt" },
    SHIPPED: { icon: Truck, color: "text-purple-500", bg: "bg-purple-50", label: "Verzonden" },
    DELIVERED: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-50", label: "Afgeleverd" },
    CANCELLED: { icon: XCircle, color: "text-red-500", bg: "bg-red-50", label: "Geannuleerd" },
};

export default function TrackPage() {
    const [orderNumber, setOrderNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!orderNumber.trim()) {
            setError("Voer een bestelnummer in");
            return;
        }

        setIsLoading(true);
        setError(null);
        setOrder(null);

        try {
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${API_URL}/api/orders/track/${orderNumber.trim()}`);

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("Bestelling niet gevonden. Controleer het bestelnummer en probeer opnieuw.");
                }
                throw new Error("Er is iets misgegaan. Probeer het later opnieuw.");
            }

            const data = await response.json();
            setOrder(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Er is iets misgegaan");
        } finally {
            setIsLoading(false);
        }
    };

    const config = order ? STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING : null;
    const StatusIcon = config?.icon || Clock;

    // Build timeline steps
    const getTimelineSteps = (): { key: string; label: string; date: string | null | undefined; completed: boolean; isCancelled?: boolean }[] => {
        if (!order) return [];

        const steps: { key: string; label: string; date: string | null | undefined; completed: boolean; isCancelled?: boolean }[] = [
            { key: "ordered", label: "Besteld", date: order.createdAt, completed: true },
            { key: "paid", label: "Betaald", date: order.paidAt, completed: !!order.paidAt },
            { key: "shipped", label: "Verzonden", date: order.shippedAt, completed: !!order.shippedAt },
            { key: "delivered", label: "Afgeleverd", date: order.deliveredAt, completed: !!order.deliveredAt },
        ];

        if (order.status === "CANCELLED") {
            return [{ key: "cancelled", label: "Geannuleerd", date: null, completed: true, isCancelled: true }];
        }

        return steps;
    };

    return (
        <main className="min-h-screen bg-zinc-50">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Truck className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">Track & Trace</h1>
                    <p className="text-zinc-600">
                        Volg de status van uw bestelling met uw bestelnummer
                    </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleTrack} className="mb-8">
                    <div className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                value={orderNumber}
                                onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
                                placeholder="Bijv. ND-MJO7C2AA-9JII"
                                className="w-full h-12 pl-12 pr-4 rounded-xl border border-zinc-200 bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-lg"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="h-12 px-8"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                "Zoeken"
                            )}
                        </Button>
                    </div>
                </form>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-8">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Order Result */}
                {order && (
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className={`rounded-xl border p-6 ${config?.bg} border-zinc-200`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-full ${config?.bg} flex items-center justify-center`}>
                                    <StatusIcon className={`w-7 h-7 ${config?.color}`} />
                                </div>
                                <div>
                                    <p className="text-sm text-zinc-500 mb-1">Bestelnummer</p>
                                    <p className="text-xl font-bold text-zinc-900">{order.orderNumber}</p>
                                </div>
                                <div className="ml-auto text-right">
                                    <p className="text-sm text-zinc-500 mb-1">Status</p>
                                    <p className={`text-lg font-semibold ${config?.color}`}>{config?.label}</p>
                                </div>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <h2 className="font-semibold text-zinc-900 mb-6">Voortgang</h2>
                            <div className="relative">
                                {getTimelineSteps().map((step, index) => (
                                    <div key={step.key} className="flex gap-4 pb-6 last:pb-0">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed
                                                ? (step.isCancelled ? "bg-red-500" : "bg-zinc-900")
                                                : "bg-zinc-200"
                                                }`}>
                                                {step.completed ? (
                                                    step.isCancelled ? (
                                                        <XCircle className="w-4 h-4 text-white" />
                                                    ) : (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    )
                                                ) : (
                                                    <div className="w-2 h-2 rounded-full bg-zinc-400" />
                                                )}
                                            </div>
                                            {index < getTimelineSteps().length - 1 && (
                                                <div className={`w-0.5 flex-1 mt-2 ${step.completed ? "bg-zinc-900" : "bg-zinc-200"
                                                    }`} />
                                            )}
                                        </div>
                                        <div className="flex-1 pb-2">
                                            <p className={`font-medium ${step.completed ? "text-zinc-900" : "text-zinc-400"}`}>
                                                {step.label}
                                            </p>
                                            {step.date && (
                                                <p className="text-sm text-zinc-500">
                                                    {new Date(step.date).toLocaleDateString('nl-NL', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Order Details */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <h2 className="font-semibold text-zinc-900 mb-4">Bestelgegevens</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Klant</span>
                                    <span className="text-zinc-900">{order.customerName}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Levering</span>
                                    <span className="text-zinc-900 flex items-center gap-1">
                                        {order.fulfillmentType === "PICKUP" ? (
                                            <>
                                                <MapPin className="w-4 h-4" />
                                                Afhalen in winkel
                                            </>
                                        ) : (
                                            <>
                                                <Truck className="w-4 h-4" />
                                                Verzending
                                            </>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-500">Besteldatum</span>
                                    <span className="text-zinc-900">
                                        {new Date(order.createdAt).toLocaleDateString('nl-NL', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </span>
                                </div>
                                <div className="flex justify-between font-medium pt-3 border-t border-zinc-200">
                                    <span className="text-zinc-900">Totaal</span>
                                    <span className="text-zinc-900">€{Number(order.total).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Items */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <h2 className="font-semibold text-zinc-900 mb-4">Producten ({order.items.length})</h2>
                            <div className="space-y-3">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex justify-between items-center py-2">
                                        <div>
                                            <p className="text-zinc-900">{item.productName}</p>
                                            <p className="text-sm text-zinc-500">Aantal: {item.quantity}</p>
                                        </div>
                                        <p className="text-zinc-900 font-medium">€{Number(item.totalPrice).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Help Text */}
                {!order && !error && (
                    <div className="text-center py-12">
                        <Package className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                        <p className="text-zinc-500">
                            Voer uw bestelnummer in om de status van uw bestelling te bekijken.
                            <br />
                            U vindt het bestelnummer in uw bevestigingsmail.
                        </p>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
