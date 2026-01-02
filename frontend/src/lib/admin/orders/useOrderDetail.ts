/**
 * useOrderDetail Hook
 * 
 * Business logic for single order detail page.
 * Handles order loading, status updates, notes, and refund creation.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback } from 'react';
import type {
    Order,
    OrderItem,
    OrderStatus,
    RefundReason,
    CreateRefundDto,
    UpdateOrderDto,
} from './types';

// ============================================
// TYPES
// ============================================

export interface UseOrderDetailReturn {
    // Data
    order: Order | null;

    // Loading states
    isLoading: boolean;
    isUpdating: boolean;
    isCreatingRefund: boolean;
    error: string | null;

    // Status update
    selectedStatus: OrderStatus | '';
    setSelectedStatus: (status: OrderStatus | '') => void;
    trackingNumber: string;
    setTrackingNumber: (value: string) => void;
    cancellationReason: string;
    setCancellationReason: (value: string) => void;
    handleStatusUpdate: () => Promise<void>;

    // Notes
    adminNotes: string;
    setAdminNotes: (value: string) => void;
    handleSaveNotes: () => Promise<void>;

    // Refund modal state
    showRefundModal: boolean;
    setShowRefundModal: (show: boolean) => void;
    refundAmount: string;
    setRefundAmount: (value: string) => void;
    refundReason: RefundReason;
    setRefundReason: (value: RefundReason) => void;
    refundReasonText: string;
    setRefundReasonText: (value: string) => void;
    refundNotes: string;
    setRefundNotes: (value: string) => void;
    returnRequired: boolean;
    setReturnRequired: (value: boolean) => void;
    handleCreateRefund: () => Promise<void>;
    resetRefundForm: () => void;

    // Invoice actions
    handleDownloadInvoice: () => Promise<void>;
    handleResendInvoice: () => Promise<void>;

    // Reload
    reload: () => Promise<void>;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getAdminToken(): string | null {
    return localStorage.getItem('adminAccessToken');
}

function parseOrderData(data: Record<string, unknown>): Order {
    return {
        ...data,
        total: Number(data.total),
        subtotal: Number(data.subtotal || 0),
        shippingAmount: Number(data.shippingAmount || 0),
        taxAmount: Number(data.taxAmount || 0),
        discountAmount: Number(data.discountAmount || 0),
        items: ((data.items as OrderItem[]) || []).map((item) => ({
            ...item,
            unitPrice: Number(item.unitPrice),
            totalPrice: Number(item.totalPrice),
        })),
    } as Order;
}

// ============================================
// HOOK
// ============================================

export function useOrderDetail(orderId: string): UseOrderDetailReturn {
    // Order state
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Status update state
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus | ''>('');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    // Refund modal state
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundAmount, setRefundAmount] = useState('');
    const [refundReason, setRefundReason] = useState<RefundReason>('REQUESTED_BY_CUSTOMER');
    const [refundReasonText, setRefundReasonText] = useState('');
    const [refundNotes, setRefundNotes] = useState('');
    const [returnRequired, setReturnRequired] = useState(false);
    const [isCreatingRefund, setIsCreatingRefund] = useState(false);

    // Load order
    const loadOrder = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const token = getAdminToken();
            const response = await fetch(`/api/orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Order niet gevonden');

            const data = await response.json();
            const parsedOrder = parseOrderData(data);

            setOrder(parsedOrder);
            setSelectedStatus(parsedOrder.status);
            setAdminNotes(parsedOrder.adminNotes || '');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load order');
        } finally {
            setIsLoading(false);
        }
    }, [orderId]);

    // Initial load
    useEffect(() => {
        loadOrder();
    }, [loadOrder]);

    // Handle status update
    const handleStatusUpdate = useCallback(async () => {
        if (!order || selectedStatus === order.status || !selectedStatus) return;

        if (selectedStatus === 'SHIPPED' && !trackingNumber.trim()) {
            alert('Voer een trackingnummer in voor verzonden bestellingen');
            return;
        }

        setIsUpdating(true);
        try {
            const token = getAdminToken();
            const body: UpdateOrderDto = { status: selectedStatus };

            if (selectedStatus === 'SHIPPED' && trackingNumber) {
                body.trackingNumber = trackingNumber;
            }
            if (selectedStatus === 'CANCELLED' && cancellationReason) {
                body.cancellationReason = cancellationReason;
            }

            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) throw new Error('Bijwerken mislukt');

            const updatedOrder = await response.json();
            setOrder({ ...order, ...updatedOrder });
            setTrackingNumber('');
            setCancellationReason('');
            alert(`Status bijgewerkt naar ${selectedStatus}. Email verzonden naar klant.`);
        } catch (err) {
            console.error('Failed to update status:', err);
            alert('Bijwerken van status mislukt');
        } finally {
            setIsUpdating(false);
        }
    }, [order, selectedStatus, trackingNumber, cancellationReason, orderId]);

    // Handle save notes
    const handleSaveNotes = useCallback(async () => {
        if (!order) return;
        setIsUpdating(true);
        try {
            const token = getAdminToken();
            const response = await fetch(`/api/orders/${orderId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ adminNotes }),
            });
            if (!response.ok) throw new Error('Opslaan mislukt');
            setOrder({ ...order, adminNotes });
            alert('Notities opgeslagen');
        } catch (err) {
            alert('Opslaan van notities mislukt');
        } finally {
            setIsUpdating(false);
        }
    }, [order, orderId, adminNotes]);

    // Reset refund form
    const resetRefundForm = useCallback(() => {
        setRefundAmount('');
        setRefundReason('REQUESTED_BY_CUSTOMER');
        setRefundReasonText('');
        setRefundNotes('');
        setReturnRequired(false);
    }, []);

    // Handle create refund
    const handleCreateRefund = useCallback(async () => {
        if (!order) return;

        const amount = parseFloat(refundAmount);
        if (isNaN(amount) || amount <= 0) {
            alert('Voer een geldig bedrag in');
            return;
        }
        if (amount > order.total) {
            alert('Bedrag mag niet hoger zijn dan het ordertotaal');
            return;
        }

        setIsCreatingRefund(true);
        try {
            const token = getAdminToken();
            const payload: CreateRefundDto = {
                orderId: order.id,
                amount,
                reason: refundReason,
                reasonText: refundReasonText || undefined,
                adminNotes: refundNotes || undefined,
                returnRequired,
            };

            const response = await fetch(`/api/refunds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Aanmaken mislukt');
            }

            alert('Terugbetaling aangemaakt! Ga naar Terugbetalingen om te verwerken.');
            setShowRefundModal(false);
            resetRefundForm();
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Aanmaken van terugbetaling mislukt');
        } finally {
            setIsCreatingRefund(false);
        }
    }, [order, refundAmount, refundReason, refundReasonText, refundNotes, returnRequired, resetRefundForm]);

    // Handle download invoice
    const handleDownloadInvoice = useCallback(async () => {
        if (!order) return;
        const token = getAdminToken();
        try {
            const response = await fetch(`/api/invoice/order/${order.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                alert('Factuur ophalen mislukt');
            }
        } catch (err) {
            alert('Fout bij ophalen factuur');
        }
    }, [order]);

    // Handle resend invoice
    const handleResendInvoice = useCallback(async () => {
        if (!order) return;
        const token = getAdminToken();
        try {
            const response = await fetch(`/api/invoice/order/${order.id}/send`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                alert('Factuur verzonden naar klant!');
            } else {
                alert('Verzenden mislukt');
            }
        } catch (err) {
            alert('Fout bij verzenden factuur');
        }
    }, [order]);

    return {
        // Data
        order,

        // Loading
        isLoading,
        isUpdating,
        isCreatingRefund,
        error,

        // Status
        selectedStatus,
        setSelectedStatus,
        trackingNumber,
        setTrackingNumber,
        cancellationReason,
        setCancellationReason,
        handleStatusUpdate,

        // Notes
        adminNotes,
        setAdminNotes,
        handleSaveNotes,

        // Refund
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
        resetRefundForm,

        // Invoice
        handleDownloadInvoice,
        handleResendInvoice,

        // Reload
        reload: loadOrder,
    };
}
