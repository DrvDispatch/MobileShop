"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, RefreshCcw, Check, X, AlertCircle, Clock, DollarSign,
    Package, Search, ChevronDown, ChevronUp, ExternalLink
} from "lucide-react";

interface RefundData {
    id: string;
    orderId: string;
    stripeRefundId?: string;
    amount: number;
    currency: string;
    status: "PENDING" | "PROCESSING" | "SUCCEEDED" | "FAILED" | "CANCELLED";
    reason: string;
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
    order: {
        orderNumber: string;
        customerName: string;
        customerEmail: string;
    };
}

interface RefundStats {
    pending: number;
    processing: number;
    succeeded: number;
    failed: number;
    totalRefundedAmount: number;
}

const statusConfig: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
    PENDING: { label: "In afwachting", bg: "bg-yellow-100", text: "text-yellow-700", icon: <Clock className="w-4 h-4" /> },
    PROCESSING: { label: "Verwerken", bg: "bg-blue-100", text: "text-blue-700", icon: <RefreshCcw className="w-4 h-4 animate-spin" /> },
    SUCCEEDED: { label: "Voltooid", bg: "bg-green-100", text: "text-green-700", icon: <Check className="w-4 h-4" /> },
    FAILED: { label: "Mislukt", bg: "bg-red-100", text: "text-red-700", icon: <AlertCircle className="w-4 h-4" /> },
    CANCELLED: { label: "Geannuleerd", bg: "bg-zinc-100", text: "text-zinc-600", icon: <X className="w-4 h-4" /> },
};

