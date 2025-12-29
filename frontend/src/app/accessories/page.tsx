"use client";

import { useState, useEffect } from "react";
import { Navbar, Footer } from "@/components/landing";
import { ProductGrid } from "@/components/storefront";
import { api, Product } from "@/lib/api";

export default function AccessoriesPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const response = await api.getProducts({ category: "accessories", limit: 24 });
                setProducts(response.data);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setIsLoading(false);
            }
        };
        loadProducts();
    }, []);

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900">Accessories</h1>
                    <p className="text-zinc-600 mt-2">Cases, chargers, and more essentials</p>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                    <span className="text-sm text-zinc-500">
                        {isLoading ? "Loading..." : `${products.length} products`}
                    </span>
                </div>

                {/* Product Grid */}
                <ProductGrid products={products} isLoading={isLoading} />
            </div>

            <Footer />
        </main>
    );
}
