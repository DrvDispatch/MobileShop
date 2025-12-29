"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar, Footer } from "@/components/landing";
import { ProductGrid } from "@/components/storefront";
import { api, Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search, ChevronLeft, ChevronRight } from "lucide-react";

const BRANDS = ["Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei"];
const CONDITIONS = [
    { value: "NEW", label: "New" },
    { value: "REFURBISHED", label: "Refurbished" },
    { value: "USED", label: "Used" },
];
const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const BATTERY_OPTIONS = [
    { value: 95, label: "95%+ (Excellent)" },
    { value: 90, label: "90%+ (Great)" },
    { value: 80, label: "80%+ (Good)" },
];
const SORT_OPTIONS = [
    { value: "flagship", label: "Flagship first" },
    { value: "newest", label: "Newest first" },
    { value: "price_asc", label: "Price: Low to High" },
    { value: "price_desc", label: "Price: High to Low" },
    { value: "name_asc", label: "Name: A-Z" },
];

const ITEMS_PER_PAGE = 12;

export default function PhonesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [products, setProducts] = useState<Product[]>([]);
    const [allProducts, setAllProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [expandedFilters, setExpandedFilters] = useState<string[]>(["brand", "condition", "price"]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Filter state
    const [filters, setFilters] = useState({
        brand: searchParams.get("brand") || "",
        condition: searchParams.get("condition") || "",
        minPrice: searchParams.get("minPrice") || "",
        maxPrice: searchParams.get("maxPrice") || "",
        minBattery: searchParams.get("minBattery") || "",
        storage: searchParams.get("storage") || "",
        sortBy: searchParams.get("sortBy") || "flagship",
        search: searchParams.get("search") || "",
    });

    const loadProducts = useCallback(async () => {
        setIsLoading(true);
        try {
            const params: Record<string, any> = {
                category: "phones",
                limit: 500, // Fetch all for client-side pagination
            };

            if (filters.brand) params.brand = filters.brand;
            if (filters.condition) params.condition = filters.condition;
            if (filters.minPrice) params.minPrice = parseFloat(filters.minPrice);
            if (filters.maxPrice) params.maxPrice = parseFloat(filters.maxPrice);
            if (filters.search) params.search = filters.search;

            // Sort handling
            if (filters.sortBy === "flagship") {
                params.sortBy = "sortOrder";
                params.sortOrder = "asc";
            } else if (filters.sortBy === "newest") {
                params.sortBy = "createdAt";
                params.sortOrder = "desc";
            } else if (filters.sortBy === "price_asc") {
                params.sortBy = "price";
                params.sortOrder = "asc";
            } else if (filters.sortBy === "price_desc") {
                params.sortBy = "price";
                params.sortOrder = "desc";
            } else if (filters.sortBy === "name_asc") {
                params.sortBy = "name";
                params.sortOrder = "asc";
            }

            const response = await api.getProducts(params);

            // Client-side filter for battery and storage
            let filtered = response.data;
            if (filters.minBattery) {
                filtered = filtered.filter(p => (p.batteryHealth || 100) >= parseInt(filters.minBattery));
            }
            if (filters.storage) {
                filtered = filtered.filter(p => p.storage === filters.storage);
            }

            setAllProducts(filtered);
            setTotalPages(Math.ceil(filtered.length / ITEMS_PER_PAGE));
            setCurrentPage(1); // Reset to first page when filters change
        } catch (error) {
            console.error("Failed to load products:", error);
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Update displayed products when page or allProducts change
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setProducts(allProducts.slice(startIndex, endIndex));
    }, [currentPage, allProducts]);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const updateFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    // Toggle filter - if same value, clear it
    const toggleFilter = (key: string, value: string) => {
        setFilters(prev => ({ ...prev, [key]: prev[key as keyof typeof prev] === value ? "" : value }));
    };

    const clearFilters = () => {
        setFilters({
            brand: "",
            condition: "",
            minPrice: "",
            maxPrice: "",
            minBattery: "",
            storage: "",
            sortBy: "newest",
            search: "",
        });
    };

    const hasActiveFilters = filters.brand || filters.condition || filters.minPrice || filters.maxPrice || filters.minBattery || filters.storage;

    const toggleFilterSection = (section: string) => {
        setExpandedFilters(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    // Generate page numbers to show
    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5;

        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }
        return pages;
    };

    const FilterSection = ({ id, title, children }: { id: string; title: string; children: React.ReactNode }) => {
        const isExpanded = expandedFilters.includes(id);
        return (
            <div className="border-b border-zinc-200 py-4">
                <button
                    onClick={() => toggleFilterSection(id)}
                    className="flex items-center justify-between w-full text-left"
                >
                    <span className="font-medium text-zinc-900">{title}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {isExpanded && <div className="mt-3 space-y-2">{children}</div>}
            </div>
        );
    };

    // Custom radio button that can be deselected
    const FilterRadio = ({ name, value, currentValue, label }: { name: string; value: string; currentValue: string; label: string }) => (
        <label
            className="flex items-center gap-2 cursor-pointer"
            onClick={(e) => {
                e.preventDefault();
                toggleFilter(name, value);
            }}
        >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${currentValue === value ? 'border-zinc-900' : 'border-zinc-300'
                }`}>
                {currentValue === value && <div className="w-2 h-2 rounded-full bg-zinc-900" />}
            </div>
            <span className="text-sm text-zinc-700">{label}</span>
        </label>
    );

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
                    {/* Search */}
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <Input
                            placeholder="Search phones..."
                            value={filters.search}
                            onChange={(e) => updateFilter("search", e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Sort */}
                    <select
                        value={filters.sortBy}
                        onChange={(e) => updateFilter("sortBy", e.target.value)}
                        className="h-10 px-3 rounded-lg border border-zinc-200 text-sm"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {/* Filter Toggle (Mobile) */}
                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="lg:hidden"
                    >
                        <SlidersHorizontal className="w-4 h-4 mr-2" />
                        Filters
                        {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-zinc-900 rounded-full" />}
                    </Button>

                    {/* Product Count */}
                    <span className="text-sm text-zinc-500 self-center">
                        {isLoading ? "Loading..." : `${allProducts.length} products`}
                    </span>
                </div>

                <div className="flex gap-8">
                    {/* Filter Sidebar */}
                    <aside className={`w-64 flex-shrink-0 ${showFilters ? "block" : "hidden lg:block"}`}>
                        <div className="sticky top-4">
                            {/* Clear Filters */}
                            {hasActiveFilters && (
                                <button
                                    onClick={clearFilters}
                                    className="flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 mb-4"
                                >
                                    <X className="w-4 h-4" />
                                    Clear all filters
                                </button>
                            )}

                            {/* Brand Filter */}
                            <FilterSection id="brand" title="Brand">
                                {BRANDS.map(brand => (
                                    <FilterRadio
                                        key={brand}
                                        name="brand"
                                        value={brand}
                                        currentValue={filters.brand}
                                        label={brand}
                                    />
                                ))}
                            </FilterSection>

                            {/* Condition Filter */}
                            <FilterSection id="condition" title="Condition">
                                {CONDITIONS.map(cond => (
                                    <FilterRadio
                                        key={cond.value}
                                        name="condition"
                                        value={cond.value}
                                        currentValue={filters.condition}
                                        label={cond.label}
                                    />
                                ))}
                            </FilterSection>

                            {/* Price Filter */}
                            <FilterSection id="price" title="Price">
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        placeholder="Min"
                                        value={filters.minPrice}
                                        onChange={(e) => updateFilter("minPrice", e.target.value)}
                                        className="w-full"
                                    />
                                    <Input
                                        type="number"
                                        placeholder="Max"
                                        value={filters.maxPrice}
                                        onChange={(e) => updateFilter("maxPrice", e.target.value)}
                                        className="w-full"
                                    />
                                </div>
                            </FilterSection>

                            {/* Battery Health Filter */}
                            <FilterSection id="battery" title="Battery Health">
                                {BATTERY_OPTIONS.map(opt => (
                                    <FilterRadio
                                        key={opt.value}
                                        name="minBattery"
                                        value={String(opt.value)}
                                        currentValue={filters.minBattery}
                                        label={opt.label}
                                    />
                                ))}
                            </FilterSection>

                            {/* Storage Filter */}
                            <FilterSection id="storage" title="Storage">
                                {STORAGE_OPTIONS.map(storage => (
                                    <FilterRadio
                                        key={storage}
                                        name="storage"
                                        value={storage}
                                        currentValue={filters.storage}
                                        label={storage}
                                    />
                                ))}
                            </FilterSection>
                        </div>
                    </aside>

                    {/* Product Grid */}
                    <div className="flex-1">
                        <ProductGrid products={products} isLoading={isLoading} />

                        {/* Pagination */}
                        {!isLoading && totalPages > 1 && (
                            <div className="flex items-center justify-center gap-2 mt-8 pb-8">
                                {/* Previous Button */}
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === 1
                                        ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                                        }`}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                {/* Page Numbers */}
                                <div className="flex items-center gap-1">
                                    {getPageNumbers().map((page, idx) => (
                                        page === '...' ? (
                                            <span key={`ellipsis-${idx}`} className="px-2 text-zinc-400">...</span>
                                        ) : (
                                            <button
                                                key={page}
                                                onClick={() => goToPage(page as number)}
                                                className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${currentPage === page
                                                    ? 'bg-zinc-900 text-white'
                                                    : 'text-zinc-700 hover:bg-zinc-100'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        )
                                    ))}
                                </div>

                                {/* Next Button */}
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${currentPage === totalPages
                                        ? 'border-zinc-200 text-zinc-300 cursor-not-allowed'
                                        : 'border-zinc-300 text-zinc-700 hover:bg-zinc-50'
                                        }`}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        {/* Page Info */}
                        {!isLoading && totalPages > 1 && (
                            <p className="text-center text-sm text-zinc-500 mb-8">
                                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, allProducts.length)} of {allProducts.length} products
                            </p>
                        )}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

