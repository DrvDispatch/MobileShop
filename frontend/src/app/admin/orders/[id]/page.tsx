"use client";

/**
 * Admin Order Detail Page (Refactored)
 * 
 * Single order detail view with status management, timeline, refunds.
 * Uses extracted components and hooks for maintainability.
 */

import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Hash,
    AlertCircle,
    Loader2,
    Copy,
    ExternalLink,
    Receipt,
    FileText,
    Download,
    CheckCircle,
    RotateCcw,
} from "lucide-react";

// Hooks & Types
import { useOrderDetail } from "@/lib/admin/orders/useOrderDetail";
import {
    ORDER_STATUS_CONFIG,
    ORDER_STATUS_OPTIONS,
    formatDate,
    copyToClipboard,
    getStatusConfig,
} from "@/lib/admin/orders/configs";
import type { OrderStatus } from "@/lib/admin/orders/types";

// Components
import {
    OrderTimeline,
    OrderItemsList,
    RefundModal,
    OrderStatusBanner,
} from "@/components/admin/orders";

export default function AdminOrderDetailPage() {
    const params = useParams();
    const router = useRouter();
    const orderId = params.id as string;

    // Use the extracted hook for all business logic
    const {
        order,
        isLoading,
        isUpdating,
        isCreatingRefund,
        error,
        selectedStatus,
        setSelectedStatus,
        trackingNumber,
        setTrackingNumber,
        cancellationReason,
        setCancellationReason,
        handleStatusUpdate,
        adminNotes,
        setAdminNotes,
        handleSaveNotes,
        showRefundModal,
        setShowRefundModal,
        refundAmount,
        setRefundAmount,
        refundReason,
        setRefundReason,
        refundReasonText,
        setRefundReasonText,
        refundNotes,
        setRefundNotes,
        returnRequired,
        setReturnRequired,
        handleCreateRefund,
        handleDownloadInvoice,
    } = useOrderDetail(orderId);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    // Error state
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

    const config = getStatusConfig(order.status);
    const StatusIcon = config.icon;

    return (
        <div className="space-y-6">
            {/* Refund Modal */}
            <RefundModal
                order={order}
                isOpen={showRefundModal}
                onClose={() => setShowRefundModal(false)}
                refundAmount={refundAmount}
                setRefundAmount={setRefundAmount}
                refundReason={refundReason}
                setRefundReason={setRefundReason}
                refundReasonText={refundReasonText}
                setRefundReasonText={setRefundReasonText}
                refundNotes={refundNotes}
                setRefundNotes={setRefundNotes}
                returnRequired={returnRequired}
                setReturnRequired={setReturnRequired}
                isCreating={isCreatingRefund}
                onSubmit={handleCreateRefund}
            />

            {/* Status Banner */}
            <OrderStatusBanner order={order} />

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
                    {/* Timeline */}
                    <OrderTimeline order={order} />

                    {/* Products */}
                    <OrderItemsList order={order} />

                    {/* Update Status */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-6">
                        <h2 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-zinc-400" />
                            Status bijwerken
                        </h2>
                        <div className="space-y-4">
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                                className="w-full h-11 px-4 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            >
                                {ORDER_STATUS_OPTIONS.map((status) => (
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
                                    `Bijwerken naar ${ORDER_STATUS_OPTIONS.find(s => s.value === selectedStatus)?.label}`
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
                                <p className="font-medium text-zinc-900">{order.customerName}</p>
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
                                    onClick={handleDownloadInvoice}
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Bekijk Factuur
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full bg-white hover:bg-purple-50"
                                    onClick={async () => {
                                        const token = localStorage.getItem("adminAccessToken");
                                        try {
                                            const response = await fetch(`/api/invoice/order/${order.id}/download`, {
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
                            <Button variant="outline" size="sm" asChild>
                                <a href={`mailto:${order.customerEmail}?subject=Over bestelling ${order.orderNumber}`}>
                                    <Mail className="w-4 h-4 mr-1" />
                                    Email
                                </a>
                            </Button>
                            {order.customerPhone && (
                                <>
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={`tel:${order.customerPhone}`}>
                                            <Phone className="w-4 h-4 mr-1" />
                                            Bellen
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                        asChild
                                    >
                                        <a
                                            href={`https://wa.me/${order.customerPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hallo ${order.customerName}, betreft uw bestelling ${order.orderNumber}.`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                            </svg>
                                            WhatsApp
                                        </a>
                                    </Button>
                                </>
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

                    {/* Fulfillment Type - Pickup */}
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
