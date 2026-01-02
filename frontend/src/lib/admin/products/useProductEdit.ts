/**
 * Product Edit Admin Hook
 * 
 * Complete business logic for product edit page.
 * Handles form data, image management, device specs, clone, delete.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api, Product, Category } from '@/lib/api';

// Types
export type Condition = 'NEW' | 'USED' | 'REFURBISHED';
export type DeviceGrade = 'A_PLUS' | 'A' | 'B' | 'C' | '';

export interface ExistingImage {
    id: string;
    url: string;
    isPrimary: boolean;
}

export interface NewImage {
    file: File;
    preview: string;
}

export interface ProductFormData {
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
    // Device specs (for refurbished/used)
    productType: string;
    storage: string;
    color: string;
    batteryHealth: number;
    deviceGrade: DeviceGrade;
}

// Constants
export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];
export const COLOR_OPTIONS = ['Space Black', 'White Titanium', 'Blue Titanium', 'Desert Titanium', 'Gold', 'Silver', 'Midnight', 'Purple', 'Red'];
export const GRADE_OPTIONS = [
    { value: 'A_PLUS', label: 'A+' },
    { value: 'A', label: 'A' },
    { value: 'B', label: 'B' },
    { value: 'C', label: 'C' },
];

const DEFAULT_FORM: ProductFormData = {
    name: '', slug: '', description: '', shortDescription: '',
    price: '', compareAtPrice: '', stockQty: '0',
    condition: 'NEW', brand: '', categoryId: '',
    isFeatured: false, isActive: true,
    productType: 'PHONE', storage: '', color: '',
    batteryHealth: 100, deviceGrade: '',
};

export interface UseProductEditReturn {
    // Data
    product: Product | null;
    categories: Category[];
    formData: ProductFormData;
    setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;

    // Images
    existingImages: ExistingImage[];
    newImages: NewImage[];
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // Loading states
    isLoading: boolean;
    isSaving: boolean;
    isDeleting: boolean;
    isCloning: boolean;
    isUploading: boolean;

    // Messages
    error: string | null;
    success: string | null;

    // Computed
    showDeviceSpecs: boolean;

    // Actions - Form
    handleNameChange: (name: string) => void;
    regenerateSlug: () => void;
    updateField: <K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => void;

    // Actions - Images
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    removeNewImage: (index: number) => void;
    removeExistingImage: (index: number) => void;
    triggerFileInput: () => void;

    // Actions - CRUD
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleClone: () => Promise<void>;
    handleDelete: () => Promise<void>;

    // Helpers
    generateSlug: (name: string) => string;
}

export function useProductEdit(): UseProductEditReturn {
    const router = useRouter();
    const params = useParams();
    const productId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Core state
    const [product, setProduct] = useState<Product | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [formData, setFormData] = useState<ProductFormData>(DEFAULT_FORM);

    // Image state
    const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
    const [newImages, setNewImages] = useState<NewImage[]>([]);

    // Loading states
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Messages
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Computed
    const showDeviceSpecs = formData.condition !== 'NEW';

    // Load product and categories
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

                // Populate form
                setFormData({
                    name: prod.name,
                    slug: prod.slug,
                    description: prod.description || '',
                    shortDescription: prod.shortDescription || '',
                    price: String(prod.price),
                    compareAtPrice: prod.compareAtPrice ? String(prod.compareAtPrice) : '',
                    stockQty: String(prod.stockQty),
                    condition: prod.condition,
                    brand: prod.brand || '',
                    categoryId: prod.categoryId || '',
                    isFeatured: prod.isFeatured,
                    isActive: prod.isActive,
                    productType: prod.productType || 'PHONE',
                    storage: prod.storage || '',
                    color: prod.color || '',
                    batteryHealth: prod.batteryHealth || 100,
                    deviceGrade: (prod.deviceGrade as DeviceGrade) || '',
                });
            } catch (err) {
                console.error('Failed to load product:', err);
                setError('Failed to load product');
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, [productId]);

    // Slug generation
    const generateSlug = useCallback((name: string): string => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    }, []);

    const handleNameChange = useCallback((name: string) => {
        setFormData(prev => ({
            ...prev,
            name,
            slug: generateSlug(name),
        }));
    }, [generateSlug]);

    const regenerateSlug = useCallback(() => {
        setFormData(prev => ({ ...prev, slug: generateSlug(prev.name) }));
    }, [generateSlug]);

    const updateField = useCallback(<K extends keyof ProductFormData>(key: K, value: ProductFormData[K]) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    }, []);

    // Image handling
    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        const newPreviews = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
        }));
        setNewImages(prev => [...prev, ...newPreviews]);
    }, []);

    const removeNewImage = useCallback((index: number) => {
        setNewImages(prev => {
            const updated = [...prev];
            URL.revokeObjectURL(updated[index].preview);
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const removeExistingImage = useCallback((index: number) => {
        setExistingImages(prev => {
            const updated = [...prev];
            updated.splice(index, 1);
            return updated;
        });
    }, []);

    const triggerFileInput = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    // Submit handler
    const handleSubmit = useCallback(async (e: React.FormEvent) => {
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
                // Device specs (only for used/refurbished)
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

            setSuccess('Product saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to update product';
            setError(message);
        } finally {
            setIsSaving(false);
            setIsUploading(false);
        }
    }, [formData, newImages, showDeviceSpecs, productId]);

    // Clone handler
    const handleClone = useCallback(async () => {
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

            router.push('/admin/products');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to clone product';
            setError(message);
            setIsCloning(false);
        }
    }, [formData, router]);

    // Delete handler
    const handleDelete = useCallback(async () => {
        if (!confirm(`Are you sure you want to delete "${formData.name}"? This cannot be undone.`)) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.deleteProduct(productId);
            router.push('/admin/products');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to delete product';
            setError(message);
            setIsDeleting(false);
        }
    }, [formData.name, productId, router]);

    return {
        product,
        categories,
        formData,
        setFormData,
        existingImages,
        newImages,
        fileInputRef,
        isLoading,
        isSaving,
        isDeleting,
        isCloning,
        isUploading,
        error,
        success,
        showDeviceSpecs,
        handleNameChange,
        regenerateSlug,
        updateField,
        handleFileSelect,
        removeNewImage,
        removeExistingImage,
        triggerFileInput,
        handleSubmit,
        handleClone,
        handleDelete,
        generateSlug,
    };
}
