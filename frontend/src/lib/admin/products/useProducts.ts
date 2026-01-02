/**
 * Products Admin Hook
 * 
 * Business logic for admin products page.
 * Handles product listing, CRUD, filtering, search, pagination, and stats.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface Product {
    id: string;
    name: string;
    slug: string;
    sku?: string;
    brand?: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    stockQty: number;
    lowStockThreshold: number;
    isActive: boolean;
    isFeatured: boolean;
    condition: string;
    categoryId?: string;
    category?: { id: string; name: string };
    images: { id: string; url: string }[];
    createdAt: string;
}

export interface ProductCategory {
    id: string;
    name: string;
    slug: string;
}

export interface ProductStats {
    total: number;
    active: number;
    lowStock: number;
    outOfStock: number;
}

export interface UseProductsReturn {
    // Data
    products: Product[];
    filteredProducts: Product[];
    categories: ProductCategory[];
    stats: ProductStats;

    // Loading
    isLoading: boolean;
    isRefreshing: boolean;
    isDeleting: boolean;

    // Pagination
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    setPage: (page: number) => void;

    // Filters
    searchQuery: string;
    categoryFilter: string;
    statusFilter: 'all' | 'active' | 'inactive';
    setSearchQuery: (q: string) => void;
    setCategoryFilter: (c: string) => void;
    setStatusFilter: (s: 'all' | 'active' | 'inactive') => void;

    // Actions
    refresh: () => Promise<void>;
    deleteProduct: (id: string, name?: string) => Promise<boolean>;
    toggleProductActive: (product: Product) => Promise<boolean>;
    toggleProductFeatured: (product: Product) => Promise<boolean>;
    duplicateProduct: (id: string) => Promise<Product | null>;
    handleSearch: (e?: React.FormEvent) => void;
}

export function useProducts(): UseProductsReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]); // For stats
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [page, setPage] = useState(1);
    const limit = 12;

    // Calculate stats from all products
    const stats = useMemo<ProductStats>(() => {
        return {
            total: allProducts.length,
            active: allProducts.filter(p => p.isActive).length,
            lowStock: allProducts.filter(p => p.stockQty > 0 && p.stockQty <= 5).length,
            outOfStock: allProducts.filter(p => p.stockQty === 0).length,
        };
    }, [allProducts]);

    const totalPages = Math.ceil(total / limit);

    // Fetch paginated products
    const fetchProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchQuery) params.append('search', searchQuery);
            params.append('page', page.toString());
            params.append('limit', limit.toString());

            const response = await adminFetch<{ data: Product[]; meta?: { total: number } }>(
                `/api/products?${params.toString()}`
            );

            // Handle both array and paginated response formats
            if (Array.isArray(response)) {
                setProducts(response);
                setTotal(response.length);
            } else {
                setProducts(response.data || []);
                setTotal(response.meta?.total || response.data?.length || 0);
            }
        } catch (err) {
            console.error('Failed to fetch products:', err);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, page]);

    // Fetch all products for stats (separate call)
    const fetchAllForStats = useCallback(async () => {
        try {
            const response = await adminFetch<Product[] | { data: Product[] }>(
                '/api/products?limit=1000'
            );
            const data = Array.isArray(response) ? response : response.data;
            setAllProducts(data || []);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        }
    }, []);

    // Fetch categories
    const fetchCategories = useCallback(async () => {
        try {
            const data = await adminFetch<ProductCategory[]>('/api/categories');
            setCategories(data);
        } catch (err) {
            console.error('Failed to fetch categories:', err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        fetchAllForStats();
        fetchCategories();
    }, [fetchAllForStats, fetchCategories]);

    // Filtered products (client-side additional filtering)
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCategory = !categoryFilter || p.categoryId === categoryFilter;
            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'active' && p.isActive) ||
                (statusFilter === 'inactive' && !p.isActive);
            return matchesCategory && matchesStatus;
        });
    }, [products, categoryFilter, statusFilter]);

    // Refresh all data
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await Promise.all([fetchProducts(), fetchAllForStats()]);
        setIsRefreshing(false);
    }, [fetchProducts, fetchAllForStats]);

    // Handle search form submit
    const handleSearch = useCallback((e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setPage(1); // Reset to first page on new search
    }, []);

    // Delete product
    const deleteProduct = useCallback(async (id: string, name?: string): Promise<boolean> => {
        const confirmMsg = name
            ? `Weet u zeker dat u "${name}" wilt verwijderen?`
            : 'Weet je zeker dat je dit product wilt verwijderen?';
        if (!confirm(confirmMsg)) return false;

        setIsDeleting(true);
        try {
            await adminFetch(`/api/products/${id}`, { method: 'DELETE' });
            // Update local state
            setProducts(prev => prev.filter(p => p.id !== id));
            setTotal(prev => prev - 1);
            // Refresh stats
            await fetchAllForStats();
            return true;
        } catch (err) {
            console.error('Failed to delete product:', err);
            alert('Verwijderen mislukt');
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [fetchAllForStats]);

    // Toggle active
    const toggleProductActive = useCallback(async (product: Product): Promise<boolean> => {
        try {
            await adminFetch(`/api/products/${product.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !product.isActive }),
            });
            await refresh();
            return true;
        } catch (err) {
            console.error('Failed to toggle product:', err);
            return false;
        }
    }, [refresh]);

    // Toggle featured
    const toggleProductFeatured = useCallback(async (product: Product): Promise<boolean> => {
        try {
            await adminFetch(`/api/products/${product.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isFeatured: !product.isFeatured }),
            });
            await refresh();
            return true;
        } catch (err) {
            console.error('Failed to toggle featured:', err);
            return false;
        }
    }, [refresh]);

    // Duplicate product
    const duplicateProduct = useCallback(async (id: string): Promise<Product | null> => {
        try {
            const newProduct = await adminFetch<Product>(`/api/products/${id}/duplicate`, {
                method: 'POST',
            });
            await refresh();
            return newProduct;
        } catch (err) {
            console.error('Failed to duplicate product:', err);
            return null;
        }
    }, [refresh]);

    return {
        products,
        filteredProducts,
        categories,
        stats,
        isLoading,
        isRefreshing,
        isDeleting,
        page,
        limit,
        total,
        totalPages,
        setPage,
        searchQuery,
        categoryFilter,
        statusFilter,
        setSearchQuery,
        setCategoryFilter,
        setStatusFilter,
        refresh,
        deleteProduct,
        toggleProductActive,
        toggleProductFeatured,
        duplicateProduct,
        handleSearch,
    };
}

