"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

// Placeholder image as data URL (gray box with camera icon)
const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23e5e7eb'%3E%3Crect width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

// Types
interface ProductContent {
    title: string;
    shortDescription: string;
    longDescription: string;
    seoKeywords: string[];
    suggestedImages: { url: string; alt: string }[];
}

interface ImageAnalysis {
    detectedColor: string;
    conditionAssessment: string;
    detectedStorage?: string;
    detectedModel?: string;
    confidence: number;
    notes?: string;
}

const BRANDS = [
    "Apple",
    "Samsung",
    "Google",
    "OnePlus",
    "Xiaomi",
    "Huawei",
    "Sony",
    "LG",
    "Motorola",
    "Other",
];

const CONDITIONS = [
    { value: "NEW", label: "New" },
    { value: "REFURBISHED", label: "Refurbished" },
    { value: "USED", label: "Used" },
];

const STORAGE_OPTIONS = [
    "64GB", "128GB", "256GB", "512GB", "1TB"
];

const PRODUCT_TYPES = [
    { value: "PHONE", label: "Phone / Device", description: "Smartphones, tablets, smartwatches" },
    { value: "ACCESSORY", label: "Accessory", description: "Cases, chargers, screen protectors, cables" },
    { value: "OTHER", label: "Other", description: "Parts, tools, other products" },
];

interface Category {
    id: string;
    name: string;
    slug: string;
}

