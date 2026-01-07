/**
 * @core-only
 * 
 * Account Orders List Page View Model
 * 
 * Handles fetching and displaying user's order history.
 */

'use client';

import { useState, useEffect } from 'react';
import { api, getToken } from '@/lib/api';

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-l-yellow-500", label: "Wachtend op betaling" },
    PAID: { bg: "bg-blue-100", text: "text-blue-700", border: "border-l-blue-500", label: "Betaald" },
    PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", border: "border-l-blue-500", label: "In behandeling" },
    SHIPPED: { bg: "bg-purple-100", text: "text-purple-700", border: "border-l-purple-500", label: "Verzonden" },
    DELIVERED: { bg: "bg-green-100", text: "text-green-700", border: "border-l-green-500", label: "Afgeleverd" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", border: "border-l-red-500", label: "Geannuleerd" },
    REFUNDED: { bg: "bg-orange-100", text: "text-orange-700", border: "border-l-orange-500", label: "Terugbetaald" },
};

export interface OrderListItemVM {
    id: string;
    orderNumber: string;
    status: string;
    statusConfig: { bg: string; text: string; border: string; label: string };
    total: number;
    createdAt: string;
    itemCount: number;
    itemsSummary: string;
    isPending: boolean;
    isRefunded: boolean;
    isCancelled: boolean;
}

export interface AccountOrdersPageVM {
    isLoading: boolean;
    needsLogin: boolean;
    userEmail: string | null;
    orders: OrderListItemVM[];
    hasOrders: boolean;
}

export function useAccountOrdersPageVM(): AccountOrdersPageVM {
    const [orders, setOrders] = useState<OrderListItemVM[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                const token = getToken();
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const user = await api.getMe();
                setUserEmail(user.email);

                const ordersData = await api.getMyOrders(user.email);

                const processed: OrderListItemVM[] = ordersData.map((order: {
                    id: string;
                    orderNumber: string;
                    status: string;
                    total: number;
                    createdAt: string;
                    items: { productName: string; quantity: number }[];
                }) => ({
                    id: order.id,
                    orderNumber: order.orderNumber,
                    status: order.status,
                    statusConfig: STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING,
                    total: Number(order.total),
                    createdAt: order.createdAt,
                    itemCount: order.items.length,
                    itemsSummary: order.items.slice(0, 2).map(item =>
                        `${item.quantity}x ${item.productName}`
                    ).join(', ') + (order.items.length > 2 ? ` +${order.items.length - 2} more` : ''),
                    isPending: order.status === "PENDING",
                    isRefunded: order.status === "REFUNDED",
                    isCancelled: order.status === "CANCELLED",
                }));

                setOrders(processed);
            } catch (error) {
                console.error("Failed to load orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, []);

    return {
        isLoading,
        needsLogin: !isLoading && !userEmail,
        userEmail,
        orders,
        hasOrders: orders.length > 0,
    };
}
