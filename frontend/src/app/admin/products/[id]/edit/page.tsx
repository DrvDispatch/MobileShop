"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { api, Product, Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    ChevronLeft,
    Save,
    Loader2,
    Trash2,
    Copy,
    Upload,
    X,
    ImageIcon,
    Wand2,
    Battery,
    HardDrive,
    Palette,
    Star,
} from "lucide-react";

type Condition = "NEW" | "USED" | "REFURBISHED";
type DeviceGrade = "A_PLUS" | "A" | "B" | "C" | "";

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];
const COLOR_OPTIONS = ["Space Black", "White Titanium", "Blue Titanium", "Desert Titanium", "Gold", "Silver", "Midnight", "Purple", "Red"];
const GRADE_OPTIONS = [
    { value: "A_PLUS", label: "A+" },
    { value: "A", label: "A" },
    { value: "B", label: "B" },
    { value: "C", label: "C" },
];

interface ExistingImage {
    id: string;
    url: string;
    isPrimary: boolean;
}

interface FormData {
    name: string;
    slug: string;
    description: string;
    shortDescription: string;
    price: string;
    compareAtPrice: string;
    stockQty: string;
    condition: Condition;
    brand: string;
    categoryId: string;
    isFeatured: boolean;
    isActive: boolean;
    // Device specs
    productType: string;
    storage: string;
    color: string;
    batteryHealth: number;
    deviceGrade: DeviceGrade;
}

