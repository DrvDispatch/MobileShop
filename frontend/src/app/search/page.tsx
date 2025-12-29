"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { ProductGrid } from "@/components/storefront";
import { api, Product } from "@/lib/api";
import { Search as SearchIcon } from "lucide-react";

function SearchContent() {
    const searchParams = useSearchParams();
    const query = searchParams.get("q") || "";
    const [products, setProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        const searchProducts = async () => {
            if (!query) {
                setProducts([]);
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            try {
                const response = await api.getProducts({ search: query, limit: 24 });
                setProducts(response.data);
                setTotal(response.meta.total);
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        };
        searchProducts();
    }, [query]);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900 flex items-center gap-3">
                    <SearchIcon className="w-8 h-8" />
                    Search Results
                </h1>
                {query && (
                    <p className="text-zinc-600 mt-2">
                        {isLoading
                            ? "Searching..."
                            : `Found ${total} results for "${query}"`}
                    </p>
                )}
            </div>

            {/* No query state */}
            {!query && (
                <div className="text-center py-16">
                    <SearchIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Enter a search term to find products</p>
                </div>
            )}

            {/* Results */}
            {query && <ProductGrid products={products} isLoading={isLoading} />}
        </div>
    );
}

export default function SearchPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <Suspense fallback={
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse">
                        <div className="h-10 bg-zinc-200 rounded w-1/3 mb-8" />
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="aspect-square bg-zinc-200 rounded-xl" />
                            ))}
                        </div>
                    </div>
                </div>
            }>
                <SearchContent />
            </Suspense>
            <Footer />
        </main>
    );
}
