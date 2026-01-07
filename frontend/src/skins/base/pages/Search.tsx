'use client';

/**
 * Base Skin - Search Page
 * 
 * PURE PRESENTATION ONLY
 * - Receives SearchPageVM via props
 * - Zero hooks, zero fetch
 * - No Navbar/Footer (layout provides them)
 */

import Link from 'next/link';
import type { SearchPageVM, SearchProductVM } from '@core/hooks/pages/useSearchPageVM';
import { Search as SearchIcon } from 'lucide-react';

export interface SearchPageProps {
    vm: SearchPageVM;
}

// Product card component for search results
function ProductCard({ product }: { product: SearchProductVM }) {
    return (
        <Link
            href={`/products/${product.slug}`}
            className="group block bg-white rounded-xl border border-zinc-200 overflow-hidden hover:shadow-lg transition-shadow"
        >
            {/* Image */}
            <div className="aspect-square bg-zinc-50 relative">
                {product.imageUrl ? (
                    <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-300">
                        <SearchIcon className="w-12 h-12" />
                    </div>
                )}
                {/* Condition Badge */}
                <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-semibold rounded ${product.condition === "NEW"
                        ? "bg-green-100 text-green-700"
                        : product.condition === "REFURBISHED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-zinc-100 text-zinc-700"
                    }`}>
                    {product.condition}
                </span>
            </div>

            {/* Info */}
            <div className="p-4">
                <h3 className="font-medium text-zinc-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {product.name}
                </h3>
                <div className="flex items-baseline gap-2 mt-2">
                    <span className="text-lg font-bold text-zinc-900">
                        €{product.price.toFixed(2)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                        <span className="text-sm text-zinc-400 line-through">
                            €{product.compareAtPrice.toFixed(2)}
                        </span>
                    )}
                </div>
                {product.stockQty > 0 ? (
                    <p className="text-sm text-green-600 mt-1">In Stock</p>
                ) : (
                    <p className="text-sm text-red-500 mt-1">Out of Stock</p>
                )}
            </div>
        </Link>
    );
}

// Loading skeleton
function LoadingSkeleton() {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse">
                    <div className="aspect-square bg-zinc-200 rounded-xl" />
                    <div className="mt-3 h-4 bg-zinc-200 rounded w-3/4" />
                    <div className="mt-2 h-5 bg-zinc-200 rounded w-1/2" />
                </div>
            ))}
        </div>
    );
}

export function SearchPage({ vm }: SearchPageProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                    <SearchIcon className="w-8 h-8" />
                    Search Results
                </h1>
                {vm.hasQuery && (
                    <p className="text-zinc-600 mt-2">{vm.statusMessage}</p>
                )}
            </div>

            {/* No query state */}
            {!vm.hasQuery && (
                <div className="text-center py-16">
                    <SearchIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Enter a search term to find products</p>
                </div>
            )}

            {/* Loading state */}
            {vm.hasQuery && vm.isLoading && <LoadingSkeleton />}

            {/* Results */}
            {vm.hasQuery && !vm.isLoading && (
                vm.hasResults ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {vm.products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <SearchIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-500">No products found for "{vm.query}"</p>
                    </div>
                )
            )}
        </div>
    );
}
