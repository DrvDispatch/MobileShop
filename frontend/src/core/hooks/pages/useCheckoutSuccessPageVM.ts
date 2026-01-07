/**
 * @core-only
 * 
 * Checkout Success Page View Model
 * 
 * Handles session resolution, order fetching, and cart clearing.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/lib/store';
import { api } from '@/lib/api';

export interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    customerEmail: string;
    customerName: string;
    total: number;
    items: OrderItem[];
    createdAt: string;
}

export interface CheckoutSuccessPageVM {
    order: Order | null;
    isLoading: boolean;
    isResolving: boolean;
    error: string | null;
}

export function useCheckoutSuccessPageVM(): CheckoutSuccessPageVM {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const orderIdParam = searchParams.get("orderId");

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clearCart = useCartStore((state) => state.clearCart);

    const loadOrder = useCallback(async () => {
        // Case 1: Session ID from Stripe redirect
        if (sessionId) {
            setIsResolving(true);
            try {
                const response = await fetch(`/api/orders/resolve-session/${sessionId}`);
                if (!response.ok) {
                    throw new Error("Could not resolve order");
                }

                interface ResolvedOrder {
                    orderId: string;
                    orderNumber: string;
                    status: string;
                    customerName: string;
                    total: number;
                    tenantId: string;
                    tenantDomain: string | null;
                }

                const resolvedOrder: ResolvedOrder = await response.json();

                // Check if we need to redirect to tenant domain
                const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';
                if (resolvedOrder.tenantDomain &&
                    resolvedOrder.tenantDomain !== currentHost &&
                    !currentHost.includes('localhost')) {
                    const tenantUrl = `https://${resolvedOrder.tenantDomain}/checkout/success?orderId=${resolvedOrder.orderId}`;
                    window.location.href = tenantUrl;
                    return;
                }

                // We're on the correct domain, load full order
                const orderData = await api.getOrderBySession(sessionId);
                setOrder(orderData);
                clearCart();
            } catch (err) {
                console.error("Failed to resolve order:", err);
                setError("Bestelling kon niet worden gevonden. Controleer uw e-mail voor bevestiging.");
            } finally {
                setIsLoading(false);
                setIsResolving(false);
            }
            return;
        }

        // Case 2: Order ID provided directly
        if (orderIdParam) {
            try {
                const orderData = await api.getOrderById(orderIdParam);
                setOrder(orderData);
                clearCart();
            } catch (err) {
                console.error("Failed to load order:", err);
                setError("Bestelling kon niet worden gevonden.");
            } finally {
                setIsLoading(false);
            }
            return;
        }

        // No session_id or orderId
        setIsLoading(false);
        setError("Geen bestelling informatie gevonden.");
    }, [sessionId, orderIdParam, clearCart]);

    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    return {
        order,
        isLoading,
        isResolving,
        error,
    };
}
