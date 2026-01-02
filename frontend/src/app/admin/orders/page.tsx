"use client";

import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    ShoppingCart,
    Package,
    Clock,
    Truck,
    CheckCircle,
    XCircle,
    ChevronRight,
    RefreshCw,
    Bell,
    Volume2,
    VolumeX,
    X,
    RotateCcw,
    Printer,
    CheckSquare,
    Square,
    Loader2,
} from "lucide-react";
import {
    useOrders,
    ORDER_STATUS_CONFIGS,
    getTimeAgo,
    type OrderListItem,
} from "@/lib/admin/orders";

// Status icons mapping
const STATUS_ICONS: Record<string, React.ElementType> = {
    PENDING: Clock,
    PAID: CheckCircle,
    PROCESSING: Package,
    SHIPPED: Truck,
    DELIVERED: CheckCircle,
    CANCELLED: XCircle,
    REFUNDED: RotateCcw,
};

// Notification toast component
function NotificationToast({ order, onClose, onClick }: { order: OrderListItem; onClose: () => void; onClick: () => void }) {
    return (
        <div
            className="fixed top-4 right-4 z-[100] animate-slide-in-right bg-green-600 text-white rounded-xl shadow-2xl p-4 max-w-sm cursor-pointer hover:bg-green-700 transition-colors"
            onClick={onClick}
        >
            <div className="flex items-start gap-3">
                <div className="bg-white/20 rounded-full p-2">
                    <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1">
                    <p className="font-bold text-lg">🎉 Nieuwe bestelling!</p>
                    <p className="font-semibold">{order.orderNumber}</p>
                    <p className="text-sm opacity-90">{order.customerName}</p>
                    <p className="text-lg font-bold mt-1">€{order.total.toFixed(2)}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="hover:bg-white/20 rounded-full p-1">
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

// Order Card Component
function OrderCard({ order, onClick, isNew, isSelected, onSelect }: {
    order: OrderListItem;
    onClick: () => void;
    isNew?: boolean;
    isSelected?: boolean;
    onSelect?: (checked: boolean) => void;
}) {
    const config = ORDER_STATUS_CONFIGS[order.status];
    const StatusIcon = STATUS_ICONS[order.status] || Clock;
    const timeAgo = getTimeAgo(order.createdAt);
    const isUnpaid = order.status === "PENDING";
    const isRefunded = order.status === "REFUNDED";
    const isCancelled = order.status === "CANCELLED";
    const needsAction = order.status === "PAID" || order.status === "PROCESSING";

    const borderColors: Record<string, string> = {
        PENDING: "border-l-yellow-500", PAID: "border-l-blue-500", PROCESSING: "border-l-blue-500",
        SHIPPED: "border-l-purple-500", DELIVERED: "border-l-green-500", CANCELLED: "border-l-red-500", REFUNDED: "border-l-orange-500",
    };

    return (
        <div
            className={`bg-white rounded-xl border border-l-4 p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden
                ${borderColors[order.status] || "border-l-zinc-300"}
                ${isNew ? 'ring-2 ring-green-400/50 animate-pulse-glow' : ''}
                ${isUnpaid ? 'bg-yellow-50/50' : ''} ${isRefunded ? 'bg-orange-50/30' : ''} ${isCancelled ? 'bg-red-50/30 opacity-75' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
        >
            {onSelect && (
                <div className="absolute top-3 left-3 z-10" onClick={(e) => { e.stopPropagation(); onSelect(!isSelected); }}>
                    {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-zinc-400 hover:text-blue-500" />}
                </div>
            )}
            <div onClick={onClick} className={onSelect ? "ml-6" : ""}>
                <div className="absolute top-0 right-0 flex">
                    {isNew && <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">NIEUW!</div>}
                    {needsAction && !isNew && <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg animate-pulse">⚡ ACTIE</div>}
                    {isUnpaid && <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1"><Clock className="w-3 h-3" />ONBETAALD</div>}
                    {isRefunded && <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">💸 TERUGBETAALD</div>}
                </div>

                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-zinc-900 text-lg">{order.orderNumber}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config?.bg} ${config?.color}`}>
                                <StatusIcon className="w-3 h-3 inline mr-1" />{config?.label}
                            </span>
                        </div>
                        <p className={`text-sm ${isNew ? 'text-green-600 font-medium' : 'text-zinc-500'}`}>{timeAgo}</p>
                    </div>
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            {isUnpaid && <span className="text-yellow-500 text-lg">⏳</span>}
                            {order.status === "PAID" && <span className="text-blue-500 text-lg">💰</span>}
                            {isRefunded && <span className="text-orange-500 text-lg">💸</span>}
                            <p className={`text-2xl font-bold ${isNew ? 'text-green-600' : ''} ${isRefunded ? 'text-orange-600 line-through' : ''} ${isCancelled ? 'text-red-400 line-through' : ''} ${!isNew && !isRefunded && !isCancelled ? 'text-zinc-900' : ''}`}>
                                €{order.total.toFixed(2)}
                            </p>
                        </div>
                        <p className="text-xs text-zinc-500">{order.items.length} product{order.items.length !== 1 ? "en" : ""}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
                    <div className="flex-1">
                        <p className="font-medium text-zinc-900">{order.customerName}</p>
                        <p className="text-sm text-zinc-500">{order.customerEmail}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all" />
                </div>
            </div>
        </div>
    );
}

function OrdersContent() {
    const router = useRouter();
    const {
        filteredOrders, newOrderIds, notification, isLoading, isRefreshing, isBulkUpdating,
        searchQuery, statusFilter, setSearchQuery, soundEnabled, toggleSound,
        selectedOrders, bulkStatus, setBulkStatus, toggleOrderSelection, selectAllFiltered, clearSelection,
        stats, refresh, handleBulkStatusUpdate, handlePrintLabels, dismissNotification,
    } = useOrders();

    return (
        <div className="space-y-6">
            {/* Notification Toast */}
            {notification && (
                <NotificationToast order={notification} onClose={dismissNotification} onClick={() => { router.push(`/admin/orders/${notification.id}`); dismissNotification(); }} />
            )}

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Bestellingen</h1>
                    <p className="text-zinc-500">{filteredOrders.length} bestellingen</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={toggleSound} title={soundEnabled ? "Geluid uit" : "Geluid aan"}>
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Vandaag</p>
                    <p className="text-2xl font-bold text-zinc-900">{stats.todaysOrders}</p>
                    <p className="text-sm text-green-600">€{stats.todaysRevenue.toFixed(0)}</p>
                </div>
                <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                    <p className="text-sm text-yellow-700">In afwachting</p>
                    <p className="text-2xl font-bold text-yellow-700">{stats.pendingCount}</p>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <p className="text-sm text-blue-700">Betaald</p>
                    <p className="text-2xl font-bold text-blue-700">{stats.paidCount}</p>
                </div>
                <div className="bg-purple-50 rounded-xl border border-purple-200 p-4">
                    <p className="text-sm text-purple-700">Verwerken</p>
                    <p className="text-2xl font-bold text-purple-700">{stats.processingCount}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700">Totaal</p>
                    <p className="text-2xl font-bold text-green-700">{filteredOrders.length}</p>
                </div>
            </div>

            {/* Search and Bulk Actions */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input type="text" placeholder="Zoek op bestelnummer, naam, of email..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                {selectedOrders.size > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-4 py-2">
                        <span className="text-sm font-medium text-blue-700">{selectedOrders.size} geselecteerd</span>
                        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="text-sm border border-blue-200 rounded px-2 py-1">
                            <option value="">Status...</option>
                            {Object.entries(ORDER_STATUS_CONFIGS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <Button size="sm" onClick={handleBulkStatusUpdate} disabled={!bulkStatus || isBulkUpdating}>
                            {isBulkUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update"}
                        </Button>
                        <Button size="sm" variant="outline" onClick={handlePrintLabels}><Printer className="w-4 h-4 mr-1" />Labels</Button>
                        <Button size="sm" variant="ghost" onClick={clearSelection}><X className="w-4 h-4" /></Button>
                    </div>
                )}
            </div>

            {/* Select All */}
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={selectAllFiltered}>Selecteer alles ({filteredOrders.length})</Button>
                {selectedOrders.size > 0 && <Button variant="ghost" size="sm" onClick={clearSelection}>Deselecteer</Button>}
            </div>

            {/* Orders Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
                            <div className="h-6 bg-zinc-200 rounded w-1/3 mb-4" />
                            <div className="h-4 bg-zinc-200 rounded w-1/2 mb-2" />
                            <div className="h-4 bg-zinc-200 rounded w-2/3" />
                        </div>
                    ))}
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                    <ShoppingCart className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Geen bestellingen gevonden</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredOrders.map(order => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onClick={() => router.push(`/admin/orders/${order.id}`)}
                            isNew={newOrderIds.has(order.id)}
                            isSelected={selectedOrders.has(order.id)}
                            onSelect={(checked) => toggleOrderSelection(order.id, checked)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function AdminOrdersPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-zinc-500">Laden...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
