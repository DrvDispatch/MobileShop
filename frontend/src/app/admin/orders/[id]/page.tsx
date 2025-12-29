"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Calendar,
    Hash,
    AlertCircle,
    Loader2,
    Copy,
    ExternalLink,
    Receipt,
    FileText,
    Download,
    RotateCcw,
    X,
} from "lucide-react";

interface OrderItem {
    id: string;
    productName: string;
    productImage?: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    productId?: string;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    subtotal: number;
    shippingAmount: number;
    taxAmount: number;
    discountAmount?: number;
    createdAt: string;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    fulfillmentType: string;
    shippingAddress?: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
    };
    stripeSessionId?: string;
    stripePaymentIntentId?: string;
    trackingNumber?: string;
    adminNotes?: string;
    items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; borderColor: string; label: string }> = {
    PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50", borderColor: "border-yellow-200", label: "In afwachting van betaling" },
    PAID: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200", label: "Betaald" },
    PROCESSING: { icon: Package, color: "text-blue-600", bg: "bg-blue-50", borderColor: "border-blue-200", label: "Wordt verwerkt" },
    SHIPPED: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50", borderColor: "border-purple-200", label: "Verzonden" },
    DELIVERED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50", borderColor: "border-green-200", label: "Afgeleverd" },
    CANCELLED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50", borderColor: "border-red-200", label: "Geannuleerd" },
    REFUNDED: { icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50", borderColor: "border-orange-200", label: "Terugbetaald" },
};

const ORDER_STATUSES = [
    { value: "PENDING", label: "In afwachting" },
    { value: "PAID", label: "Betaald" },
    { value: "PROCESSING", label: "Verwerken" },
    { value: "SHIPPED", label: "Verzonden" },
    { value: "DELIVERED", label: "Afgeleverd" },
    { value: "CANCELLED", label: "Geannuleerd" },
    { value: "REFUNDED", label: "Terugbetaald" },
];

function formatDate(dateString: string | undefined | null, includeTime = false): string {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        day: "numeric",
        month: "long",
        year: "numeric",
    };
    if (includeTime) {
        options.hour = "2-digit";
        options.minute = "2-digit";
    }
    return date.toLocaleDateString("nl-NL", options);
}

