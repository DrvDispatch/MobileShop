import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    slug?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
    removeItem: (id: string) => void;
    updateQuantity: (id: string, quantity: number) => void;
    clearCart: () => void;
    getTotal: () => number;
    getItemCount: () => number;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (item, quantity = 1) => {
                set((state) => {
                    const existingItem = state.items.find((i) => i.id === item.id);

                    if (existingItem) {
                        return {
                            items: state.items.map((i) =>
                                i.id === item.id
                                    ? { ...i, quantity: i.quantity + quantity }
                                    : i
                            ),
                        };
                    }

                    return {
                        items: [...state.items, { ...item, quantity }],
                    };
                });
            },

            removeItem: (id) => {
                set((state) => ({
                    items: state.items.filter((i) => i.id !== id),
                }));
            },

            updateQuantity: (id, quantity) => {
                if (quantity <= 0) {
                    get().removeItem(id);
                    return;
                }

                set((state) => ({
                    items: state.items.map((i) =>
                        i.id === id ? { ...i, quantity } : i
                    ),
                }));
            },

            clearCart: () => {
                set({ items: [] });
            },

            getTotal: () => {
                return get().items.reduce(
                    (total, item) => total + item.price * item.quantity,
                    0
                );
            },

            getItemCount: () => {
                return get().items.reduce((count, item) => count + item.quantity, 0);
            },
        }),
        {
            name: 'cart-storage',
        }
    )
);