export default function EditProductPage() {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Image state
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newImages, setNewImages] = useState<{ file: File; preview: string }[]>([]);

    const [formData, setFormData] = useState<FormData>({
        name: "",
        slug: "",
        description: "",
        shortDescription: "",
        price: "",
        compareAtPrice: "",
        stockQty: "0",
        condition: "NEW",
        brand: "",
        categoryId: "",
        isFeatured: false,
        isActive: true,
        productType: "PHONE",
        storage: "",
        color: "",
        batteryHealth: 100,
        deviceGrade: "",
    });

    const showDeviceSpecs = formData.condition !== "NEW";

    useEffect(() => {
        const loadData = async () => {
            try {
                const [prod, cats] = await Promise.all([
                    api.getProduct(productId),
                    api.getCategories(),
                ]);
                setProduct(prod);
                setCategories(cats);

                // Load existing images
                if (prod.images && prod.images.length > 0) {
                    setExistingImages(prod.images.map(img => ({
                        id: img.id,
                        url: img.url,
                        isPrimary: img.isPrimary,
                    })));
                }

                setFormData({
                    name: prod.name,
                    slug: prod.slug,
                    description: prod.description || "",
                    shortDescription: prod.shortDescription || "",
                    price: String(prod.price),
                    compareAtPrice: prod.compareAtPrice ? String(prod.compareAtPrice) : "",
                    stockQty: String(prod.stockQty),
                    condition: prod.condition,
                    brand: prod.brand || "",
                    categoryId: prod.categoryId || "",
                    isFeatured: prod.isFeatured,
                    isActive: prod.isActive,
                    productType: prod.productType || "PHONE",
                    storage: prod.storage || "",
                    color: prod.color || "",
                    batteryHealth: prod.batteryHealth || 100,
                    deviceGrade: (prod.deviceGrade as DeviceGrade) || "",
                });
            } catch (error) {
                console.error("Failed to load product:", error);
                setError("Failed to load product");
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [productId]);

    // Auto-generate slug from name
    const generateSlug = (name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-")
            .replace(/-+/g, "-")
            .trim();
    };

    const handleNameChange = (name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPreviews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setNewImages(prev => [...prev, ...newPreviews]);
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    };

    const removeExistingImage = (index: number) => {
        setExistingImages(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError(null);
        setSuccess(null);

        try {
            // Upload new images if any
            let uploadedImages: { url: string; key: string }[] = [];
            if (newImages.length > 0) {
                setIsUploading(true);
                const files = newImages.map(p => p.file);
                uploadedImages = await api.uploadImages(files);
                setIsUploading(false);
            }

            await api.updateProduct(productId, {
                name: formData.name,
                slug: formData.slug,
                description: formData.description || undefined,
                shortDescription: formData.shortDescription || undefined,
                price: parseFloat(formData.price),
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                stockQty: parseInt(formData.stockQty),
                condition: formData.condition,
                brand: formData.brand || undefined,
                categoryId: formData.categoryId || undefined,
                isFeatured: formData.isFeatured,
                isActive: formData.isActive,
                // Device specs
                ...(showDeviceSpecs ? {
                    storage: formData.storage || undefined,
                    color: formData.color || undefined,
                    batteryHealth: formData.batteryHealth,
                    deviceGrade: formData.deviceGrade || undefined,
                } : {}),
                // Include uploaded image URLs so backend saves them
                ...(uploadedImages.length > 0 ? {
                    imageUrls: uploadedImages.map(img => img.url),
                } : {}),
            });

            // Clear new images after successful save
            newImages.forEach(p => URL.revokeObjectURL(p.preview));
            setNewImages([]);

            // Add uploaded images to existing
            if (uploadedImages.length > 0) {
                setExistingImages(prev => [
                    ...prev,
                    ...uploadedImages.map((img, i) => ({
                        id: `new-${Date.now()}-${i}`,
                        url: img.url,
                        isPrimary: prev.length === 0 && i === 0,
                    })),
                ]);
            }

            setSuccess("Product saved successfully!");
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Failed to update product");
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    };

    const handleClone = async () => {
        if (!confirm(`Clone "${formData.name}"? This will create a copy of the product.`)) {
            return;
        }

        setIsCloning(true);
        setError(null);

        try {
            // Generate unique slug with counter
            const baseSlug = formData.slug.replace(/-\d+$/, ''); // Remove existing counter
            const timestamp = Date.now().toString().slice(-4);
            const newSlug = `${baseSlug}-${timestamp}`;

            await api.createProduct({
                name: `${formData.name} (Copy)`,
                slug: newSlug,
                description: formData.description || undefined,
                shortDescription: formData.shortDescription || undefined,
                price: parseFloat(formData.price),
                compareAtPrice: formData.compareAtPrice ? parseFloat(formData.compareAtPrice) : undefined,
                stockQty: parseInt(formData.stockQty),
                condition: formData.condition,
                brand: formData.brand || undefined,
                categoryId: formData.categoryId || undefined,
                isFeatured: false,
                isActive: false, // Start cloned products as draft
            });

            router.push("/admin/products");
        } catch (err: any) {
            setError(err.message || "Failed to clone product");
            setIsCloning(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(`Are you sure you want to delete "${formData.name}"? This cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.deleteProduct(productId);
            router.push("/admin/products");
        } catch (err: any) {
            setError(err.message || "Failed to delete product");
            setIsDeleting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="h-8 w-32 bg-zinc-200 rounded animate-pulse" />
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="space-y-4">
                        <div className="h-10 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-10 bg-zinc-200 rounded animate-pulse" />
                        <div className="h-24 bg-zinc-200 rounded animate-pulse" />
                    </div>
                </div>
            </div>
        );
    }

    if (!product) {
        return (
            <div className="max-w-4xl mx-auto text-center py-12">
                <p className="text-zinc-500 mb-4">Product not found</p>
                <Link href="/admin/products">
                    <Button>Back to Products</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="mb-6 flex items-start justify-between">
                <div>
                    <Link href="/admin/products" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-2">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Products
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900">Edit Product</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleClone} disabled={isCloning}>
                        {isCloning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4 mr-2" />}
                        Clone
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Delete
                    </Button>
                </div>
            </div>

            {/* Messages */}
            {error && (
                <div className="mb-4 p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
                    {error}
                </div>
            )}
            {success && (
                <div className="mb-4 p-4 rounded-lg bg-green-50 border border-green-200 text-green-600">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Basic Info */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                            <h2 className="font-semibold text-zinc-900">Basic Information</h2>

                            <div className="space-y-2">
                                <Label htmlFor="name">Product Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="slug" className="flex items-center gap-2">
                                        URL Slug
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }))}
                                            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                        >
                                            <Wand2 className="w-3 h-3" />
                                            Auto
                                        </button>
                                    </Label>
                                    <Input
                                        id="slug"
                                        value={formData.slug}
                                        onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="brand">Brand</Label>
                                    <Input
                                        id="brand"
                                        value={formData.brand}
                                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="shortDescription">Short Description</Label>
                                <Input
                                    id="shortDescription"
                                    value={formData.shortDescription}
                                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Full Description</Label>
                                <textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full min-h-[100px] px-3 py-2 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                                />
                            </div>
                        </div>

                        {/* Images */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-zinc-900">Product Images</h2>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    <Upload className="w-4 h-4" />
                                    Add Images
                                </button>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />

                            {existingImages.length === 0 && newImages.length === 0 ? (
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="border-2 border-dashed border-zinc-300 rounded-xl p-8 text-center cursor-pointer hover:border-zinc-400 transition-colors"
                                >
                                    <ImageIcon className="w-10 h-10 text-zinc-400 mx-auto mb-2" />
                                    <p className="text-sm text-zinc-600">Click to upload product images</p>
                                    <p className="text-xs text-zinc-400">JPG, PNG, WebP (max 10MB each)</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                    {existingImages.map((img, i) => (
                                        <div key={img.id} className="relative aspect-square bg-zinc-100 rounded-lg overflow-hidden group">
                                            <img src={img.url} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeExistingImage(i)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            {i === 0 && (
                                                <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-zinc-900 text-white text-xs rounded">
                                                    Main
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                    {newImages.map((p, i) => (
                                        <div key={`new-${i}`} className="relative aspect-square bg-zinc-100 rounded-lg overflow-hidden group">
                                            <img src={p.preview} alt="" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => removeNewImage(i)}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                            <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-yellow-500 text-white text-xs rounded">
                                                New
                                            </span>
                                        </div>
                                    ))}
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="aspect-square border-2 border-dashed border-zinc-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-zinc-400 transition-colors"
                                    >
                                        <Upload className="w-6 h-6 text-zinc-400" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Device Specs (for refurbished) */}
                        {showDeviceSpecs && (
                            <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                                <h2 className="font-semibold text-zinc-900">Device Specifications</h2>
                                <p className="text-sm text-zinc-500">For refurbished/used devices</p>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Battery className="w-4 h-4" />
                                            Battery Health: {formData.batteryHealth}%
                                        </Label>
                                        <input
                                            type="range"
                                            min="50"
                                            max="100"
                                            value={formData.batteryHealth}
                                            onChange={(e) => setFormData({ ...formData, batteryHealth: parseInt(e.target.value) })}
                                            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-zinc-900"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Star className="w-4 h-4" />
                                            Grade
                                        </Label>
                                        <select
                                            value={formData.deviceGrade}
                                            onChange={(e) => setFormData({ ...formData, deviceGrade: e.target.value as DeviceGrade })}
                                            className="w-full h-10 px-3 rounded-lg border border-zinc-200"
                                        >
                                            <option value="">Select grade</option>
                                            {GRADE_OPTIONS.map(g => (
                                                <option key={g.value} value={g.value}>{g.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <HardDrive className="w-4 h-4" />
                                            Storage
                                        </Label>
                                        <select
                                            value={formData.storage}
                                            onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                                            className="w-full h-10 px-3 rounded-lg border border-zinc-200"
                                        >
                                            <option value="">Select storage</option>
                                            {STORAGE_OPTIONS.map(s => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="flex items-center gap-2">
                                            <Palette className="w-4 h-4" />
                                            Color
                                        </Label>
                                        <select
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-full h-10 px-3 rounded-lg border border-zinc-200"
                                        >
                                            <option value="">Select color</option>
                                            {COLOR_OPTIONS.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Pricing */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                            <h2 className="font-semibold text-zinc-900">Pricing</h2>

                            <div className="space-y-2">
                                <Label htmlFor="price">Price (€) *</Label>
                                <Input
                                    id="price"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="compareAtPrice">Compare at Price (€)</Label>
                                <Input
                                    id="compareAtPrice"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={formData.compareAtPrice}
                                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="stockQty">Stock *</Label>
                                <Input
                                    id="stockQty"
                                    type="number"
                                    min="0"
                                    value={formData.stockQty}
                                    onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                            <h2 className="font-semibold text-zinc-900">Organization</h2>

                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <select
                                    id="category"
                                    value={formData.categoryId}
                                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                    className="w-full h-10 px-3 rounded-lg border border-zinc-200"
                                >
                                    <option value="">No category</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="condition">Condition *</Label>
                                <select
                                    id="condition"
                                    value={formData.condition}
                                    onChange={(e) => setFormData({ ...formData, condition: e.target.value as Condition })}
                                    className="w-full h-10 px-3 rounded-lg border border-zinc-200"
                                >
                                    <option value="NEW">New</option>
                                    <option value="USED">Used</option>
                                    <option value="REFURBISHED">Refurbished</option>
                                </select>
                            </div>

                            <div className="space-y-3 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-zinc-300"
                                    />
                                    <span className="text-sm">Active (visible on store)</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isFeatured}
                                        onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                        className="w-4 h-4 rounded border-zinc-300"
                                    />
                                    <span className="text-sm">Featured on homepage</span>
                                </label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                            <Button type="submit" className="w-full" disabled={isSaving || isUploading}>
                                {isSaving || isUploading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        {isUploading ? "Uploading..." : "Saving..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Save Changes
                                    </>
                                )}
                            </Button>
                            <Link href="/admin/products" className="block">
                                <Button type="button" variant="outline" className="w-full">
                                    Cancel
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
