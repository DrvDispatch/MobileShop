"use client";

import { Suspense } from "react";
import { Navbar, Footer } from "@/components/landing";
import { ProductGrid } from "@/components/storefront";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
    useProductList, BRANDS, CONDITIONS, STORAGE_OPTIONS, BATTERY_OPTIONS, SORT_OPTIONS,
} from "@/lib/products";

function PhonesContent() {
    const {
        products, allProducts, isLoading,
        currentPage, totalPages, goToPage, getPageNumbers,
        filters, updateFilter, toggleFilter, clearFilters, hasActiveFilters,
        showFilters, setShowFilters, expandedFilters, toggleFilterSection,
    } = useProductList("phones");

    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900">Phones</h1>
                    <p className="text-zinc-600 mt-2">Browse our selection of smartphones</p>
                </div>

                {/* Search & Controls Bar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 pb-6 border-b border-zinc-100">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input placeholder="Search phones..." value={filters.search} onChange={(e) => updateFilter("search", e.target.value)} className="pl-10" />
                    </div>
                    <select value={filters.sortBy} onChange={(e) => updateFilter("sortBy", e.target.value)} className="h-10 px-3 rounded-lg border border-zinc-200 text-sm">
                        {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                    <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
                        <SlidersHorizontal className="w-4 h-4 mr-2" />Filters
                        {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-zinc-900 rounded-full" />}
                    </Button>
                    <span className="text-sm text-zinc-500 self-center">{isLoading ? "Loading..." : `${allProducts.length} products`}</span>
                </div>

                <div className="flex gap-8">
                    {/* Filter Sidebar */}
                    <aside className={`w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
                        <div className="sticky top-4">
                            {hasActiveFilters && (
                                <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4">
                                    <X className="w-4 h-4" />Clear all filters
                                </button>
                            )}
                            <FilterSection id="brand" title="Brand" expanded={expandedFilters} onToggle={toggleFilterSection}>
                                {BRANDS.map(brand => <FilterRadio key={brand} name="brand" value={brand} currentValue={filters.brand} label={brand} onToggle={toggleFilter} />)}
                            </FilterSection>
                            <FilterSection id="condition" title="Condition" expanded={expandedFilters} onToggle={toggleFilterSection}>
                                {CONDITIONS.map(c => <FilterRadio key={c.value} name="condition" value={c.value} currentValue={filters.condition} label={c.label} onToggle={toggleFilter} />)}
                            </FilterSection>
                            <FilterSection id="price" title="Price" expanded={expandedFilters} onToggle={toggleFilterSection}>
                                <div className="flex gap-2">
                                    <Input type="number" placeholder="Min" value={filters.minPrice} onChange={(e) => updateFilter("minPrice", e.target.value)} className="w-full" />
                                    <Input type="number" placeholder="Max" value={filters.maxPrice} onChange={(e) => updateFilter("maxPrice", e.target.value)} className="w-full" />
                                </div>
                            </FilterSection>
                            <FilterSection id="battery" title="Battery Health" expanded={expandedFilters} onToggle={toggleFilterSection}>
                                {BATTERY_OPTIONS.map(opt => <FilterRadio key={opt.value} name="minBattery" value={String(opt.value)} currentValue={filters.minBattery} label={opt.label} onToggle={toggleFilter} />)}
                            </FilterSection>
                            <FilterSection id="storage" title="Storage" expanded={expandedFilters} onToggle={toggleFilterSection}>
                                {STORAGE_OPTIONS.map(s => <FilterRadio key={s} name="storage" value={s} currentValue={filters.storage} label={s} onToggle={toggleFilter} />)}
                            </FilterSection>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <ProductGrid products={products} isLoading={isLoading} />
                        {/* Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === 1 ? 'border-zinc-200 text-zinc-300 cursor-not-allowed' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>
                                    <ChevronLeft className="w-4 h-4" />Previous
                                </button>
                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((page, idx) => page === '...' ? (
                                        <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400">...</span>
                                    ) : (
                                        <button key={page} onClick={() => goToPage(page as number)}
                                            className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page ? 'bg-zinc-900 text-white' : 'text-zinc-700 hover:bg-zinc-100'}`}>
                                            {page}
                                        </button>
                                    ))}
                                </div>
                                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === totalPages ? 'border-zinc-200 text-zinc-300 cursor-not-allowed' : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'}`}>
                                    Next<ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                        {!isLoading && totalPages > 1 && (
                            <p className="text-center text-sm text-zinc-500 mb-8">
                                Showing {(currentPage - 1) * 12 + 1} - {Math.min(currentPage * 12, allProducts.length)} of {allProducts.length} products
                            </p>
                        )}
                    </div>
                </div>
            </div>
            <Footer />
        </main>
    );
}

function FilterSection({ id, title, expanded, onToggle, children }: { id: string; title: string; expanded: string[]; onToggle: (id: string) => void; children: React.ReactNode }) {
    const isExpanded = expanded.includes(id);
    return (
        <div className="border-b border-zinc-200 py-4">
            <button onClick={() => onToggle(id)} className="flex items-center justify-between w-full text-left">
                <span className="font-medium text-zinc-900">{title}</span>
                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            {isExpanded && <div className="mt-3 space-y-2">{children}</div>}
        </div>
    );
}

function FilterRadio({ name, value, currentValue, label, onToggle }: { name: string; value: string; currentValue: string; label: string; onToggle: (key: string, value: string) => void }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer" onClick={(e) => { e.preventDefault(); onToggle(name, value); }}>
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${currentValue === value ? 'border-zinc-900' : 'border-zinc-300'}`}>
                {currentValue === value && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
            </div>
            <span className="text-sm text-zinc-700">{label}</span>
        </label>
    );
}

export default function PhonesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <PhonesContent />
        </Suspense>
    );
}
