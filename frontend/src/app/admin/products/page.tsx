"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api, Product } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash2,
    ChevronLeft,
    ChevronRight,
    Package,
    ExternalLink,
    RefreshCw,
    AlertTriangle,
} from "lucide-react";

function ConditionBadge({ condition }: { condition: string }) {
    const classes: Record<string, string> = {
        NEW: "bg-green-100 text-green-700",
        USED: "bg-yellow-100 text-yellow-700",
        REFURBISHED: "bg-blue-100 text-blue-700",
    };
    const labels: Record<string, string> = {
        NEW: "Nieuw",
        USED: "Gebruikt",
        REFURBISHED: "Refurbished",
    };
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes[condition] || "bg-zinc-100 text-zinc-700"}`}>
            {labels[condition] || condition}
        </span>
    );
}

function StockBadge({ stock }: { stock: number }) {
    if (stock === 0) {
        return (
            <span className="inline-flex items-center gap-1 text-red-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                Uitverkocht
            </span>
        );
    }
    if (stock <= 5) {
        return (
            <span className="inline-flex items-center gap-1 text-yellow-600 font-medium">
                <AlertTriangle className="w-3 h-3" />
                {stock} over
            </span>
        );
    }
    return <span className="text-zinc-600">{stock} op voorraad</span>;
}

function ProductCard({ product, onEdit, onDelete, onView }: {
    product: Product;
    onEdit: () => void;
    onDelete: () => void;
    onView: () => void;
}) {
    const hasDiscount = product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price);
    const discountPercent = hasDiscount
        ? Math.round((1 - Number(product.price) / Number(product.compareAtPrice!)) * 100)
        : 0;

    return (
        <div
            onClick={onEdit}
            className="bg-white rounded-xl border border-zinc-200 overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer group"
        >
            {/* Product Image */}
            <div className="aspect-square bg-zinc-100 relative">
                {product.images?.[0] ? (
                    <img
                        src={getImageUrl(product.images[0].url)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-zinc-300" />
                    </div>
                )}

                {/* Status Badge */}
                <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${product.isActive ? "bg-green-100 text-green-700" : "bg-zinc-200 text-zinc-600"
                        }`}>
                        {product.isActive ? "Actief" : "Concept"}
                    </span>
                </div>

                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-red-500 text-white">
                            -{discountPercent}%
                        </span>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={(e) => { e.stopPropagation(); onView(); }}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-white shadow-sm"
                        title="Bekijk"
                    >
                        <ExternalLink className="w-4 h-4 text-zinc-600" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(); }}
                        className="p-2 bg-white/90 backdrop-blur rounded-lg hover:bg-red-50 shadow-sm"
                        title="Verwijderen"
                    >
                        <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                </div>
            </div>

            {/* Product Info */}
            <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                        <p className="font-semibold text-zinc-900 line-clamp-1">{product.name}</p>
                        <p className="text-sm text-zinc-500">{product.brand || "Geen merk"}</p>
                    </div>
                    <ConditionBadge condition={product.condition} />
                </div>

                <div className="flex items-end justify-between mt-3">
                    <div>
                        <p className="text-lg font-bold text-zinc-900">€{Number(product.price).toFixed(2)}</p>
                        {hasDiscount && (
                            <p className="text-sm text-zinc-400 line-through">€{Number(product.compareAtPrice).toFixed(2)}</p>
                        )}
                    </div>
                    <div className="text-right text-sm">
                        <StockBadge stock={product.stockQty} />
                    </div>
                </div>
            </div>
        </div>
    );
}

function ProductsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
    const [page, setPage] = useState(parseInt(searchParams.get("page") || "1"));
    const limit = 12;

    // Stats state (calculated from ALL products)
    const [stats, setStats] = useState({ active: 0, lowStock: 0, outOfStock: 0 });

    const loadProducts = async () => {
        setIsLoading(true);
        try {
            const response = await api.getProducts({
                search: searchQuery || undefined,
                page,
                limit,
            });
            setProducts(response.data);
            setTotal(response.meta?.total || 0);
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load stats from ALL products (separate call)
    const loadStats = async () => {
        try {
            // Fetch all products for accurate stats
            const allProducts = await api.getProducts({ limit: 1000 });
            const all = allProducts.data;
            setStats({
                active: all.filter((p: Product) => p.isActive).length,
                lowStock: all.filter((p: Product) => p.stockQty > 0 && p.stockQty <= 5).length,
                outOfStock: all.filter((p: Product) => p.stockQty === 0).length,
            });
        } catch (error) {
            console.error("Failed to load stats:", error);
        }
    };

    useEffect(() => {
        loadProducts();
    }, [searchQuery, page]);

    useEffect(() => {
        loadStats();
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await Promise.all([loadProducts(), loadStats()]);
        setIsRefreshing(false);
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        setPage(1);
    };

    const totalPages = Math.ceil(total / limit);

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Weet u zeker dat u "${name}" wilt verwijderen?`)) return;
        try {
            await api.deleteProduct(id);
            setProducts(products.filter((p) => p.id !== id));
            setTotal(total - 1);
            loadStats(); // Refresh stats after delete
        } catch (error) {
            console.error("Failed to delete product:", error);
            alert("Verwijderen mislukt");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Producten</h1>
                    <p className="text-zinc-500">{total} producten totaal</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Vernieuwen
                    </Button>
                    <Link href="/admin/products/new">
                        <Button className="bg-gradient-to-r from-zinc-900 to-zinc-700 hover:from-zinc-800 hover:to-zinc-600">
                            <Plus className="w-4 h-4 mr-2" />
                            Product Toevoegen
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Totaal</p>
                    <p className="text-2xl font-bold text-zinc-900">{total}</p>
                    <p className="text-xs text-zinc-500">producten</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700 mb-1">Actief</p>
                    <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                    <p className="text-xs text-green-600">zichtbaar in shop</p>
                </div>
                {stats.lowStock > 0 && (
                    <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
                        <p className="text-sm text-yellow-700 mb-1">Lage voorraad</p>
                        <p className="text-2xl font-bold text-yellow-700">{stats.lowStock}</p>
                        <p className="text-xs text-yellow-600">≤5 op voorraad</p>
                    </div>
                )}
                {stats.outOfStock > 0 && (
                    <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                        <p className="text-sm text-red-700 mb-1">Uitverkocht</p>
                        <p className="text-2xl font-bold text-red-700">{stats.outOfStock}</p>
                        <p className="text-xs text-red-600">0 op voorraad</p>
                    </div>
                )}
            </div>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input
                        type="text"
                        placeholder="Zoek producten..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </form>

            {/* Products Grid */}
            {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-zinc-200 overflow-hidden animate-pulse">
                            <div className="aspect-square bg-zinc-200" />
                            <div className="p-4 space-y-2">
                                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                                <div className="h-3 bg-zinc-200 rounded w-1/2" />
                                <div className="h-5 bg-zinc-200 rounded w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                    <Package className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">Geen producten gevonden</p>
                    <Link href="/admin/products/new">
                        <Button>Product toevoegen</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={() => router.push(`/admin/products/${product.id}/edit`)}
                            onDelete={() => handleDelete(product.id, product.name)}
                            onView={() => window.open(`/phones/${product.slug}`, "_blank")}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">
                        Toon {(page - 1) * limit + 1} tot {Math.min(page * limit, total)} van {total}
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page <= 1}
                            onClick={() => setPage(page - 1)}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <span className="text-sm text-zinc-600 px-2">
                            Pagina {page} van {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={page >= totalPages}
                            onClick={() => setPage(page + 1)}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminProductsPage() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-zinc-500">Laden...</div>}>
            <ProductsContent />
        </Suspense>
    );
}
