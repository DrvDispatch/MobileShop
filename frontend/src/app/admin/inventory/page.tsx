"use client";

import { useEffect, useState } from "react";
import { getImageUrl } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Package,
    Search,
    AlertTriangle,
    ArrowUp,
    ArrowDown,
    RefreshCw,
    History,
    TrendingUp,
    BoxIcon,
    DollarSign,
    X,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

interface Product {
    id: string;
    name: string;
    sku: string | null;
    stockQty: number;
    lowStockThreshold: number;
    price: string;
    images: { url: string }[];
}

interface Movement {
    id: string;
    type: string;
    quantity: number;
    previousQty: number;
    newQty: number;
    reason: string | null;
    createdAt: string;
    product: {
        id: string;
        name: string;
        sku: string | null;
    };
    user: { id: string; name: string } | null;
}

interface Summary {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
    totalUnits: number;
    inventoryValue: number;
}

export default function AdminInventoryPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [summary, setSummary] = useState<Summary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState<"overview" | "adjust" | "history">("overview");

    // Adjustment modal state
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [adjustType, setAdjustType] = useState<"STOCK_IN" | "STOCK_OUT" | "ADJUSTMENT">("STOCK_IN");
    const [adjustQty, setAdjustQty] = useState("");
    const [adjustReason, setAdjustReason] = useState("");
    const [isAdjusting, setIsAdjusting] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        const token = localStorage.getItem("adminAccessToken");
        try {
            const [productsRes, lowStockRes, movementsRes, summaryRes] = await Promise.all([
                fetch(`/api/inventory/products`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`/api/inventory/low-stock?threshold=10`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`/api/inventory/movements?limit=50`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch(`/api/inventory/summary`, {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ]);

            if (productsRes.ok) setProducts(await productsRes.json());
            if (lowStockRes.ok) setLowStockProducts(await lowStockRes.json());
            if (movementsRes.ok) {
                const data = await movementsRes.json();
                setMovements(data.data || []);
            }
            if (summaryRes.ok) setSummary(await summaryRes.json());
        } catch (error) {
            console.error("Failed to fetch inventory data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAdjust = async () => {
        if (!selectedProduct || !adjustQty) return;
        setIsAdjusting(true);

        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/inventory/adjust`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    productId: selectedProduct.id,
                    quantity: parseInt(adjustQty),
                    type: adjustType,
                    reason: adjustReason || undefined,
                }),
            });

            if (res.ok) {
                setShowAdjustModal(false);
                setSelectedProduct(null);
                setAdjustQty("");
                setAdjustReason("");
                fetchData();
            }
        } catch (error) {
            console.error("Failed to adjust stock:", error);
        } finally {
            setIsAdjusting(false);
        }
    };

    const filteredProducts = products.filter(
        (p) =>
            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "STOCK_IN": return { label: "Ingekomen", color: "text-green-600 bg-green-50" };
            case "STOCK_OUT": return { label: "Uitgegaan", color: "text-red-600 bg-red-50" };
            case "ADJUSTMENT": return { label: "Aanpassing", color: "text-blue-600 bg-blue-50" };
            case "SALE": return { label: "Verkoop", color: "text-purple-600 bg-purple-50" };
            default: return { label: type, color: "text-zinc-600 bg-zinc-50" };
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Voorraadbeheer</h1>
                    <p className="text-zinc-500">Beheer je voorraad en bekijk bewegingen</p>
                </div>
                <Button onClick={fetchData} variant="outline" size="sm">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Vernieuwen
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <Package className="w-4 h-4" />
                            <span className="text-sm">Producten</span>
                        </div>
                        <p className="text-2xl font-bold text-zinc-900">{summary.totalProducts}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <BoxIcon className="w-4 h-4" />
                            <span className="text-sm">Totaal stuks</span>
                        </div>
                        <p className="text-2xl font-bold text-zinc-900">{summary.totalUnits}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center gap-2 text-zinc-500 mb-1">
                            <DollarSign className="w-4 h-4" />
                            <span className="text-sm">Voorraadwaarde</span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">€{summary.inventoryValue.toLocaleString("nl-NL", { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${summary.lowStock > 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-zinc-200"}`}>
                        <div className="flex items-center gap-2 text-yellow-600 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Lage voorraad</span>
                        </div>
                        <p className="text-2xl font-bold text-yellow-700">{summary.lowStock}</p>
                    </div>
                    <div className={`rounded-xl border p-4 ${summary.outOfStock > 0 ? "bg-red-50 border-red-200" : "bg-white border-zinc-200"}`}>
                        <div className="flex items-center gap-2 text-red-600 mb-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span className="text-sm">Uitverkocht</span>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{summary.outOfStock}</p>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-zinc-200">
                {[
                    { id: "overview", label: "Overzicht", icon: TrendingUp },
                    { id: "adjust", label: "Aanpassen", icon: Package },
                    { id: "history", label: "Geschiedenis", icon: History },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? "border-zinc-900 text-zinc-900"
                            : "border-transparent text-zinc-500 hover:text-zinc-700"
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Low Stock Alerts */}
            {lowStockProducts.length > 0 && activeTab === "overview" && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <h3 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Producten met lage voorraad
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {lowStockProducts.slice(0, 6).map((product) => (
                            <div key={product.id} className="bg-white rounded-lg p-3 border border-yellow-100 flex items-center gap-3">
                                <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center flex-shrink-0">
                                    {product.images[0] ? (
                                        <img src={getImageUrl(product.images[0].url)} alt="" className="w-full h-full object-cover rounded" />
                                    ) : (
                                        <Package className="w-5 h-5 text-zinc-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm text-zinc-900 truncate">{product.name}</p>
                                    <p className="text-xs text-yellow-700">
                                        <span className="font-bold">{product.stockQty}</span> op voorraad
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedProduct(product);
                                        setAdjustType("STOCK_IN");
                                        setShowAdjustModal(true);
                                    }}
                                >
                                    <ArrowUp className="w-3 h-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Products Table / Adjust Tab */}
            {(activeTab === "overview" || activeTab === "adjust") && (
                <div className="bg-white rounded-xl border border-zinc-200">
                    <div className="p-4 border-b border-zinc-100 flex items-center justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input
                                type="text"
                                placeholder="Zoek product..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-zinc-50 border-b border-zinc-100">
                                <tr>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Product</th>
                                    <th className="text-left px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">SKU</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Voorraad</th>
                                    <th className="text-right px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Prijs</th>
                                    <th className="text-center px-4 py-3 text-xs font-semibold text-zinc-500 uppercase">Acties</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            Laden...
                                        </td>
                                    </tr>
                                ) : filteredProducts.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-4 py-8 text-center text-zinc-500">
                                            Geen producten gevonden
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-zinc-50">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-zinc-100 rounded flex items-center justify-center flex-shrink-0">
                                                        {product.images[0] ? (
                                                            <img src={getImageUrl(product.images[0].url)} alt="" className="w-full h-full object-cover rounded" />
                                                        ) : (
                                                            <Package className="w-5 h-5 text-zinc-400" />
                                                        )}
                                                    </div>
                                                    <span className="font-medium text-zinc-900 truncate max-w-[200px]">{product.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-zinc-500">{product.sku || "-"}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`font-semibold ${product.stockQty === 0 ? "text-red-600" :
                                                    product.stockQty <= product.lowStockThreshold ? "text-yellow-600" :
                                                        "text-zinc-900"
                                                    }`}>
                                                    {product.stockQty}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right text-sm text-zinc-500">
                                                €{Number(product.price).toFixed(2)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-1">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-green-600 hover:bg-green-50"
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setAdjustType("STOCK_IN");
                                                            setShowAdjustModal(true);
                                                        }}
                                                    >
                                                        <ArrowUp className="w-3 h-3" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="text-red-600 hover:bg-red-50"
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setAdjustType("STOCK_OUT");
                                                            setShowAdjustModal(true);
                                                        }}
                                                    >
                                                        <ArrowDown className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
                <div className="bg-white rounded-xl border border-zinc-200">
                    <div className="p-4 border-b border-zinc-100">
                        <h3 className="font-semibold text-zinc-900">Recente voorraadwijzigingen</h3>
                    </div>
                    <div className="divide-y divide-zinc-100">
                        {movements.length === 0 ? (
                            <div className="px-4 py-8 text-center text-zinc-500">
                                Geen voorraadwijzigingen gevonden
                            </div>
                        ) : (
                            movements.map((movement) => {
                                const typeInfo = getTypeLabel(movement.type);
                                return (
                                    <div key={movement.id} className="p-4 flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${typeInfo.color}`}>
                                            {movement.quantity > 0 ? (
                                                <ArrowUp className="w-5 h-5" />
                                            ) : (
                                                <ArrowDown className="w-5 h-5" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-zinc-900">{movement.product.name}</p>
                                            <p className="text-sm text-zinc-500">
                                                {typeInfo.label}: {movement.quantity > 0 ? "+" : ""}{movement.quantity} stuks
                                                {movement.reason && ` • ${movement.reason}`}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-zinc-900">
                                                {movement.previousQty} → {movement.newQty}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {new Date(movement.createdAt).toLocaleString("nl-NL")}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Adjust Modal */}
            {showAdjustModal && selectedProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
                        <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="font-semibold text-lg">Voorraad aanpassen</h3>
                            <button onClick={() => setShowAdjustModal(false)} className="p-1 hover:bg-zinc-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <p className="text-sm text-zinc-500">Product</p>
                                <p className="font-medium">{selectedProduct.name}</p>
                                <p className="text-sm text-zinc-500">Huidige voorraad: {selectedProduct.stockQty}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Type</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: "STOCK_IN", label: "Inkomen", icon: ArrowUp, color: "text-green-600 border-green-500 bg-green-50" },
                                        { id: "STOCK_OUT", label: "Uitgaan", icon: ArrowDown, color: "text-red-600 border-red-500 bg-red-50" },
                                    ].map((type) => (
                                        <button
                                            key={type.id}
                                            onClick={() => setAdjustType(type.id as typeof adjustType)}
                                            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${adjustType === type.id ? type.color : "border-zinc-200 hover:border-zinc-300"
                                                }`}
                                        >
                                            <type.icon className="w-4 h-4" />
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Aantal</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={adjustQty}
                                    onChange={(e) => setAdjustQty(e.target.value)}
                                    placeholder="Voer aantal in"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Reden (optioneel)</label>
                                <Input
                                    type="text"
                                    value={adjustReason}
                                    onChange={(e) => setAdjustReason(e.target.value)}
                                    placeholder="bijv. Nieuwe levering, Beschadigde producten"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-100 flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setShowAdjustModal(false)}>
                                Annuleren
                            </Button>
                            <Button onClick={handleAdjust} disabled={!adjustQty || isAdjusting}>
                                {isAdjusting ? "Bezig..." : "Aanpassen"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
