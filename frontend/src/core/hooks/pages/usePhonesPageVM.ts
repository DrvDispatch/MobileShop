/**
 * @core-only
 * 
 * Phones Page View Model
 * 
 * Wraps useProductList to provide all data for the Phones skin page.
 */

'use client';

import { useProductList, BRANDS, CONDITIONS, STORAGE_OPTIONS, BATTERY_OPTIONS, SORT_OPTIONS } from '@/lib/products';

export interface Product {
    id: string;
    name: string;
    price: number;
    image?: string;
    brand?: string;
    condition?: string;
    storage?: string;
    batteryHealth?: number;
}

export interface Filters {
    search: string;
    brand: string;
    condition: string;
    minPrice: string;
    maxPrice: string;
    minBattery: string;
    storage: string;
    sortBy: string;
}

export interface PhonesPageVM {
    // Products
    products: Product[];
    allProducts: Product[];
    isLoading: boolean;

    // Pagination
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    getPageNumbers: () => (number | string)[];

    // Filters
    filters: Filters;
    updateFilter: (key: string, value: string) => void;
    toggleFilter: (key: string, value: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;

    // Filter UI state
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    expandedFilters: string[];
    toggleFilterSection: (id: string) => void;

    // Filter options (constants)
    BRANDS: string[];
    CONDITIONS: { value: string; label: string }[];
    STORAGE_OPTIONS: string[];
    BATTERY_OPTIONS: { value: number; label: string }[];
    SORT_OPTIONS: { value: string; label: string }[];
}

export function usePhonesPageVM(): PhonesPageVM {
    const productList = useProductList("phones");

    return {
        products: productList.products,
        allProducts: productList.allProducts,
        isLoading: productList.isLoading,
        currentPage: productList.currentPage,
        totalPages: productList.totalPages,
        goToPage: productList.goToPage,
        getPageNumbers: productList.getPageNumbers,
        filters: productList.filters,
        updateFilter: productList.updateFilter,
        toggleFilter: productList.toggleFilter,
        clearFilters: productList.clearFilters,
        hasActiveFilters: productList.hasActiveFilters,
        showFilters: productList.showFilters,
        setShowFilters: productList.setShowFilters,
        expandedFilters: productList.expandedFilters,
        toggleFilterSection: productList.toggleFilterSection,
        // Constants
        BRANDS,
        CONDITIONS,
        STORAGE_OPTIONS,
        BATTERY_OPTIONS,
        SORT_OPTIONS,
    };
}
