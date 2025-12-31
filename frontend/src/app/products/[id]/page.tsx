"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { api, Product } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { RelatedProducts } from "@/components/related-products";
import { getImageUrl } from "@/lib/image-utils";
import {
    ChevronLeft,
    Minus,
    Plus,
    ShoppingCart,
    Check,
    Truck,
    Shield,
    Battery,
    HardDrive,
    Palette,
    Star,
    Award,
} from "lucide-react";

const GRADE_LABELS: Record<string, { label: string; description: string; color: string }> = {
    A_PLUS: { label: "A+", description: "Like new", color: "text-green-600" },
    A: { label: "A", description: "Excellent", color: "text-green-600" },
    B: { label: "B", description: "Good", color: "text-yellow-600" },
    C: { label: "C", description: "Fair", color: "text-orange-600" },
};

export default function ProductDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [selectedImage, setSelectedImage] = useState(0);
    const [addedToCart, setAddedToCart] = useState(false);

    const addItem = useCartStore((state) => state.addItem);

    useEffect(() => {
        const loadProduct = async () => {
            try {
                const id = params.id as string;
                const data = await api.getProduct(id);
                setProduct(data);
            } catch (error) {
                console.error("Failed to load product:", error);
            } finally {
                setIsLoading(false);
            }
        };
        if (params.id) {
            loadProduct();
        }
    }, [params.id]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse grid lg:grid-cols-2 gap-12">
                        <div className="aspect-square bg-zinc-200 rounded-2xl" />
                        <div className="space-y-4">
                            <div className="h-8 bg-zinc-200 rounded w-3/4" />
                            <div className="h-6 bg-zinc-200 rounded w-1/4" />
                            <div className="h-24 bg-zinc-200 rounded" />
                        </div>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (!product) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h1 className="text-2xl font-bold text-zinc-900 mb-4">Product not found</h1>
                    <Link href="/phones">
                        <Button variant="outline">
                            <ChevronLeft className="w-4 h-4 mr-2" />
                            Back to products
                        </Button>
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    const handleAddToCart = () => {
        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0]?.url,
            slug: product.slug,
        }, quantity);
        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    };

    const isRefurbished = product.condition === "REFURBISHED" || product.condition === "USED";
    const hasDeviceSpecs = isRefurbished && (product.batteryHealth || product.storage || product.color || product.deviceGrade);
    const gradeInfo = product.deviceGrade ? GRADE_LABELS[product.deviceGrade] : null;

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb */}
                <nav className="mb-6">
                    <Link href={`/${product.category?.slug || "phones"}`} className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1">
                        <ChevronLeft className="w-4 h-4" />
                        Back to {product.category?.name || "Products"}
                    </Link>
                </nav>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Product Images */}
                    <div className="space-y-4">
                        {/* Main Image */}
                        <div className="aspect-square bg-zinc-100 rounded-2xl flex items-center justify-center overflow-hidden">
                            {product.images && product.images.length > 0 ? (
                                <img
                                    src={getImageUrl(product.images[selectedImage]?.url)}
                                    alt={product.name}
                                    className="max-w-full max-h-full object-contain"
                                />
                            ) : (
                                <div className="text-zinc-400">No image available</div>
                            )}
                        </div>

                        {/* Thumbnails */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-2">
                                {product.images.map((img, idx) => (
                                    <button
                                        key={img.id}
                                        onClick={() => setSelectedImage(idx)}
                                        className={`w-16 h-16 rounded-lg bg-zinc-100 overflow-hidden border-2 transition-colors ${selectedImage === idx ? "border-zinc-900" : "border-transparent"
                                            }`}
                                    >
                                        <img src={getImageUrl(img.url)} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div className="space-y-6">
                        {/* Title & Price */}
                        <div>
                            <h1 className="text-3xl font-bold text-zinc-900 mb-2">{product.name}</h1>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl font-bold text-zinc-900">€{Number(product.price).toFixed(2)}</span>
                                {product.compareAtPrice && Number(product.compareAtPrice) > Number(product.price) && (
                                    <span className="text-lg text-zinc-400 line-through">
                                        €{Number(product.compareAtPrice).toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500 mt-1">Price includes 21% VAT</p>
                        </div>

                        {/* Condition Badge */}
                        <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${product.condition === "NEW"
                                ? "bg-green-100 text-green-700"
                                : product.condition === "REFURBISHED"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-zinc-100 text-zinc-700"
                                }`}>
                                {product.condition}
                            </span>
                            {product.brand && (
                                <span className="text-sm text-zinc-500">by {product.brand}</span>
                            )}
                        </div>

                        {/* Device Specifications - Beautiful Cards for Refurbished */}
                        {hasDeviceSpecs && (
                            <div className="bg-gradient-to-br from-zinc-50 to-zinc-100 rounded-2xl p-6 border border-zinc-200">
                                <h3 className="text-sm font-semibold text-zinc-700 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Award className="w-4 h-4" />
                                    Device Specifications
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Battery Health */}
                                    {product.batteryHealth && (
                                        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
                                            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                                <Battery className="w-4 h-4" />
                                                <span className="text-xs font-medium uppercase">Battery</span>
                                            </div>
                                            <div className="flex items-end gap-1">
                                                <span className={`text-2xl font-bold ${product.batteryHealth >= 90 ? "text-green-600" : product.batteryHealth >= 80 ? "text-yellow-600" : "text-orange-600"
                                                    }`}>
                                                    {product.batteryHealth}%
                                                </span>
                                            </div>
                                            <div className="mt-2 h-2 bg-zinc-200 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${product.batteryHealth >= 90 ? "bg-green-500" : product.batteryHealth >= 80 ? "bg-yellow-500" : "bg-orange-500"
                                                        }`}
                                                    style={{ width: `${product.batteryHealth}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Storage */}
                                    {product.storage && (
                                        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
                                            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                                <HardDrive className="w-4 h-4" />
                                                <span className="text-xs font-medium uppercase">Storage</span>
                                            </div>
                                            <span className="text-2xl font-bold text-zinc-900">{product.storage}</span>
                                        </div>
                                    )}

                                    {/* Color */}
                                    {product.color && (
                                        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
                                            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                                <Palette className="w-4 h-4" />
                                                <span className="text-xs font-medium uppercase">Color</span>
                                            </div>
                                            <span className="text-lg font-semibold text-zinc-900">{product.color}</span>
                                        </div>
                                    )}

                                    {/* Device Grade */}
                                    {gradeInfo && (
                                        <div className="bg-white rounded-xl p-4 border border-zinc-200 shadow-sm">
                                            <div className="flex items-center gap-2 text-zinc-500 mb-2">
                                                <Star className="w-4 h-4" />
                                                <span className="text-xs font-medium uppercase">Grade</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-2xl font-bold ${gradeInfo.color}`}>
                                                    {gradeInfo.label}
                                                </span>
                                                <span className="text-sm text-zinc-500">
                                                    {gradeInfo.description}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Short Description */}
                        {product.shortDescription && (
                            <div className="prose prose-zinc max-w-none">
                                <p className="text-zinc-600">{product.shortDescription}</p>
                            </div>
                        )}

                        {/* Stock Status */}
                        <div className="flex items-center gap-2 text-sm">
                            {product.stockQty > 0 ? (
                                <>
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-green-600">In Stock ({product.stockQty} available)</span>
                                </>
                            ) : (
                                <span className="text-red-600">Out of Stock</span>
                            )}
                        </div>

                        {/* Quantity Selector */}
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-medium text-zinc-700">Quantity</span>
                            <div className="flex items-center border border-zinc-200 rounded-lg">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-2 hover:bg-zinc-100 transition-colors"
                                    disabled={quantity <= 1}
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-4 py-2 font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(Math.min(product.stockQty, quantity + 1))}
                                    className="p-2 hover:bg-zinc-100 transition-colors"
                                    disabled={quantity >= product.stockQty}
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        <div className="flex gap-4">
                            <Button
                                size="lg"
                                className="flex-1"
                                onClick={handleAddToCart}
                                disabled={product.stockQty === 0 || addedToCart}
                            >
                                {addedToCart ? (
                                    <>
                                        <Check className="w-5 h-5 mr-2" />
                                        Added to Cart
                                    </>
                                ) : (
                                    <>
                                        <ShoppingCart className="w-5 h-5 mr-2" />
                                        Add to Cart
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* Features */}
                        <div className="border-t border-zinc-100 pt-6 space-y-4">
                            <div className="flex items-center gap-3 text-sm text-zinc-600">
                                <Truck className="w-5 h-5 text-zinc-400" />
                                <span>Free shipping on orders over €75</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-zinc-600">
                                <Shield className="w-5 h-5 text-zinc-400" />
                                <span>90-day warranty included</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Long Description Section */}
                {product.description && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-200 mt-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6">Product Description</h2>
                        <div className="prose prose-zinc max-w-none">
                            {product.description.split('\n').map((paragraph, i) => (
                                paragraph.trim() && (
                                    <p key={i} className="mb-4 text-zinc-600 leading-relaxed text-base">
                                        {paragraph}
                                    </p>
                                )
                            ))}
                        </div>
                    </div>
                )}

                {/* Short Description (if no long description) */}
                {!product.description && product.shortDescription && (
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-zinc-200 mt-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6">About this Product</h2>
                        <p className="text-zinc-600 leading-relaxed text-base">
                            {product.shortDescription}
                        </p>
                    </div>
                )}

                {/* Related Products Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <RelatedProducts productId={product.id} currentBrand={product.brand || undefined} />
                </div>
            </div>

            <Footer />
        </main>
    );
}
