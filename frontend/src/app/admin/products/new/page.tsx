"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, Category } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    ChevronLeft,
    Save,
    Loader2,
    Sparkles,
    Upload,
    X,
    ImageIcon,
    Wand2,
    Package,
    Battery,
    Star,
    FolderOpen,
    HelpCircle,
    Check,
    Info,
} from "lucide-react";

// Types
type Condition = "NEW" | "REFURBISHED" | "USED";
type DeviceGrade = "A_PLUS" | "A" | "B" | "C" | "D";
type ProductType = "PHONE" | "ACCESSORY";

interface ImageAnalysis {
    detectedColor: string;
    conditionAssessment: string;
    detectedStorage?: string;
    detectedModel?: string;
    confidence: number;
    notes?: string;
}

interface ProductContent {
    title: string;
    shortDescription: string;
    longDescription: string;
    seoKeywords: string[];
    suggestedImages: { url: string; alt: string }[];
}

interface Asset {
    url: string;
    key: string;
    lastModified?: string;
    size?: number;
}

// Constants
const BRANDS = [
    "Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Huawei", "Sony", "LG", "Motorola", "Other"
];

const STORAGE_OPTIONS = ["64GB", "128GB", "256GB", "512GB", "1TB"];

const CONDITION_OPTIONS = [
    { value: "NEW", label: "Nieuw", description: "Factory sealed" },
    { value: "REFURBISHED", label: "Refurbished", description: "Professionally restored" },
    { value: "USED", label: "Gebruikt", description: "Pre-owned condition" },
];

const DEVICE_GRADES = [
    { value: "A_PLUS", label: "A+", description: "Zoals nieuw" },
    { value: "A", label: "A", description: "Uitstekend" },
    { value: "B", label: "B", description: "Goed" },
    { value: "C", label: "C", description: "Redelijk" },
    { value: "D", label: "D", description: "Acceptabel" },
];