function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
}

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState("");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [cancellationReason, setCancellationReason] = useState("");
    const [adminNotes, setAdminNotes] = useState("");
    const [error, setError] = useState<string | null>(null);

    // Refund modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("REQUESTED_BY_CUSTOMER");
    const [refundReasonText, setRefundReasonText] = useState("");
    const [refundNotes, setRefundNotes] = useState("");
    const [returnRequired, setReturnRequired] = useState(false);
    const [isCreatingRefund, setIsCreatingRefund] = useState(false);

    useEffect(() => {
        const loadOrder = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const token = localStorage.getItem("adminAccessToken");
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (!response.ok) throw new Error("Order niet gevonden");

                const data = await response.json();
                setOrder({
                    ...data,
                    total: Number(data.total),
                    subtotal: Number(data.subtotal || 0),
                    shippingAmount: Number(data.shippingAmount || 0),
                    taxAmount: Number(data.taxAmount || 0),
                    discountAmount: Number(data.discountAmount || 0),
                    items: data.items.map((item: OrderItem) => ({
                        ...item,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    })),
                });
                setSelectedStatus(data.status);
                setAdminNotes(data.adminNotes || "");
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load order");
            } finally {
                setIsLoading(false);
            }
        };
        loadOrder();
    }, [orderId]);

    const handleStatusUpdate = async () => {
        if (!order || selectedStatus === order.status) return;

        if (selectedStatus === "SHIPPED" && !trackingNumber.trim()) {
            alert("Voer een trackingnummer in voor verzonden bestellingen");
            return;
        }

        setIsUpdating(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

            const body: Record<string, string> = { status: selectedStatus };
            if (selectedStatus === "SHIPPED" && trackingNumber) {
                body.trackingNumber = trackingNumber;
            }
            if (selectedStatus === "CANCELLED" && cancellationReason) {
                body.cancellationReason = cancellationReason;
            }

            const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error("Bijwerken mislukt");

            const updatedOrder = await response.json();
            setOrder({ ...order, ...updatedOrder });
            setTrackingNumber("");
            setCancellationReason("");
            alert(`Status bijgewerkt naar ${selectedStatus}. Email verzonden naar klant.`);
        } catch (err) {
            console.error("Failed to update status:", err);
            alert("Bijwerken van status mislukt");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!order) return;
        setIsUpdating(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
            const response = await fetch(`${API_URL}/api/orders/${orderId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ adminNotes }),
            });
            if (!response.ok) throw new Error("Opslaan mislukt");
            setOrder({ ...order, adminNotes });
            alert("Notities opgeslagen");
        } catch (err) {
            alert("Opslaan van notities mislukt");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCreateRefund = async () => {
        if (!order) return;

        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0) {
            alert("Voer een geldig bedrag in");
            return;
        }
        if (amount > order.total) {
            alert("Bedrag mag niet hoger zijn dan het ordertotaal");
            return;
        }

        setIsCreatingRefund(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

            const response = await fetch(`${API_URL}/api/refunds`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    orderId: order.id,
                    amount,
                    reason: refundReason,
                    reasonText: refundReasonText || undefined,
                    adminNotes: refundNotes || undefined,
                    returnRequired,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Aanmaken mislukt");
            }

            alert("Terugbetaling aangemaakt! Ga naar Terugbetalingen om te verwerken.");
            setShowRefundModal(false);
            setRefundAmount("");
            setRefundReason("REQUESTED_BY_CUSTOMER");
            setRefundReasonText("");
            setRefundNotes("");
            setReturnRequired(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : "Aanmaken van terugbetaling mislukt");
        } finally {
            setIsCreatingRefund(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-zinc-600 mb-4">{error || "Order niet gevonden"}</p>
                <Button variant="outline" onClick={() => router.push("/admin/orders")}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Terug naar overzicht
                </Button>
            </div>
        );
    }

    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = config.icon;

    return (
        <div className="space-y-6">
            {/* Refund Modal */}
            {showRefundModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShowRefundModal(false)}
                    />
                    <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full mx-4 p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-violet-600" />
                                Terugbetaling aanmaken
                            </h2>
                            <button
                                onClick={() => setShowRefundModal(false)}
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Order Info */}
                            <div className="bg-zinc-50 rounded-lg p-3">
                                <p className="text-sm text-zinc-500">Order</p>
                                <p className="font-semibold">{order.orderNumber}</p>
                                <p className="text-sm text-zinc-600">Totaal: €{order.total.toFixed(2)}</p>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Bedrag (€) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    max={order.total}
                                    value={refundAmount}
                                    onChange={(e) => setRefundAmount(e.target.value)}
                                    placeholder={`Max €${order.total.toFixed(2)}`}
                                    className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                />
                                <button
                                    type="button"
                                    onClick={() => setRefundAmount(order.total.toString())}
                                    className="text-xs text-violet-600 hover:underline mt-1"
                                >
                                    Volledig bedrag terugbetalen
                                </button>
                            </div>

                            {/* Reason */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Reden <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={refundReason}
                                    onChange={(e) => setRefundReason(e.target.value)}
                                    className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                >
                                    <option value="REQUESTED_BY_CUSTOMER">Klantverzoek</option>
                                    <option value="DEFECTIVE_PRODUCT">Defect product</option>
                                    <option value="WRONG_PRODUCT">Verkeerd product</option>
                                    <option value="SHIPPING_DAMAGE">Transportschade</option>
                                    <option value="DUPLICATE">Dubbele betaling</option>
                                    <option value="FRAUDULENT">Fraude</option>
                                    <option value="OTHER">Anders</option>
                                </select>
                            </div>

                            {/* Custom Reason Text */}
                            {refundReason === "OTHER" && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Toelichting
                                    </label>
                                    <input
                                        type="text"
                                        value={refundReasonText}
                                        onChange={(e) => setRefundReasonText(e.target.value)}
                                        placeholder="Beschrijf de reden..."
                                        className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500"
                                    />
                                </div>
                            )}

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Interne notities
                                </label>
                                <textarea
                                    value={refundNotes}
                                    onChange={(e) => setRefundNotes(e.target.value)}
                                    placeholder="Optionele notities voor intern gebruik..."
                                    rows={2}
                                    className="w-full px-4 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
                                />
                            </div>

                            {/* Return Required */}
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={returnRequired}
                                    onChange={(e) => setReturnRequired(e.target.checked)}
                                    className="w-5 h-5 rounded border-zinc-300 text-violet-600 focus:ring-violet-500"
                                />
                                <span className="text-sm text-zinc-700">
                                    Klant moet product retourneren
                                </span>
                            </label>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-zinc-200">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setShowRefundModal(false)}
                                >
                                    Annuleren
                                </Button>
                                <Button
                                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                                    onClick={handleCreateRefund}
                                    disabled={isCreatingRefund || !refundAmount}
                                >
                                    {isCreatingRefund ? (
                                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Aanmaken...</>
                                    ) : (
                                        <>Terugbetaling aanmaken</>
                                    )}
                                </Button>
                            </div>

                            <p className="text-xs text-zinc-500 text-center">
                                Na aanmaken kun je de terugbetaling verwerken via Stripe in het Terugbetalingen overzicht
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== PROMINENT STATUS BANNERS ===== */}
            {order.status === "PENDING" && (
                <div className="bg-yellow-500 text-white px-6 py-4 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-3">
                        <Clock className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">⚠️ WACHTEND OP BETALING</p>
                            <p className="text-yellow-100 text-sm">Deze bestelling is nog niet betaald</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold">€{Number(order.total).toFixed(2)}</span>
                </div>
            )}

            {order.status === "REFUNDED" && (
                <div className="bg-orange-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <RotateCcw className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">💸 TERUGBETAALD</p>
                            <p className="text-orange-100 text-sm">Deze bestelling is volledig terugbetaald</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold line-through opacity-75">€{Number(order.total).toFixed(2)}</span>
                </div>
            )}

            {order.status === "CANCELLED" && (
                <div className="bg-red-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">❌ GEANNULEERD</p>
                            <p className="text-red-100 text-sm">Deze bestelling is geannuleerd</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold line-through opacity-75">€{Number(order.total).toFixed(2)}</span>
                </div>
            )}

            {(order.status === "PAID" || order.status === "PROCESSING") && (
                <div className="bg-blue-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Package className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">⚡ ACTIE VEREIST</p>
                            <p className="text-blue-100 text-sm">Deze bestelling moet nog verzonden worden</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold">€{Number(order.total).toFixed(2)}</span>
                </div>
            )}

            {order.status === "DELIVERED" && (
                <div className="bg-green-500 text-white px-6 py-4 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="w-8 h-8" />
                        <div>
                            <p className="font-bold text-lg">✅ AFGELEVERD</p>
                            <p className="text-green-100 text-sm">Deze bestelling is succesvol afgeleverd</p>
                        </div>
                    </div>
                    <span className="text-2xl font-bold">€{Number(order.total).toFixed(2)}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push("/admin/orders")}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-zinc-900">{order.orderNumber}</h1>
                            <button
                                onClick={() => copyToClipboard(order.orderNumber)}
                                className="p-1 text-zinc-400 hover:text-zinc-600"
                                title="Kopieer bestelnummer"
                            >
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <p className="text-sm text-zinc-500">Geplaatst op {formatDate(order.createdAt, true)}</p>
                    </div>
                </div>
                <div className={`px-4 py-2 rounded-full border ${config.bg} ${config.borderColor}`}>
                    <span className={`font-semibold ${config.color} flex items-center gap-2`}>
                        <StatusIcon className="w-4 h-4" />
                        {config.label}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content - 2 columns */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Order Timeline */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-6 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-zinc-400" />
                            Tijdlijn
                        </h2>
                        <div className="relative">
                            {[
                                { label: "Besteld", date: order.createdAt, completed: true },
                                { label: "Betaald", date: order.paidAt, completed: !!order.paidAt },
                                { label: "Verzonden", date: order.shippedAt, completed: !!order.shippedAt },
                                { label: "Afgeleverd", date: order.deliveredAt, completed: !!order.deliveredAt },
                            ].map((step, index, arr) => (
                                <div key={step.label} className="flex gap-4 pb-6 last:pb-0">
                                    <div className="flex flex-col items-center">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.completed ? "bg-green-500" : "bg-zinc-200"
                                            }`}>
                                            <CheckCircle className={`w-4 h-4 ${step.completed ? "text-white" : "text-zinc-400"}`} />
                                        </div>
                                        {index < arr.length - 1 && (
                                            <div className={`w-0.5 flex-1 mt-2 ${step.completed ? "bg-green-500" : "bg-zinc-200"}`} />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${step.completed ? "text-zinc-900" : "text-zinc-400"}`}>
                                            {step.label}
                                        </p>
                                        <p className="text-sm text-zinc-500">{formatDate(step.date, true)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Products */}
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
                                            €{Number(item.unitPrice).toFixed(2)} × {item.quantity}
                                        </p>
                                    </div>
                                    <p className="font-semibold text-zinc-900">€{Number(item.totalPrice).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-zinc-50 border-t border-zinc-100 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Subtotaal</span>
                                <span>€{Number(order.subtotal || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-500">Verzending</span>
                                <span>{Number(order.shippingAmount || 0) > 0 ? `€${Number(order.shippingAmount).toFixed(2)}` : "Gratis"}</span>
                            </div>
                            {order.discountAmount && Number(order.discountAmount) > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Korting</span>
                                    <span>-€{Number(order.discountAmount).toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-3 border-t border-zinc-200">
                                <span>Totaal</span>
                                <span>€{Number(order.total).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Update Status */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-zinc-400" />
                            Status bijwerken
                        </h2>
                        <div className="space-y-4">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            >
                                {ORDER_STATUSES.map((status) => (
                                    <option key={status.value} value={status.value}>
                                        {status.label}
                                    </option>
                                ))}
                            </select>

                            {selectedStatus === "SHIPPED" && selectedStatus !== order.status && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">
                                        Trackingnummer <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                        placeholder="Bijv. 3SXXXX123456789"
                                        className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                    />
                                </div>
                            )}

                            {selectedStatus === "CANCELLED" && selectedStatus !== order.status && (
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-zinc-700">Reden voor annulering</label>
                                    <textarea
                                        value={cancellationReason}
                                        onChange={(e) => setCancellationReason(e.target.value)}
                                        placeholder="Reden wordt getoond in email naar klant..."
                                        rows={3}
                                        className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none"
                                    />
                                </div>
                            )}

                            <Button
                                onClick={handleStatusUpdate}
                                disabled={isUpdating || selectedStatus === order.status}
                                className="w-full"
                            >
                                {isUpdating ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Bijwerken...</>
                                ) : (
                                    `Bijwerken naar ${ORDER_STATUSES.find(s => s.value === selectedStatus)?.label}`
                                )}
                            </Button>
                            {selectedStatus !== order.status && (
                                <p className="text-xs text-zinc-500 text-center">
                                    Klant ontvangt automatisch een email notificatie
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Admin Notes */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <Receipt className="w-5 h-5 text-zinc-400" />
                            Interne notities
                        </h2>
                        <textarea
                            value={adminNotes}
                            onChange={(e) => setAdminNotes(e.target.value)}
                            placeholder="Interne notities (niet zichtbaar voor klant)..."
                            rows={4}
                            className="w-full px-4 py-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 resize-none mb-3"
                        />
                        <Button variant="outline" onClick={handleSaveNotes} disabled={isUpdating}>
                            {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                            Notities opslaan
                        </Button>
                    </div>
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                    {/* Customer Info */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-zinc-400" />
                            Klantgegevens
                        </h2>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <User className="w-4 h-4 text-zinc-400 mt-1" />
                                <div>
                                    <p className="font-medium text-zinc-900">{order.customerName}</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <Mail className="w-4 h-4 text-zinc-400 mt-1" />
                                <a href={`mailto:${order.customerEmail}`} className="text-blue-600 hover:underline">
                                    {order.customerEmail}
                                </a>
                            </div>
                            {order.customerPhone && (
                                <div className="flex items-start gap-3">
                                    <Phone className="w-4 h-4 text-zinc-400 mt-1" />
                                    <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline">
                                        {order.customerPhone}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Invoice & Quick Actions */}
                    {order.paidAt && (
                        <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-6">
                            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                Factuur
                            </h2>
                            <p className="text-sm text-zinc-600 mb-3">
                                <span className="font-medium">Factuurnummer:</span>{" "}
                                <code className="bg-white px-2 py-0.5 rounded text-purple-700">
                                    FAC-{order.orderNumber}
                                </code>
                            </p>
                            <div className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full bg-white hover:bg-purple-50"
                                    onClick={async () => {
                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                                        const token = localStorage.getItem("adminAccessToken");
                                        try {
                                            const response = await fetch(`${API_URL}/api/invoice/order/${order.id}`, {
                                                headers: { Authorization: `Bearer ${token}` },
                                            });
                                            if (response.ok) {
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                window.open(url, "_blank");
                                            }
                                        } catch (err) {
                                            console.error("Failed to open invoice:", err);
                                        }
                                    }}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Bekijk Factuur
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full bg-white hover:bg-purple-50"
                                    onClick={async () => {
                                        const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
                                        const token = localStorage.getItem("adminAccessToken");
                                        try {
                                            const response = await fetch(`${API_URL}/api/invoice/order/${order.id}/download`, {
                                                headers: { Authorization: `Bearer ${token}` },
                                            });
                                            if (response.ok) {
                                                const blob = await response.blob();
                                                const url = window.URL.createObjectURL(blob);
                                                const a = document.createElement("a");
                                                a.href = url;
                                                a.download = `factuur-${order.orderNumber}.pdf`;
                                                document.body.appendChild(a);
                                                a.click();
                                                window.URL.revokeObjectURL(url);
                                                a.remove();
                                            }
                                        } catch (err) {
                                            console.error("Download failed:", err);
                                        }
                                    }}
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download PDF
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Refund Section - Only show for paid orders */}
                    {order.paidAt && order.status !== "CANCELLED" && order.status !== "REFUNDED" && (
                        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl border border-orange-200 p-6">
                            <h2 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                <RotateCcw className="w-5 h-5 text-orange-600" />
                                Terugbetaling
                            </h2>
                            <p className="text-sm text-zinc-600 mb-4">
                                Maak een terugbetaling aan voor deze bestelling via Stripe.
                            </p>
                            <Button
                                className="w-full bg-orange-600 hover:bg-orange-700"
                                onClick={() => setShowRefundModal(true)}
                            >
                                <RotateCcw className="w-4 h-4 mr-2" />
                                Terugbetaling aanmaken
                            </Button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4">Snelle acties</h2>
                        <div className="grid grid-cols-2 gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <a href={`mailto:${order.customerEmail}?subject=Over bestelling ${order.orderNumber}`}>
                                    <Mail className="w-4 h-4 mr-1" />
                                    Email
                                </a>
                            </Button>
                            {order.customerPhone && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                >
                                    <a href={`tel:${order.customerPhone}`}>
                                        <Phone className="w-4 h-4 mr-1" />
                                        Bellen
                                    </a>
                                </Button>
                            )}
                            {order.customerPhone && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                    asChild
                                >
                                    <a
                                        href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hallo ${order.customerName}, betreft uw bestelling ${order.orderNumber} bij SmartphoneService.`)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                        </svg>
                                        WhatsApp
                                    </a>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Shipping Address */}
                    {order.fulfillmentType === "SHIPPING" && order.shippingAddress && (
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-zinc-400" />
                                Verzendadres
                            </h2>
                            <div className="text-zinc-600 space-y-1">
                                <p>{order.shippingAddress.line1}</p>
                                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                                <p>{order.shippingAddress.postalCode} {order.shippingAddress.city}</p>
                                <p>{order.shippingAddress.country}</p>
                            </div>
                        </div>
                    )}

                    {/* Fulfillment Type */}
                    {order.fulfillmentType === "PICKUP" && (
                        <div className="bg-amber-50 rounded-xl border border-amber-200 p-6">
                            <h2 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Afhalen in winkel
                            </h2>
                            <p className="text-sm text-amber-700">
                                Klant haalt bestelling af op locatie
                            </p>
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-zinc-400" />
                            Betalingsgegevens
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-zinc-500">Status</span>
                                <span className={order.paidAt ? "text-green-600 font-medium" : "text-yellow-600"}>
                                    {order.paidAt ? "Betaald" : "Niet betaald"}
                                </span>
                            </div>
                            {order.paidAt && (
                                <div className="flex justify-between">
                                    <span className="text-zinc-500">Betaald op</span>
                                    <span>{formatDate(order.paidAt, true)}</span>
                                </div>
                            )}
                            {order.stripePaymentIntentId && (
                                <div className="flex justify-between items-center">
                                    <span className="text-zinc-500">Payment ID</span>
                                    <div className="flex items-center gap-1">
                                        <span className="font-mono text-xs">{order.stripePaymentIntentId.slice(0, 15)}...</span>
                                        <button
                                            onClick={() => copyToClipboard(order.stripePaymentIntentId!)}
                                            className="p-1 text-zinc-400 hover:text-zinc-600"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                        {order.stripePaymentIntentId && (
                            <a
                                href={`https://dashboard.stripe.com/test/payments/${order.stripePaymentIntentId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-4 flex items-center justify-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                                <ExternalLink className="w-4 h-4" />
                                Bekijk in Stripe
                            </a>
                        )}
                    </div>

                    {/* Order IDs */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <Hash className="w-5 h-5 text-zinc-400" />
                            Technische gegevens
                        </h2>
                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="text-zinc-500 mb-1">Order ID</p>
                                <div className="flex items-center gap-2">
                                    <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">{order.id}</code>
                                    <button
                                        onClick={() => copyToClipboard(order.id)}
                                        className="p-1 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <Copy className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                            {order.stripeSessionId && (
                                <div>
                                    <p className="text-zinc-500 mb-1">Stripe Session</p>
                                    <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono block truncate">
                                        {order.stripeSessionId}
                                    </code>
                                </div>
                            )}
                            {order.trackingNumber && (
                                <div>
                                    <p className="text-zinc-500 mb-1">Trackingnummer</p>
                                    <code className="text-xs bg-zinc-100 px-2 py-1 rounded font-mono">
                                        {order.trackingNumber}
                                    </code>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
