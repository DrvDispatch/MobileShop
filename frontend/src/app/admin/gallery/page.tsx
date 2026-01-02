"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageIcon, Search, Trash2, Check, Loader2, FolderOpen, RefreshCw } from "lucide-react";
import { useGallery, Asset } from "@/lib/admin/gallery";

export default function AdminGalleryPage() {
    const {
        assetsByBrand, filteredAssets, isLoading, isDeleting,
        searchQuery, setSearchQuery,
        selectedAssets, toggleSelection, selectAll, isSelected,
        refresh, deleteSelected,
    } = useGallery();

    const formatSize = (bytes?: number) => bytes ? `${(bytes / 1024).toFixed(0)} KB` : "-";

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Media Galerij</h1>
                    <p className="text-zinc-500">{filteredAssets.length} afbeeldingen</p>
                </div>
                <div className="flex gap-2">
                    {selectedAssets.length > 0 && (
                        <Button variant="destructive" size="sm" onClick={deleteSelected} disabled={isDeleting}>
                            {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            {selectedAssets.length} verwijderen
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Search & Select */}
            <div className="flex gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input placeholder="Zoek afbeeldingen..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Button variant="outline" onClick={selectAll}>
                    {selectedAssets.length === filteredAssets.length && filteredAssets.length > 0 ? "Deselecteer alles" : "Selecteer alles"}
                </Button>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : Object.keys(assetsByBrand).length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                    <ImageIcon className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Geen afbeeldingen gevonden</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(assetsByBrand).map(([brand, brandAssets]) => (
                        <div key={brand} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center gap-2">
                                <FolderOpen className="w-4 h-4 text-zinc-500" />
                                <h3 className="font-semibold text-zinc-900">{brand}</h3>
                                <span className="text-sm text-zinc-500">({brandAssets.length})</span>
                            </div>
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2 p-3">
                                {brandAssets.map((asset) => (
                                    <AssetCard key={asset.key} asset={asset} isSelected={isSelected(asset.url)} onClick={() => toggleSelection(asset.url)} formatSize={formatSize} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function AssetCard({ asset, isSelected, onClick, formatSize }: { asset: Asset; isSelected: boolean; onClick: () => void; formatSize: (s?: number) => string }) {
    const filename = asset.key.split("/").pop() || "";
    return (
        <div onClick={onClick} className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${isSelected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-zinc-300"}`}>
            <img src={asset.url} alt={filename} className="w-full aspect-square object-cover" loading="lazy" />
            {isSelected && <div className="absolute top-1 right-1 bg-blue-500 rounded-full p-0.5"><Check className="w-3 h-3 text-white" /></div>}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                <p className="text-[10px] text-white truncate">{filename}</p>
            </div>
        </div>
    );
}
