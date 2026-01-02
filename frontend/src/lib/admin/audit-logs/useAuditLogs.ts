/**
 * Audit Logs Admin Hook
 * 
 * Business logic for admin audit logs page.
 * Handles fetching, filtering, pagination, and export.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface AuditLog {
    id: string;
    userId: string;
    userName: string;
    userRole: string;
    action: string;
    entityType: string;
    entityId: string | null;
    entityName: string | null;
    description: string;
    createdAt: string;
}

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE' | 'LOGIN' | 'LOGOUT' | 'EXPORT' | 'REFUND' | 'OTHER';
export type EntityType = 'product' | 'order' | 'user' | 'settings' | 'refund' | '';

// Action display configs
export const AUDIT_ACTION_CONFIG: Record<string, { label: string; color: string }> = {
    CREATE: { label: 'Aangemaakt', color: 'bg-green-100 text-green-700' },
    UPDATE: { label: 'Bijgewerkt', color: 'bg-blue-100 text-blue-700' },
    DELETE: { label: 'Verwijderd', color: 'bg-red-100 text-red-700' },
    STATUS_CHANGE: { label: 'Status gewijzigd', color: 'bg-purple-100 text-purple-700' },
    LOGIN: { label: 'Ingelogd', color: 'bg-emerald-100 text-emerald-700' },
    LOGOUT: { label: 'Uitgelogd', color: 'bg-zinc-100 text-zinc-700' },
    EXPORT: { label: 'Geëxporteerd', color: 'bg-amber-100 text-amber-700' },
    REFUND: { label: 'Terugbetaald', color: 'bg-orange-100 text-orange-700' },
    OTHER: { label: 'Anders', color: 'bg-zinc-100 text-zinc-700' },
};

// Entity type labels
export const ENTITY_TYPE_LABELS: Record<string, string> = {
    product: 'Producten',
    order: 'Bestellingen',
    user: 'Gebruikers',
    settings: 'Instellingen',
    refund: 'Terugbetalingen',
};

export interface UseAuditLogsOptions {
    limit?: number;
}

export interface UseAuditLogsReturn {
    // Data
    logs: AuditLog[];

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;

    // Pagination
    page: number;
    totalPages: number;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    hasNextPage: boolean;
    hasPrevPage: boolean;

    // Filters
    search: string;
    setSearch: (search: string) => void;
    filterAction: string;
    setFilterAction: (action: string) => void;
    filterEntity: string;
    setFilterEntity: (entity: string) => void;

    // Actions
    refresh: () => Promise<void>;
    exportToCsv: () => Promise<void>;

    // Helpers
    formatDate: (dateString: string) => string;
}

export function useAuditLogs(options: UseAuditLogsOptions = {}): UseAuditLogsReturn {
    const { limit = 30 } = options;

    // Data state
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter state
    const [search, setSearch] = useState('');
    const [filterAction, setFilterAction] = useState('');
    const [filterEntity, setFilterEntity] = useState('');

    // Fetch logs
    const fetchLogs = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        if (silent) setIsRefreshing(true);

        try {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });
            if (filterAction) params.append('action', filterAction);
            if (filterEntity) params.append('entityType', filterEntity);

            const data = await adminFetch<{ data: AuditLog[]; meta: { totalPages: number } }>(
                `/api/audit-logs?${params}`
            );

            setLogs(data.data || []);
            setTotalPages(data.meta?.totalPages || 1);
        } catch (error) {
            console.error('Failed to load audit logs:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [page, limit, filterAction, filterEntity]);

    // Initial fetch and on filter change
    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    // Reset page when filters change
    const handleFilterAction = useCallback((action: string) => {
        setFilterAction(action);
        setPage(1);
    }, []);

    const handleFilterEntity = useCallback((entity: string) => {
        setFilterEntity(entity);
        setPage(1);
    }, []);

    // Pagination
    const goToPage = useCallback((newPage: number) => {
        setPage(Math.max(1, Math.min(newPage, totalPages)));
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (page < totalPages) setPage(page + 1);
    }, [page, totalPages]);

    const prevPage = useCallback(() => {
        if (page > 1) setPage(page - 1);
    }, [page]);

    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Export to CSV
    const exportToCsv = useCallback(async () => {
        try {
            const response = await fetch('/api/audit-logs/export', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}`
                },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
        }
    }, []);

    // Refresh
    const refresh = useCallback(async () => {
        await fetchLogs(true);
    }, [fetchLogs]);

    // Format date helper
    const formatDate = useCallback((dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleDateString('nl-NL', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }, []);

    return {
        // Data
        logs,

        // Loading states
        isLoading,
        isRefreshing,

        // Pagination
        page,
        totalPages,
        goToPage,
        nextPage,
        prevPage,
        hasNextPage,
        hasPrevPage,

        // Filters
        search,
        setSearch,
        filterAction: filterAction,
        setFilterAction: handleFilterAction,
        filterEntity: filterEntity,
        setFilterEntity: handleFilterEntity,

        // Actions
        refresh,
        exportToCsv,

        // Helpers
        formatDate,
    };
}
