"use client";

import { useState } from "react";

interface CategoryTabsProps {
    categories: { slug: string; name: string; count?: number }[];
    activeCategory?: string;
    onCategoryChange: (slug: string | undefined) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
    return (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
                onClick={() => onCategoryChange(undefined)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!activeCategory
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
            >
                All
            </button>
            {categories.map((category) => (
                <button
                    key={category.slug}
                    onClick={() => onCategoryChange(category.slug)}
                    className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeCategory === category.slug
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                >
                    {category.name}
                    {category.count !== undefined && (
                        <span className="ml-1 text-xs opacity-70">({category.count})</span>
                    )}
                </button>
            ))}
        </div>
    );
}
