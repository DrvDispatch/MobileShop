/**
 * Admin Search Hook
 * 
 * Manages search state with debounce for admin list pages.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export interface UseAdminSearchOptions {
    /** Debounce delay in ms (default: 300) */
    debounceMs?: number;

    /** Sync with URL query params */
    syncWithUrl?: boolean;

    /** Callback when search value changes (debounced) */
    onSearch?: (query: string) => void;

    /** Reset pagination on search */
    resetPagination?: () => void;
}

export interface UseAdminSearchReturn {
    /** Current search query (immediate) */
    searchQuery: string;

    /** Debounced search query */
    debouncedQuery: string;

    /** Set search query */
    setSearchQuery: (query: string) => void;

    /** Clear search */
    clearSearch: () => void;

    /** Handle form submit */
    handleSubmit: (e: React.FormEvent) => void;

    /** Is searching (debounce in progress) */
    isSearching: boolean;
}

export function useAdminSearch(
    options: UseAdminSearchOptions = {}
): UseAdminSearchReturn {
    const {
        debounceMs = 300,
        syncWithUrl = false,
        onSearch,
        resetPagination,
    } = options;

    const searchParams = useSearchParams();
    const router = useRouter();

    // Get initial value from URL if syncing
    const initialQuery = syncWithUrl
        ? searchParams.get('search') || ''
        : '';

    const [searchQuery, setSearchQueryState] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [isSearching, setIsSearching] = useState(false);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

    // Debounce effect
    useEffect(() => {
        // Skip init of isSearching on mount - rely on searchQuery !== debouncedQuery instead
        debounceTimeoutRef.current = setTimeout(() => {
            setDebouncedQuery(searchQuery);
            setIsSearching(false);

            if (onSearch) {
                onSearch(searchQuery);
            }

            if (resetPagination && searchQuery !== debouncedQuery) {
                resetPagination();
            }
        }, debounceMs);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [searchQuery, debounceMs, onSearch, resetPagination, debouncedQuery]);

    // Sync with URL
    useEffect(() => {
        if (!syncWithUrl) return;

        const params = new URLSearchParams(searchParams.toString());
        if (debouncedQuery) {
            params.set('search', debouncedQuery);
        } else {
            params.delete('search');
        }
        router.push(`?${params.toString()}`, { scroll: false });
    }, [debouncedQuery, syncWithUrl, searchParams, router]);

    const setSearchQuery = useCallback((query: string) => {
        setSearchQueryState(query);
    }, []);

    const clearSearch = useCallback(() => {
        setSearchQueryState('');
        setDebouncedQuery('');
        if (resetPagination) {
            resetPagination();
        }
    }, [resetPagination]);

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        // Immediately apply the search
        setDebouncedQuery(searchQuery);
        if (resetPagination) {
            resetPagination();
        }
    }, [searchQuery, resetPagination]);

    return {
        searchQuery,
        debouncedQuery,
        setSearchQuery,
        clearSearch,
        handleSubmit,
        isSearching,
    };
}
