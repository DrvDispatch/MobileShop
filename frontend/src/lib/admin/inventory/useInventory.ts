/**
 * Inventory Admin Hook
 * 
 * Business logic for admin inventory page.
 * Handles product stock, adjustments, movements, and summary.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface InventoryProduct {
    id: string;
    name: string;
    sku: string | null;
    stockQty: number;
    lowStockThreshold: number;
    price: string;
    images: { url: string }[];
}

export interface StockMovement {
    id: string;
    type: string;
    quantity: number;
    previousQty: number;
    newQty: number;
    reason: string | null;
    createdAt: string;
    product: {
        id: string;
        name: string;
        sku: string | null;
    };
    user: { id: string; name: string } | null;
}

export interface InventorySummary {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalUnits: number;
    inventoryValue: number;
}

export type AdjustType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
export type InventoryTab = 'overview' | 'adjust' | 'history';

// Configs
export const MOVEMENT_TYPES: Record<string, { label: string; color: string }> = {
    STOCK_IN: { label: 'Ingekomen', color: 'text-green-600 bg-green-50' },
    STOCK_OUT: { label: 'Uitgegaan', color: 'text-red-600 bg-red-50' },
    ADJUSTMENT: { label: 'Aanpassing', color: 'text-blue-600 bg-blue-50' },
    SALE: { label: 'Verkoop', color: 'text-purple-600 bg-purple-50' },
};

export interface UseInventoryReturn {
    // Data
    products: InventoryProduct[];
    filteredProducts: InventoryProduct[];
    lowStockProducts: InventoryProduct[];
    movements: StockMovement[];
    summary: InventorySummary | null;

    // Loading states
    isLoading: boolean;
    isAdjusting: boolean;

    // Tab state
    activeTab: InventoryTab;
    setActiveTab: (tab: InventoryTab) => void;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Adjustment modal
    showAdjustModal: boolean;
    selectedProduct: InventoryProduct | null;
    adjustType: AdjustType;
    adjustQty: string;
    adjustReason: string;
    setShowAdjustModal: (show: boolean) => void;
    setAdjustType: (type: AdjustType) => void;
    setAdjustQty: (qty: string) => void;
    setAdjustReason: (reason: string) => void;
    openAdjustModal: (product: InventoryProduct, type: AdjustType) => void;
    closeAdjustModal: () => void;
    handleAdjust: () => Promise<boolean>;

    // Actions
    refresh: () => Promise<void>;

    // Helpers
    getTypeLabel: (type: string) => { label: string; color: string };
}

export function useInventory(): UseInventoryReturn {
    // Data state
    const [products, setProducts] = useState<InventoryProduct[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<InventoryProduct[]>([]);
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [summary, setSummary] = useState<InventorySummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Tab state
    const [activeTab, setActiveTab] = useState<InventoryTab>('overview');

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Adjustment modal state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<InventoryProduct | null>(null);
    const [adjustType, setAdjustType] = useState<AdjustType>('STOCK_IN');
    const [adjustQty, setAdjustQty] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [isAdjusting, setIsAdjusting] = useState(false);

    // Fetch all inventory data
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [productsData, lowStockData, movementsData, summaryData] = await Promise.all([
                adminFetch<InventoryProduct[]>('/api/inventory/products'),
                adminFetch<InventoryProduct[]>('/api/inventory/low-stock?threshold=10'),
                adminFetch<{ data: StockMovement[] }>('/api/inventory/movements?limit=50'),
                adminFetch<InventorySummary>('/api/inventory/summary'),
            ]);

            setProducts(productsData);
            setLowStockProducts(lowStockData);
            setMovements(movementsData.data || []);
            setSummary(summaryData);
        } catch (error) {
            console.error('Failed to fetch inventory data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Filtered products
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return products;
        const query = searchQuery.toLowerCase();
        return products.filter(p =>
            p.name.toLowerCase().includes(query) ||
            (p.sku && p.sku.toLowerCase().includes(query))
        );
    }, [products, searchQuery]);

    // Open adjust modal
    const openAdjustModal = useCallback((product: InventoryProduct, type: AdjustType) => {
        setSelectedProduct(product);
        setAdjustType(type);
        setAdjustQty('');
        setAdjustReason('');
        setShowAdjustModal(true);
    }, []);

    // Close adjust modal
    const closeAdjustModal = useCallback(() => {
        setShowAdjustModal(false);
        setSelectedProduct(null);
        setAdjustQty('');
        setAdjustReason('');
    }, []);

    // Handle adjustment
    const handleAdjust = useCallback(async (): Promise<boolean> => {
        if (!selectedProduct || !adjustQty) return false;
        setIsAdjusting(true);

        try {
            await adminFetch('/api/inventory/adjust', {
                method: 'POST',
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: parseInt(adjustQty),
                    type: adjustType,
                    reason: adjustReason || undefined,
                }),
            });

            closeAdjustModal();
            await fetchData();
            return true;
        } catch (error) {
            console.error('Failed to adjust stock:', error);
            return false;
        } finally {
            setIsAdjusting(false);
        }
    }, [selectedProduct, adjustQty, adjustType, adjustReason, closeAdjustModal, fetchData]);

    // Get type label
    const getTypeLabel = useCallback((type: string): { label: string; color: string } => {
        return MOVEMENT_TYPES[type] || { label: type, color: 'text-zinc-600 bg-zinc-50' };
    }, []);

    return {
        // Data
        products,
        filteredProducts,
        lowStockProducts,
        movements,
        summary,

        // Loading states
        isLoading,
        isAdjusting,

        // Tab state
        activeTab,
        setActiveTab,

        // Search
        searchQuery,
        setSearchQuery,

        // Adjustment modal
        showAdjustModal,
        selectedProduct,
        adjustType,
        adjustQty,
        adjustReason,
        setShowAdjustModal,
        setAdjustType,
        setAdjustQty,
        setAdjustReason,
        openAdjustModal,
        closeAdjustModal,
        handleAdjust,

        // Actions
        refresh: fetchData,

        // Helpers
        getTypeLabel,
    };
}
