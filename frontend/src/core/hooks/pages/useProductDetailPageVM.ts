/**
 * @core-only
 * 
 * Product Detail Page View Model
 * 
 * Handles all data fetching and state for the product detail page.
 * Provides actions like addToCart that the skin can call.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { api, Product } from '@/lib/api';
import { useCartStore } from '@/lib/store';
import { getImageUrl } from '@/lib/image-utils';

// Grade labels for refurbished devices
const GRADE_LABELS: Record<string, { label: string; description: string; color: string }> = {
    A_PLUS: { label: "A+", description: "Like new", color: "text-green-600" },
    A: { label: "A", description: "Excellent", color: "text-green-600" },
    B: { label: "B", description: "Good", color: "text-yellow-600" },
    C: { label: "C", description: "Fair", color: "text-orange-600" },
};

export interface ProductImage {
    id: string;
    url: string;
    resolvedUrl: string;
}

export interface ProductDetailVM {
    // Loading states
    isLoading: boolean;
    notFound: boolean;

    // Product data (pre-processed for display)
    product: {
        id: string;
        name: string;
        slug: string;
        price: number;
        compareAtPrice: number | null;
        condition: string;
        brand: string | null;
        stockQty: number;
        shortDescription: string | null;
        description: string | null;
        images: ProductImage[];
        category: { slug: string; name: string } | null;

        // Refurbished device specs
        isRefurbished: boolean;
        hasDeviceSpecs: boolean;
        batteryHealth: number | null;
        storage: string | null;
        color: string | null;
        gradeInfo: { label: string; description: string; color: string } | null;
    } | null;

    // UI state
    selectedImage: number;
    setSelectedImage: (idx: number) => void;
    quantity: number;
    setQuantity: (qty: number) => void;
    addedToCart: boolean;

    // Actions
    onAddToCart: () => void;

    // Navigation helpers
    backLink: string;
    backLabel: string;
}

export function useProductDetailPageVM(): ProductDetailVM {
    const params = useParams();
    // Support both /products/[id] and /phones/[slug] routes
    const productId = (params?.id || params?.slug) as string;

    // Data state
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // UI state
    const [selectedImage, setSelectedImage] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [addedToCart, setAddedToCart] = useState(false);

    // Cart store
    const addItem = useCartStore((state) => state.addItem);

    // Load product
    useEffect(() => {
        const loadProduct = async () => {
            if (!productId) return;

            try {
                setIsLoading(true);
                const data = await api.getProduct(productId);
                setProduct(data);
            } catch (error) {
                console.error("Failed to load product:", error);
                setProduct(null);
            } finally {
                setIsLoading(false);
            }
        };

        loadProduct();
    }, [productId]);

    // Add to cart handler
    const onAddToCart = useCallback(() => {
        if (!product) return;

        addItem({
            id: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0]?.url,
            slug: product.slug,
        }, quantity);

        setAddedToCart(true);
        setTimeout(() => setAddedToCart(false), 2000);
    }, [product, quantity, addItem]);

    // Quantity setter with bounds
    const handleSetQuantity = useCallback((qty: number) => {
        if (!product) return;
        const bounded = Math.max(1, Math.min(product.stockQty, qty));
        setQuantity(bounded);
    }, [product]);

    // Process product for display
    const processedProduct = product ? (() => {
        const isRefurbished = product.condition === "REFURBISHED" || product.condition === "USED";
        const hasDeviceSpecs = Boolean(isRefurbished && (
            product.batteryHealth || product.storage || product.color || product.deviceGrade
        ));
        const gradeInfo = product.deviceGrade ? GRADE_LABELS[product.deviceGrade] || null : null;

        return {
            id: product.id,
            name: product.name,
            slug: product.slug,
            price: Number(product.price),
            compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
            condition: product.condition,
            brand: product.brand || null,
            stockQty: product.stockQty,
            shortDescription: product.shortDescription || null,
            description: product.description || null,
            images: (product.images || []).map(img => ({
                id: img.id,
                url: img.url,
                resolvedUrl: getImageUrl(img.url),
            })),
            category: product.category ? {
                slug: product.category.slug,
                name: product.category.name,
            } : null,
            isRefurbished,
            hasDeviceSpecs,
            batteryHealth: product.batteryHealth || null,
            storage: product.storage || null,
            color: product.color || null,
            gradeInfo,
        };
    })() : null;

    return {
        isLoading,
        notFound: !isLoading && !product,
        product: processedProduct,
        selectedImage,
        setSelectedImage,
        quantity,
        setQuantity: handleSetQuantity,
        addedToCart,
        onAddToCart,
        backLink: product?.category?.slug ? `/${product.category.slug}` : '/phones',
        backLabel: product?.category?.name || 'Products',
    };
}
