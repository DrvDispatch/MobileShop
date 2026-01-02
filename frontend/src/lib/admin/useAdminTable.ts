/**
 * Admin Table Hook
 * 
 * Combines data fetching, pagination, search, and CRUD into a single
 * convenient hook for admin list pages.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useMemo, useCallback } from 'react';
import { useAdminCRUD, type UseAdminCRUDOptions } from './useAdminCRUD';
import { useAdminPagination, type UseAdminPaginationOptions } from './useAdminPagination';
import { useAdminSearch, type UseAdminSearchOptions } from './useAdminSearch';

export interface UseAdminTableOptions<T, R = T[]> extends UseAdminCRUDOptions<T, R> {
    /** Pagination options */
    pagination?: UseAdminPaginationOptions;

    /** Search options */
    search?: Omit<UseAdminSearchOptions, 'resetPagination'>;

    /** Filter function to apply after fetching */
    filterFn?: (item: T, searchQuery: string) => boolean;
}

export interface UseAdminTableReturn<T> {
    // Data
    data: T[];
    filteredData: T[];
    paginatedData: T[];

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;
    isCreating: boolean;
    isUpdating: boolean;
    isDeleting: boolean;

    // Pagination
    page: number;
    totalPages: number;
    total: number;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    displayRange: { from: number; to: number; total: number };

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    handleSearchSubmit: (e: React.FormEvent) => void;
    clearSearch: () => void;
    isSearching: boolean;

    // Actions
    refresh: () => Promise<void>;
    create: (data: Omit<T, 'id'>) => Promise<T | null>;
    update: (id: string, data: Partial<T>) => Promise<T | null>;
    deleteItem: (item: T) => Promise<boolean>;
    deleteById: (id: string, confirmMessage?: string) => Promise<boolean>;
    bulkDelete: (ids: string[], confirmMessage?: string) => Promise<boolean>;

    // Direct data access
    setData: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useAdminTable<T extends { id: string }, R = T[]>(
    options: UseAdminTableOptions<T, R>
): UseAdminTableReturn<T> {
    const {
        pagination: paginationOptions = {},
        search: searchOptions = {},
        filterFn,
        ...crudOptions
    } = options;

    // Pagination
    const {
        page,
        limit,
        totalPages,
        total,
        setTotal,
        goToPage,
        nextPage,
        prevPage,
        hasNextPage,
        hasPrevPage,
        displayRange,
        resetPage,
    } = useAdminPagination(paginationOptions);

    // Search with pagination reset
    const {
        searchQuery,
        debouncedQuery,
        setSearchQuery,
        clearSearch,
        handleSubmit: handleSearchSubmit,
        isSearching,
    } = useAdminSearch({
        ...searchOptions,
        resetPagination: resetPage,
    });

    // CRUD operations
    const {
        data,
        isLoading,
        isRefreshing,
        error,
        refresh,
        setData,
        isCreating,
        isUpdating,
        isDeleting,
        create,
        update,
        deleteItem,
        deleteById,
        bulkDelete,
    } = useAdminCRUD<T, R>(crudOptions);

    // Filtered data based on search
    const filteredData = useMemo(() => {
        if (!debouncedQuery || !filterFn) {
            return data;
        }
        return data.filter(item => filterFn(item, debouncedQuery));
    }, [data, debouncedQuery, filterFn]);

    // Update total when filtered data changes
    useMemo(() => {
        setTotal(filteredData.length);
    }, [filteredData.length, setTotal]);

    // Paginated data
    const paginatedData = useMemo(() => {
        const start = (page - 1) * limit;
        return filteredData.slice(start, start + limit);
    }, [filteredData, page, limit]);

    return {
        // Data
        data,
        filteredData,
        paginatedData,

        // Loading states
        isLoading,
        isRefreshing,
        isCreating,
        isUpdating,
        isDeleting,

        // Pagination
        page,
        totalPages,
        total,
        goToPage,
        nextPage,
        prevPage,
        hasNextPage,
        hasPrevPage,
        displayRange,

        // Search
        searchQuery,
        setSearchQuery,
        handleSearchSubmit,
        clearSearch,
        isSearching,

        // Actions
        refresh,
        create,
        update,
        deleteItem,
        deleteById,
        bulkDelete,

        // Direct access
        setData,
    };
}
