/**
 * Product AI Creation Hook
 * 
 * Complete business logic for AI-assisted product creation.
 * Handles multi-step wizard flow, AI content generation, image analysis,
 * manual/suggested images, and product submission.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api, Category } from '@/lib/api';

// ============================================
// TYPES
// ============================================

export type ProductType = 'PHONE' | 'ACCESSORY' | 'OTHER';
export type Condition = 'NEW' | 'USED' | 'REFURBISHED';
export type DeviceGrade = 'A_PLUS' | 'A' | 'B' | 'C' | 'D';
export type WizardStep = 'input' | 'review' | 'save';

export interface ProductContent {
    title: string;
    shortDescription: string;
    longDescription: string;
    seoKeywords: string[];
    suggestedImages: { url: string; alt: string }[];
}

export interface ImageAnalysis {
    detectedColor: string;
    conditionAssessment: string;
    detectedStorage?: string;
    detectedModel?: string;
    confidence: number;
    notes?: string;
}

// ============================================
// CONSTANTS
// ============================================

export const BRANDS = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Motorola', 'Other'
];

export const CONDITIONS = [
    { value: 'NEW' as const, label: 'New' },
    { value: 'REFURBISHED' as const, label: 'Refurbished' },
    { value: 'USED' as const, label: 'Used' },
];

export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export const PRODUCT_TYPES = [
    { value: 'PHONE' as const, label: 'Phone / Device', description: 'Smartphones, tablets, smartwatches' },
    { value: 'ACCESSORY' as const, label: 'Accessory', description: 'Cases, chargers, screen protectors, cables' },
    { value: 'OTHER' as const, label: 'Other', description: 'Parts, tools, other products' },
];

export const DEVICE_GRADES = [
    { value: 'A_PLUS' as const, label: 'A+ (Like New)' },
    { value: 'A' as const, label: 'A (Excellent)' },
    { value: 'B' as const, label: 'B (Good)' },
    { value: 'C' as const, label: 'C (Fair)' },
    { value: 'D' as const, label: 'D (Acceptable)' },
];

export const PLACEHOLDER_IMAGE = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' fill='%23e5e7eb'%3E%3Crect width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af' font-size='14'%3ENo Image%3C/text%3E%3C/svg%3E";

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateSlug(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// ============================================
// HOOK INTERFACE
// ============================================

export interface UseProductAIReturn {
    // Step control
    step: WizardStep;
    setStep: (s: WizardStep) => void;

    // Categories
    categories: Category[];
    selectedCategory: string;
    setSelectedCategory: (c: string) => void;

    // Product type
    productType: ProductType;
    setProductType: (t: ProductType) => void;

    // Input fields
    modelName: string;
    setModelName: (m: string) => void;
    brand: string;
    setBrand: (b: string) => void;
    condition: Condition;
    setCondition: (c: Condition) => void;
    inputStorage: string;
    setInputStorage: (s: string) => void;
    inputColor: string;
    setInputColor: (c: string) => void;

    // Device image for analysis
    deviceImage: File | null;
    deviceImagePreview: string | null;
    handleDeviceImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeDeviceImage: () => void;

    // AI state
    generatedContent: ProductContent | null;
    imageAnalysis: ImageAnalysis | null;
    isGenerating: boolean;
    isAnalyzing: boolean;

    // Editable fields (review step)
    editableTitle: string;
    setEditableTitle: (t: string) => void;
    editableShortDesc: string;
    setEditableShortDesc: (d: string) => void;
    editableLongDesc: string;
    setEditableLongDesc: (d: string) => void;
    editableColor: string;
    setEditableColor: (c: string) => void;
    editableStorage: string;
    setEditableStorage: (s: string) => void;
    batteryHealth: string;
    setBatteryHealth: (b: string) => void;
    deviceGrade: DeviceGrade;
    setDeviceGrade: (g: DeviceGrade) => void;

    // Pricing
    price: string;
    setPrice: (p: string) => void;
    comparePrice: string;
    setComparePrice: (p: string) => void;
    stockQty: string;
    setStockQty: (q: string) => void;

    // Options
    isFeatured: boolean;
    setIsFeatured: (f: boolean) => void;
    isOnSale: boolean;
    setIsOnSale: (s: boolean) => void;

    // AI suggested images
    selectedImages: string[];
    toggleImageSelection: (url: string) => void;

    // Manual images
    manualImages: File[];
    manualImagePreviews: string[];
    handleManualImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeManualImage: (index: number) => void;
    includeDeviceImage: boolean;
    setIncludeDeviceImage: (include: boolean) => void;

    // Image summary
    totalSelectedImages: number;

    // Actions
    handleGenerate: () => Promise<void>;
    handleSave: () => Promise<void>;

    // UI state
    isSaving: boolean;
    error: string | null;
    setError: (e: string | null) => void;

    // Computed
    discountPreview: { amount: number; percent: number } | null;
    isValid: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useProductAI(): UseProductAIReturn {
    const router = useRouter();

    // Step
    const [step, setStep] = useState<WizardStep>('input');

    // Categories
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('');

    // Product type
    const [productType, setProductType] = useState<ProductType>('PHONE');

    // Input fields
    const [modelName, setModelName] = useState('');
    const [brand, setBrand] = useState('Apple');
    const [condition, setCondition] = useState<Condition>('REFURBISHED');
    const [inputStorage, setInputStorage] = useState('');
    const [inputColor, setInputColor] = useState('');

    // Device image
    const [deviceImage, setDeviceImage] = useState<File | null>(null);
    const [deviceImagePreview, setDeviceImagePreview] = useState<string | null>(null);

    // AI state
    const [generatedContent, setGeneratedContent] = useState<ProductContent | null>(null);
    const [imageAnalysis, setImageAnalysis] = useState<ImageAnalysis | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Editable fields
    const [editableTitle, setEditableTitle] = useState('');
    const [editableShortDesc, setEditableShortDesc] = useState('');
    const [editableLongDesc, setEditableLongDesc] = useState('');
    const [editableColor, setEditableColor] = useState('');
    const [editableStorage, setEditableStorage] = useState('');
    const [batteryHealth, setBatteryHealth] = useState('100');
    const [deviceGrade, setDeviceGrade] = useState<DeviceGrade>('A');

    // Pricing
    const [price, setPrice] = useState('');
    const [comparePrice, setComparePrice] = useState('');
    const [stockQty, setStockQty] = useState('1');

    // Options
    const [isFeatured, setIsFeatured] = useState(false);
    const [isOnSale, setIsOnSale] = useState(false);

    // Images
    const [selectedImages, setSelectedImages] = useState<string[]>([]);
    const [manualImages, setManualImages] = useState<File[]>([]);
    const [manualImagePreviews, setManualImagePreviews] = useState<string[]>([]);
    const [includeDeviceImage, setIncludeDeviceImage] = useState(true);

    // UI state
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load categories on mount
    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const cats = await api.getCategories();
            setCategories(cats);
            const phonesCat = cats.find((c: Category) => c.slug === 'phones');
            if (phonesCat) setSelectedCategory(phonesCat.id);
        } catch (err) {
            console.error('Failed to load categories:', err);
        }
    };

    // Handle product type change - auto-select category
    const handleSetProductType = useCallback((type: ProductType) => {
        setProductType(type);
        if (type === 'PHONE') {
            const phonesCat = categories.find(c => c.slug === 'phones');
            if (phonesCat) setSelectedCategory(phonesCat.id);
        } else if (type === 'ACCESSORY') {
            const accCat = categories.find(c => c.slug === 'accessories');
            if (accCat) setSelectedCategory(accCat.id);
        }
    }, [categories]);

    // Device image upload
    const handleDeviceImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setDeviceImage(file);
            setDeviceImagePreview(URL.createObjectURL(file));
        }
    }, []);

    const removeDeviceImage = useCallback(() => {
        setDeviceImage(null);
        setDeviceImagePreview(null);
    }, []);

    // Manual image upload
    const handleManualImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            setManualImages(prev => [...prev, ...files]);
            setManualImagePreviews(prev => [...prev, ...files.map(f => URL.createObjectURL(f))]);
        }
    }, []);

    const removeManualImage = useCallback((index: number) => {
        setManualImages(prev => prev.filter((_, i) => i !== index));
        setManualImagePreviews(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Toggle image selection
    const toggleImageSelection = useCallback((url: string) => {
        setSelectedImages(prev =>
            prev.includes(url) ? prev.filter(u => u !== url) : [...prev, url]
        );
    }, []);

    // Analyze device image
    const analyzeImage = useCallback(async () => {
        if (!deviceImage) return;

        setIsAnalyzing(true);
        try {
            const formData = new FormData();
            formData.append('file', deviceImage);
            formData.append('modelHint', `${brand} ${modelName}`);

            const response = await fetch('/api/gemini/analyze', {
                method: 'POST',
                headers: { Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}` },
                body: formData,
            });

            if (response.ok) {
                const analysis: ImageAnalysis = await response.json();
                setImageAnalysis(analysis);
                if (!editableColor && analysis.detectedColor) setEditableColor(analysis.detectedColor);
                if (!editableStorage && analysis.detectedStorage) setEditableStorage(analysis.detectedStorage);
            }
        } catch (err) {
            console.error('Image analysis failed:', err);
        } finally {
            setIsAnalyzing(false);
        }
    }, [deviceImage, brand, modelName, editableColor, editableStorage]);

    // Generate AI content
    const handleGenerate = useCallback(async () => {
        if (!modelName.trim()) {
            setError('Please enter the device model name');
            return;
        }

        setIsGenerating(true);
        setError(null);

        try {
            const fullModelName = inputStorage ? `${modelName} ${inputStorage}` : modelName;

            const response = await fetch('/api/gemini/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('adminAccessToken')}`,
                },
                body: JSON.stringify({ modelName: fullModelName, brand, condition }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to generate content');
            }

            const content: ProductContent = await response.json();
            setGeneratedContent(content);

            // Populate editable fields
            setEditableTitle(content.title);
            setEditableShortDesc(content.shortDescription);
            setEditableLongDesc(content.longDescription);
            setEditableStorage(inputStorage);
            setEditableColor(inputColor);

            // Analyze image if uploaded
            if (deviceImage) {
                await analyzeImage();
            }

            setStep('review');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to generate content');
        } finally {
            setIsGenerating(false);
        }
    }, [modelName, inputStorage, inputColor, brand, condition, deviceImage, analyzeImage]);

    // Save product
    const handleSave = useCallback(async () => {
        if (!editableTitle || !price) {
            setError('Title and price are required');
            return;
        }

        const priceValue = parseFloat(price);
        if (isNaN(priceValue) || priceValue < 0) {
            setError('Price must be a valid number and cannot be negative');
            return;
        }

        const comparePriceValue = comparePrice ? parseFloat(comparePrice) : undefined;
        if (comparePriceValue !== undefined && (isNaN(comparePriceValue) || comparePriceValue < 0)) {
            setError('Compare price must be a valid number');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            let imageUrls: string[] = [...selectedImages];

            // Upload device image if included
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
            const conditionPart = condition !== 'NEW' ? `-${condition.toLowerCase()}` : '';
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
                deviceGrade: productType === 'PHONE' ? deviceGrade : undefined,
                imageUrls,
            });

            router.push('/admin/products');
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save product');
        } finally {
            setIsSaving(false);
        }
    }, [
        editableTitle, editableShortDesc, editableLongDesc, editableStorage, editableColor,
        price, comparePrice, stockQty, condition, brand, selectedCategory, isFeatured,
        productType, batteryHealth, deviceGrade, modelName,
        selectedImages, deviceImage, includeDeviceImage, manualImages, router
    ]);

    // Computed: discount preview
    const discountPreview = useMemo(() => {
        if (!price || !comparePrice) return null;
        const priceNum = parseFloat(price);
        const compareNum = parseFloat(comparePrice);
        if (compareNum <= priceNum) return null;
        return {
            amount: compareNum - priceNum,
            percent: Math.round((1 - priceNum / compareNum) * 100),
        };
    }, [price, comparePrice]);

    // Computed: total selected images
    const totalSelectedImages = useMemo(() => {
        return selectedImages.length + manualImages.length + (deviceImage && includeDeviceImage ? 1 : 0);
    }, [selectedImages.length, manualImages.length, deviceImage, includeDeviceImage]);

    // Validation
    const isValid = editableTitle.trim().length > 0 && parseFloat(price) > 0;

    return {
        step, setStep,
        categories, selectedCategory, setSelectedCategory,
        productType, setProductType: handleSetProductType,
        modelName, setModelName,
        brand, setBrand,
        condition, setCondition,
        inputStorage, setInputStorage,
        inputColor, setInputColor,
        deviceImage, deviceImagePreview,
        handleDeviceImageUpload, removeDeviceImage,
        generatedContent, imageAnalysis,
        isGenerating, isAnalyzing,
        editableTitle, setEditableTitle,
        editableShortDesc, setEditableShortDesc,
        editableLongDesc, setEditableLongDesc,
        editableColor, setEditableColor,
        editableStorage, setEditableStorage,
        batteryHealth, setBatteryHealth,
        deviceGrade, setDeviceGrade,
        price, setPrice,
        comparePrice, setComparePrice,
        stockQty, setStockQty,
        isFeatured, setIsFeatured,
        isOnSale, setIsOnSale,
        selectedImages, toggleImageSelection,
        manualImages, manualImagePreviews,
        handleManualImageUpload, removeManualImage,
        includeDeviceImage, setIncludeDeviceImage,
        totalSelectedImages,
        handleGenerate, handleSave,
        isSaving, error, setError,
        discountPreview, isValid,
    };
}
