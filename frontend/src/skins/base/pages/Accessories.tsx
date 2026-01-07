'use client';

/**
 * Base Skin - Accessories Page
 * PURE PRESENTATION ONLY
 */

import type { AccessoriesPageVM } from '@core/hooks/pages/useAccessoriesPageVM';
import { ProductGrid } from '@/components/storefront';

export interface AccessoriesPageProps {
    vm: AccessoriesPageVM;
}

export function AccessoriesPage({ vm }: AccessoriesPageProps) {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-zinc-900">Accessories</h1>
                <p className="text-zinc-600 mt-2">Cases, chargers, and more essentials</p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
                <span className="text-sm text-zinc-500">
                    {vm.isLoading ? "Loading..." : `${vm.productCount} products`}
                </span>
            </div>

            {/* Product Grid */}
            <ProductGrid products={vm.products} isLoading={vm.isLoading} />
        </div>
    );
}
