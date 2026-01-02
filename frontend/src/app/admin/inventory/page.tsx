"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getImageUrl } from "@/lib/image-utils";
import { Package, Search, AlertTriangle, ArrowUp, ArrowDown, RefreshCw, History, TrendingUp, BoxIcon, DollarSign, X, Loader2 } from "lucide-react";
import { useInventory, MOVEMENT_TYPES, InventoryProduct, AdjustType } from "@/lib/admin/inventory";

export default function AdminInventoryPage() {
    const {
        products, filteredProducts, lowStockProducts, movements, summary,
        isLoading, isAdjusting,
        activeTab, setActiveTab, searchQuery, setSearchQuery,
        showAdjustModal, selectedProduct, adjustType, adjustQty, adjustReason,
        setAdjustType, setAdjustQty, setAdjustReason,
        openAdjustModal, closeAdjustModal, handleAdjust,
        refresh, getTypeLabel,
    } = useInventory();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Voorraad Beheer</h1>
                    <p className="text-zinc-500">Beheer productvoorraad en volg verplaatsingen</p>
                </div>
                <Button variant="outline" onClick={refresh} disabled={isLoading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />Vernieuwen
                </Button>
            </div>

            {/* Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <SummaryCard icon={BoxIcon} label="Producten" value={summary.totalProducts} color="blue" />
                    <SummaryCard icon={TrendingUp} label="Totaal eenheden" value={summary.totalUnits} color="green" />
                    <SummaryCard icon={AlertTriangle} label="Lage voorraad" value={summary.lowStock} color="yellow" />
                    <SummaryCard icon={Package} label="Niet op voorraad" value={summary.outOfStock} color="red" />
                    <SummaryCard icon={DollarSign} label="Voorraadwaarde" value={`€${summary.inventoryValue.toFixed(0)}`} color="purple" />
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2">
                <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overzicht</TabButton>
                <TabButton active={activeTab === "adjust"} onClick={() => setActiveTab("adjust")}>Aanpassen</TabButton>
                <TabButton active={activeTab === "history"} onClick={() => setActiveTab("history")}><History className="w-4 h-4 mr-2" />Geschiedenis</TabButton>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : activeTab === "overview" ? (
                <div className="space-y-4">
                    {lowStockProducts.length > 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                            <h3 className="font-semibold text-yellow-800 flex items-center gap-2"><AlertTriangle className="w-4 h-4" />Lage Voorraad</h3>
                            <div className="mt-3 space-y-2">
                                {lowStockProducts.slice(0, 5).map((p) => (
                                    <div key={p.id} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                                        <span className="text-sm font-medium text-zinc-900">{p.name}</span>
                                        <span className={`text-sm font-bold ${p.stockQty === 0 ? "text-red-600" : "text-yellow-600"}`}>{p.stockQty} stuks</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            ) : activeTab === "adjust" ? (
                <div className="bg-white rounded-xl border border-zinc-200">
                    <div className="p-4 border-b border-zinc-200">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Zoek producten..." className="pl-10" />
                        </div>
                    </div>
                    <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
                        {filteredProducts.map((product) => (
                            <ProductRow key={product.id} product={product} onStockIn={() => openAdjustModal(product, "STOCK_IN")} onStockOut={() => openAdjustModal(product, "STOCK_OUT")} />
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-xl border border-zinc-200">
                    <div className="divide-y divide-zinc-100 max-h-96 overflow-y-auto">
                        {movements.map((m) => {
                            const typeConfig = getTypeLabel(m.type);
                            return (
                                <div key={m.id} className="flex items-center justify-between px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig.color}`}>{typeConfig.label}</span>
                                        <span className="text-zinc-900 font-medium">{m.product.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <span className="text-zinc-500">{m.previousQty} → {m.newQty}</span>
                                        <span className={m.quantity > 0 ? "text-green-600" : "text-red-600"}>{m.quantity > 0 ? "+" : ""}{m.quantity}</span>
                                        <span className="text-zinc-400">{new Date(m.createdAt).toLocaleDateString("nl-NL")}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Adjust Modal */}
            {showAdjustModal && selectedProduct && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md m-4">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                            <h2 className="text-lg font-semibold">Voorraad Aanpassen</h2>
                            <button onClick={closeAdjustModal}><X className="w-5 h-5 text-zinc-400" /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="bg-zinc-50 rounded-lg p-3">
                                <p className="font-medium text-zinc-900">{selectedProduct.name}</p>
                                <p className="text-sm text-zinc-500">Huidige voorraad: {selectedProduct.stockQty}</p>
                            </div>
                            <div className="flex gap-2">
                                {(["STOCK_IN", "STOCK_OUT", "ADJUSTMENT"] as AdjustType[]).map((type) => (
                                    <button key={type} onClick={() => setAdjustType(type)} className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${adjustType === type ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-700"}`}>
                                        {type === "STOCK_IN" ? "In" : type === "STOCK_OUT" ? "Uit" : "Aanpassing"}
                                    </button>
                                ))}
                            </div>
                            <Input type="number" value={adjustQty} onChange={(e) => setAdjustQty(e.target.value)} placeholder="Aantal" min="1" />
                            <Input value={adjustReason} onChange={(e) => setAdjustReason(e.target.value)} placeholder="Reden (optioneel)" />
                        </div>
                        <div className="flex gap-2 p-4 border-t border-zinc-200">
                            <Button variant="outline" onClick={closeAdjustModal} className="flex-1">Annuleren</Button>
                            <Button onClick={handleAdjust} disabled={isAdjusting || !adjustQty} className="flex-1">
                                {isAdjusting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Opslaan
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string | number; color: string }) {
    const colorMap: Record<string, string> = { blue: "bg-blue-50 text-blue-600", green: "bg-green-50 text-green-600", yellow: "bg-yellow-50 text-yellow-600", red: "bg-red-50 text-red-600", purple: "bg-purple-50 text-purple-600" };
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center gap-2"><div className={`p-2 rounded-lg ${colorMap[color]}`}><Icon className="w-4 h-4" /></div></div>
            <p className="text-2xl font-bold text-zinc-900 mt-2">{value}</p>
            <p className="text-sm text-zinc-500">{label}</p>
        </div>
    );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button onClick={onClick} className={`flex items-center px-4 py-2 rounded-lg font-medium ${active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
            {children}
        </button>
    );
}

function ProductRow({ product, onStockIn, onStockOut }: { product: InventoryProduct; onStockIn: () => void; onStockOut: () => void }) {
    return (
        <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
                {product.images?.[0]?.url && <img src={getImageUrl(product.images[0].url)} alt="" className="w-10 h-10 object-cover rounded" />}
                <div>
                    <p className="font-medium text-zinc-900">{product.name}</p>
                    <p className="text-sm text-zinc-500">{product.sku || "Geen SKU"} • €{parseFloat(product.price).toFixed(2)}</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded text-sm font-medium ${product.stockQty === 0 ? "bg-red-100 text-red-700" : product.stockQty <= product.lowStockThreshold ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                    {product.stockQty} stuks
                </span>
                <Button size="sm" variant="outline" onClick={onStockIn}><ArrowUp className="w-4 h-4" /></Button>
                <Button size="sm" variant="outline" onClick={onStockOut}><ArrowDown className="w-4 h-4" /></Button>
            </div>
        </div>
    );
}