export default function NewProductWithAI() {
    const router = useRouter();

    // Product type (determines AI depth)
    const [productType, setProductType] = useState<"PHONE" | "ACCESSORY" | "OTHER">("PHONE");

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState("");

    // Input state - now with separate storage and color fields
    const [modelName, setModelName] = useState("");
    const [brand, setBrand] = useState("Apple");
    const [condition, setCondition] = useState<"NEW" | "USED" | "REFURBISHED">("REFURBISHED");
    const [inputStorage, setInputStorage] = useState("");
    const [inputColor, setInputColor] = useState("");
    const [deviceImage, setDeviceImage] = useState<File | null>(null);
    const [deviceImagePreview, setDeviceImagePreview] = useState<string | null>(null);

    // AI results state
    const [generatedContent, setGeneratedContent] = useState<ProductContent | null>(null);
    const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [manualImages, setManualImages] = useState<File[]>([]);
    const [manualImagePreviews, setManualImagePreviews] = useState<string[]>([]);
    const [includeDeviceImage, setIncludeDeviceImage] = useState(true);

    // Editable fields (populated from AI, can be edited)
    const [editableTitle, setEditableTitle] = useState("");
    const [editableShortDesc, setEditableShortDesc] = useState("");
    const [editableLongDesc, setEditableLongDesc] = useState("");
    const [editableColor, setEditableColor] = useState("");
    const [editableStorage, setEditableStorage] = useState("");
    const [batteryHealth, setBatteryHealth] = useState("100");
    const [deviceGrade, setDeviceGrade] = useState<"A_PLUS" | "A" | "B" | "C" | "D">("A");
    const [price, setPrice] = useState("");
    const [comparePrice, setComparePrice] = useState("");
    const [stockQty, setStockQty] = useState("1");
    const [isFeatured, setIsFeatured] = useState(false);
    const [isOnSale, setIsOnSale] = useState(false);

    // Loading states
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState<"input" | "review" | "save">("input");

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await api.getCategories();
            setCategories(cats);
            // Auto-select phones category for phone products
            const phonesCategory = cats.find((c: Category) => c.slug === "phones");
            if (phonesCategory) {
                setSelectedCategory(phonesCategory.id);
            }
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    };

    // Handle device image upload for analysis
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDeviceImage(file);
            setDeviceImagePreview(URL.createObjectURL(file));
        }
    };

    // Handle manual image uploads in review step
    const handleManualImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setManualImages(prev => [...prev, ...files]);
            setManualImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        }
    };

    // Remove a manual image
    const removeManualImage = (index: number) => {
        setManualImages(prev => prev.filter((_, i) => i !== index));
        setManualImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    // Generate content with Gemini
    const handleGenerate = async () => {
        if (!modelName.trim()) {
            setError("Please enter the device model name");
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            // Build full model name with storage if provided
            const fullModelName = inputStorage
                ? `${modelName} ${inputStorage}`
                : modelName;

            // Call generate endpoint
            const response = await fetch(`/api/gemini/generate`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("adminAccessToken")}`,
                },
                body: JSON.stringify({
                    modelName: fullModelName,
                    brand,
                    condition,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Failed to generate content");
            }

            const content: ProductContent = await response.json();
            setGeneratedContent(content);

            // Populate editable fields
            setEditableTitle(content.title);
            setEditableShortDesc(content.shortDescription);
            setEditableLongDesc(content.longDescription);

            // Pre-populate storage/color from input
            setEditableStorage(inputStorage);
            setEditableColor(inputColor);

            // If device image uploaded, analyze it
            if (deviceImage) {
                await analyzeImage();
            }

            setStep("review");
        } catch (err: any) {
            setError(err.message || "Failed to generate content");
        } finally {
            setIsGenerating(false);
        }
    };

    // Analyze uploaded device image
    const analyzeImage = async () => {
        if (!deviceImage) return;

        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append("file", deviceImage);
            formData.append("modelHint", `${brand} ${modelName}`);

            const response = await fetch(`/api/gemini/analyze`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("adminAccessToken")}`,
                },
                body: formData,
            });

            if (response.ok) {
                const analysis: ImageAnalysis = await response.json();
                setImageAnalysis(analysis);
                // Only update color/storage if not already set by user
                if (!editableColor && analysis.detectedColor) {
                    setEditableColor(analysis.detectedColor);
                }
                if (!editableStorage && analysis.detectedStorage) {
                    setEditableStorage(analysis.detectedStorage);
                }
            }
        } catch (err) {
            console.error("Image analysis failed:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Toggle image selection
    const toggleImageSelection = (url: string) => {
        setSelectedImages(prev =>
            prev.includes(url)
                ? prev.filter(u => u !== url)
                : [...prev, url]
        );
    };

    // Generate URL slug
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    // Save product
    const handleSave = async () => {
        if (!editableTitle || !price) {
            setError("Title and price are required");
            return;
        }

        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue < 0) {
            setError("Price must be a valid number and cannot be negative");
            return;
        }

        const comparePriceValue = comparePrice ? parseFloat(comparePrice) : undefined;
        if (comparePriceValue !== undefined && (isNaN(comparePriceValue) || comparePriceValue < 0)) {
            setError("Compare price must be a valid number and cannot be negative");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Collect all image URLs
            let imageUrls: string[] = [...selectedImages];

            // Upload device image if provided and selected
            if (deviceImage && includeDeviceImage) {
                const uploaded = await api.uploadImages([deviceImage]);
                imageUrls = [...uploaded.map(u => u.url), ...imageUrls];
            }

            // Upload manual images
            if (manualImages.length > 0) {
                const uploaded = await api.uploadImages(manualImages);
                imageUrls = [...imageUrls, ...uploaded.map(u => u.url)];
            }

            // Generate unique slug
            const baseSlug = generateSlug(modelName);
            const storagePart = editableStorage ? `-${editableStorage.toLowerCase().replace(/\s/g, '')}` : '';
            const colorPart = editableColor ? `-${generateSlug(editableColor)}` : '';
            const conditionPart = condition !== "NEW" ? `-${condition.toLowerCase()}` : '';
            const uniqueId = Date.now().toString(36).slice(-4);
            const slug = `${baseSlug}${storagePart}${colorPart}${conditionPart}-${uniqueId}`;

            // Create product
            await api.createProduct({
                name: editableTitle,
                slug,
                description: editableLongDesc,
                shortDescription: editableShortDesc,
                price: priceValue,
                compareAtPrice: comparePriceValue,
                stockQty: parseInt(stockQty),
                condition,
                brand,
                categoryId: selectedCategory || undefined,
                isFeatured,
                isActive: true,
                storage: editableStorage || undefined,
                color: editableColor || undefined,
                batteryHealth: batteryHealth ? parseInt(batteryHealth) : undefined,
                deviceGrade: productType === "PHONE" ? deviceGrade : undefined,
                imageUrls: imageUrls,
            });

            router.push("/admin/products");
        } catch (err: any) {
            setError(err.message || "Failed to save product");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/products"
                            className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                        >
                            ← Back to Products
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
                            Add Product with AI
                        </h1>
                    </div>
                    <Link
                        href="/admin/products/new"
                        className="text-sm text-zinc-600 hover:text-zinc-900 underline"
                    >
                        Use manual entry instead
                    </Link>
                </div>
            </div>

            <div className="max-w-4xl mx-auto py-8 px-6">
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Step 1: Input */}
                {step === "input" && (
                    <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                        <h2 className="text-lg font-semibold mb-6">Tell us about the product</h2>

                        <div className="space-y-6">
                            {/* Product Type Selection */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-3">
                                    Product Type *
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {PRODUCT_TYPES.map((type) => (
                                        <button
                                            key={type.value}
                                            type="button"
                                            onClick={() => {
                                                setProductType(type.value as any);
                                                // Auto-switch category based on type
                                                if (type.value === "PHONE") {
                                                    const phonesCat = categories.find(c => c.slug === "phones");
                                                    if (phonesCat) setSelectedCategory(phonesCat.id);
                                                } else if (type.value === "ACCESSORY") {
                                                    const accCat = categories.find(c => c.slug === "accessories");
                                                    if (accCat) setSelectedCategory(accCat.id);
                                                }
                                            }}
                                            className={`p-4 rounded-lg border-2 text-left transition-all ${productType === type.value
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-zinc-200 hover:border-zinc-300"
                                                }`}
                                        >
                                            <span className="text-lg">{type.label}</span>
                                            <p className="text-xs text-zinc-500 mt-1">{type.description}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Category Selection */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Category *
                                </label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Select a category...</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Model Name */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    {productType === "PHONE" ? "Device Model *" : "Product Name *"}
                                </label>
                                <input
                                    type="text"
                                    value={modelName}
                                    onChange={(e) => setModelName(e.target.value)}
                                    placeholder={productType === "PHONE" ? "e.g., iPhone 16 Pro Max" : "e.g., Screen Protector for iPhone 16"}
                                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-sm text-zinc-500">
                                    {productType === "PHONE"
                                        ? "Enter the device model name (AI will research specs and find images)"
                                        : "Enter the product name (simpler AI analysis for accessories)"
                                    }
                                </p>
                            </div>

                            {/* Brand, Storage, Color, Condition - Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Brand
                                    </label>
                                    <select
                                        value={brand}
                                        onChange={(e) => setBrand(e.target.value)}
                                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {BRANDS.map((b) => (
                                            <option key={b} value={b}>{b}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Storage
                                    </label>
                                    <select
                                        value={inputStorage}
                                        onChange={(e) => setInputStorage(e.target.value)}
                                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select...</option>
                                        {STORAGE_OPTIONS.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Color (optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={inputColor}
                                        onChange={(e) => setInputColor(e.target.value)}
                                        placeholder="e.g., Black"
                                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        Condition
                                    </label>
                                    <select
                                        value={condition}
                                        onChange={(e) => setCondition(e.target.value as any)}
                                        className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        {CONDITIONS.map((c) => (
                                            <option key={c.value} value={c.value}>{c.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Device Image Upload */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Upload Device Photo (Optional)
                                </label>
                                <p className="text-sm text-zinc-500 mb-3">
                                    AI will analyze the image to detect color and condition. This helps find matching product images.
                                </p>
                                <div className="flex items-start gap-4">
                                    <label className="flex-1 flex flex-col items-center justify-center px-6 py-8 border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                        <svg className="w-8 h-8 text-zinc-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                        <span className="text-sm text-zinc-600">Click to upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    {deviceImagePreview && (
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-200">
                                            <img
                                                src={deviceImagePreview}
                                                alt="Device preview"
                                                className="w-full h-full object-cover"
                                            />
                                            <button
                                                onClick={() => {
                                                    setDeviceImage(null);
                                                    setDeviceImagePreview(null);
                                                }}
                                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Generate Button */}
                            <button
                                onClick={handleGenerate}
                                disabled={isGenerating || !modelName.trim()}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Generating with AI...
                                    </>
                                ) : (
                                    <>
                                        Generate Product Content
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2: Review & Edit */}
                {step === "review" && generatedContent && (
                    <div className="space-y-6">
                        {/* Image Analysis Results */}
                        {imageAnalysis && (
                            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                                <h3 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
                                    Image Analysis Results
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <span className="text-zinc-600">Color:</span>{" "}
                                        <span className="font-medium">{imageAnalysis.detectedColor}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-600">Condition:</span>{" "}
                                        <span className="font-medium">{imageAnalysis.conditionAssessment}</span>
                                    </div>
                                    <div>
                                        <span className="text-zinc-600">Confidence:</span>{" "}
                                        <span className="font-medium">{imageAnalysis.confidence}%</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {isAnalyzing && (
                            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 flex items-center gap-3">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-blue-700">Analyzing your device image...</span>
                            </div>
                        )}

                        {/* Editable Content */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-6">Review & Edit Generated Content</h2>

                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Product Title
                                    </label>
                                    <input
                                        type="text"
                                        value={editableTitle}
                                        onChange={(e) => setEditableTitle(e.target.value)}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Short Description */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Short Description
                                    </label>
                                    <textarea
                                        value={editableShortDesc}
                                        onChange={(e) => setEditableShortDesc(e.target.value)}
                                        rows={2}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Long Description */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Full Description
                                    </label>
                                    <textarea
                                        value={editableLongDesc}
                                        onChange={(e) => setEditableLongDesc(e.target.value)}
                                        rows={6}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Color & Storage */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                                            Color
                                        </label>
                                        <input
                                            type="text"
                                            value={editableColor}
                                            onChange={(e) => setEditableColor(e.target.value)}
                                            placeholder="e.g., Desert Titanium"
                                            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                                            Storage
                                        </label>
                                        <input
                                            type="text"
                                            value={editableStorage}
                                            onChange={(e) => setEditableStorage(e.target.value)}
                                            placeholder="e.g., 128GB"
                                            className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Battery Health & Device Grade (for phones) */}
                                {productType === "PHONE" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                                Battery Health (%)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={batteryHealth}
                                                onChange={(e) => setBatteryHealth(e.target.value)}
                                                placeholder="100"
                                                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="mt-1 text-xs text-zinc-500">0-100%, typical range for refurbished is 80-100%</p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                                Device Grade
                                            </label>
                                            <select
                                                value={deviceGrade}
                                                onChange={(e) => setDeviceGrade(e.target.value as any)}
                                                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="A_PLUS">A+ (Like New)</option>
                                                <option value="A">A (Excellent)</option>
                                                <option value="B">B (Good)</option>
                                                <option value="C">C (Fair)</option>
                                                <option value="D">D (Acceptable)</option>
                                            </select>
                                            <p className="mt-1 text-xs text-zinc-500">Cosmetic condition grade</p>
                                        </div>
                                    </div>
                                )}

                                {/* Pricing Section */}
                                <div className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                                    <h3 className="font-medium text-orange-800 mb-3 flex items-center gap-2">
                                        <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
                                        Pricing (Required)
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                                Price (€) <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                placeholder="899.00"
                                                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${!price ? "border-orange-400 bg-orange-50" : "border-zinc-300"
                                                    }`}
                                            />
                                            {!price && (
                                                <p className="mt-1 text-xs text-orange-600">⚠️ Price is required</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-zinc-700 mb-1">
                                                Compare at Price (€)
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={comparePrice}
                                                onChange={(e) => setComparePrice(e.target.value)}
                                                placeholder="1199.00"
                                                className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                            <p className="mt-1 text-xs text-zinc-500">Original price for showing discount</p>
                                        </div>
                                    </div>

                                    {/* Show discount preview */}
                                    {price && comparePrice && parseFloat(comparePrice) > parseFloat(price) && (
                                        <div className="mt-3 p-2 bg-green-100 rounded-lg flex items-center gap-2 text-green-700">
                                            <span className="font-medium">
                                                Save €{(parseFloat(comparePrice) - parseFloat(price)).toFixed(2)} ({Math.round((1 - parseFloat(price) / parseFloat(comparePrice)) * 100)}% off)
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Stock Quantity */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Stock Quantity
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Feature & Sale Toggles */}
                                <div className="grid grid-cols-2 gap-4">
                                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isFeatured
                                        ? "border-yellow-400 bg-yellow-50"
                                        : "border-zinc-200 hover:border-zinc-300"
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={isFeatured}
                                            onChange={(e) => setIsFeatured(e.target.checked)}
                                            className="w-5 h-5 rounded text-yellow-500"
                                        />
                                        <div>
                                            <span className="font-medium text-zinc-900">Feature on Homepage</span>
                                            <p className="text-xs text-zinc-500">Show in featured products section</p>
                                        </div>
                                    </label>
                                    <label className={`flex items-center gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${isOnSale
                                        ? "border-red-400 bg-red-50"
                                        : "border-zinc-200 hover:border-zinc-300"
                                        }`}>
                                        <input
                                            type="checkbox"
                                            checked={isOnSale}
                                            onChange={(e) => setIsOnSale(e.target.checked)}
                                            className="w-5 h-5 rounded text-red-500"
                                        />
                                        <div>
                                            <span className="font-medium text-zinc-900">🔥 On Sale / Promo</span>
                                            <p className="text-xs text-zinc-500">Highlight as sale item</p>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* AI Suggested Images */}
                        {generatedContent.suggestedImages && generatedContent.suggestedImages.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                                <h2 className="text-lg font-semibold mb-4">AI Found These Images</h2>
                                <p className="text-sm text-zinc-500 mb-4">Click to select images for your product</p>
                                <div className="grid grid-cols-4 gap-4">
                                    {generatedContent.suggestedImages.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={() => toggleImageSelection(img.url)}
                                            className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${selectedImages.includes(img.url)
                                                ? "border-blue-500 ring-2 ring-blue-200"
                                                : "border-zinc-200 hover:border-zinc-400"
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.alt}
                                                className="w-full h-32 object-contain bg-zinc-50"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
                                                }}
                                            />
                                            {selectedImages.includes(img.url) && (
                                                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm">
                                                    ✓
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Manual Image Upload Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">Upload Your Own Images</h2>
                            <p className="text-sm text-zinc-500 mb-4">
                                {generatedContent.suggestedImages?.length ?
                                    "Add additional images or replace AI suggestions with your own photos" :
                                    "AI couldn't find suitable images. Please upload your own product photos."
                                }
                            </p>

                            <div className="flex flex-wrap gap-4">
                                {/* Device Image Preview (if uploaded) */}
                                {deviceImage && deviceImagePreview && (
                                    <div
                                        onClick={() => setIncludeDeviceImage(!includeDeviceImage)}
                                        className={`relative w-32 h-32 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${includeDeviceImage
                                            ? "border-green-500 ring-2 ring-green-200"
                                            : "border-zinc-300 opacity-50"
                                            }`}
                                    >
                                        <img
                                            src={deviceImagePreview}
                                            alt="Device photo"
                                            className="w-full h-full object-cover"
                                        />
                                        {includeDeviceImage && (
                                            <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm">
                                                ✓
                                            </div>
                                        )}
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs py-1 text-center">
                                            📸 Your Photo
                                        </div>
                                    </div>
                                )}

                                {/* Uploaded Image Previews */}
                                {manualImagePreviews.map((preview, i) => (
                                    <div key={i} className="relative w-32 h-32 rounded-lg overflow-hidden border border-zinc-200">
                                        <img
                                            src={preview}
                                            alt={`Upload ${i + 1}`}
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => removeManualImage(i)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {/* Upload Button */}
                                <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                    <svg className="w-8 h-8 text-zinc-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    <span className="text-xs text-zinc-500">Add Image</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleManualImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>

                            {/* Summary of selected images */}
                            {(selectedImages.length > 0 || manualImages.length > 0 || (deviceImage && includeDeviceImage)) && (
                                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                                    <span className="font-medium">
                                        {selectedImages.length + manualImages.length + (deviceImage && includeDeviceImage ? 1 : 0)} image(s) ready
                                    </span>
                                    {' - '}
                                    {deviceImage && includeDeviceImage && "1 device photo, "}
                                    {selectedImages.length > 0 && `${selectedImages.length} AI suggestion(s), `}
                                    {manualImages.length > 0 && `${manualImages.length} manual upload(s)`}
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4">
                            <button
                                onClick={() => setStep("input")}
                                className="flex-1 py-3 border border-zinc-300 text-zinc-700 font-medium rounded-lg hover:bg-zinc-50"
                            >
                                ← Back to Edit Input
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || !editableTitle || !price}
                                className="flex-1 py-3 bg-zinc-900 text-white font-semibold rounded-lg hover:bg-zinc-800 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Product"
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
