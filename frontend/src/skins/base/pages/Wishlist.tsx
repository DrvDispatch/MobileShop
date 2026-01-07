'use client';

/**
 * Base Skin - Wishlist Page
 * PURE PRESENTATION ONLY
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import type { WishlistPageVM, WishlistItemVM } from '@core/hooks/pages/useWishlistPageVM';
import { Heart, ShoppingCart, Trash2, TrendingDown, Package, ArrowLeft, Loader2 } from 'lucide-react';

export interface WishlistPageProps {
    vm: WishlistPageVM;
}

function WishlistItemCard({ item, onRemove }: { item: WishlistItemVM; onRemove: () => void }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 hover:shadow-md transition-shadow">
            <div className="flex gap-4">
                {/* Product Image */}
                <Link href={`/products/${item.product.slug}`} className="flex-shrink-0">
                    <div className="w-24 h-24 bg-zinc-100 rounded-lg overflow-hidden">
                        {item.product.imageUrl ? (
                            <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-contain"
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
                        <h3 className="font-semibold text-zinc-900 hover:text-blue-600 transition-colors line-clamp-2">
                            {item.product.name}
                        </h3>
                    </Link>

                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-lg font-bold text-zinc-900">€{item.product.price.toFixed(2)}</span>
                        {item.hasPriceDrop && (
                            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                                <TrendingDown className="w-4 h-4" />
                                -€{item.priceDrop.toFixed(2)}
                            </span>
                        )}
                    </div>

                    <p className={`text-sm mt-1 ${item.product.isInStock ? 'text-green-600' : 'text-red-500'}`}>
                        {item.product.isInStock ? 'In Stock' : 'Out of Stock'}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-2 mt-3">
                        <Link href={`/products/${item.product.slug}`}>
                            <Button size="sm" disabled={!item.product.isInStock}>
                                <ShoppingCart className="w-4 h-4 mr-1" />
                                View Product
                            </Button>
                        </Link>
                        <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function WishlistPage({ vm }: WishlistPageProps) {
    if (vm.isLoading) {
        return (
            <div className="flex items-center justify-center py-32">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/account" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Account
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                    <Heart className="w-8 h-8 text-red-500" />
                    Mijn Verlanglijstje
                </h1>
                {vm.hasItems && (
                    <p className="text-zinc-600 mt-1">{vm.items.length} {vm.items.length === 1 ? 'item' : 'items'}</p>
                )}
            </div>

            {!vm.hasItems ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Heart className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2">Je verlanglijstje is leeg</h2>
                    <p className="text-zinc-600 mb-6">Voeg producten toe aan je verlanglijstje om ze later te bekijken.</p>
                    <Link href="/phones">
                        <Button>Bekijk producten</Button>
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {vm.items.map((item) => (
                        <WishlistItemCard
                            key={item.id}
                            item={item}
                            onRemove={() => vm.onRemoveItem(item.productId)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
