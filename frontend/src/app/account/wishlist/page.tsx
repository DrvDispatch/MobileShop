"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Heart,
    ShoppingCart,
    Trash2,
    TrendingDown,
    Package,
    ArrowLeft,
    Loader2,
} from "lucide-react";
import { getImageUrl } from "@/lib/image-utils";

// Use relative paths for tenant resolution

interface WishlistItem {
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
}

export default function WishlistPage() {
    const [items, setItems] = useState<WishlistItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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
                setItems(data.items || []);
            }
        } catch (error) {
            console.error("Failed to load wishlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const removeItem = async (productId: string) => {
        try {
            const token = localStorage.getItem("accessToken");
            await fetch(`/api/wishlist/${productId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            setItems(items.filter((item) => item.productId !== productId));
        } catch (error) {
            console.error("Failed to remove item:", error);
        }
    };

    useEffect(() => {
        loadWishlist();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-700 mb-4">
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        Terug naar account
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-3">
                        <Heart className="w-7 h-7 text-red-500 fill-red-500" />
                        Mijn Verlanglijstje
                    </h1>
                    <p className="text-zinc-500 mt-1">
                        {items.length} {items.length === 1 ? "product" : "producten"} bewaard
                    </p>
                </div>

                {items.length === 0 ? (
                    <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                        <Heart className="w-16 h-16 mx-auto text-zinc-200 mb-4" />
                        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Je verlanglijstje is leeg</h2>
                        <p className="text-zinc-500 mb-6">
                            Voeg producten toe aan je verlanglijstje door op het hartje te klikken
                        </p>
                        <Link href="/products">
                            <Button>
                                <Package className="w-4 h-4 mr-2" />
                                Bekijk producten
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className={`bg-white rounded-xl border p-4 transition-all ${item.product.stockQty === 0
                                    ? "border-zinc-300 opacity-70"
                                    : item.hasPriceDrop
                                        ? "border-green-200 bg-green-50/30"
                                        : "border-zinc-200"
                                    }`}
                            >
                                <div className="flex gap-4">
                                    {/* Product Image */}
                                    <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                                        <div className="w-24 h-24 bg-zinc-100 rounded-lg overflow-hidden">
                                            {item.product.image ? (
                                                <img
                                                    src={getImageUrl(item.product.image)}
                                                    alt={item.product.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <Package className="w-8 h-8 text-zinc-300" />
                                                </div>
                                            )}
                                        </div>
                                    </Link>

                                    {/* Product Info */}
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/products/${item.product.slug}`}>
                                            <h3 className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors">
                                                {item.product.name}
                                            </h3>
                                        </Link>

                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-xl font-bold text-zinc-900">
                                                €{item.currentPrice.toFixed(2)}
                                            </span>
                                            {item.hasPriceDrop && (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                                                    <TrendingDown className="w-3 h-3" />
                                                    €{item.priceDrop.toFixed(2)} goedkoper!
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-4 mt-3">
                                            {item.product.stockQty > 0 ? (
                                                <span className="text-sm text-green-600 font-medium">
                                                    Op voorraad ({item.product.stockQty})
                                                </span>
                                            ) : (
                                                <span className="text-sm text-red-500 font-medium">
                                                    Niet op voorraad
                                                </span>
                                            )}
                                            <span className="text-sm text-zinc-400">
                                                Toegevoegd op {new Date(item.addedAt).toLocaleDateString("nl-NL")}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2">
                                        <Button
                                            className="w-full"
                                            disabled={item.product.stockQty === 0}
                                            asChild
                                        >
                                            <Link href={`/products/${item.product.slug}`}>
                                                <ShoppingCart className="w-4 h-4 mr-2" />
                                                Bekijken
                                            </Link>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:bg-red-50"
                                            onClick={() => removeItem(item.productId)}
                                        >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Verwijderen
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
