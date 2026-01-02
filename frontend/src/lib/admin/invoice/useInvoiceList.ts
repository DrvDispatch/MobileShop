/**
 * Invoice List Hook
 * 
 * Business logic for invoice listing, filtering, and PDF download.
 */

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin';
import type { Invoice } from './types';
import { INVOICE_STATUS_CONFIG } from './types';

export interface UseInvoiceListReturn {
    invoices: Invoice[];
    loading: boolean;
    search: string;
    setSearch: (s: string) => void;
    statusFilter: string;
    setStatusFilter: (s: string) => void;
    fetchInvoices: () => Promise<void>;
    downloadPdf: (id: string) => Promise<void>;
    getStatusConfig: (status: string) => { label: string; style: string };
}

export function useInvoiceList(): UseInvoiceListReturn {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const fetchInvoices = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);

            const data = await adminFetch<{ invoices: Invoice[] }>(`/api/invoice?${params}`);
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search, statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [search, statusFilter, fetchInvoices]);

    const downloadPdf = useCallback(async (id: string) => {
        const token = localStorage.getItem('adminAccessToken');
        const res = await fetch(`/api/invoice/${id}/pdf`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank');
        }
    }, []);

    const getStatusConfig = useCallback((status: string) => {
        return INVOICE_STATUS_CONFIG[status] || { label: status, style: '' };
    }, []);

    return {
        invoices,
        loading,
        search,
        setSearch,
        statusFilter,
        setStatusFilter,
        fetchInvoices,
        downloadPdf,
        getStatusConfig,
    };
}
