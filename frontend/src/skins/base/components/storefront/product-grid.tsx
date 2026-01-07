import { ProductCard } from "./product-card";
import { Product } from "@/lib/api";

interface ProductGridProps {
    products: Product[];
    isLoading?: boolean;
}

function ProductSkeleton() {
    return (
        <div className="animate-pulse">
            <div className="bg-zinc-200 rounded-xl aspect-square" />
            <div className="mt-3 space-y-2">
                <div className="h-4 bg-zinc-200 rounded w-3/4" />
                <div className="h-4 bg-zinc-200 rounded w-1/4" />
            </div>
        </div>
    );
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                ))}
            </div>
        );
    }

    if (!products || products.length === 0) {
        return (
            <div className="text-center py-16">
                <p className="text-zinc-500">No products found</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
                <ProductCard
                    key={product.id}
                    id={product.id}
                    name={product.name}
                    price={Number(product.price)}
                    originalPrice={product.compareAtPrice ? Number(product.compareAtPrice) : undefined}
                    image={product.images?.[0]?.url}
                    category={product.category?.slug}
                    isNew={product.condition === "NEW"}
                />
            ))}
        </div>
    );
}
