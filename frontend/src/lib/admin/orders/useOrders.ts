/**
 * Orders Admin Hook (Enhanced)
 * 
 * Business logic for admin orders page.
 * Handles order listing, filtering, real-time updates, bulk actions, and notifications.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { adminFetch } from '@/lib/admin';

// OrderListItem - simplified order for list view (not the full Order for detail page)
export interface OrderListItem {
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

// Status configs with icons
export const ORDER_STATUS_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'In afwachting', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' },
    PAID: { label: 'Betaald', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    PROCESSING: { label: 'Verwerken', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    SHIPPED: { label: 'Verzonden', color: 'text-purple-600', bg: 'bg-purple-50 border-purple-200' },
    DELIVERED: { label: 'Afgeleverd', color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
    CANCELLED: { label: 'Geannuleerd', color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    REFUNDED: { label: 'Terugbetaald', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
};

// Play notification sound
export function playNotificationSound() {
    try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
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
        playBeep(880, now, 0.15);
        playBeep(1108.73, now + 0.15, 0.15);
        playBeep(1318.51, now + 0.3, 0.2);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Get time ago string
export function getTimeAgo(dateString: string): string {
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

export interface UseOrdersReturn {
    // Data
    orders: OrderListItem[];
    filteredOrders: OrderListItem[];
    newOrderIds: Set<string>;
    notification: OrderListItem | null;

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;
    isBulkUpdating: boolean;

    // Filters
    searchQuery: string;
    statusFilter: string;
    setSearchQuery: (q: string) => void;

    // Sound
    soundEnabled: boolean;
    toggleSound: () => void;

    // Selection
    selectedOrders: Set<string>;
    bulkStatus: string;
    setBulkStatus: (s: string) => void;
    toggleOrderSelection: (orderId: string, selected: boolean) => void;
    selectAllFiltered: () => void;
    clearSelection: () => void;

    // Stats
    stats: {
        pendingCount: number;
        processingCount: number;
        paidCount: number;
        todaysOrders: number;
        todaysRevenue: number;
        statusCounts: Record<string, number>;
    };

    // Actions
    refresh: () => Promise<void>;
    handleBulkStatusUpdate: () => Promise<void>;
    handlePrintLabels: () => Promise<void>;
    dismissNotification: () => void;
}

export function useOrders(): UseOrdersReturn {
    const searchParams = useSearchParams();
    const statusFilter = searchParams.get("status") || "";

    // Data state
    const [orders, setOrders] = useState<OrderListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Notification state
    const [newOrderIds, setNewOrderIds] = useState<Set<string>>(new Set());
    const [notification, setNotification] = useState<OrderListItem | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const previousOrderIdsRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    // Selection state
    const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
    const [bulkStatus, setBulkStatus] = useState("");
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    // Load orders
    const loadOrders = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const response = await fetch(`/api/orders/admin/all`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                const transformedOrders: OrderListItem[] = data.map((order: {
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
                transformedOrders.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );

                // Check for new orders (not on first load)
                if (!isFirstLoadRef.current) {
                    const currentIds = new Set(transformedOrders.map(o => o.id));
                    const newOrders = transformedOrders.filter(o => !previousOrderIdsRef.current.has(o.id));

                    if (newOrders.length > 0) {
                        setNewOrderIds(new Set(newOrders.map(o => o.id)));
                        setNotification(newOrders[0]);

                        if (soundEnabled) {
                            playNotificationSound();
                        }

                        setTimeout(() => setNewOrderIds(new Set()), 30000);
                    }

                    previousOrderIdsRef.current = currentIds;
                } else {
                    previousOrderIdsRef.current = new Set(transformedOrders.map(o => o.id));
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

    // Refresh
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadOrders();
        setIsRefreshing(false);
    }, [loadOrders]);

    // Initial load and polling
    useEffect(() => {
        loadOrders();
    }, [statusFilter, loadOrders]);

    useEffect(() => {
        const interval = setInterval(() => loadOrders(true), 15000);
        return () => clearInterval(interval);
    }, [loadOrders]);

    // Filtered orders
    const filteredOrders = useMemo(() => {
        return orders.filter(order => {
            const matchesStatus = !statusFilter || order.status === statusFilter;
            const matchesSearch = !searchQuery ||
                order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesStatus && matchesSearch;
        });
    }, [orders, statusFilter, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const today = new Date().toDateString();
        const todaysOrders = orders.filter(o => new Date(o.createdAt).toDateString() === today);
        const todaysRevenue = todaysOrders
            .filter(o => o.status !== "CANCELLED")
            .reduce((sum, o) => sum + o.total, 0);

        return {
            pendingCount: statusCounts["PENDING"] || 0,
            processingCount: statusCounts["PROCESSING"] || 0,
            paidCount: statusCounts["PAID"] || 0,
            todaysOrders: todaysOrders.length,
            todaysRevenue,
            statusCounts,
        };
    }, [orders]);

    // Toggle sound
    const toggleSound = useCallback(() => {
        setSoundEnabled(prev => !prev);
    }, []);

    // Selection handlers
    const toggleOrderSelection = useCallback((orderId: string, selected: boolean) => {
        setSelectedOrders(prev => {
            const next = new Set(prev);
            if (selected) next.add(orderId);
            else next.delete(orderId);
            return next;
        });
    }, []);

    const selectAllFiltered = useCallback(() => {
        setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }, [filteredOrders]);

    const clearSelection = useCallback(() => {
        setSelectedOrders(new Set());
        setBulkStatus("");
    }, []);

    // Bulk status update
    const handleBulkStatusUpdate = useCallback(async () => {
        if (!bulkStatus || selectedOrders.size === 0) return;
        setIsBulkUpdating(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
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
    }, [bulkStatus, selectedOrders, clearSelection, loadOrders]);

    // Print labels
    const handlePrintLabels = useCallback(async () => {
        if (selectedOrders.size === 0) return;
        try {
            const token = localStorage.getItem("adminAccessToken");
            const response = await fetch(`/api/orders/bulk/labels`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ orderIds: Array.from(selectedOrders) }),
            });

            if (response.ok) {
                const result = await response.json();
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
    }, [selectedOrders]);

    // Dismiss notification
    const dismissNotification = useCallback(() => {
        setNotification(null);
    }, []);

    return {
        orders,
        filteredOrders,
        newOrderIds,
        notification,
        isLoading,
        isRefreshing,
        isBulkUpdating,
        searchQuery,
        statusFilter,
        setSearchQuery,
        soundEnabled,
        toggleSound,
        selectedOrders,
        bulkStatus,
        setBulkStatus,
        toggleOrderSelection,
        selectAllFiltered,
        clearSelection,
        stats,
        refresh,
        handleBulkStatusUpdate,
        handlePrintLabels,
        dismissNotification,
    };
}
