"use client";

import Link from "next/link";
import { ArrowLeft, RefreshCcw, Check, X, AlertCircle, Clock, DollarSign, Package, Search, ChevronDown, ChevronUp, ExternalLink, Loader2 } from "lucide-react";
import { useRefunds, REFUND_STATUS_CONFIGS, REFUND_REASON_LABELS, type RefundData } from "@/lib/admin/refunds";

// Status icons mapping
const STATUS_ICONS: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4" />,
    PROCESSING: <RefreshCcw className="w-4 h-4 animate-spin" />,
    SUCCEEDED: <Check className="w-4 h-4" />,
    FAILED: <AlertCircle className="w-4 h-4" />,
    CANCELLED: <X className="w-4 h-4" />,
};

export default function AdminRefundsPage() {
    const {
        filteredRefunds, stats, isLoading, processingId,
        searchQuery, setSearchQuery, statusFilter, setStatusFilter,
        expandedId, toggleExpanded,
        refresh, processRefund, cancelRefund, getStatusConfig, getReasonLabel,
    } = useRefunds();

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-violet-600" />
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
                            <Link href="/admin" className="p-2 hover:bg-zinc-100 rounded-lg transition-colors">
                                <ArrowLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-900">Terugbetalingen</h1>
                                <p className="text-sm text-zinc-500">Beheer refunds en retourzendingen</p>
                            </div>
                        </div>
                        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors">
                            <RefreshCcw className="w-4 h-4" />Vernieuwen
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats */}
                {stats && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                        <StatCard icon={<Clock className="w-4 h-4" />} label="In afwachting" value={stats.pending} color="yellow" />
                        <StatCard icon={<RefreshCcw className="w-4 h-4" />} label="Verwerken" value={stats.processing} color="blue" />
                        <StatCard icon={<Check className="w-4 h-4" />} label="Voltooid" value={stats.succeeded} color="green" />
                        <StatCard icon={<AlertCircle className="w-4 h-4" />} label="Mislukt" value={stats.failed} color="red" />
                        <StatCard icon={<DollarSign className="w-4 h-4" />} label="Totaal terugbetaald" value={`€${stats.totalRefundedAmount.toFixed(2)}`} color="violet" />
                    </div>
                )}

                {/* Filters */}
                <div className="bg-white rounded-xl border border-zinc-200 p-4 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <input type="text" placeholder="Zoeken op bestelnummer, naam, email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-violet-500 bg-white">
                            <option value="">Alle statussen</option>
                            {Object.entries(REFUND_STATUS_CONFIGS).map(([key, config]) => (
                                <option key={key} value={key}>{config.label}</option>
                            ))}
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
                            {filteredRefunds.map((refund) => (
                                <RefundRow
                                    key={refund.id}
                                    refund={refund}
                                    isExpanded={expandedId === refund.id}
                                    isProcessing={processingId === refund.id}
                                    onToggle={() => toggleExpanded(refund.id)}
                                    onProcess={() => processRefund(refund.id)}
                                    onCancel={() => cancelRefund(refund.id)}
                                    getStatusConfig={getStatusConfig}
                                    getReasonLabel={getReasonLabel}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
    const colors: Record<string, string> = {
        yellow: "bg-yellow-50 border-yellow-200 text-yellow-700",
        blue: "bg-blue-50 border-blue-200 text-blue-700",
        green: "bg-green-50 border-green-200 text-green-700",
        red: "bg-red-50 border-red-200 text-red-700",
        violet: "bg-violet-50 border-violet-200 text-violet-700",
    };
    const textColors: Record<string, string> = { yellow: "text-yellow-900", blue: "text-blue-900", green: "text-green-900", red: "text-red-900", violet: "text-violet-900" };
    return (
        <div className={`border rounded-xl p-4 ${colors[color]}`}>
            <div className="flex items-center gap-2 mb-1">{icon}<span className="text-sm font-medium">{label}</span></div>
            <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
        </div>
    );
}

function RefundRow({ refund, isExpanded, isProcessing, onToggle, onProcess, onCancel, getStatusConfig, getReasonLabel }: {
    refund: RefundData; isExpanded: boolean; isProcessing: boolean;
    onToggle: () => void; onProcess: () => void; onCancel: () => void;
    getStatusConfig: (s: string) => { label: string; color: string; bg: string };
    getReasonLabel: (r: string) => string;
}) {
    const status = getStatusConfig(refund.status);
    return (
        <div className="hover:bg-zinc-50 transition-colors">
            <div className="p-4 cursor-pointer" onClick={onToggle}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${status.bg}`}>{STATUS_ICONS[refund.status]}</div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-semibold text-zinc-900">€{Number(refund.amount).toFixed(2)}</span>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.color}`}>{status.label}</span>
                            </div>
                            <p className="text-sm text-zinc-500">Order: {refund.order.orderNumber} • {refund.order.customerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-xs text-zinc-400">{new Date(refund.createdAt).toLocaleDateString("nl-BE")}</span>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="px-4 pb-4 border-t border-zinc-100 bg-zinc-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                        <div>
                            <p className="text-xs text-zinc-500 mb-1">Reden</p>
                            <p className="text-sm font-medium">{getReasonLabel(refund.reason)}</p>
                            {refund.reasonText && <p className="text-sm text-zinc-600 mt-1">{refund.reasonText}</p>}
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
                                {refund.returnTrackingNumber && <p className="text-xs text-zinc-500 mt-1">Track: {refund.returnTrackingNumber}</p>}
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
                        <Link href={`/admin/orders/${refund.orderId}`} className="flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700">
                            <ExternalLink className="w-3 h-3" />Bekijk order
                        </Link>
                        {refund.status === "PENDING" && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); onProcess(); }} disabled={isProcessing}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50">
                                    {isProcessing ? <RefreshCcw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}Verwerk via Stripe
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); onCancel(); }}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-zinc-200 text-zinc-700 text-sm rounded-lg hover:bg-zinc-300">
                                    <X className="w-3 h-3" />Annuleren
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
