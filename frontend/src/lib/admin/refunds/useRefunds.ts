/**
 * Refunds Admin Hook (Extended)
 * 
 * Complete business logic for admin refunds page.
 * Handles refund listing, filtering, stats, Stripe processing.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { adminFetch } from '@/lib/admin';

// Types
export interface RefundData {
    id: string;
    orderId: string;
    stripeRefundId?: string;
    amount: number;
    currency: string;
    status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED';
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

export interface RefundStats {
    pending: number;
    processing: number;
    succeeded: number;
    failed: number;
    totalRefundedAmount: number;
}

// Status configs
export const REFUND_STATUS_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'In afwachting', color: 'text-yellow-700', bg: 'bg-yellow-100' },
    PROCESSING: { label: 'Verwerken', color: 'text-blue-700', bg: 'bg-blue-100' },
    SUCCEEDED: { label: 'Voltooid', color: 'text-green-700', bg: 'bg-green-100' },
    FAILED: { label: 'Mislukt', color: 'text-red-700', bg: 'bg-red-100' },
    CANCELLED: { label: 'Geannuleerd', color: 'text-zinc-600', bg: 'bg-zinc-100' },
};

export const REFUND_REASON_LABELS: Record<string, string> = {
    DUPLICATE: 'Dubbele betaling',
    FRAUDULENT: 'Fraude',
    REQUESTED_BY_CUSTOMER: 'Klantverzoek',
    DEFECTIVE_PRODUCT: 'Defect product',
    WRONG_PRODUCT: 'Verkeerd product',
    SHIPPING_DAMAGE: 'Transportschade',
    OTHER: 'Anders',
};

export interface UseRefundsReturn {
    // Data
    refunds: RefundData[];
    filteredRefunds: RefundData[];
    stats: RefundStats | null;

    // Loading
    isLoading: boolean;
    processingId: string | null;

    // Filters
    searchQuery: string;
    statusFilter: string;
    setSearchQuery: (q: string) => void;
    setStatusFilter: (s: string) => void;

    // Expansion
    expandedId: string | null;
    setExpandedId: (id: string | null) => void;
    toggleExpanded: (id: string) => void;

    // Actions
    refresh: () => Promise<void>;
    processRefund: (id: string) => Promise<boolean>;
    cancelRefund: (id: string) => Promise<boolean>;

    // Helpers
    getStatusConfig: (status: string) => { label: string; color: string; bg: string };
    getReasonLabel: (reason: string) => string;
}

export function useRefunds(): UseRefundsReturn {
    const router = useRouter();
    const [refunds, setRefunds] = useState<RefundData[]>([]);
    const [stats, setStats] = useState<RefundStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Fetch refunds and stats
    const fetchRefunds = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter) params.append('status', statusFilter);

            const [refundsData, statsData] = await Promise.all([
                adminFetch<{ data: RefundData[] } | RefundData[]>(`/api/refunds?${params.toString()}`),
                adminFetch<RefundStats>('/api/refunds/stats'),
            ]);

            // Handle both array and object response formats
            const refundsList = Array.isArray(refundsData) ? refundsData : (refundsData.data || []);
            setRefunds(refundsList);
            setStats(statsData);
        } catch (err) {
            console.error('Failed to fetch refunds:', err);
            // Check if auth error
            if (err instanceof Error && err.message.includes('401')) {
                router.push('/admin/login');
            }
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, router]);

    useEffect(() => {
        fetchRefunds();
    }, [fetchRefunds]);

    // Filtered refunds
    const filteredRefunds = useMemo(() => {
        if (!searchQuery) return refunds;
        const query = searchQuery.toLowerCase();
        return refunds.filter(r =>
            r.order.orderNumber.toLowerCase().includes(query) ||
            r.order.customerName.toLowerCase().includes(query) ||
            r.order.customerEmail.toLowerCase().includes(query)
        );
    }, [refunds, searchQuery]);

    // Toggle expanded
    const toggleExpanded = useCallback((id: string) => {
        setExpandedId(prev => prev === id ? null : id);
    }, []);

    // Process refund via Stripe
    const processRefund = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Weet je zeker dat je deze terugbetaling wilt verwerken via Stripe?')) {
            return false;
        }

        setProcessingId(id);
        try {
            await adminFetch(`/api/refunds/${id}/process`, { method: 'POST' });
            await fetchRefunds();
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Verwerken mislukt';
            alert(errorMessage);
            return false;
        } finally {
            setProcessingId(null);
        }
    }, [fetchRefunds]);

    // Cancel refund
    const cancelRefund = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Weet je zeker dat je deze terugbetaling wilt annuleren?')) {
            return false;
        }

        try {
            await adminFetch(`/api/refunds/${id}/cancel`, { method: 'POST' });
            await fetchRefunds();
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Annuleren mislukt';
            alert(errorMessage);
            return false;
        }
    }, [fetchRefunds]);

    // Helpers
    const getStatusConfig = useCallback((status: string) => {
        return REFUND_STATUS_CONFIGS[status] || { label: status, color: 'text-zinc-600', bg: 'bg-zinc-100' };
    }, []);

    const getReasonLabel = useCallback((reason: string) => {
        return REFUND_REASON_LABELS[reason] || reason;
    }, []);

    return {
        refunds,
        filteredRefunds,
        stats,
        isLoading,
        processingId,
        searchQuery,
        statusFilter,
        setSearchQuery,
        setStatusFilter,
        expandedId,
        setExpandedId,
        toggleExpanded,
        refresh: fetchRefunds,
        processRefund,
        cancelRefund,
        getStatusConfig,
        getReasonLabel,
    };
}
