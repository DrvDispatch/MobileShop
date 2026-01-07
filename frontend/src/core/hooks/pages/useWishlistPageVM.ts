/**
 * @core-only
 * Wishlist Page View Model
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getImageUrl } from '@/lib/image-utils';

export interface WishlistItemVM {
    id: string;
    productId: string;
    addedAt: string;
    priceWhenAdded: number;
    currentPrice: number;
    priceDrop: number;
    hasPriceDrop: boolean;
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        stockQty: number;
        isActive: boolean;
        condition: string;
        imageUrl: string | null;
        isInStock: boolean;
    };
}

export interface WishlistPageVM {
    isLoading: boolean;
    items: WishlistItemVM[];
    hasItems: boolean;
    onRemoveItem: (productId: string) => void;
}

export function useWishlistPageVM(): WishlistPageVM {
    const [items, setItems] = useState<WishlistItemVM[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadWishlist = async () => {
            try {
                const token = localStorage.getItem("accessToken");
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                const response = await fetch(`/api/wishlist`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const data = await response.json();
                    const processed = (data.items || []).map((item: {
                        id: string;
                        productId: string;
                        addedAt: string;
                        priceWhenAdded: number;
                        currentPrice: number;
                        priceDrop: number;
                        hasPriceDrop: boolean;
                        product: {
                            id: string;
                            name: string;
                            slug: string;
                            price: number;
                            stockQty: number;
                            isActive: boolean;
                            condition: string;
                            image: string | null;
                        };
                    }) => ({
                        id: item.id,
                        productId: item.productId,
                        addedAt: item.addedAt,
                        priceWhenAdded: item.priceWhenAdded,
                        currentPrice: item.currentPrice,
                        priceDrop: item.priceDrop,
                        hasPriceDrop: item.hasPriceDrop,
                        product: {
                            id: item.product.id,
                            name: item.product.name,
                            slug: item.product.slug,
                            price: item.product.price,
                            stockQty: item.product.stockQty,
                            isActive: item.product.isActive,
                            condition: item.product.condition,
                            imageUrl: item.product.image ? getImageUrl(item.product.image) : null,
                            isInStock: item.product.stockQty > 0,
                        },
                    }));
                    setItems(processed);
                }
            } catch (error) {
                console.error("Failed to load wishlist:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadWishlist();
    }, []);

    const onRemoveItem = useCallback(async (productId: string) => {
        try {
            const token = localStorage.getItem("accessToken");
            await fetch(`/api/wishlist/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(prev => prev.filter(item => item.productId !== productId));
        } catch (error) {
            console.error("Failed to remove item:", error);
        }
    }, []);

    return {
        isLoading,
        items,
        hasItems: items.length > 0,
        onRemoveItem,
    };
}
