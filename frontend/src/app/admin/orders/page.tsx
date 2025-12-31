"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
} from "lucide-react";

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    fulfillmentType?: string;
    paidAt?: string;
    items: { productName: string; quantity: number; price: number }[];
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
    PENDING: { icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200", label: "In afwachting" },
    PAID: { icon: CheckCircle, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Betaald" },
    PROCESSING: { icon: Package, color: "text-blue-600", bg: "bg-blue-50 border-blue-200", label: "Verwerken" },
    SHIPPED: { icon: Truck, color: "text-purple-600", bg: "bg-purple-50 border-purple-200", label: "Verzonden" },
    DELIVERED: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50 border-green-200", label: "Afgeleverd" },
    CANCELLED: { icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200", label: "Geannuleerd" },
    REFUNDED: { icon: RotateCcw, color: "text-orange-600", bg: "bg-orange-50 border-orange-200", label: "Terugbetaald" },
};

// Notification toast component
function NotificationToast({
    order,
    onClose,
    onClick
}: {
    order: Order;
    onClose: () => void;
    onClick: () => void;
}) {
    useEffect(() => {
        const timer = setTimeout(onClose, 15000); // Auto-dismiss after 15s
        return () => clearTimeout(timer);
    }, [onClose]);

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
                <button
                    onClick={(e) => { e.stopPropagation(); onClose(); }}
                    className="hover:bg-white/20 rounded-full p-1"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function OrderCard({ order, onClick, isNew, isSelected, onSelect }: {
    order: Order;
    onClick: () => void;
    isNew?: boolean;
    isSelected?: boolean;
    onSelect?: (checked: boolean) => void;
}) {
    const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
    const StatusIcon = config.icon;
    const timeAgo = getTimeAgo(order.createdAt);

    // Determine urgency and payment status
    const isUnpaid = order.status === "PENDING";
    const isRefunded = order.status === "REFUNDED";
    const isCancelled = order.status === "CANCELLED";
    const needsAction = order.status === "PAID" || order.status === "PROCESSING";

    // Border colors based on status
    const borderColors: Record<string, string> = {
        PENDING: "border-l-yellow-500",
        PAID: "border-l-blue-500",
        PROCESSING: "border-l-blue-500",
        SHIPPED: "border-l-purple-500",
        DELIVERED: "border-l-green-500",
        CANCELLED: "border-l-red-500",
        REFUNDED: "border-l-orange-500",
    };

    return (
        <div
            className={`bg-white rounded-xl border border-l-4 p-5 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden
                ${borderColors[order.status] || "border-l-zinc-300"}
                ${isNew ? 'ring-2 ring-green-400/50 animate-pulse-glow' : ''}
                ${isUnpaid ? 'bg-yellow-50/50' : ''}
                ${isRefunded ? 'bg-orange-50/30' : ''}
                ${isCancelled ? 'bg-red-50/30 opacity-75' : ''}
                ${isSelected ? 'ring-2 ring-blue-500' : ''}
            `}
        >
            {/* Checkbox for selection */}
            {onSelect && (
                <div
                    className="absolute top-3 left-3 z-10"
                    onClick={(e) => { e.stopPropagation(); onSelect(!isSelected); }}
                >
                    {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-600" />
                    ) : (
                        <Square className="w-5 h-5 text-zinc-400 hover:text-blue-500" />
                    )}
                </div>
            )}
            {/* Main content - clickable */}
            <div onClick={onClick} className={onSelect ? "ml-6" : ""}>
                {/* Status badges in top right */}
                <div className="absolute top-0 right-0 flex">
                    {isNew && (
                        <div className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            NIEUW!
                        </div>
                    )}
                    {needsAction && !isNew && (
                        <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg animate-pulse">
                            ⚡ ACTIE
                        </div>
                    )}
                    {isUnpaid && (
                        <div className="bg-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ONBETAALD
                        </div>
                    )}
                    {isRefunded && (
                        <div className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
                            💸 TERUGBETAALD
                        </div>
                    )}
                </div>

                <div className="flex items-start justify-between mb-4">
                    {/* Order Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                            <span className="font-bold text-zinc-900 text-lg">{order.orderNumber}</span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.color}`}>
                                <StatusIcon className="w-3 h-3 inline mr-1" />
                                {config.label}
                            </span>
                        </div>
                        <p className={`text-sm ${isNew ? 'text-green-600 font-medium' : 'text-zinc-500'}`}>{timeAgo}</p>
                    </div>

                    {/* Total with payment indicator */}
                    <div className="text-right">
                        <div className="flex items-center justify-end gap-2">
                            {/* Payment status icon */}
                            {isUnpaid && <span className="text-yellow-500 text-lg">⏳</span>}
                            {order.status === "PAID" && <span className="text-blue-500 text-lg">💰</span>}
                            {isRefunded && <span className="text-orange-500 text-lg">💸</span>}

                            <p className={`text-2xl font-bold 
                            ${isNew ? 'text-green-600' : ''} 
                            ${isRefunded ? 'text-orange-600 line-through' : ''} 
                            ${isCancelled ? 'text-red-400 line-through' : ''}
                            ${!isNew && !isRefunded && !isCancelled ? 'text-zinc-900' : ''}
                        `}>
                                €{order.total.toFixed(2)}
                            </p>
                        </div>
                        <p className="text-xs text-zinc-500">{order.items.length} product{order.items.length !== 1 ? "en" : ""}</p>
                    </div>
                </div>

                {/* Customer Info */}
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

function getTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Zojuist";
    if (diffMins < 60) return `${diffMins} min geleden`;
    if (diffHours < 24) return `${diffHours} uur geleden`;
    if (diffDays < 7) return `${diffDays} dag${diffDays !== 1 ? "en" : ""} geleden`;

    return date.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create a simple notification beep using Web Audio API
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

        // Create two beeps for a nice notification sound
        const playBeep = (frequency: number, startTime: number, duration: number) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
            gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

            oscillator.start(startTime);
            oscillator.stop(startTime + duration);
        };

        const now = audioContext.currentTime;
        playBeep(880, now, 0.15);        // A5
        playBeep(1108.73, now + 0.15, 0.15); // C#6
        playBeep(1318.51, now + 0.3, 0.2);   // E6

    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

function OrdersContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status") || "";

    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<Order | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const previousOrderIdsRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    // Bulk selection state
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState("");
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const loadOrders = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            // Use relative path to go through Next.js proxy for tenant resolution
            const response = await fetch(`/api/orders/admin/all`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                const transformedOrders = data.map((order: {
                    id: string;
                    orderNumber: string;
                    status: string;
                    total: number;
                    createdAt: string;
                    customerEmail: string;
                    customerName: string;
                    customerPhone?: string;
                    fulfillmentType?: string;
                    paidAt?: string;
                    items: { productName: string; quantity: number; unitPrice: number }[];
                }) => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    total: Number(order.total),
                    createdAt: order.createdAt,
                    customerEmail: order.customerEmail,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    fulfillmentType: order.fulfillmentType,
                    paidAt: order.paidAt,
                    items: order.items.map((item) => ({
                        productName: item.productName,
                        quantity: item.quantity,
                        price: Number(item.unitPrice),
                    })),
                }));

                // Sort by newest first
                transformedOrders.sort((a: Order, b: Order) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Check for new orders (not on first load)
                if (!isFirstLoadRef.current) {
                    const currentIds = new Set(transformedOrders.map((o: Order) => o.id));
                    const newOrders = transformedOrders.filter((o: Order) => !previousOrderIdsRef.current.has(o.id));

                    if (newOrders.length > 0) {
                        // Mark new orders for highlighting
                        setNewOrderIds(new Set(newOrders.map((o: Order) => o.id)));

                        // Show notification for the newest order
                        setNotification(newOrders[0]);

                        // Play sound
                        if (soundEnabled) {
                            playNotificationSound();
                        }

                        // Clear highlight after 30 seconds
                        setTimeout(() => {
                            setNewOrderIds(new Set());
                        }, 30000);
                    }

                    previousOrderIdsRef.current = currentIds as Set<string>;
                } else {
                    previousOrderIdsRef.current = new Set(transformedOrders.map((o: Order) => o.id));
                    isFirstLoadRef.current = false;
                }

                setOrders(transformedOrders);
            }
        } catch (error) {
            console.error("Failed to load orders:", error);
        } finally {
            if (!silent) setIsLoading(false);
        }
    }, [soundEnabled]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadOrders();
        setIsRefreshing(false);
    };

    // Bulk action handlers
    const toggleOrderSelection = (orderId: string, selected: boolean) => {
        setSelectedOrders(prev => {
            const next = new Set(prev);
            if (selected) {
                next.add(orderId);
            } else {
                next.delete(orderId);
            }
            return next;
        });
    };

    const selectAllFiltered = () => {
        setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    };

    const clearSelection = () => {
        setSelectedOrders(new Set());
        setBulkStatus("");
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus || selectedOrders.size === 0) return;

        setIsBulkUpdating(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            // Use relative path for tenant resolution
            const response = await fetch(`/api/orders/bulk/status`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderIds: Array.from(selectedOrders),
                    status: bulkStatus,
                }),
            });

            if (response.ok) {
                const result = await response.json();
                alert(`${result.success.length} bestellingen bijgewerkt!`);
                clearSelection();
                await loadOrders();
            } else {
                alert("Fout bij bulk update");
            }
        } catch (error) {
            console.error("Bulk update failed:", error);
            alert("Fout bij bulk update");
        } finally {
            setIsBulkUpdating(false);
        }
    };

    const handlePrintLabels = async () => {
        if (selectedOrders.size === 0) return;

        try {
            const token = localStorage.getItem("adminAccessToken");
            // Use relative path for tenant resolution  
            const response = await fetch(`/api/orders/bulk/labels`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orderIds: Array.from(selectedOrders),
                }),
            });

            if (response.ok) {
                const result = await response.json();
                // Open print dialog with labels
                const printWindow = window.open("", "_blank");
                if (printWindow) {
                    printWindow.document.write(`
                        <html>
                        <head>
                            <title>Verzendlabels</title>
                            <style>
                                body { font-family: Arial, sans-serif; }
                                .label { border: 2px solid black; padding: 20px; margin: 20px; page-break-after: always; }
                                .order-number { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
                                .customer { font-size: 18px; margin-bottom: 10px; }
                                .address { font-size: 16px; line-height: 1.5; }
                                .items { margin-top: 15px; font-size: 14px; }
                                @media print { .label { page-break-after: always; } }
                            </style>
                        </head>
                        <body>
                            ${result.labels.map((label: { orderNumber: string; customerName: string; address: { line1: string; line2?: string; postalCode: string; city: string; country: string } | null; items: { name: string; quantity: number }[] }) => `
                                <div class="label">
                                    <div class="order-number">${label.orderNumber}</div>
                                    <div class="customer">${label.customerName}</div>
                                    ${label.address ? `
                                        <div class="address">
                                            ${label.address.line1}<br/>
                                            ${label.address.line2 ? label.address.line2 + '<br/>' : ''}
                                            ${label.address.postalCode} ${label.address.city}<br/>
                                            ${label.address.country}
                                        </div>
                                    ` : '<div class="address">Pickup - Geen verzending</div>'}
                                    <div class="items">
                                        <strong>Items:</strong><br/>
                                        ${label.items.map((item: { name: string; quantity: number }) => `${item.quantity}x ${item.name}`).join('<br/>')}
                                    </div>
                                </div>
                            `).join('')}
                        </body>
                        </html>
                    `);
                    printWindow.document.close();
                    printWindow.print();
                }
            }
        } catch (error) {
            console.error("Print labels failed:", error);
            alert("Fout bij genereren labels");
        }
    };

    // Initial load
    useEffect(() => {
        loadOrders();
    }, [statusFilter, loadOrders]);

    // Auto-refresh every 15 seconds for real-time updates
    useEffect(() => {
        const interval = setInterval(() => {
            loadOrders(true); // Silent refresh
        }, 15000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    const filteredOrders = orders.filter((order) => {
        const matchesStatus = !statusFilter || order.status === statusFilter;
        const matchesSearch =
            !searchQuery ||
            order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const statusCounts = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    // Calculate stats
    const pendingCount = statusCounts["PENDING"] || 0;
    const processingCount = statusCounts["PROCESSING"] || 0;
    const paidCount = statusCounts["PAID"] || 0;
    const todaysOrders = orders.filter(o => {
        const orderDate = new Date(o.createdAt);
        const today = new Date();
        return orderDate.toDateString() === today.toDateString();
    }).length;
    const todaysRevenue = orders
        .filter(o => {
            const orderDate = new Date(o.createdAt);
            const today = new Date();
            return orderDate.toDateString() === today.toDateString() && o.status !== "CANCELLED";
        })
        .reduce((sum, o) => sum + o.total, 0);

    return (
        <div className="space-y-6">
            {/* New Order Notification Toast */}
            {notification && (
                <NotificationToast
                    order={notification}
                    onClose={() => setNotification(null)}
                    onClick={() => {
                        router.push(`/admin/orders/${notification.id}`);
                        setNotification(null);
                    }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Bestellingen</h1>
                    <p className="text-zinc-500">{orders.length} bestellingen totaal</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Sound toggle */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSoundEnabled(!soundEnabled)}
                        title={soundEnabled ? "Geluid uitschakelen" : "Geluid inschakelen"}
                    >
                        {soundEnabled ? (
                            <Volume2 className="w-4 h-4" />
                        ) : (
                            <VolumeX className="w-4 h-4" />
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Stats Cards - with attention indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Vandaag</p>
                    <p className="text-2xl font-bold text-zinc-900">{todaysOrders}</p>
                    <p className="text-xs text-zinc-500">bestellingen</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Omzet vandaag</p>
                    <p className="text-2xl font-bold text-green-600">€{todaysRevenue.toFixed(2)}</p>
                    <p className="text-xs text-zinc-500">excl. geannuleerd</p>
                </div>
                <div className={`rounded-xl border p-4 ${(paidCount + processingCount) > 0 ? 'bg-blue-50 border-blue-300 animate-pulse-subtle' : 'bg-white border-zinc-200'}`}>
                    <p className="text-sm text-blue-700 mb-1">⚡ Te verwerken</p>
                    <p className="text-2xl font-bold text-blue-700">{paidCount + processingCount}</p>
                    <p className="text-xs text-blue-600">wachtend op actie</p>
                </div>
                <div className={`rounded-xl border p-4 ${pendingCount > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-zinc-200'}`}>
                    <p className="text-sm text-yellow-700 mb-1">Onbetaald</p>
                    <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
                    <p className="text-xs text-yellow-600">wachtend op betaling</p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        type="text"
                        placeholder="Zoek op bestelnummer, naam of email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={!statusFilter ? "default" : "outline"}
                        size="sm"
                        onClick={() => router.push("/admin/orders")}
                    >
                        Alle ({orders.length})
                    </Button>
                    {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                        <Button
                            key={status}
                            variant={statusFilter === status ? "default" : "outline"}
                            size="sm"
                            onClick={() => router.push(`/admin/orders?status=${status}`)}
                            className={statusFilter === status ? "" : `hover:${config.bg}`}
                        >
                            {config.label} ({statusCounts[status] || 0})
                        </Button>
                    ))}
                </div>
            </div>

            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2 text-xs text-zinc-400">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Live updates actief - vernieuwt elke 15 seconden
            </div>

            {/* Bulk Action Toolbar - appears when orders selected */}
            {selectedOrders.size > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white rounded-xl shadow-2xl px-6 py-4 flex items-center gap-4">
                    <span className="font-medium">{selectedOrders.size} geselecteerd</span>
                    <div className="h-6 w-px bg-zinc-700" />
                    <select
                        value={bulkStatus}
                        onChange={(e) => setBulkStatus(e.target.value)}
                        className="bg-zinc-800 text-white rounded-lg px-3 py-2 text-sm"
                    >
                        <option value="">Kies status...</option>
                        <option value="PROCESSING">Verwerken</option>
                        <option value="SHIPPED">Verzonden</option>
                        <option value="DELIVERED">Afgeleverd</option>
                        <option value="CANCELLED">Geannuleerd</option>
                    </select>
                    <Button
                        size="sm"
                        onClick={handleBulkStatusUpdate}
                        disabled={!bulkStatus || isBulkUpdating}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {isBulkUpdating ? "Bezig..." : "Update Status"}
                    </Button>
                    <div className="h-6 w-px bg-zinc-700" />
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={handlePrintLabels}
                        className="border-zinc-700 text-white hover:bg-zinc-800"
                    >
                        <Printer className="w-4 h-4 mr-2" />
                        Print Labels
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={clearSelection}
                        className="text-zinc-400 hover:text-white"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            )}

            {/* Select All / Clear buttons */}
            {!isLoading && filteredOrders.length > 0 && (
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllFiltered}
                    >
                        <CheckSquare className="w-4 h-4 mr-2" />
                        Selecteer alle ({filteredOrders.length})
                    </Button>
                    {selectedOrders.size > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={clearSelection}
                        >
                            Deselecteer
                        </Button>
                    )}
                </div>
            )}

            {/* Orders Grid - sorted by newest first */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
                            <div className="flex justify-between mb-4">
                                <div className="space-y-2">
                                    <div className="h-5 bg-zinc-200 rounded w-32" />
                                    <div className="h-4 bg-zinc-200 rounded w-24" />
                                </div>
                                <div className="h-8 bg-zinc-200 rounded w-20" />
                            </div>
                            <div className="pt-4 border-t border-zinc-100">
                                <div className="h-4 bg-zinc-200 rounded w-40" />
                            </div>
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
                    {filteredOrders.map((order) => (
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
        <Suspense fallback={<div className="p-8 text-zinc-500">Bestellingen laden...</div>}>
            <OrdersContent />
        </Suspense>
    );
}
