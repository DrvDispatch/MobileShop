/**
 * @core-only
 * 
 * Cart Page View Model
 * 
 * Provides cart state and actions to the Cart skin page.
 */

'use client';

import { useState, useEffect } from 'react';
import { useCartStore, CartItem } from '../store/cart';

export interface CartPageVM {
    items: CartItem[];
    subtotal: number;
    mounted: boolean;
    isEmpty: boolean;
    updateQuantity: (id: string, quantity: number) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
}

export function useCartPageVM(): CartPageVM {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    return {
        items,
        subtotal: getTotal(),
        mounted,
        isEmpty: items.length === 0,
        updateQuantity,
        removeItem,
        clearCart,
    };
}
