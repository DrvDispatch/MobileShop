/**
 * Gallery Admin Hook
 * 
 * Business logic for admin gallery page.
 * Handles asset management, search, selection, and bulk operations.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface Asset {
    url: string;
    key: string;
    lastModified?: string;
    size?: number;
}

export interface UseGalleryReturn {
    // Data
    assets: Asset[];
    filteredAssets: Asset[];
    assetsByBrand: Record<string, Asset[]>;

    // Loading states
    isLoading: boolean;
    isDeleting: boolean;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;

    // Selection
    selectedAssets: string[];
    toggleSelection: (url: string) => void;
    selectAll: () => void;
    clearSelection: () => void;
    isSelected: (url: string) => boolean;

    // Actions
    refresh: () => Promise<void>;
    deleteSelected: () => Promise<boolean>;
    deleteAsset: (key: string) => Promise<boolean>;
}

// Sorting helpers
const getBrandScore = (key: string): number => {
    if (key.includes('/Apple/')) return 1000;
    if (key.includes('/Samsung/')) return 500;
    return 0;
};

const getModelTierScore = (key: string): number => {
    if (key.includes('Pro Max') || key.includes('Ultra')) return 300;
    if (key.includes('Pro') && !key.includes('Pro Max')) return 250;
    if (key.includes('Plus')) return 200;
    if (key.includes('Z Fold') || key.includes('Z Flip')) return 180;
    return 100;
};

const getModelNumber = (key: string): number => {
    const match = key.match(/(?:iPhone|iPad|Galaxy\s*[A-Z]?)[\s]*(\d+)/i);
    return match ? parseInt(match[1]) : 0;
};

export function useGallery(): UseGalleryReturn {
    // Data state
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    // Search state
    const [searchQuery, setSearchQuery] = useState('');

    // Selection state
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

    // Load assets
    const loadAssets = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<{ assets: Asset[] }>(
                '/api/upload/assets?folder=devices&limit=250'
            );
            setAssets(data.assets || []);
        } catch (err) {
            console.error('Failed to load assets:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadAssets();
    }, [loadAssets]);

    // Sorted assets
    const sortedAssets = useMemo(() => {
        return [...assets].sort((a, b) => {
            const brandDiff = getBrandScore(b.key) - getBrandScore(a.key);
            if (brandDiff !== 0) return brandDiff;
            const tierDiff = getModelTierScore(b.key) - getModelTierScore(a.key);
            if (tierDiff !== 0) return tierDiff;
            return getModelNumber(b.key) - getModelNumber(a.key);
        });
    }, [assets]);

    // Filtered assets
    const filteredAssets = useMemo(() => {
        if (!searchQuery.trim()) return sortedAssets;
        return sortedAssets.filter(asset =>
            asset.key.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [sortedAssets, searchQuery]);

    // Assets grouped by brand
    const assetsByBrand = useMemo(() => {
        const grouped: Record<string, Asset[]> = {};
        filteredAssets.forEach(asset => {
            const parts = asset.key.split('/');
            const brand = parts.length > 1 ? parts[1] : 'Other';
            if (!grouped[brand]) grouped[brand] = [];
            grouped[brand].push(asset);
        });
        return grouped;
    }, [filteredAssets]);

    // Selection handlers
    const toggleSelection = useCallback((url: string) => {
        setSelectedAssets(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    }, []);

    const selectAll = useCallback(() => {
        if (selectedAssets.length === filteredAssets.length) {
            setSelectedAssets([]);
        } else {
            setSelectedAssets(filteredAssets.map(a => a.url));
        }
    }, [selectedAssets.length, filteredAssets]);

    const clearSelection = useCallback(() => {
        setSelectedAssets([]);
    }, []);

    const isSelected = useCallback((url: string): boolean => {
        return selectedAssets.includes(url);
    }, [selectedAssets]);

    // Delete single asset
    const deleteAsset = useCallback(async (key: string): Promise<boolean> => {
        try {
            await adminFetch(`/api/upload/${encodeURIComponent(key)}`, {
                method: 'DELETE',
            });
            return true;
        } catch (err) {
            console.error('Failed to delete asset:', err);
            return false;
        }
    }, []);

    // Delete selected assets
    const deleteSelected = useCallback(async (): Promise<boolean> => {
        if (!confirm(`Weet je zeker dat je ${selectedAssets.length} afbeelding(en) wilt verwijderen?`)) {
            return false;
        }

        setIsDeleting(true);
        try {
            for (const url of selectedAssets) {
                const asset = assets.find(a => a.url === url);
                if (asset) {
                    await deleteAsset(asset.key);
                }
            }
            setSelectedAssets([]);
            await loadAssets();
            return true;
        } catch (err) {
            console.error('Failed to delete assets:', err);
            alert('Verwijderen mislukt');
            return false;
        } finally {
            setIsDeleting(false);
        }
    }, [selectedAssets, assets, deleteAsset, loadAssets]);

    return {
        // Data
        assets,
        filteredAssets,
        assetsByBrand,

        // Loading states
        isLoading,
        isDeleting,

        // Search
        searchQuery,
        setSearchQuery,

        // Selection
        selectedAssets,
        toggleSelection,
        selectAll,
        clearSelection,
        isSelected,

        // Actions
        refresh: loadAssets,
        deleteSelected,
        deleteAsset,
    };
}
