/**
 * @core-only
 * 
 * Search Page View Model
 * 
 * Handles search query, product fetching, and result state.
 */

'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { api, Product } from '@/lib/api';
import { getImageUrl } from '@/lib/image-utils';

export interface SearchProductVM {
    id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice: number | null;
    condition: string;
    stockQty: number;
    imageUrl: string | null;
}

export interface SearchPageVM {
    query: string;
    isLoading: boolean;
    total: number;
    products: SearchProductVM[];
    hasResults: boolean;
    hasQuery: boolean;
    statusMessage: string;
}

export function useSearchPageVM(): SearchPageVM {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";

    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const searchProducts = async () => {
            if (!query) {
                setProducts([]);
                setIsLoading(false);
                setTotal(0);
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.getProducts({ search: query, limit: 24 });
                setProducts(response.data);
                setTotal(response.meta.total);
            } catch (error) {
                console.error("Search failed:", error);
                setProducts([]);
                setTotal(0);
            } finally {
                setIsLoading(false);
            }
        };
        searchProducts();
    }, [query]);

    // Process products for display
    const processedProducts: SearchProductVM[] = products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        price: Number(p.price),
        compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
        condition: p.condition,
        stockQty: p.stockQty,
        imageUrl: p.images?.[0]?.url ? getImageUrl(p.images[0].url) : null,
    }));

    // Build status message
    let statusMessage = "";
    if (query) {
        statusMessage = isLoading
            ? "Searching..."
            : `Found ${total} results for "${query}"`;
    }

    return {
        query,
        isLoading,
        total,
        products: processedProducts,
        hasResults: processedProducts.length > 0,
        hasQuery: !!query,
        statusMessage,
    };
}
