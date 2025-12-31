"use client";

import { useEffect, useState } from "react";
import {
    ImageIcon,
    Search,
    Trash2,
    Download,
    Check,
    Loader2,
    FolderOpen,
    Upload,
    RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface Asset {
    url: string;
    key: string;
    lastModified?: string;
    size?: number;
}

export default function AdminGalleryPage() {
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadAssets();
    }, []);

    const loadAssets = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/upload/assets?folder=devices&limit=250`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("adminAccessToken")}` },
            });

            if (response.ok) {
                const data = await response.json();
                setAssets(data.assets || []);
            }
        } catch (err) {
            console.error("Failed to load assets:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSelection = (url: string) => {
        setSelectedAssets(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    };

    const selectAll = () => {
        if (selectedAssets.length === filteredAssets.length) {
            setSelectedAssets([]);
        } else {
            setSelectedAssets(filteredAssets.map(a => a.url));
        }
    };

    const deleteSelected = async () => {
        if (!confirm(`Weet je zeker dat je ${selectedAssets.length} afbeelding(en) wilt verwijderen?`)) return;

        setIsDeleting(true);
        try {
            // Delete each selected asset
            for (const url of selectedAssets) {
                const asset = assets.find(a => a.url === url);
                if (asset) {
                    await fetch(`/api/upload/${encodeURIComponent(asset.key)}`, {
                        method: "DELETE",
                        headers: { "Authorization": `Bearer ${localStorage.getItem("adminAccessToken")}` },
                    });
                }
            }
            setSelectedAssets([]);
            loadAssets();
        } catch (err) {
            console.error("Failed to delete assets:", err);
            alert("Verwijderen mislukt");
        } finally {
            setIsDeleting(false);
        }
    };

    // Sort by: 1) Brand (Apple first) 2) Model tier 3) Model number (newest first)
    const getBrandScore = (key: string): number => {
        if (key.includes('/Apple/')) return 1000;
        if (key.includes('/Samsung/')) return 500;
        return 0;
    };

    const getModelTierScore = (key: string): number => {
        if (key.includes('Pro Max') || key.includes('Ultra')) return 300;
        if (key.includes('Pro') && !key.includes('Pro Max')) return 250;
        if (key.includes('Plus')) return 200;
        if (key.includes('Z Fold') || key.includes('Z Flip')) return 180;
        return 100;
    };

    const getModelNumber = (key: string): number => {
        const match = key.match(/(?:iPhone|iPad|Galaxy\s*[A-Z]?)[\s]*(\d+)/i);
        return match ? parseInt(match[1]) : 0;
    };

    // Sort assets
    const sortedAssets = [...assets].sort((a, b) => {
        const brandDiff = getBrandScore(b.key) - getBrandScore(a.key);
        if (brandDiff !== 0) return brandDiff;
        const tierDiff = getModelTierScore(b.key) - getModelTierScore(a.key);
        if (tierDiff !== 0) return tierDiff;
        return getModelNumber(b.key) - getModelNumber(a.key);
    });

    // Filter assets by search
    const filteredAssets = searchQuery.trim()
        ? sortedAssets.filter(asset => asset.key.toLowerCase().includes(searchQuery.toLowerCase()))
        : sortedAssets;

    // Group assets by brand
    const assetsByBrand: Record<string, Asset[]> = {};
    filteredAssets.forEach(asset => {
        const parts = asset.key.split('/');
        const brand = parts.length > 1 ? parts[1] : 'Other';
        if (!assetsByBrand[brand]) assetsByBrand[brand] = [];
        assetsByBrand[brand].push(asset);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                        <ImageIcon className="w-7 h-7" />
                        Gallery
                    </h1>
                    <p className="text-zinc-500">{assets.length} afbeeldingen in bibliotheek</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadAssets} disabled={isLoading}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Search and Actions Bar */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input
                            type="text"
                            placeholder="Zoek op toestel naam... (bijv. iPhone 15, Galaxy S24)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={selectAll}>
                            {selectedAssets.length === filteredAssets.length && filteredAssets.length > 0
                                ? "Deselecteer alles"
                                : "Selecteer alles"}
                        </Button>
                        {selectedAssets.length > 0 && (
                            <Button
                                variant="outline"
                                onClick={deleteSelected}
                                disabled={isDeleting}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                )}
                                Verwijder ({selectedAssets.length})
                            </Button>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
            ) : assets.length === 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                    <FolderOpen className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
                    <h3 className="text-lg font-medium text-zinc-900 mb-2">Geen afbeeldingen</h3>
                    <p className="text-zinc-500">Upload afbeeldingen via het Product Toevoegen formulier</p>
                </div>
            ) : filteredAssets.length === 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                    <Search className="w-16 h-16 mx-auto mb-4 text-zinc-300" />
                    <h3 className="text-lg font-medium text-zinc-900 mb-2">Geen resultaten</h3>
                    <p className="text-zinc-500">Geen afbeeldingen gevonden voor "{searchQuery}"</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(assetsByBrand).map(([brand, brandAssets]) => (
                        <div key={brand} className="bg-white rounded-xl border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                {brand === 'Apple' && '🍎'}
                                {brand === 'Samsung' && '📱'}
                                {brand}
                                <span className="text-sm font-normal text-zinc-500">
                                    ({brandAssets.length} afbeeldingen)
                                </span>
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                                {brandAssets.map((asset, i) => {
                                    const parts = asset.key.split('/');
                                    const deviceName = parts.length > 2 ? parts[2] : parts[parts.length - 1].replace(/\.[^.]+$/, '');
                                    const isSelected = selectedAssets.includes(asset.url);

                                    return (
                                        <button
                                            key={i}
                                            onClick={() => toggleSelection(asset.url)}
                                            className={`flex flex-col bg-white rounded-xl border-2 transition-all hover:shadow-md overflow-hidden ${isSelected
                                                ? "border-green-500 ring-2 ring-green-200 shadow-md"
                                                : "border-zinc-200 hover:border-zinc-300"
                                                }`}
                                        >
                                            <div className="relative aspect-square bg-zinc-50">
                                                <img
                                                    src={asset.url}
                                                    alt={deviceName}
                                                    className="w-full h-full object-contain p-2"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23e5e7eb'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3EError%3C/text%3E%3C/svg%3E";
                                                    }}
                                                />
                                                {isSelected && (
                                                    <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-0.5">
                                                        <Check className="w-3 h-3" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-1.5 border-t border-zinc-100 text-left">
                                                <p className="text-[10px] font-medium text-zinc-900 truncate">{deviceName}</p>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