export default function AddProductPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [productType, setProductType] = useState<ProductType>("PHONE");
    const [brand, setBrand] = useState("Apple");
    const [modelName, setModelName] = useState("");
    const [condition, setCondition] = useState<Condition>("REFURBISHED");
    const [storage, setStorage] = useState("");
    const [color, setColor] = useState("");
    const [categoryId, setCategoryId] = useState("");

    // Descriptions
    const [title, setTitle] = useState("");
    const [shortDescription, setShortDescription] = useState("");
    const [description, setDescription] = useState("");

    // Phone-specific
    const [batteryHealth, setBatteryHealth] = useState("100");
    const [deviceGrade, setDeviceGrade] = useState<DeviceGrade>("A");

    // Pricing
    const [price, setPrice] = useState("");
    const [compareAtPrice, setCompareAtPrice] = useState("");
    const [stockQty, setStockQty] = useState("1");

    // Options
    const [isFeatured, setIsFeatured] = useState(false);
    const [isActive, setIsActive] = useState(true);

    // Images
    const [images, setImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [suggestedImages, setSuggestedImages] = useState<{ url: string; alt: string }[]>([]);
    const [selectedSuggestedImages, setSelectedSuggestedImages] = useState<string[]>([]);

    // Asset Library
    const [existingAssets, setExistingAssets] = useState<Asset[]>([]);
    const [isLoadingAssets, setIsLoadingAssets] = useState(false);
    const [showAssetLibrary, setShowAssetLibrary] = useState(false);
    const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
    const [assetSearchQuery, setAssetSearchQuery] = useState("");

    // AI states
    const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
    const [isGeneratingShort, setIsGeneratingShort] = useState(false);
    const [isGeneratingLong, setIsGeneratingLong] = useState(false);

    // General states
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    // Load categories
    useEffect(() => {
        loadCategories();
        loadAssets();
    }, []);

    // Auto-select category based on product type
    useEffect(() => {
        if (categories.length > 0) {
            if (productType === "PHONE") {
                const phonesCat = categories.find(c => c.slug === "phones");
                if (phonesCat) setCategoryId(phonesCat.id);
            } else {
                const accCat = categories.find(c => c.slug === "accessories");
                if (accCat) setCategoryId(accCat.id);
            }
        }
    }, [productType, categories]);

    const loadCategories = async () => {
        try {
            const cats = await api.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error("Failed to load categories:", err);
        }
    };

    // Load existing assets from MinIO (device images only)
    const loadAssets = async () => {
        setIsLoadingAssets(true);
        try {
            const response = await fetch(`/api/upload/assets?folder=devices&limit=250`, {
                headers: { "Authorization": `Bearer ${localStorage.getItem("adminAccessToken")}` },
            });

            if (response.ok) {
                const data = await response.json();
                setExistingAssets(data.assets || []);
            }
        } catch (err) {
            console.error("Failed to load assets:", err);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    // Toggle asset selection
    const toggleAssetSelection = (url: string) => {
        setSelectedAssets(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    };

    // Handle image upload
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setImages(prev => [...prev, ...files]);
            setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);

            // Analyze first image with AI if it's the first upload
            if (images.length === 0 && files.length > 0) {
                analyzeImage(files[0]);
            }
        }
    };

    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (index === 0) {
            setImageAnalysis(null);
        }
    };

    // AI: Analyze uploaded image
    const analyzeImage = async (file: File) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
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

                // Auto-fill fields from analysis (only color - AI can't detect storage)
                if (analysis.detectedColor && !color) {
                    setColor(analysis.detectedColor);
                }
            }
        } catch (err) {
            console.error("Image analysis failed:", err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // AI: Generate content
    const generateContent = async (field: "title" | "short" | "long") => {
        if (!modelName.trim()) {
            setError("Vul eerst de modelnaam in voordat je AI-content genereert");
            return;
        }

        const setLoading = field === "title" ? setIsGeneratingTitle :
            field === "short" ? setIsGeneratingShort : setIsGeneratingLong;

        setLoading(true);
        setError(null);

        try {
            const fullModelName = storage ? `${modelName} ${storage}` : modelName;

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
                throw new Error("Failed to generate content");
            }

            const content: ProductContent = await response.json();

            // Fill the requested field
            if (field === "title") {
                setTitle(content.title);
            } else if (field === "short") {
                setShortDescription(content.shortDescription);
            } else {
                setDescription(content.longDescription);
            }

            // Store suggested images
            if (content.suggestedImages && content.suggestedImages.length > 0) {
                setSuggestedImages(content.suggestedImages);
            }
        } catch (err: any) {
            setError(err.message || "AI generatie mislukt");
        } finally {
            setLoading(false);
        }
    };

    // Generate all content at once
    const generateAllContent = async () => {
        if (!modelName.trim()) {
            setError("Vul eerst de modelnaam in");
            return;
        }

        setIsGeneratingTitle(true);
        setIsGeneratingShort(true);
        setIsGeneratingLong(true);
        setError(null);

        try {
            const fullModelName = storage ? `${modelName} ${storage}` : modelName;

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

            if (!response.ok) throw new Error("Failed to generate content");

            const content: ProductContent = await response.json();

            setTitle(content.title);
            setShortDescription(content.shortDescription);
            setDescription(content.longDescription);

            if (content.suggestedImages?.length > 0) {
                setSuggestedImages(content.suggestedImages);
            }
        } catch (err: any) {
            setError(err.message || "AI generatie mislukt");
        } finally {
            setIsGeneratingTitle(false);
            setIsGeneratingShort(false);
            setIsGeneratingLong(false);
        }
    };

    // Toggle suggested image selection
    const toggleSuggestedImage = (url: string) => {
        setSelectedSuggestedImages(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    };

    // Generate slug
    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "");
    };

    // Save product
    const handleSubmit = async () => {
        // Validation
        if (!title.trim()) {
            setError("Producttitel is verplicht");
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            setError("Geldige prijs is verplicht");
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Collect all image URLs (uploaded + AI suggested + library assets)
            let imageUrls: string[] = [...selectedSuggestedImages, ...selectedAssets];

            if (images.length > 0) {
                const uploaded = await api.uploadImages(images);
                imageUrls = [...uploaded.map(u => u.url), ...imageUrls];
            }

            // Generate unique slug
            const baseSlug = generateSlug(modelName || title);
            const storagePart = storage ? `-${storage.toLowerCase().replace(/\s/g, '')}` : '';
            const colorPart = color ? `-${generateSlug(color)}` : '';
            const conditionPart = condition !== "NEW" ? `-${condition.toLowerCase()}` : '';
            const uniqueId = Date.now().toString(36).slice(-4);
            const slug = `${baseSlug}${storagePart}${colorPart}${conditionPart}-${uniqueId}`;

            // Create product
            await api.createProduct({
                name: title,
                slug,
                description,
                shortDescription,
                price: parseFloat(price),
                compareAtPrice: compareAtPrice ? parseFloat(compareAtPrice) : undefined,
                stockQty: parseInt(stockQty) || 1,
                condition,
                brand,
                categoryId: categoryId || undefined,
                isFeatured,
                isActive,
                storage: storage || undefined,
                color: color || undefined,
                batteryHealth: productType === "PHONE" && batteryHealth ? parseInt(batteryHealth) : undefined,
                deviceGrade: productType === "PHONE" ? deviceGrade : undefined,
                imageUrls,
            });

            setSuccess(true);
            setTimeout(() => router.push("/admin/products"), 1500);
        } catch (err: any) {
            setError(err.message || "Opslaan mislukt");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50">
            {/* Header */}
            <div className="bg-white border-b border-zinc-200 px-6 py-4 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <div>
                        <Link
                            href="/admin/products"
                            className="text-sm text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Terug naar Producten
                        </Link>
                        <h1 className="text-2xl font-bold text-zinc-900 mt-1 flex items-center gap-2">
                            Product Toevoegen
                            <span className="text-xs bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-0.5 rounded-full">
                                AI
                            </span>
                            <button
                                onClick={() => setShowHelp(!showHelp)}
                                className="ml-2 p-1 rounded-full hover:bg-zinc-100 text-zinc-400 hover:text-zinc-600"
                                title="Handleiding"
                            >
                                <HelpCircle className="w-5 h-5" />
                            </button>
                        </h1>
                    </div>
                    <Button
                        onClick={handleSubmit}
                        disabled={isSaving || !title || !price}
                        className="bg-zinc-900 hover:bg-zinc-800"
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Opslaan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Product Opslaan
                            </>
                        )}
                    </Button>
                </div>
            </div>

            <div className="max-w-5xl mx-auto py-8 px-6">
                {/* Error/Success Messages */}
                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                        ✓ Product succesvol opgeslagen! Doorsturen...
                    </div>
                )}

                {/* Quick Start Guide */}
                <div className="mb-6">
                    <button
                        onClick={() => setShowHelp(!showHelp)}
                        className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                        <HelpCircle className="w-4 h-4" />
                        {showHelp ? "Verberg handleiding" : "Hoe werkt dit? (Klik voor handleiding)"}
                    </button>

                    {showHelp && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
                            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                <Info className="w-5 h-5" />
                                Snelstartgids - Product Toevoegen
                            </h3>
                            <div className="space-y-3 text-sm text-blue-800">
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">1</span>
                                    <div>
                                        <strong>Upload een foto</strong> (optioneel) - AI detecteert automatisch de kleur en conditie van het toestel
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">2</span>
                                    <div>
                                        <strong>Vul het model in</strong> - bijv. "iPhone 15 Pro Max" en selecteer het merk
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">3</span>
                                    <div>
                                        <strong>Klik op "Genereer Alles met AI"</strong> - AI maakt automatisch titel en beschrijvingen + zoekt afbeeldingen
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">4</span>
                                    <div>
                                        <strong>Selecteer afbeeldingen</strong> - Kies uit AI-voorstellen OF eerder geüploade afbeeldingen
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600">5</span>
                                    <div>
                                        <strong>Stel de prijs in</strong> en klik op "Product Opslaan"
                                    </div>
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-blue-200">
                                <p className="text-xs text-blue-600">
                                    💡 <strong>Tip:</strong> Je kunt elk AI-gegenereerd veld handmatig aanpassen voordat je opslaat
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Form - Left 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Image Upload Section */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" />
                                Afbeeldingen
                            </h2>

                            {/* Analysis Result */}
                            {imageAnalysis && (
                                <div className="mb-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-4 border border-purple-200">
                                    <h3 className="font-medium text-purple-900 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" />
                                        AI Analyse Resultaat
                                    </h3>
                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-zinc-600">Kleur:</span>{" "}
                                            <span className="font-medium">{imageAnalysis.detectedColor}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-600">Conditie:</span>{" "}
                                            <span className="font-medium">{imageAnalysis.conditionAssessment}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-600">Zekerheid:</span>{" "}
                                            <span className="font-medium">{imageAnalysis.confidence}%</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {isAnalyzing && (
                                <div className="mb-4 bg-blue-50 rounded-lg p-4 border border-blue-200 flex items-center gap-3">
                                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                    <span className="text-blue-700">Afbeelding analyseren met AI...</span>
                                </div>
                            )}

                            {/* Upload Area */}
                            <div className="flex flex-wrap gap-4">
                                {imagePreviews.map((preview, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-zinc-200">
                                        <img src={preview} alt="" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {index === 0 && (
                                            <span className="absolute bottom-1 left-1 text-xs bg-black/50 text-white px-1 rounded">
                                                Hoofd
                                            </span>
                                        )}
                                    </div>
                                ))}
                                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-zinc-300 rounded-lg cursor-pointer hover:border-blue-400 transition-colors">
                                    <Upload className="w-6 h-6 text-zinc-400" />
                                    <span className="text-xs text-zinc-500 mt-1">Upload</span>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleImageUpload}
                                        className="hidden"
                                    />
                                </label>
                            </div>
                            <p className="text-xs text-zinc-500 mt-2">
                                💡 Upload een foto van het toestel - AI detecteert automatisch kleur en conditie
                            </p>
                        </div>

                        {/* Basic Info */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <Package className="w-5 h-5" />
                                Product Informatie
                            </h2>

                            <div className="space-y-4">
                                {/* Product Type */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">Type</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setProductType("PHONE")}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${productType === "PHONE"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-zinc-200 hover:border-zinc-300"
                                                }`}
                                        >
                                            <span className="font-medium">📱 Toestel</span>
                                            <p className="text-xs text-zinc-500">Smartphones, tablets</p>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setProductType("ACCESSORY")}
                                            className={`p-3 rounded-lg border-2 text-left transition-all ${productType === "ACCESSORY"
                                                ? "border-blue-500 bg-blue-50"
                                                : "border-zinc-200 hover:border-zinc-300"
                                                }`}
                                        >
                                            <span className="font-medium">🎧 Accessoire</span>
                                            <p className="text-xs text-zinc-500">Hoesjes, kabels, etc.</p>
                                        </button>
                                    </div>
                                </div>

                                {/* Brand, Model, Condition, Storage, Color */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Merk</label>
                                        <select
                                            value={brand}
                                            onChange={(e) => setBrand(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            {BRANDS.map((b) => (
                                                <option key={b} value={b}>{b}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Model / Naam *</label>
                                        <input
                                            type="text"
                                            value={modelName}
                                            onChange={(e) => setModelName(e.target.value)}
                                            placeholder="bijv. iPhone 15 Pro Max"
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Conditie</label>
                                        <select
                                            value={condition}
                                            onChange={(e) => setCondition(e.target.value as Condition)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            {CONDITION_OPTIONS.map((c) => (
                                                <option key={c.value} value={c.value}>{c.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Opslag</label>
                                        <select
                                            value={storage}
                                            onChange={(e) => setStorage(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">Selecteer...</option>
                                            {STORAGE_OPTIONS.map((s) => (
                                                <option key={s} value={s}>{s}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">Kleur</label>
                                        <input
                                            type="text"
                                            value={color}
                                            onChange={(e) => setColor(e.target.value)}
                                            placeholder="bijv. Zwart"
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Categorie</label>
                                    <select
                                        value={categoryId}
                                        onChange={(e) => setCategoryId(e.target.value)}
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Selecteer categorie...</option>
                                        {categories.map((cat) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Descriptions with AI */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <Wand2 className="w-5 h-5" />
                                    Beschrijvingen
                                </h2>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={generateAllContent}
                                    disabled={isGeneratingTitle || !modelName.trim()}
                                    className="text-purple-600 border-purple-300 hover:bg-purple-50"
                                >
                                    {isGeneratingTitle ? (
                                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                                    ) : (
                                        <Sparkles className="w-4 h-4 mr-1" />
                                    )}
                                    Genereer Alles met AI
                                </Button>
                            </div>

                            <div className="space-y-4">
                                {/* Title */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-zinc-700">
                                            Titel *
                                        </label>
                                        <button
                                            onClick={() => generateContent("title")}
                                            disabled={isGeneratingTitle || !modelName.trim()}
                                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isGeneratingTitle ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            Genereer
                                        </button>
                                    </div>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Product titel"
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Short Description */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-zinc-700">
                                            Korte beschrijving
                                        </label>
                                        <button
                                            onClick={() => generateContent("short")}
                                            disabled={isGeneratingShort || !modelName.trim()}
                                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isGeneratingShort ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            Genereer
                                        </button>
                                    </div>
                                    <textarea
                                        value={shortDescription}
                                        onChange={(e) => setShortDescription(e.target.value)}
                                        rows={2}
                                        placeholder="Korte samenvatting..."
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Long Description */}
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-medium text-zinc-700">
                                            Volledige beschrijving
                                        </label>
                                        <button
                                            onClick={() => generateContent("long")}
                                            disabled={isGeneratingLong || !modelName.trim()}
                                            className="text-xs text-purple-600 hover:text-purple-700 flex items-center gap-1 disabled:opacity-50"
                                        >
                                            {isGeneratingLong ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <Sparkles className="w-3 h-3" />
                                            )}
                                            Genereer
                                        </button>
                                    </div>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        rows={6}
                                        placeholder="Gedetailleerde productbeschrijving..."
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Suggested Images from AI */}
                        {suggestedImages.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-500" />
                                    AI Voorgestelde Afbeeldingen
                                </h2>
                                <p className="text-sm text-zinc-500 mb-4">
                                    Klik om te selecteren (geselecteerd: {selectedSuggestedImages.length})
                                </p>
                                <div className="grid grid-cols-4 gap-3">
                                    {suggestedImages.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => toggleSuggestedImage(img.url)}
                                            className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selectedSuggestedImages.includes(img.url)
                                                ? "border-blue-500 ring-2 ring-blue-200"
                                                : "border-zinc-200 hover:border-zinc-300"
                                                }`}
                                        >
                                            <img
                                                src={img.url}
                                                alt={img.alt}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23e5e7eb'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3EError%3C/text%3E%3C/svg%3E";
                                                }}
                                            />
                                            {selectedSuggestedImages.includes(img.url) && (
                                                <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                                                    <div className="bg-blue-500 text-white rounded-full p-1">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Asset Library */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-lg font-semibold flex items-center gap-2">
                                    <FolderOpen className="w-5 h-5" />
                                    Afbeeldingen Bibliotheek
                                </h2>
                                <button
                                    onClick={() => setShowAssetLibrary(!showAssetLibrary)}
                                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                >
                                    {showAssetLibrary ? "Verbergen" : "Tonen"} ({existingAssets.length} beschikbaar)
                                </button>
                            </div>

                            {selectedAssets.length > 0 && (
                                <div className="mb-4 p-3 bg-green-50 rounded-lg text-green-700 text-sm flex items-center gap-2">
                                    <Check className="w-4 h-4" />
                                    {selectedAssets.length} afbeelding(en) geselecteerd uit bibliotheek
                                </div>
                            )}

                            {showAssetLibrary && (
                                <>
                                    {/* Search Input */}
                                    <div className="mb-4">
                                        <input
                                            type="text"
                                            placeholder="Zoek op toestel naam... (bijv. iPhone 15, Galaxy S24)"
                                            value={assetSearchQuery}
                                            onChange={(e) => setAssetSearchQuery(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                                        />
                                    </div>

                                    {isLoadingAssets ? (
                                        <div className="flex items-center justify-center py-8">
                                            <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                                        </div>
                                    ) : existingAssets.length === 0 ? (
                                        <div className="text-center py-8 text-zinc-500">
                                            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-zinc-300" />
                                            <p>Geen bestaande afbeeldingen gevonden</p>
                                            <p className="text-xs mt-1">Upload afbeeldingen worden hier opgeslagen</p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Filter and sort assets */}
                                            {(() => {
                                                // Sort by: 1) Brand (Apple first) 2) Model tier 3) Model number (newest first)
                                                const getBrandScore = (key: string): number => {
                                                    if (key.includes('/Apple/')) return 1000;
                                                    if (key.includes('/Samsung/')) return 500;
                                                    return 0;
                                                };

                                                const getModelTierScore = (key: string): number => {
                                                    // Tier 1: Flagships
                                                    if (key.includes('Pro Max') || key.includes('Ultra')) return 300;
                                                    if (key.includes('Pro') && !key.includes('Pro Max')) return 250;
                                                    if (key.includes('Plus')) return 200;
                                                    if (key.includes('Z Fold') || key.includes('Z Flip')) return 180;
                                                    // Tier 2: Base models (will be sorted by number below)
                                                    return 100;
                                                };

                                                const getModelNumber = (key: string): number => {
                                                    // Extract model numbers (iPhone 17, Galaxy S24, etc.)
                                                    const match = key.match(/(?:iPhone|iPad|Galaxy\s*[A-Z]?)[\s]*(\d+)/i);
                                                    return match ? parseInt(match[1]) : 0;
                                                };

                                                let sortedAssets = [...existingAssets].sort((a, b) => {
                                                    // Primary: Brand (Apple > Samsung)
                                                    const brandDiff = getBrandScore(b.key) - getBrandScore(a.key);
                                                    if (brandDiff !== 0) return brandDiff;

                                                    // Secondary: Model tier (Pro Max > Pro > Plus > Base)
                                                    const tierDiff = getModelTierScore(b.key) - getModelTierScore(a.key);
                                                    if (tierDiff !== 0) return tierDiff;

                                                    // Tertiary: Model number (17 > 16 > 15...)
                                                    return getModelNumber(b.key) - getModelNumber(a.key);
                                                });

                                                const filteredAssets = assetSearchQuery.trim()
                                                    ? sortedAssets.filter(asset =>
                                                        asset.key.toLowerCase().includes(assetSearchQuery.toLowerCase())
                                                    )
                                                    : sortedAssets;

                                                if (filteredAssets.length === 0) {
                                                    return (
                                                        <div className="text-center py-6 text-zinc-500">
                                                            <p>Geen resultaten voor "{assetSearchQuery}"</p>
                                                        </div>
                                                    );
                                                }

                                                return (
                                                    <div className="grid grid-cols-4 gap-4 max-h-[500px] overflow-y-auto p-1">
                                                        {filteredAssets.map((asset, i) => {
                                                            // Extract brand and device name from key
                                                            const parts = asset.key.split('/');
                                                            const brand = parts.length > 1 ? parts[1] : '';
                                                            const deviceName = parts.length > 2 ? parts[2] : parts[parts.length - 1].replace(/\.[^.]+$/, '');

                                                            return (
                                                                <button
                                                                    key={i}
                                                                    onClick={() => toggleAssetSelection(asset.url)}
                                                                    className={`flex flex-col bg-white rounded-xl border-2 transition-all hover:shadow-md overflow-hidden ${selectedAssets.includes(asset.url)
                                                                        ? "border-green-500 ring-2 ring-green-200 shadow-md"
                                                                        : "border-zinc-200 hover:border-zinc-300"
                                                                        }`}
                                                                >
                                                                    {/* Image */}
                                                                    <div className="relative aspect-square bg-zinc-50">
                                                                        <img
                                                                            src={asset.url}
                                                                            alt={deviceName}
                                                                            className="w-full h-full object-contain p-2"
                                                                            onError={(e) => {
                                                                                (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' fill='%23e5e7eb'%3E%3Crect width='100' height='100'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='10'%3EError%3C/text%3E%3C/svg%3E";
                                                                            }}
                                                                        />
                                                                        {selectedAssets.includes(asset.url) && (
                                                                            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                                                                <Check className="w-3 h-3" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {/* Device Info */}
                                                                    <div className="p-2 border-t border-zinc-100 text-left">
                                                                        <p className="text-xs font-medium text-zinc-900 truncate">{deviceName}</p>
                                                                        <p className="text-[10px] text-zinc-500">{brand}</p>
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                );
                                            })()}
                                        </>
                                    )}
                                </>
                            )}

                            <p className="text-xs text-zinc-500 mt-3">
                                � 199 toestelafbeeldingen (Apple iPhones/iPads, Samsung Galaxy)
                            </p>
                        </div>
                    </div>

                    {/* Sidebar - Right column */}
                    <div className="space-y-6">
                        {/* Phone-specific fields */}
                        {productType === "PHONE" && (
                            <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Battery className="w-5 h-5" />
                                    Toestel Details
                                </h2>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                                            Batterij Gezondheid (%)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={batteryHealth}
                                            onChange={(e) => setBatteryHealth(e.target.value)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                                        />
                                        <p className="text-xs text-zinc-500 mt-1">Typisch 80-100% voor refurbished</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-zinc-700 mb-1">
                                            Graad
                                        </label>
                                        <select
                                            value={deviceGrade}
                                            onChange={(e) => setDeviceGrade(e.target.value as DeviceGrade)}
                                            className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                                        >
                                            {DEVICE_GRADES.map((g) => (
                                                <option key={g.value} value={g.value}>
                                                    {g.label} - {g.description}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Pricing */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">💰 Prijs</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Prijs (€) *
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        placeholder="0.00"
                                        className={`w-full px-3 py-2 border rounded-lg ${!price ? "border-orange-300 bg-orange-50" : "border-zinc-300"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Vergelijkingsprijs (€)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={compareAtPrice}
                                        onChange={(e) => setCompareAtPrice(e.target.value)}
                                        placeholder="Originele prijs"
                                        className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                                    />
                                    <p className="text-xs text-zinc-500 mt-1">Voor kortingsweergave</p>
                                </div>

                                {/* Discount preview */}
                                {price && compareAtPrice && parseFloat(compareAtPrice) > parseFloat(price) && (
                                    <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                                        <strong>Korting:</strong> €{(parseFloat(compareAtPrice) - parseFloat(price)).toFixed(2)}
                                        ({Math.round((1 - parseFloat(price) / parseFloat(compareAtPrice)) * 100)}% off)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Stock */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">📦 Voorraad</h2>
                            <input
                                type="number"
                                min="0"
                                value={stockQty}
                                onChange={(e) => setStockQty(e.target.value)}
                                className="w-full px-3 py-2 border border-zinc-300 rounded-lg"
                            />
                        </div>

                        {/* Options */}
                        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
                            <h2 className="text-lg font-semibold mb-4">⚙️ Opties</h2>
                            <div className="space-y-3">
                                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${isFeatured ? "border-yellow-400 bg-yellow-50" : "border-zinc-200"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={isFeatured}
                                        onChange={(e) => setIsFeatured(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <div>
                                        <span className="font-medium text-sm">⭐ Uitgelicht</span>
                                        <p className="text-xs text-zinc-500">Tonen op homepage</p>
                                    </div>
                                </label>
                                <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer ${isActive ? "border-green-400 bg-green-50" : "border-zinc-200"
                                    }`}>
                                    <input
                                        type="checkbox"
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        className="w-4 h-4"
                                    />
                                    <div>
                                        <span className="font-medium text-sm">✓ Actief</span>
                                        <p className="text-xs text-zinc-500">Zichtbaar in winkel</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
