"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { api, Product } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";

interface RelatedProductsProps {
    productId: string;
    currentBrand?: string;
}

export function RelatedProducts({ productId, currentBrand }: RelatedProductsProps) {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadRelatedProducts = async () => {
            try {
                const data = await api.getRelatedProducts(productId, 8);
                setProducts(data);
            } catch (error) {
                console.error("Failed to load related products:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (productId) {
            loadRelatedProducts();
        }
    }, [productId]);

    if (isLoading) {
        return (
            <div className="py-12">
                <h2 className="text-2xl font-bold text-zinc-900 mb-6">Similar Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="animate-pulse">
                            <div className="aspect-square bg-zinc-100 rounded-lg mb-3" />
                            <div className="h-4 bg-zinc-200 rounded w-3/4 mb-2" />
                            <div className="h-4 bg-zinc-200 rounded w-1/2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="py-12 border-t border-zinc-200">
            <h2 className="text-2xl font-bold text-zinc-900 mb-6">Similar Products</h2>
            <p className="text-zinc-600 mb-6">
                {currentBrand
                    ? `More from ${currentBrand} and similar devices in your price range`
                    : "You might also like"}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((product) => (
                    <Link
                        key={product.id}
                        href={`/products/${product.id}`}
                        className="group block"
                    >
                        <div className="relative aspect-square bg-zinc-50 rounded-lg overflow-hidden border border-zinc-200 mb-3 group-hover:border-zinc-400 transition-colors">
                            {product.images[0]?.url ? (
                                <img
                                    src={getImageUrl(product.images[0].url)}
                                    alt={product.name}
                                    className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-200"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23f4f4f5'%3E%3Crect width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23a1a1aa' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    No Image
                                </div>
                            )}
                            {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded">
                                    Sale
                                </span>
                            )}
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs text-zinc-500 uppercase tracking-wide">
                                {product.brand || "Phone"}
                            </p>
                            <h3 className="text-sm font-medium text-zinc-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                {product.name}
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-zinc-900">
                                    €{Number(product.price).toFixed(2)}
                                </span>
                                {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                                    <span className="text-xs text-zinc-400 line-through">
                                        €{Number(product.compareAtPrice).toFixed(2)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
