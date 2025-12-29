"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FilterOption {
    value: string;
    label: string;
    count?: number;
}

interface FilterSidebarProps {
    brands?: FilterOption[];
    conditions?: FilterOption[];
    priceRange?: { min: number; max: number };
    selectedFilters: {
        brand?: string;
        condition?: string;
        minPrice?: number;
        maxPrice?: number;
    };
    onFilterChange: (filters: FilterSidebarProps["selectedFilters"]) => void;
    onReset: () => void;
}

export function FilterSidebar({
    brands = [],
    conditions = [
        { value: "NEW", label: "New" },
        { value: "USED", label: "Used" },
        { value: "REFURBISHED", label: "Refurbished" },
    ],
    priceRange = { min: 0, max: 2000 },
    selectedFilters,
    onFilterChange,
    onReset,
}: FilterSidebarProps) {
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        condition: true,
        brand: true,
        price: true,
    });

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const hasActiveFilters =
        selectedFilters.brand ||
        selectedFilters.condition ||
        selectedFilters.minPrice !== undefined ||
        selectedFilters.maxPrice !== undefined;

    return (
        <aside className="w-full lg:w-64 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-zinc-900">Filters</h3>
                {hasActiveFilters && (
                    <button
                        onClick={onReset}
                        className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1"
                    >
                        <X className="w-3 h-3" />
                        Clear all
                    </button>
                )}
            </div>

            {/* Condition Filter */}
            <div className="border-b border-zinc-100 pb-4">
                <button
                    onClick={() => toggleSection("condition")}
                    className="flex items-center justify-between w-full text-left mb-3"
                >
                    <span className="text-sm font-medium text-zinc-900">Condition</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSections.condition ? "rotate-180" : ""}`} />
                </button>
                {expandedSections.condition && (
                    <div className="space-y-2">
                        {conditions.map((option) => (
                            <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    name="condition"
                                    checked={selectedFilters.condition === option.value}
                                    onChange={() =>
                                        onFilterChange({
                                            ...selectedFilters,
                                            condition: selectedFilters.condition === option.value ? undefined : option.value,
                                        })
                                    }
                                    className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-500"
                                />
                                <span className="text-sm text-zinc-600">{option.label}</span>
                            </label>
                        ))}
                    </div>
                )}
            </div>

            {/* Brand Filter */}
            {brands.length > 0 && (
                <div className="border-b border-zinc-100 pb-4">
                    <button
                        onClick={() => toggleSection("brand")}
                        className="flex items-center justify-between w-full text-left mb-3"
                    >
                        <span className="text-sm font-medium text-zinc-900">Brand</span>
                        <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSections.brand ? "rotate-180" : ""}`} />
                    </button>
                    {expandedSections.brand && (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {brands.map((option) => (
                                <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="brand"
                                        checked={selectedFilters.brand === option.value}
                                        onChange={() =>
                                            onFilterChange({
                                                ...selectedFilters,
                                                brand: selectedFilters.brand === option.value ? undefined : option.value,
                                            })
                                        }
                                        className="w-4 h-4 text-zinc-900 border-zinc-300 focus:ring-zinc-500"
                                    />
                                    <span className="text-sm text-zinc-600">{option.label}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Price Range Filter */}
            <div className="pb-4">
                <button
                    onClick={() => toggleSection("price")}
                    className="flex items-center justify-between w-full text-left mb-3"
                >
                    <span className="text-sm font-medium text-zinc-900">Price Range</span>
                    <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform ${expandedSections.price ? "rotate-180" : ""}`} />
                </button>
                {expandedSections.price && (
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="flex-1">
                                <input
                                    type="number"
                                    placeholder="Min"
                                    value={selectedFilters.minPrice ?? ""}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...selectedFilters,
                                            minPrice: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                />
                            </div>
                            <span className="text-zinc-400">-</span>
                            <div className="flex-1">
                                <input
                                    type="number"
                                    placeholder="Max"
                                    value={selectedFilters.maxPrice ?? ""}
                                    onChange={(e) =>
                                        onFilterChange({
                                            ...selectedFilters,
                                            maxPrice: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}
