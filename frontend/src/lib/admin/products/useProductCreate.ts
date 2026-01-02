/**
 * Product Create Admin Hook
 * 
 * Complete business logic for adding new products.
 * Handles form state, image upload, AI analysis, AI content generation,
 * asset library, and product submission.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, Category } from '@/lib/api';
import { adminFetch } from '@/lib/admin';

// ============================================
// TYPES
// ============================================

export type Condition = 'NEW' | 'REFURBISHED' | 'USED';
export type DeviceGrade = 'A_PLUS' | 'A' | 'B' | 'C' | 'D';
export type ProductType = 'PHONE' | 'ACCESSORY';

export interface ImageAnalysis {
    detectedColor: string;
    conditionAssessment: string;
    detectedStorage?: string;
    detectedModel?: string;
    confidence: number;
    notes?: string;
}

export interface ProductContent {
    title: string;
    shortDescription: string;
    longDescription: string;
    seoKeywords: string[];
    suggestedImages: { url: string; alt: string }[];
}

export interface Asset {
    url: string;
    key: string;
    lastModified?: string;
    size?: number;
}

// ============================================
// CONSTANTS
// ============================================

export const BRANDS = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Motorola', 'Other'
];

export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export const CONDITION_OPTIONS = [
    { value: 'NEW' as const, label: 'Nieuw', description: 'Factory sealed' },
    { value: 'REFURBISHED' as const, label: 'Refurbished', description: 'Professionally restored' },
    { value: 'USED' as const, label: 'Gebruikt', description: 'Pre-owned condition' },
];

export const DEVICE_GRADES = [
    { value: 'A_PLUS' as const, label: 'A+', description: 'Zoals nieuw' },
    { value: 'A' as const, label: 'A', description: 'Uitstekend' },
    { value: 'B' as const, label: 'B', description: 'Goed' },
    { value: 'C' as const, label: 'C', description: 'Redelijk' },
    { value: 'D' as const, label: 'D', description: 'Acceptabel' },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Asset sorting for library
export function sortAssets(assets: Asset[]): Asset[] {
    const getBrandScore = (key: string): number => {
        if (key.includes('/Apple/')) return 1000;
        if (key.includes('/Samsung/')) return 500;
        return 0;
    };

    const getModelTierScore = (key: string): number => {
        if (key.includes('Pro Max') || key.includes('Ultra')) return 300;
        if (key.includes('Pro') && !key.includes('Pro Max')) return 250;
        if (key.includes('Plus')) return 200;
        if (key.includes('Z Fold') || key.includes('Z Flip')) return 180;
        return 100;
    };

    const getModelNumber = (key: string): number => {
        const match = key.match(/(?:iPhone|iPad|Galaxy\s*[A-Z]?)[\s]*(\d+)/i);
        return match ? parseInt(match[1]) : 0;
    };

    return [...assets].sort((a, b) => {
        const brandDiff = getBrandScore(b.key) - getBrandScore(a.key);
        if (brandDiff !== 0) return brandDiff;
        const tierDiff = getModelTierScore(b.key) - getModelTierScore(a.key);
        if (tierDiff !== 0) return tierDiff;
        return getModelNumber(b.key) - getModelNumber(a.key);
    });
}

export function extractAssetInfo(key: string): { brand: string; deviceName: string } {
    const parts = key.split('/');
    const brand = parts.length > 1 ? parts[1] : '';
    const deviceName = parts.length > 2 ? parts[2] : parts[parts.length - 1].replace(/\.[^.]+$/, '');
    return { brand, deviceName };
}

// ============================================
// HOOK INTERFACE
// ============================================

export interface UseProductCreateReturn {
    // Categories
    categories: Category[];

    // Product Type
    productType: ProductType;
    setProductType: (t: ProductType) => void;

    // Basic Info
    brand: string;
    setBrand: (b: string) => void;
    modelName: string;
    setModelName: (m: string) => void;
    condition: Condition;
    setCondition: (c: Condition) => void;
    storage: string;
    setStorage: (s: string) => void;
    color: string;
    setColor: (c: string) => void;
    categoryId: string;
    setCategoryId: (c: string) => void;

    // Descriptions
    title: string;
    setTitle: (t: string) => void;
    shortDescription: string;
    setShortDescription: (d: string) => void;
    description: string;
    setDescription: (d: string) => void;

    // Phone-specific
    batteryHealth: string;
    setBatteryHealth: (b: string) => void;
    deviceGrade: DeviceGrade;
    setDeviceGrade: (g: DeviceGrade) => void;

    // Pricing
    price: string;
    setPrice: (p: string) => void;
    compareAtPrice: string;
    setCompareAtPrice: (p: string) => void;
    stockQty: string;
    setStockQty: (q: string) => void;

    // Options
    isFeatured: boolean;
    setIsFeatured: (f: boolean) => void;
    isActive: boolean;
    setIsActive: (a: boolean) => void;

    // Images (uploaded files)
    images: File[];
    imagePreviews: string[];
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeImage: (index: number) => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // AI Image Analysis
    imageAnalysis: ImageAnalysis | null;
    isAnalyzing: boolean;
    analyzeImage: (file: File) => Promise<void>;

    // AI Content Generation
    isGeneratingTitle: boolean;
    isGeneratingShort: boolean;
    isGeneratingLong: boolean;
    generateContent: (field: 'title' | 'short' | 'long') => Promise<void>;
    generateAllContent: () => Promise<void>;

    // AI Suggested Images
    suggestedImages: { url: string; alt: string }[];
    selectedSuggestedImages: string[];
    toggleSuggestedImage: (url: string) => void;

    // Asset Library
    existingAssets: Asset[];
    isLoadingAssets: boolean;
    showAssetLibrary: boolean;
    setShowAssetLibrary: (show: boolean) => void;
    selectedAssets: string[];
    toggleAssetSelection: (url: string) => void;
    assetSearchQuery: string;
    setAssetSearchQuery: (q: string) => void;
    filteredAssets: Asset[];

    // UI State
    showHelp: boolean;
    setShowHelp: (show: boolean) => void;

    // Submission
    isSaving: boolean;
    error: string | null;
    setError: (e: string | null) => void;
    success: boolean;
    handleSubmit: () => Promise<void>;

    // Validation
    isValid: boolean;

    // Computed
    discountPreview: { amount: number; percent: number } | null;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useProductCreate(): UseProductCreateReturn {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [productType, setProductType] = useState<ProductType>('PHONE');
    const [brand, setBrand] = useState('Apple');
    const [modelName, setModelName] = useState('');
    const [condition, setCondition] = useState<Condition>('REFURBISHED');
    const [storage, setStorage] = useState('');
    const [color, setColor] = useState('');
    const [categoryId, setCategoryId] = useState('');

    // Descriptions
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [description, setDescription] = useState('');

    // Phone-specific
    const [batteryHealth, setBatteryHealth] = useState('100');
    const [deviceGrade, setDeviceGrade] = useState<DeviceGrade>('A');

    // Pricing
    const [price, setPrice] = useState('');
    const [compareAtPrice, setCompareAtPrice] = useState('');
    const [stockQty, setStockQty] = useState('1');

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
    const [assetSearchQuery, setAssetSearchQuery] = useState('');

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

    // Load categories and assets on mount
    useEffect(() => {
        loadCategories();
        loadAssets();
    }, []);

    // Auto-select category based on product type
    useEffect(() => {
        if (categories.length > 0) {
            if (productType === 'PHONE') {
                const phonesCat = categories.find(c => c.slug === 'phones');
                if (phonesCat) setCategoryId(phonesCat.id);
            } else {
                const accCat = categories.find(c => c.slug === 'accessories');
                if (accCat) setCategoryId(accCat.id);
            }
        }
    }, [productType, categories]);

    const loadCategories = async () => {
        try {
            const cats = await api.getCategories();
            setCategories(cats);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    const loadAssets = async () => {
        setIsLoadingAssets(true);
        try {
            const response = await fetch('/api/upload/assets?folder=devices&limit=250', {
                headers: { Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}` },
            });
            if (response.ok) {
                const data = await response.json();
                setExistingAssets(data.assets || []);
            }
        } catch (err) {
            console.error('Failed to load assets:', err);
        } finally {
            setIsLoadingAssets(false);
        }
    };

    // Toggle asset selection
    const toggleAssetSelection = useCallback((url: string) => {
        setSelectedAssets(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    }, []);

    // Handle image upload
    const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setImages(prev => [...prev, ...files]);
            setImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);

            // Analyze first image with AI if it's the first upload
            if (images.length === 0 && files.length > 0) {
                analyzeImage(files[0]);
            }
        }
    }, [images.length]);

    const removeImage = useCallback((index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
        if (index === 0) {
            setImageAnalysis(null);
        }
    }, []);

    // AI: Analyze uploaded image
    const analyzeImage = useCallback(async (file: File) => {
        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('modelHint', `${brand} ${modelName}`);

            const response = await fetch('/api/gemini/analyze', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}` },
                body: formData,
            });

            if (response.ok) {
                const analysis: ImageAnalysis = await response.json();
                setImageAnalysis(analysis);
                if (analysis.detectedColor && !color) {
                    setColor(analysis.detectedColor);
                }
            }
        } catch (err) {
            console.error('Image analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [brand, modelName, color]);

    // AI: Generate content
    const generateContent = useCallback(async (field: 'title' | 'short' | 'long') => {
        if (!modelName.trim()) {
            setError('Vul eerst de modelnaam in voordat je AI-content genereert');
            return;
        }

        const setLoading = field === 'title' ? setIsGeneratingTitle :
            field === 'short' ? setIsGeneratingShort : setIsGeneratingLong;

        setLoading(true);
        setError(null);

        try {
            const fullModelName = storage ? `${modelName} ${storage}` : modelName;
            const response = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}`,
                },
                body: JSON.stringify({ modelName: fullModelName, brand, condition }),
            });

            if (!response.ok) throw new Error('Failed to generate content');

            const content: ProductContent = await response.json();

            if (field === 'title') setTitle(content.title);
            else if (field === 'short') setShortDescription(content.shortDescription);
            else setDescription(content.longDescription);

            if (content.suggestedImages?.length > 0) {
                setSuggestedImages(content.suggestedImages);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'AI generatie mislukt');
        } finally {
            setLoading(false);
        }
    }, [modelName, storage, brand, condition]);

    // Generate all content at once
    const generateAllContent = useCallback(async () => {
        if (!modelName.trim()) {
            setError('Vul eerst de modelnaam in');
            return;
        }

        setIsGeneratingTitle(true);
        setIsGeneratingShort(true);
        setIsGeneratingLong(true);
        setError(null);

        try {
            const fullModelName = storage ? `${modelName} ${storage}` : modelName;
            const response = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}`,
                },
                body: JSON.stringify({ modelName: fullModelName, brand, condition }),
            });

            if (!response.ok) throw new Error('Failed to generate content');

            const content: ProductContent = await response.json();
            setTitle(content.title);
            setShortDescription(content.shortDescription);
            setDescription(content.longDescription);

            if (content.suggestedImages?.length > 0) {
                setSuggestedImages(content.suggestedImages);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'AI generatie mislukt');
        } finally {
            setIsGeneratingTitle(false);
            setIsGeneratingShort(false);
            setIsGeneratingLong(false);
        }
    }, [modelName, storage, brand, condition]);

    // Toggle suggested image selection
    const toggleSuggestedImage = useCallback((url: string) => {
        setSelectedSuggestedImages(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    }, []);

    // Filtered and sorted assets
    const filteredAssets = useMemo(() => {
        const sorted = sortAssets(existingAssets);
        if (!assetSearchQuery.trim()) return sorted;
        return sorted.filter(asset =>
            asset.key.toLowerCase().includes(assetSearchQuery.toLowerCase())
        );
    }, [existingAssets, assetSearchQuery]);

    // Validation
    const isValid = title.trim().length > 0 && parseFloat(price) > 0;

    // Discount preview
    const discountPreview = useMemo(() => {
        if (!price || !compareAtPrice) return null;
        const priceNum = parseFloat(price);
        const compareNum = parseFloat(compareAtPrice);
        if (compareNum <= priceNum) return null;
        return {
            amount: compareNum - priceNum,
            percent: Math.round((1 - priceNum / compareNum) * 100),
        };
    }, [price, compareAtPrice]);

    // Save product
    const handleSubmit = useCallback(async () => {
        if (!title.trim()) {
            setError('Producttitel is verplicht');
            return;
        }
        if (!price || parseFloat(price) <= 0) {
            setError('Geldige prijs is verplicht');
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
            const conditionPart = condition !== 'NEW' ? `-${condition.toLowerCase()}` : '';
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
                batteryHealth: productType === 'PHONE' && batteryHealth ? parseInt(batteryHealth) : undefined,
                deviceGrade: productType === 'PHONE' ? deviceGrade : undefined,
                imageUrls,
            });

            setSuccess(true);
            setTimeout(() => router.push('/admin/products'), 1500);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Opslaan mislukt');
        } finally {
            setIsSaving(false);
        }
    }, [
        title, price, modelName, storage, color, condition, description, shortDescription,
        compareAtPrice, stockQty, brand, categoryId, isFeatured, isActive, productType,
        batteryHealth, deviceGrade, images, selectedSuggestedImages, selectedAssets, router
    ]);

    return {
        categories,
        productType, setProductType,
        brand, setBrand,
        modelName, setModelName,
        condition, setCondition,
        storage, setStorage,
        color, setColor,
        categoryId, setCategoryId,
        title, setTitle,
        shortDescription, setShortDescription,
        description, setDescription,
        batteryHealth, setBatteryHealth,
        deviceGrade, setDeviceGrade,
        price, setPrice,
        compareAtPrice, setCompareAtPrice,
        stockQty, setStockQty,
        isFeatured, setIsFeatured,
        isActive, setIsActive,
        images, imagePreviews,
        handleImageUpload, removeImage,
        fileInputRef,
        imageAnalysis, isAnalyzing, analyzeImage,
        isGeneratingTitle, isGeneratingShort, isGeneratingLong,
        generateContent, generateAllContent,
        suggestedImages, selectedSuggestedImages, toggleSuggestedImage,
        existingAssets, isLoadingAssets,
        showAssetLibrary, setShowAssetLibrary,
        selectedAssets, toggleAssetSelection,
        assetSearchQuery, setAssetSearchQuery,
        filteredAssets,
        showHelp, setShowHelp,
        isSaving, error, setError, success,
        handleSubmit,
        isValid,
        discountPreview,
    };
}
