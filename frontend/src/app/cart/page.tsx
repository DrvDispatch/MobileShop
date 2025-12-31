"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { getImageUrl } from "@/lib/image-utils";
import { Minus, Plus, X, ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
    const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-zinc-200 rounded w-1/4" />
                        <div className="h-32 bg-zinc-200 rounded" />
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                    <h1 className="text-2xl font-bold text-zinc-900 mb-4">Your cart is empty</h1>
                    <p className="text-zinc-600 mb-8">Looks like you haven&apos;t added any items yet.</p>
                    <Link href="/phones">
                        <Button size="lg">
                            Browse Products
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    const subtotal = getTotal();

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold text-zinc-900 mb-8">Shopping Cart</h1>

                <div className="grid lg:grid-cols-3 gap-12">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="flex gap-4 p-4 bg-zinc-50 rounded-xl"
                            >
                                {/* Image */}
                                <div className="w-24 h-24 bg-zinc-200 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden">
                                    {item.image ? (
                                        <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="text-zinc-400 text-xs">No image</span>
                                    )}
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <Link href={`/products/${item.id}`} className="font-medium text-zinc-900 hover:underline line-clamp-1">
                                        {item.name}
                                    </Link>
                                    <p className="text-lg font-semibold text-zinc-900 mt-1">
                                        €{item.price.toFixed(2)}
                                    </p>

                                    {/* Quantity */}
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="flex items-center border border-zinc-200 rounded-lg bg-white">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-2 hover:bg-zinc-100 transition-colors"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="px-3 text-sm font-medium">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-2 hover:bg-zinc-100 transition-colors"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            className="text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="text-right flex-shrink-0">
                                    <p className="font-semibold text-zinc-900">
                                        €{(item.price * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            </div>
                        ))}

                        <button
                            onClick={clearCart}
                            className="text-sm text-zinc-500 hover:text-red-500 transition-colors"
                        >
                            Clear cart
                        </button>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="bg-zinc-50 rounded-xl p-6 sticky top-24">
                            <h2 className="text-lg font-semibold text-zinc-900 mb-6">Order Summary</h2>

                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Subtotal</span>
                                    <span className="font-medium">€{subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-zinc-600">Shipping</span>
                                    <span className="text-zinc-500">Calculated at checkout</span>
                                </div>
                                <p className="text-xs text-zinc-500">All prices include 21% VAT</p>
                            </div>

                            <div className="border-t border-zinc-200 pt-4 mb-6">
                                <div className="flex justify-between">
                                    <span className="font-semibold">Total</span>
                                    <span className="text-xl font-bold">€{subtotal.toFixed(2)}</span>
                                </div>
                            </div>

                            <Link href="/checkout">
                                <Button size="lg" className="w-full">
                                    Proceed to Checkout
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </Link>

                            <p className="text-xs text-zinc-500 text-center mt-4">
                                Secure checkout powered by Stripe
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
