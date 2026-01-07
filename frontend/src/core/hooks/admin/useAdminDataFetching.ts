/**
 * Admin Data Fetching Hook
 * 
 * Generic hook for fetching and managing data in admin pages.
 * Handles loading states, refreshing, and error handling.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch, type AdminApiError } from './adminApi';

export interface UseAdminDataFetchingOptions<T, R = T[]> {
    /** API endpoint to fetch from */
    endpoint: string;

    /** Transform function to apply to response data */
    transform?: (data: R) => T[];

    /** Enable auto-refresh polling */
    autoRefresh?: boolean;

    /** Auto-refresh interval in ms (default: 30000) */
    refreshInterval?: number;

    /** Initial sorting */
    sortFn?: (a: T, b: T) => number;

    /** Dependencies that trigger refetch */
    deps?: unknown[];

    /** Skip initial fetch (for conditional loading) */
    skipInitial?: boolean;
}

export interface UseAdminDataFetchingReturn<T> {
    /** The fetched data */
    data: T[];

    /** Initial loading state */
    isLoading: boolean;

    /** Refresh in progress */
    isRefreshing: boolean;

    /** Error if any */
    error: AdminApiError | null;

    /** Refresh data */
    refresh: () => Promise<void>;

    /** Set data directly (for optimistic updates) */
    setData: React.Dispatch<React.SetStateAction<T[]>>;

    /** Remove item by id (for optimistic deletes) */
    removeItem: (id: string) => void;

    /** Update single item (for optimistic updates) */
    updateItem: (id: string, updates: Partial<T>) => void;

    /** Add item to list */
    addItem: (item: T) => void;
}

export function useAdminDataFetching<T extends { id: string }, R = T[]>(
    options: UseAdminDataFetchingOptions<T, R>
): UseAdminDataFetchingReturn<T> {
    const {
        endpoint,
        transform,
        autoRefresh = false,
        refreshInterval = 30000,
        sortFn,
        deps = [],
        skipInitial = false,
    } = options;

    const [data, setData] = useState<T[]>([]);
    const [isLoading, setIsLoading] = useState(!skipInitial);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<AdminApiError | null>(null);

    const isMountedRef = useRef(true);
    const isFirstLoadRef = useRef(true);

    const fetchData = useCallback(async (silent = false) => {
        if (!silent && isFirstLoadRef.current) {
            setIsLoading(true);
        }
        if (silent) {
            setIsRefreshing(true);
        }
        setError(null);

        try {
            const response = await adminFetch<R>(endpoint);

            if (!isMountedRef.current) return;

            let processedData: T[] = transform
                ? transform(response)
                : response as unknown as T[];

            // Apply sorting if provided
            if (sortFn) {
                processedData = [...processedData].sort(sortFn);
            }

            setData(processedData);
            isFirstLoadRef.current = false;
        } catch (err) {
            if (!isMountedRef.current) return;
            console.error(`Failed to fetch from ${endpoint}:`, err);
            setError(err as AdminApiError);
        } finally {
            if (!isMountedRef.current) return;
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [endpoint, transform, sortFn]);

    // Initial fetch
    useEffect(() => {
        if (skipInitial) return;
        fetchData();
    }, [fetchData, skipInitial, ...deps]);

    // Auto-refresh polling
    useEffect(() => {
        if (!autoRefresh) return;

        const interval = setInterval(() => {
            fetchData(true);
        }, refreshInterval);

        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchData]);

    // Cleanup on unmount
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchData(true);
    }, [fetchData]);

    const removeItem = useCallback((id: string) => {
        setData(prev => prev.filter(item => item.id !== id));
    }, []);

    const updateItem = useCallback((id: string, updates: Partial<T>) => {
        setData(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const addItem = useCallback((item: T) => {
        setData(prev => {
            const newData = [item, ...prev];
            return sortFn ? newData.sort(sortFn) : newData;
        });
    }, [sortFn]);

    return {
        data,
        isLoading,
        isRefreshing,
        error,
        refresh,
        setData,
        removeItem,
        updateItem,
        addItem,
    };
}
