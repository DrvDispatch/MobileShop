/**
 * Featured Products Component
 * Displays selected products to be included in marketing emails
 */

import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { type MarketingProduct } from "@/lib/admin/marketing";

export interface FeaturedProductsProps {
    selectedProducts: MarketingProduct[];
    onAdd: () => void;
    onRemove: (id: string) => void;
}

export function FeaturedProducts({ selectedProducts, onAdd, onRemove }: FeaturedProductsProps) {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-zinc-900">Uitgelichte Producten</h3>
                <Button variant="outline" size="sm" onClick={onAdd}>
                    <Plus className="w-4 h-4 mr-1" /> Toevoegen
                </Button>
            </div>
            {selectedProducts.length === 0 ? (
                <p className="text-zinc-500 text-sm">Geen producten geselecteerd</p>
            ) : (
                <div className="space-y-2">
                    {selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg">
                            <div className="flex-1">
                                <p className="text-sm font-medium truncate">{product.name}</p>
                                <p className="text-xs text-purple-600">€{Number(product.price).toFixed(2)}</p>
                            </div>
                            <button onClick={() => onRemove(product.id)} className="p-1 hover:bg-zinc-200 rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
