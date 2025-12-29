import Link from "next/link";

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    originalPrice?: number;
    image?: string;
    category?: string;
    isNew?: boolean;
}

export function ProductCard({ id, name, price, originalPrice, image, category, isNew }: ProductCardProps) {
    return (
        <Link href={`/products/${id}`} className="group block">
            <div className="bg-zinc-100 rounded-xl p-6 aspect-square flex items-center justify-center relative overflow-hidden transition-all duration-200 group-hover:bg-zinc-200">
                {isNew && (
                    <span className="absolute top-3 left-3 bg-zinc-900 text-white text-xs px-2 py-1 rounded">
                        New
                    </span>
                )}
                {originalPrice && originalPrice > price && (
                    <span className="absolute top-3 right-3 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        Sale
                    </span>
                )}
                {image ? (
                    <img
                        src={image}
                        alt={name}
                        className="max-w-full max-h-full object-contain transition-transform duration-200 group-hover:scale-105"
                    />
                ) : (
                    <div className="w-24 h-32 bg-zinc-300 rounded-lg flex items-center justify-center">
                        <span className="text-zinc-500 text-xs">Image</span>
                    </div>
                )}
            </div>
            <div className="mt-3 space-y-1">
                {category && (
                    <span className="text-xs text-zinc-500 uppercase tracking-wide">{category}</span>
                )}
                <h3 className="text-sm font-medium text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-2">
                    {name}
                </h3>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-zinc-900">€{Number(price).toFixed(2)}</span>
                    {originalPrice && Number(originalPrice) > Number(price) && (
                        <span className="text-sm text-zinc-400 line-through">€{Number(originalPrice).toFixed(2)}</span>
                    )}
                </div>
                <p className="text-xs text-zinc-500">incl. VAT</p>
            </div>
        </Link>
    );
}
