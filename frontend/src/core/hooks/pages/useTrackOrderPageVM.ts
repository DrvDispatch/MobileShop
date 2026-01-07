/**
 * @core-only
 * Track Order Page View Model
 */

'use client';

import { useState, useCallback } from 'react';

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
    PENDING: { iconType: "clock", color: "text-yellow-500", bg: "bg-yellow-50", label: "In afwachting van betaling" },
    PAID: { iconType: "check", color: "text-blue-500", bg: "bg-blue-50", label: "Betaald" },
    PROCESSING: { iconType: "package", color: "text-blue-500", bg: "bg-blue-50", label: "Wordt verwerkt" },
    SHIPPED: { iconType: "truck", color: "text-purple-500", bg: "bg-purple-50", label: "Verzonden" },
    DELIVERED: { iconType: "check", color: "text-green-500", bg: "bg-green-50", label: "Afgeleverd" },
    CANCELLED: { iconType: "x", color: "text-red-500", bg: "bg-red-50", label: "Geannuleerd" },
};

export interface TimelineStep {
    key: string;
    label: string;
    date: string | null | undefined;
    completed: boolean;
    isCancelled?: boolean;
}

export interface TrackOrderVM {
    orderNumber: string;
    isLoading: boolean;
    order: OrderStatus | null;
    error: string | null;
    statusConfig: { iconType: string; color: string; bg: string; label: string } | null;
    timelineSteps: TimelineStep[];
    onOrderNumberChange: (value: string) => void;
    onTrack: (e: React.FormEvent) => void;
}

export function useTrackOrderPageVM(): TrackOrderVM {
    const [orderNumber, setOrderNumber] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [order, setOrder] = useState<OrderStatus | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onOrderNumberChange = useCallback((value: string) => {
        setOrderNumber(value.toUpperCase());
    }, []);

    const onTrack = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderNumber.trim()) {
            setError("Voer een bestelnummer in");
            return;
        }

        setIsLoading(true);
        setError(null);
        setOrder(null);

        try {
            const response = await fetch(`/api/orders/track/${orderNumber.trim()}`);
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
    }, [orderNumber]);

    const statusConfig = order ? STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.PENDING : null;

    const getTimelineSteps = (): TimelineStep[] => {
        if (!order) return [];
        if (order.status === "CANCELLED") {
            return [{ key: "cancelled", label: "Geannuleerd", date: null, completed: true, isCancelled: true }];
        }
        return [
            { key: "ordered", label: "Besteld", date: order.createdAt, completed: true },
            { key: "paid", label: "Betaald", date: order.paidAt, completed: !!order.paidAt },
            { key: "shipped", label: "Verzonden", date: order.shippedAt, completed: !!order.shippedAt },
            { key: "delivered", label: "Afgeleverd", date: order.deliveredAt, completed: !!order.deliveredAt },
        ];
    };

    return {
        orderNumber,
        isLoading,
        order,
        error,
        statusConfig,
        timelineSteps: getTimelineSteps(),
        onOrderNumberChange,
        onTrack,
    };
}
