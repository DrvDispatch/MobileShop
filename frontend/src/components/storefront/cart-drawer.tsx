"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/image-utils";
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react";

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, getTotal, getItemCount, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isOpen]);

    if (!mounted) return null;

    const itemCount = getItemCount();
    const total = getTotal();

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
                    }`}
                onClick={onClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 h-full w-full max-w-md bg-white z-50 shadow-2xl transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "translate-x-full"
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        <h2 className="text-lg font-semibold text-zinc-900">
                            Your Cart ({itemCount})
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-zinc-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex flex-col h-[calc(100%-140px)] overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <ShoppingBag className="w-16 h-16 text-zinc-300 mb-4" />
                            <h3 className="text-lg font-medium text-zinc-900 mb-2">Your cart is empty</h3>
                            <p className="text-zinc-500 mb-6">Add some items to get started</p>
                            <Button onClick={onClose} asChild>
                                <Link href="/phones">Browse Products</Link>
                            </Button>
                        </div>
                    ) : (
                        <div className="p-4 space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 p-3 bg-zinc-50 rounded-xl"
                                >
                                    {/* Image */}
                                    <div className="w-20 h-20 bg-white rounded-lg overflow-hidden flex-shrink-0 border border-zinc-200">
                                        {item.image ? (
                                            <img
                                                src={getImageUrl(item.image)}
                                                alt={item.name}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                <ShoppingBag className="w-8 h-8" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-medium text-zinc-900 truncate">{item.name}</h4>
                                        <p className="text-lg font-semibold text-zinc-900 mt-1">
                                            €{item.price.toFixed(2)}
                                        </p>

                                        {/* Quantity Controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-1 hover:bg-zinc-200 rounded transition-colors"
                                                disabled={item.quantity <= 1}
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 hover:bg-zinc-200 rounded transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="p-1 ml-auto text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {/* Clear Cart */}
                            {items.length > 0 && (
                                <button
                                    onClick={clearCart}
                                    className="text-sm text-zinc-500 hover:text-red-500 transition-colors"
                                >
                                    Clear all items
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-zinc-200 bg-white">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-zinc-600">Subtotal (incl. tax)</span>
                            <span className="text-xl font-bold text-zinc-900">€{total.toFixed(2)}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Button variant="outline" asChild onClick={onClose}>
                                <Link href="/cart">View Cart</Link>
                            </Button>
                            <Button asChild>
                                <Link href="/checkout">Checkout</Link>
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
