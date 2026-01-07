/**
 * Admin Pagination Hook
 * 
 * Manages pagination state and calculations for admin list pages.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export interface UseAdminPaginationOptions {
    /** Items per page (default: 12) */
    limit?: number;

    /** Sync with URL query params */
    syncWithUrl?: boolean;

    /** Initial page (default: 1) */
    initialPage?: number;
}

export interface UseAdminPaginationReturn {
    /** Current page number (1-indexed) */
    page: number;

    /** Items per page */
    limit: number;

    /** Total pages (needs total to be set) */
    totalPages: number;

    /** Total items count */
    total: number;

    /** Set total items count */
    setTotal: (total: number) => void;

    /** Go to specific page */
    goToPage: (page: number) => void;

    /** Go to next page */
    nextPage: () => void;

    /** Go to previous page */
    prevPage: () => void;

    /** Reset to first page */
    resetPage: () => void;

    /** Check if has next page */
    hasNextPage: boolean;

    /** Check if has previous page */
    hasPrevPage: boolean;

    /** Get offset for API calls */
    offset: number;

    /** Display range text (e.g., "1 to 12 of 24") */
    displayRange: { from: number; to: number; total: number };
}

export function useAdminPagination(
    options: UseAdminPaginationOptions = {}
): UseAdminPaginationReturn {
    const {
        limit = 12,
        syncWithUrl = false,
        initialPage = 1,
    } = options;

    const searchParams = useSearchParams();
    const router = useRouter();

    // Get initial page from URL if syncing
    const urlPage = syncWithUrl
        ? parseInt(searchParams.get('page') || String(initialPage))
        : initialPage;

    const [page, setPage] = useState(urlPage);
    const [total, setTotal] = useState(0);

    const totalPages = useMemo(() => Math.ceil(total / limit), [total, limit]);
    const offset = useMemo(() => (page - 1) * limit, [page, limit]);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const displayRange = useMemo(() => ({
        from: total === 0 ? 0 : offset + 1,
        to: Math.min(offset + limit, total),
        total,
    }), [offset, limit, total]);

    const updateUrl = useCallback((newPage: number) => {
        if (!syncWithUrl) return;
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(newPage));
        router.push(`?${params.toString()}`, { scroll: false });
    }, [syncWithUrl, searchParams, router]);

    const goToPage = useCallback((newPage: number) => {
        const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
        setPage(validPage);
        updateUrl(validPage);
    }, [totalPages, updateUrl]);

    const nextPage = useCallback(() => {
        if (hasNextPage) {
            goToPage(page + 1);
        }
    }, [hasNextPage, page, goToPage]);

    const prevPage = useCallback(() => {
        if (hasPrevPage) {
            goToPage(page - 1);
        }
    }, [hasPrevPage, page, goToPage]);

    const resetPage = useCallback(() => {
        goToPage(1);
    }, [goToPage]);

    return {
        page,
        limit,
        totalPages,
        total,
        setTotal,
        goToPage,
        nextPage,
        prevPage,
        resetPage,
        hasNextPage,
        hasPrevPage,
        offset,
        displayRange,
    };
}
