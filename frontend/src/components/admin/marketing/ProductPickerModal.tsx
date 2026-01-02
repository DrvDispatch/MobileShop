/**
 * Product Picker Modal Component
 * Modal for selecting products to include in marketing emails
 */

import { Search, X } from "lucide-react";
import { type MarketingProduct } from "@/lib/admin/marketing";

export interface ProductPickerModalProps {
    products: MarketingProduct[];
    search: string;
    onSearch: (q: string) => void;
    onSelect: (p: MarketingProduct) => void;
    onClose: () => void;
}

export function ProductPickerModal({ products, search, onSearch, onSelect, onClose }: ProductPickerModalProps) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden m-4">
                <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                    <h3 className="font-semibold">Product Selecteren</h3>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <div className="p-4 border-b border-zinc-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" value={search} onChange={(e) => onSearch(e.target.value)}
                            placeholder="Zoek product..." className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg" />
                    </div>
                </div>
                <div className="overflow-y-auto max-h-80 p-4">
                    {products.length === 0 ? (
                        <p className="text-center text-zinc-500 py-8">Geen producten gevonden</p>
                    ) : (
                        <div className="space-y-2">
                            {products.slice(0, 20).map((product) => (
                                <button key={product.id} onClick={() => onSelect(product)}
                                    className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 rounded-lg text-left">
                                    <div className="flex-1">
                                        <p className="font-medium">{product.name}</p>
                                        <p className="text-sm text-purple-600">€{Number(product.price).toFixed(2)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
