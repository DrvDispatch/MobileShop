/**
 * Product List Hook
 * 
 * Business logic for product listing pages (phones, accessories).
 * Handles filtering, sorting, pagination, and search.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Product } from '@/lib/api';

// Filter Constants
export const BRANDS = ['Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei'];
export const CONDITIONS = [
    { value: 'NEW', label: 'New' },
    { value: 'REFURBISHED', label: 'Refurbished' },
    { value: 'USED', label: 'Used' },
];
export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];
export const BATTERY_OPTIONS = [
    { value: 95, label: '95%+ (Excellent)' },
    { value: 90, label: '90%+ (Great)' },
    { value: 80, label: '80%+ (Good)' },
];
export const SORT_OPTIONS = [
    { value: 'flagship', label: 'Flagship first' },
    { value: 'newest', label: 'Newest first' },
    { value: 'price_asc', label: 'Price: Low to High' },
    { value: 'price_desc', label: 'Price: High to Low' },
    { value: 'name_asc', label: 'Name: A-Z' },
];

const ITEMS_PER_PAGE = 12;

export interface ProductFilters {
    brand: string;
    condition: string;
    minPrice: string;
    maxPrice: string;
    minBattery: string;
    storage: string;
    sortBy: string;
    search: string;
}

export interface UseProductListReturn {
    // Data
    products: Product[];
    allProducts: Product[];
    isLoading: boolean;

    // Pagination
    currentPage: number;
    totalPages: number;
    goToPage: (page: number) => void;
    getPageNumbers: () => (number | string)[];

    // Filters
    filters: ProductFilters;
    updateFilter: (key: string, value: string) => void;
    toggleFilter: (key: string, value: string) => void;
    clearFilters: () => void;
    hasActiveFilters: boolean;

    // UI State
    showFilters: boolean;
    setShowFilters: (show: boolean) => void;
    expandedFilters: string[];
    toggleFilterSection: (section: string) => void;
}

export function useProductList(category: string = 'phones'): UseProductListReturn {
    const searchParams = useSearchParams();

    // Data state
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // UI state
    const [showFilters, setShowFilters] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState<string[]>(['brand', 'condition', 'price']);

    // Filter state
    const [filters, setFilters] = useState<ProductFilters>({
        brand: searchParams?.get('brand') || '',
        condition: searchParams?.get('condition') || '',
        minPrice: searchParams?.get('minPrice') || '',
        maxPrice: searchParams?.get('maxPrice') || '',
        minBattery: searchParams?.get('minBattery') || '',
        storage: searchParams?.get('storage') || '',
        sortBy: searchParams?.get('sortBy') || 'flagship',
        search: searchParams?.get('search') || '',
    });

    // Load products
    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, string | number | boolean> = { category, limit: 500 };

            if (filters.brand) params.brand = filters.brand;
            if (filters.condition) params.condition = filters.condition;
            if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
            if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
            if (filters.search) params.search = filters.search;

            // Sort handling
            switch (filters.sortBy) {
                case 'flagship': params.sortBy = 'sortOrder'; params.sortOrder = 'asc'; break;
                case 'newest': params.sortBy = 'createdAt'; params.sortOrder = 'desc'; break;
                case 'price_asc': params.sortBy = 'price'; params.sortOrder = 'asc'; break;
                case 'price_desc': params.sortBy = 'price'; params.sortOrder = 'desc'; break;
                case 'name_asc': params.sortBy = 'name'; params.sortOrder = 'asc'; break;
            }

            const response = await api.getProducts(params);
            let filtered = response.data;

            // Client-side filter for battery and storage
            if (filters.minBattery) {
                filtered = filtered.filter(p => (p.batteryHealth || 100) >= parseInt(filters.minBattery));
            }
            if (filters.storage) {
                filtered = filtered.filter(p => p.storage === filters.storage);
            }

            setAllProducts(filtered);
            setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
            setCurrentPage(1);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setIsLoading(false);
        }
    }, [category, filters]);

    // Update displayed products when page changes
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setProducts(allProducts.slice(startIndex, endIndex));
    }, [currentPage, allProducts]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Filter handlers
    const updateFilter = useCallback((key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const toggleFilter = useCallback((key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: prev[key as keyof ProductFilters] === value ? '' : value }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({
            brand: '', condition: '', minPrice: '', maxPrice: '',
            minBattery: '', storage: '', sortBy: 'newest', search: '',
        });
    }, []);

    const hasActiveFilters = useMemo(() =>
        !!(filters.brand || filters.condition || filters.minPrice || filters.maxPrice || filters.minBattery || filters.storage),
        [filters]);

    // Pagination
    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [totalPages]);

    const getPageNumbers = useCallback((): (number | string)[] => {
        const pages: (number | string)[] = [];
        const showPages = 5;

        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else if (currentPage <= 3) {
            for (let i = 1; i <= 4; i++) pages.push(i);
            pages.push('...', totalPages);
        } else if (currentPage >= totalPages - 2) {
            pages.push(1, '...');
            for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
        } else {
            pages.push(1, '...');
            for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
            pages.push('...', totalPages);
        }
        return pages;
    }, [currentPage, totalPages]);

    const toggleFilterSection = useCallback((section: string) => {
        setExpandedFilters(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
    }, []);

    return {
        products, allProducts, isLoading,
        currentPage, totalPages, goToPage, getPageNumbers,
        filters, updateFilter, toggleFilter, clearFilters, hasActiveFilters,
        showFilters, setShowFilters, expandedFilters, toggleFilterSection,
    };
}
