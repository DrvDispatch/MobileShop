"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { api, Product } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store/cart";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductReviews } from "@/components/product-reviews";
import { StockNotificationForm } from "@/components/stock-notification-form";
import { RelatedProducts } from "@/components/related-products";
import {
    ChevronLeft,
    ChevronRight,
    ShoppingCart,
    Check,
    Battery,
    HardDrive,
    Palette,
    Star,
    ArrowLeft,
    Minus,
    Plus,
} from "lucide-react";

export default function ProductDetailPage() {
    const params = useParams();
    const slug = params.slug as string;

    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);
    const [quantity, setQuantity] = useState(1);

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        if (slug) {
            loadProduct();
        }
    }, [slug]);

    const loadProduct = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await api.getProduct(slug);
            setProduct(data);
        } catch (err: any) {
            setError(err.message || "Product not found");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddToCart = () => {
        if (!product) return;
        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0]?.url,
        }, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const incrementQuantity = () => {
        if (product && quantity < product.stockQty) {
            setQuantity(q => q + 1);
        }
    };

    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(q => q - 1);
        }
    };

    const images = product?.images || [];
    const primaryImage = images[selectedImage]?.url || "/placeholder-phone.png";

    if (isLoading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-6xl mx-auto px-4 py-8">
                    <div className="animate-pulse">
                        <div className="h-6 w-32 bg-zinc-200 rounded mb-8" />
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="aspect-square bg-zinc-100 rounded-lg" />
                            <div className="space-y-4">
                                <div className="h-8 bg-zinc-200 rounded w-3/4" />
                                <div className="h-6 bg-zinc-200 rounded w-1/3" />
                                <div className="h-40 bg-zinc-100 rounded" />
                                <div className="h-24 bg-zinc-200 rounded" />
                            </div>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-6xl mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold text-zinc-900 mb-4">Product Not Found</h1>
                    <p className="text-zinc-600 mb-8">{error || "The product you're looking for doesn't exist."}</p>
                    <Link href="/phones">
                        <Button>Browse All Phones</Button>
                    </Link>
                </div>
                <Footer />
            </div>
        );
    }

    const conditionLabel = {
        NEW: "NEW",
        REFURBISHED: "REFURBISHED",
        USED: "USED",
    }[product.condition] || product.condition;

    const gradeLabels: Record<string, string> = {
        A_PLUS: "Like New",
        A: "Excellent",
        B: "Good",
        C: "Fair",
        D: "Acceptable",
    };
    const gradeLabel = gradeLabels[product.deviceGrade || "A"] || "Excellent";

    // Generate clean title without "Smartphone"
    const cleanTitle = product.name.replace(/\s*smartphone\s*/gi, ' ').trim();

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="max-w-6xl mx-auto px-4 py-6">
                {/* Back Link */}
                <Link
                    href="/phones"
                    className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mb-6"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Phones
                </Link>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Image Gallery */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="relative aspect-square bg-zinc-50 rounded-lg overflow-hidden border border-zinc-200">
                            <img
                                src={primaryImage}
                                alt={cleanTitle}
                                className="w-full h-full object-contain p-8"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%23f4f4f5'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%23a1a1aa' font-size='16'%3ENo Image%3C/text%3E%3C/svg%3E";
                                }}
                            />
                            {images.length > 1 && (
                                <>
                                    <button
                                        onClick={() => setSelectedImage((prev) => (prev - 1 + images.length) % images.length)}
                                        className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-zinc-600" />
                                    </button>
                                    <button
                                        onClick={() => setSelectedImage((prev) => (prev + 1) % images.length)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition-shadow"
                                    >
                                        <ChevronRight className="w-5 h-5 text-zinc-600" />
                                    </button>
                                </>
                            )}
                            {/* Wishlist Button */}
                            <WishlistButton
                                productId={product.id}
                                className="absolute top-3 right-3 z-10"
                            />
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-2 overflow-x-auto pb-2">
                                {images.map((img, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedImage(i)}
                                        className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${selectedImage === i
                                            ? "border-blue-500"
                                            : "border-zinc-200 hover:border-zinc-400"
                                            }`}
                                    >
                                        <img
                                            src={img.url}
                                            alt={`View ${i + 1}`}
                                            className="w-full h-full object-contain bg-zinc-50 p-1"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-5">
                        {/* Title */}
                        <h1 className="text-2xl font-bold text-zinc-900">{cleanTitle}</h1>

                        {/* Price */}
                        <div>
                            <div className="flex items-baseline gap-3">
                                <span className="text-2xl font-bold text-zinc-900">
                                    €{Number(product.price).toFixed(2)}
                                </span>
                                {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                                    <span className="text-lg text-zinc-400 line-through">
                                        €{Number(product.compareAtPrice).toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">Price includes 21% VAT</p>
                        </div>

                        {/* Condition & Brand Badge */}
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-zinc-100 rounded-full text-xs font-semibold text-zinc-700 uppercase tracking-wide">
                                {conditionLabel}
                            </span>
                            {product.brand && (
                                <span className="text-sm text-zinc-500">
                                    by <span className="text-zinc-700 font-medium">{product.brand}</span>
                                </span>
                            )}
                        </div>

                        {/* Device Specifications Box */}
                        <div className="border border-zinc-200 rounded-lg p-4">
                            <div className="flex items-center gap-2 mb-4">
                                <HardDrive className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm font-semibold text-zinc-700 uppercase tracking-wide">
                                    Device Specifications
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {/* Battery */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Battery className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-xs text-zinc-500 uppercase tracking-wide">Battery</span>
                                    </div>
                                    <div className="text-lg font-bold text-green-600">
                                        {product.batteryHealth || 100}%
                                    </div>
                                    <div className="mt-1 h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all"
                                            style={{ width: `${product.batteryHealth || 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Storage */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-xs text-zinc-500 uppercase tracking-wide">Storage</span>
                                    </div>
                                    <div className="text-lg font-bold text-zinc-900">
                                        {product.storage || "N/A"}
                                    </div>
                                </div>

                                {/* Color */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Palette className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-xs text-zinc-500 uppercase tracking-wide">Color</span>
                                    </div>
                                    <div className="text-sm font-semibold text-zinc-900">
                                        {product.color || "N/A"}
                                    </div>
                                </div>

                                {/* Grade */}
                                <div className="bg-zinc-50 rounded-lg p-3">
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Star className="w-3.5 h-3.5 text-zinc-400" />
                                        <span className="text-xs text-zinc-500 uppercase tracking-wide">Grade</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg font-bold text-zinc-900">
                                            {product.deviceGrade || "A"}
                                        </span>
                                        <span className="text-sm text-zinc-500">{gradeLabel}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Short Description */}
                        {product.shortDescription && (
                            <p className="text-zinc-600 leading-relaxed">
                                {product.shortDescription}
                            </p>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-2">
                            {product.stockQty > 0 ? (
                                <>
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600 font-medium">
                                        In Stock ({product.stockQty} available)
                                    </span>
                                </>
                            ) : (
                                <span className="text-red-600 font-medium">Out of Stock</span>
                            )}
                        </div>

                        {/* Stock Notification for out-of-stock products */}
                        {product.stockQty === 0 && (
                            <StockNotificationForm productId={product.id} productName={product.name} />
                        )}

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-zinc-600">Quantity</span>
                            <div className="flex items-center border border-zinc-300 rounded-lg">
                                <button
                                    onClick={decrementQuantity}
                                    disabled={quantity <= 1}
                                    className="p-2 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Minus className="w-4 h-4 text-zinc-600" />
                                </button>
                                <span className="w-10 text-center font-medium text-zinc-900">
                                    {quantity}
                                </span>
                                <button
                                    onClick={incrementQuantity}
                                    disabled={product.stockQty <= quantity}
                                    className="p-2 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4 text-zinc-600" />
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart Button */}
                        <Button
                            onClick={handleAddToCart}
                            disabled={product.stockQty === 0 || addedToCart}
                            className="w-full py-6 text-base bg-zinc-900 hover:bg-zinc-800"
                            size="lg"
                        >
                            {addedToCart ? (
                                <>
                                    <Check className="w-5 h-5 mr-2" />
                                    Added to Cart!
                                </>
                            ) : (
                                <>
                                    <ShoppingCart className="w-5 h-5 mr-2" />
                                    Add to Cart
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Long Description Section */}
                {product.description && (
                    <div className="mt-12 border-t border-zinc-200 pt-8">
                        <h2 className="text-xl font-bold text-zinc-900 mb-4">Product Description</h2>
                        <div className="prose prose-zinc max-w-none">
                            {product.description.split('\n').map((paragraph, i) => (
                                paragraph.trim() && (
                                    <p key={i} className="mb-4 text-zinc-600 leading-relaxed">
                                        {paragraph}
                                    </p>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Related Products Section */}
                <div className="mt-12 border-t border-zinc-200 pt-8">
                    <RelatedProducts productId={product.id} currentBrand={product.brand || undefined} />
                </div>

                {/* Product Reviews Section */}
                <div className="mt-12 border-t border-zinc-200 pt-8">
                    <ProductReviews productId={product.id} />
                </div>
            </main>

            <Footer />
        </div>
    );
}
