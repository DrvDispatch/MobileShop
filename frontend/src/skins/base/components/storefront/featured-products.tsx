"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ProductCard } from "./product-card";
import { api, Product } from "@/lib/api";

export function FeaturedProducts() {
    const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
    const [moreProducts, setMoreProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                // Fetch featured products
                const featured = await api.getFeaturedProducts(4);
                setFeaturedProducts(featured);

                // Fetch more products (latest)
                const response = await api.getProducts({ limit: 8, sortBy: "createdAt", sortOrder: "desc" });
                // Filter out already featured products
                const featuredIds = new Set(featured.map((p: Product) => p.id));
                const more = response.data.filter((p: Product) => !featuredIds.has(p.id)).slice(0, 8);
                setMoreProducts(more);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadProducts();
    }, []);

    // Loading skeleton
    if (isLoading) {
        return (
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="animate-pulse">
                                <div className="bg-zinc-200 rounded-xl aspect-square" />
                                <div className="mt-3 space-y-2">
                                    <div className="h-3 bg-zinc-200 rounded w-16" />
                                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                                    <div className="h-4 bg-zinc-200 rounded w-1/2" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // No products state
    if (featuredProducts.length === 0 && moreProducts.length === 0) {
        return (
            <section className="py-12 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <p className="text-zinc-500">No products available yet. Check back soon!</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Featured Products Row */}
                {featuredProducts.length > 0 && (
                    <>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900">Featured Products</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                            {featuredProducts.map((product, index) => (
                                <div key={product.id} className="relative">
                                    <span className="absolute -top-2 -left-2 w-6 h-6 bg-zinc-200 rounded-full flex items-center justify-center text-xs font-medium text-zinc-600 z-10">
                                        {index + 1}
                                    </span>
                                    <ProductCard
                                        id={product.id}
                                        name={product.name}
                                        price={Number(product.price)}
                                        originalPrice={product.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                                        image={product.images?.[0]?.url}
                                        category={product.category?.name}
                                        isNew={product.condition === "NEW"}
                                    />
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* More Products Section */}
                {moreProducts.length > 0 && (
                    <div className="mt-16">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-semibold text-zinc-900">More Products</h2>
                            <Link href="/phones" className="text-sm text-zinc-600 hover:text-zinc-900 transition-colors">
                                View all →
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {moreProducts.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    price={Number(product.price)}
                                    originalPrice={product.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                                    image={product.images?.[0]?.url}
                                    category={product.category?.name}
                                    isNew={product.condition === "NEW"}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