const reasonLabels: Record<string, string> = {
    DUPLICATE: "Dubbele betaling",
    FRAUDULENT: "Fraude",
    REQUESTED_BY_CUSTOMER: "Klantverzoek",
    DEFECTIVE_PRODUCT: "Defect product",
    WRONG_PRODUCT: "Verkeerd product",
    SHIPPING_DAMAGE: "Transportschade",
    OTHER: "Anders",
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function AdminRefundsPage() {
    const router = useRouter();
    const [refunds, setRefunds] = useState<RefundData[]>([]);
    const [stats, setStats] = useState<RefundStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>("");
    const [searchQuery, setSearchQuery] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchRefunds = useCallback(async () => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            if (!token) {
                router.push("/admin/login");
                return;
            }

            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);

            const [refundsRes, statsRes] = await Promise.all([
                fetch(`${API_URL}/api/refunds?${params.toString()}`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`${API_URL}/api/refunds/stats`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (refundsRes.ok) {
                const refundsData = await refundsRes.json();
                setRefunds(refundsData.data || refundsData);
            }
            if (statsRes.ok) {
                const statsData = await statsRes.json();
                setStats(statsData);
            }
        } catch (error) {
            console.error("Failed to fetch refunds:", error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, router]);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    const handleProcess = async (refundId: string) => {
        if (!confirm("Weet je zeker dat je deze terugbetaling wilt verwerken via Stripe?")) return;

        setProcessing(refundId);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const response = await fetch(`${API_URL}/api/refunds/${refundId}/process`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Verwerken mislukt");
            }
            await fetchRefunds();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Verwerken mislukt";
            alert(errorMessage);
        } finally {
            setProcessing(null);
        }
    };

    const handleCancel = async (refundId: string) => {
        if (!confirm("Weet je zeker dat je deze terugbetaling wilt annuleren?")) return;

        try {
            const token = localStorage.getItem("adminAccessToken");
            const response = await fetch(`${API_URL}/api/refunds/${refundId}/cancel`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || "Annuleren mislukt");
            }
            await fetchRefunds();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Annuleren mislukt";
            alert(errorMessage);
        }
    };

    const filteredRefunds = refunds.filter(refund => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                refund.order.orderNumber.toLowerCase().includes(query) ||
                refund.order.customerName.toLowerCase().includes(query) ||
                refund.order.customerEmail.toLowerCase().includes(query)
            );
        }
        return true;
    });

    if (loading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link
                                href="/admin"
                                className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">Terugbetalingen</h1>
                                <p className="text-sm text-zinc-500">Beheer refunds en retourzendingen</p>
                            </div>
                        </div>
                        <button
                            onClick={() => fetchRefunds()}
                            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                        >
                            <RefreshCcw className="w-4 h-4" />
                            Vernieuwen
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-yellow-700 mb-1">
                                <Clock className="w-4 h-4" />
                                <span className="text-sm font-medium">In afwachting</span>
                            </div>
                            <p className="text-2xl font-bold text-yellow-900">{stats.pending}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-blue-700 mb-1">
                                <RefreshCcw className="w-4 h-4" />
                                <span className="text-sm font-medium">Verwerken</span>
                            </div>
                            <p className="text-2xl font-bold text-blue-900">{stats.processing}</p>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-green-700 mb-1">
                                <Check className="w-4 h-4" />
                                <span className="text-sm font-medium">Voltooid</span>
                            </div>
                            <p className="text-2xl font-bold text-green-900">{stats.succeeded}</p>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-red-700 mb-1">
                                <AlertCircle className="w-4 h-4" />
                                <span className="text-sm font-medium">Mislukt</span>
                            </div>
                            <p className="text-2xl font-bold text-red-900">{stats.failed}</p>
                        </div>
                        <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                            <div className="flex items-center gap-2 text-violet-700 mb-1">
                                <DollarSign className="w-4 h-4" />
                                <span className="text-sm font-medium">Totaal terugbetaald</span>
                            </div>
                            <p className="text-2xl font-bold text-violet-900">
                                €{stats.totalRefundedAmount.toFixed(2)}
                            </p>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Zoeken op bestelnummer, naam, email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white"
                        >
                            <option value="">Alle statussen</option>
                            <option value="PENDING">In afwachting</option>
                            <option value="PROCESSING">Verwerken</option>
                            <option value="SUCCEEDED">Voltooid</option>
                            <option value="FAILED">Mislukt</option>
                            <option value="CANCELLED">Geannuleerd</option>
                        </select>
                    </div>
                </div>

                {/* Refunds List */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    {filteredRefunds.length === 0 ? (
                        <div className="p-12 text-center">
                            <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                            <p className="text-zinc-500">Geen terugbetalingen gevonden</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {filteredRefunds.map((refund) => {
                                const status = statusConfig[refund.status] || statusConfig.PENDING;
                                const isExpanded = expandedId === refund.id;

                                return (
                                    <div key={refund.id} className="hover:bg-zinc-50 transition-colors">
                                        <div
                                            className="p-4 cursor-pointer"
                                            onClick={() => setExpandedId(isExpanded ? null : refund.id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2 rounded-lg ${status.bg}`}>
                                                        {status.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-zinc-900">
                                                                €{Number(refund.amount).toFixed(2)}
                                                            </span>
                                                            <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                                                                {status.label}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-zinc-500">
                                                            Order: {refund.order.orderNumber} • {refund.order.customerName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-400">
                                                        {new Date(refund.createdAt).toLocaleDateString("nl-BE")}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-4 h-4 text-zinc-400" />
                                                    ) : (
                                                        <ChevronDown className="w-4 h-4 text-zinc-400" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Expanded details */}
                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-zinc-100 bg-zinc-50">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                                                    <div>
                                                        <p className="text-xs text-zinc-500 mb-1">Reden</p>
                                                        <p className="text-sm font-medium">{reasonLabels[refund.reason] || refund.reason}</p>
                                                        {refund.reasonText && (
                                                            <p className="text-sm text-zinc-600 mt-1">{refund.reasonText}</p>
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-zinc-500 mb-1">Klant</p>
                                                        <p className="text-sm">{refund.order.customerEmail}</p>
                                                    </div>
                                                    {refund.returnRequired && (
                                                        <div>
                                                            <p className="text-xs text-zinc-500 mb-1">Retourzending</p>
                                                            <p className={`text-sm font-medium ${refund.returnReceived ? "text-green-600" : "text-yellow-600"}`}>
                                                                {refund.returnReceived ? "✓ Ontvangen" : "⏳ In afwachting"}
                                                            </p>
                                                            {refund.returnTrackingNumber && (
                                                                <p className="text-xs text-zinc-500 mt-1">Track: {refund.returnTrackingNumber}</p>
                                                            )}
                                                        </div>
                                                    )}
                                                    {refund.stripeRefundId && (
                                                        <div>
                                                            <p className="text-xs text-zinc-500 mb-1">Stripe Refund ID</p>
                                                            <p className="text-sm font-mono text-xs">{refund.stripeRefundId}</p>
                                                        </div>
                                                    )}
                                                    {refund.failureReason && (
                                                        <div className="md:col-span-2">
                                                            <p className="text-xs text-red-500 mb-1">Foutmelding</p>
                                                            <p className="text-sm text-red-600">{refund.failureReason}</p>
                                                        </div>
                                                    )}
                                                    {refund.adminNotes && (
                                                        <div className="md:col-span-2">
                                                            <p className="text-xs text-zinc-500 mb-1">Interne notities</p>
                                                            <p className="text-sm text-zinc-600">{refund.adminNotes}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center gap-3 pt-3 border-t border-zinc-200">
                                                    <Link
                                                        href={`/admin/orders/${refund.orderId}`}
                                                        className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        Bekijk order
                                                    </Link>

                                                    {refund.status === "PENDING" && (
                                                        <>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleProcess(refund.id);
                                                                }}
                                                                disabled={processing === refund.id}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50"
                                                            >
                                                                {processing === refund.id ? (
                                                                    <RefreshCcw className="w-3 h-3 animate-spin" />
                                                                ) : (
                                                                    <Check className="w-3 h-3" />
                                                                )}
                                                                Verwerk via Stripe
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleCancel(refund.id);
                                                                }}
                                                                className="flex items-center gap-1 px-3 py-1.5 bg-zinc-200 text-zinc-700 text-sm rounded-lg hover:bg-zinc-300"
                                                            >
                                                                <X className="w-3 h-3" />
                                                                Annuleren
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
