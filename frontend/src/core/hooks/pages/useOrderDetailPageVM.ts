/**
 * @core-only
 * 
 * Order Detail Page View Model
 * 
 * Handles fetching order details and refund request submission.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api, getToken } from '@/lib/api';

const STATUS_CONFIG: Record<string, { color: string; label: string; iconType: string }> = {
    PENDING: { color: "text-yellow-600", iconType: "clock", label: "Wachtend op betaling" },
    PAID: { color: "text-blue-600", iconType: "check", label: "Betaald" },
    PROCESSING: { color: "text-blue-600", iconType: "package", label: "Wordt verwerkt" },
    SHIPPED: { color: "text-purple-600", iconType: "truck", label: "Verzonden" },
    DELIVERED: { color: "text-green-600", iconType: "check", label: "Afgeleverd" },
    CANCELLED: { color: "text-red-600", iconType: "x", label: "Geannuleerd" },
    REFUNDED: { color: "text-orange-600", iconType: "rotate", label: "Terugbetaald" },
};

export interface OrderItemVM {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface ShippingAddressVM {
    line1: string;
    line2?: string;
    city: string;
    postalCode: string;
    country: string;
}

export interface OrderDetailDataVM {
    id: string;
    orderNumber: string;
    status: string;
    statusConfig: { color: string; label: string; iconType: string };
    total: number;
    subtotal: number;
    shippingCost: number;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    shippingAddress?: ShippingAddressVM;
    items: OrderItemVM[];
    createdAt: string;
    isPending: boolean;
    isRefunded: boolean;
    isCancelled: boolean;
    isShipped: boolean;
    isDelivered: boolean;
    canRequestRefund: boolean;
}

export interface OrderDetailPageVM {
    isLoading: boolean;
    error: string | null;
    order: OrderDetailDataVM | null;

    // Refund modal state
    showRefundModal: boolean;
    refundReason: string;
    refundDescription: string;
    isSubmitting: boolean;
    submitSuccess: boolean;

    // Actions
    onOpenRefundModal: () => void;
    onCloseRefundModal: () => void;
    onRefundReasonChange: (reason: string) => void;
    onRefundDescriptionChange: (desc: string) => void;
    onSubmitRefund: () => Promise<void>;
    onResetRefundSuccess: () => void;
}

export function useOrderDetailPageVM(): OrderDetailPageVM {
    const params = useParams();
    const orderId = params?.id as string;

    // Order data
    const [order, setOrder] = useState<OrderDetailDataVM | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Refund modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundReason, setRefundReason] = useState("");
    const [refundDescription, setRefundDescription] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    // Load order
    useEffect(() => {
        const loadOrder = async () => {
            if (!orderId) return;

            try {
                const token = getToken();
                if (!token) {
                    setError("Please log in to view order details");
                    setIsLoading(false);
                    return;
                }

                const orderData = await api.getOrderById(orderId);

                const statusConfig = STATUS_CONFIG[orderData.status] || STATUS_CONFIG.PENDING;
                const canRequestRefund = ["DELIVERED", "PAID", "SHIPPED"].includes(orderData.status);

                setOrder({
                    id: orderData.id,
                    orderNumber: orderData.orderNumber,
                    status: orderData.status,
                    statusConfig,
                    total: Number(orderData.total),
                    subtotal: Number(orderData.subtotal || orderData.total),
                    shippingCost: Number(orderData.shippingCost || 0),
                    customerEmail: orderData.customerEmail,
                    customerName: orderData.customerName,
                    customerPhone: orderData.customerPhone,
                    shippingAddress: orderData.shippingAddress,
                    items: orderData.items.map((item: { id: string; productName: string; quantity: number; unitPrice: number; totalPrice: number }) => ({
                        id: item.id,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: Number(item.unitPrice),
                        totalPrice: Number(item.totalPrice),
                    })),
                    createdAt: orderData.createdAt,
                    isPending: orderData.status === "PENDING",
                    isRefunded: orderData.status === "REFUNDED",
                    isCancelled: orderData.status === "CANCELLED",
                    isShipped: orderData.status === "SHIPPED",
                    isDelivered: orderData.status === "DELIVERED",
                    canRequestRefund,
                });
            } catch (err) {
                console.error("Failed to load order:", err);
                setError("Order not found or you don't have permission to view it");
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [orderId]);

    // Refund handlers
    const onOpenRefundModal = useCallback(() => setShowRefundModal(true), []);
    const onCloseRefundModal = useCallback(() => {
        if (!isSubmitting) {
            setShowRefundModal(false);
        }
    }, [isSubmitting]);

    const onRefundReasonChange = useCallback((reason: string) => setRefundReason(reason), []);
    const onRefundDescriptionChange = useCallback((desc: string) => setRefundDescription(desc), []);

    const onSubmitRefund = useCallback(async () => {
        if (!order || !refundReason.trim()) return;

        setIsSubmitting(true);
        try {
            const token = getToken();
            if (!token) {
                alert("Je moet ingelogd zijn om een terugbetaling aan te vragen");
                return;
            }

            let sessionId = localStorage.getItem('chat_session_id');
            if (!sessionId) {
                sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
                localStorage.setItem('chat_session_id', sessionId);
            }

            const response = await fetch(`/api/tickets`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    customerName: order.customerName,
                    customerEmail: order.customerEmail,
                    subject: `Terugbetalingsverzoek - Order #${order.orderNumber}`,
                    initialMessage: `**Terugbetalingsverzoek**\n\nOrder: #${order.orderNumber}\nBedrag: €${order.total.toFixed(2)}\n\n**Reden:** ${refundReason}\n\n**Toelichting:**\n${refundDescription || "Geen aanvullende toelichting opgegeven."}`,
                    category: "REFUND",
                    sessionId,
                }),
            });

            if (!response.ok) {
                throw new Error("Verzoek kon niet worden verzonden");
            }

            setSubmitSuccess(true);
            setRefundReason("");
            setRefundDescription("");
        } catch (err) {
            console.error("Failed to submit refund request:", err);
            alert("Er is iets misgegaan. Probeer het opnieuw of neem contact met ons op.");
        } finally {
            setIsSubmitting(false);
        }
    }, [order, refundReason, refundDescription]);

    const onResetRefundSuccess = useCallback(() => {
        setShowRefundModal(false);
        setSubmitSuccess(false);
    }, []);

    return {
        isLoading,
        error,
        order,
        showRefundModal,
        refundReason,
        refundDescription,
        isSubmitting,
        submitSuccess,
        onOpenRefundModal,
        onCloseRefundModal,
        onRefundReasonChange,
        onRefundDescriptionChange,
        onSubmitRefund,
        onResetRefundSuccess,
    };
}
