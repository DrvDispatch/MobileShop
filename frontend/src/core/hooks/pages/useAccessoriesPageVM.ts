/**
 * @core-only
 * Accessories Page View Model
 */

'use client';

import { useState, useEffect } from 'react';
import { api, Product } from '@/lib/api';

export interface AccessoriesPageVM {
    products: Product[];
    isLoading: boolean;
    productCount: number;
}

export function useAccessoriesPageVM(): AccessoriesPageVM {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await api.getProducts({ category: "accessories", limit: 24 });
                setProducts(response.data);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, []);

    return {
        products,
        isLoading,
        productCount: products.length,
    };
}
