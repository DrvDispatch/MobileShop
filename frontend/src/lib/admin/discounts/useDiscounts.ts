/**
 * Discounts Admin Hook
 * 
 * Business logic for admin discounts/coupon codes page.
 * Handles CRUD operations, form state, and utility functions.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface DiscountCode {
    id: string;
    code: string;
    description: string | null;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderAmount: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    usageCount: number;
    perUserLimit: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    appliesToAll: boolean;
    productIds: string[];
    categoryIds: string[];
    createdAt: string;
    _count?: { orders: number };
}

export interface DiscountFormData {
    code: string;
    description: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderAmount: string;
    maxDiscount: string;
    usageLimit: string;
    perUserLimit: string;
    startsAt: string;
    expiresAt: string;
    isActive: boolean;
    appliesToAll: boolean;
}

export const DEFAULT_DISCOUNT_FORM: DiscountFormData = {
    code: '',
    description: '',
    type: 'PERCENTAGE',
    value: 10,
    minOrderAmount: '',
    maxDiscount: '',
    usageLimit: '',
    perUserLimit: '',
    startsAt: '',
    expiresAt: '',
    isActive: true,
    appliesToAll: true,
};

export interface UseDiscountsReturn {
    // Data
    discounts: DiscountCode[];
    activeDiscounts: DiscountCode[];
    expiredDiscounts: DiscountCode[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;

    // Modal state
    showModal: boolean;
    editingId: string | null;
    formData: DiscountFormData;

    // Actions
    refresh: () => Promise<void>;
    openCreateModal: () => void;
    openEditModal: (discount: DiscountCode) => void;
    closeModal: () => void;
    setFormData: React.Dispatch<React.SetStateAction<DiscountFormData>>;
    updateFormField: <K extends keyof DiscountFormData>(field: K, value: DiscountFormData[K]) => void;
    handleSubmit: () => Promise<boolean>;
    handleDelete: (id: string) => Promise<boolean>;
    handleToggleActive: (discount: DiscountCode) => Promise<boolean>;
    copyCode: (code: string) => void;

    // Helpers
    isExpired: (discount: DiscountCode) => boolean;
    isLimitReached: (discount: DiscountCode) => boolean;
    formatDiscount: (discount: DiscountCode) => string;
    getUsagePercentage: (discount: DiscountCode) => number;
}

export function useDiscounts(): UseDiscountsReturn {
    // Data state
    const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<DiscountFormData>(DEFAULT_DISCOUNT_FORM);

    // Fetch discounts
    const fetchDiscounts = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<DiscountCode[]>('/api/discounts');
            setDiscounts(data);
        } catch (err) {
            console.error('Failed to fetch discounts:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchDiscounts();
    }, [fetchDiscounts]);

    // Helper: Check if expired
    const isExpired = useCallback((discount: DiscountCode): boolean => {
        if (!discount.expiresAt) return false;
        return new Date(discount.expiresAt) < new Date();
    }, []);

    // Helper: Check if usage limit reached
    const isLimitReached = useCallback((discount: DiscountCode): boolean => {
        if (!discount.usageLimit) return false;
        return discount.usageCount >= discount.usageLimit;
    }, []);

    // Derived data
    const activeDiscounts = useMemo(() =>
        discounts.filter(d => d.isActive && !isExpired(d) && !isLimitReached(d))
        , [discounts, isExpired, isLimitReached]);

    const expiredDiscounts = useMemo(() =>
        discounts.filter(d => isExpired(d) || isLimitReached(d) || !d.isActive)
        , [discounts, isExpired, isLimitReached]);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData(DEFAULT_DISCOUNT_FORM);
        setEditingId(null);
    }, []);

    // Open create modal
    const openCreateModal = useCallback(() => {
        resetForm();
        setShowModal(true);
    }, [resetForm]);

    // Open edit modal
    const openEditModal = useCallback((discount: DiscountCode) => {
        setFormData({
            code: discount.code,
            description: discount.description || '',
            type: discount.type,
            value: Number(discount.value),
            minOrderAmount: discount.minOrderAmount ? String(discount.minOrderAmount) : '',
            maxDiscount: discount.maxDiscount ? String(discount.maxDiscount) : '',
            usageLimit: discount.usageLimit ? String(discount.usageLimit) : '',
            perUserLimit: discount.perUserLimit ? String(discount.perUserLimit) : '',
            startsAt: discount.startsAt ? discount.startsAt.slice(0, 16) : '',
            expiresAt: discount.expiresAt ? discount.expiresAt.slice(0, 16) : '',
            isActive: discount.isActive,
            appliesToAll: discount.appliesToAll,
        });
        setEditingId(discount.id);
        setShowModal(true);
    }, []);

    // Close modal
    const closeModal = useCallback(() => {
        setShowModal(false);
        resetForm();
    }, [resetForm]);

    // Update form field
    const updateFormField = useCallback(<K extends keyof DiscountFormData>(
        field: K,
        value: DiscountFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Submit form
    const handleSubmit = useCallback(async (): Promise<boolean> => {
        if (!formData.code.trim()) {
            alert('Voer een kortingscode in');
            return false;
        }

        setIsSaving(true);
        try {
            const body = {
                code: formData.code.toUpperCase(),
                description: formData.description || null,
                type: formData.type,
                value: formData.value,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
                isActive: formData.isActive,
                appliesToAll: formData.appliesToAll,
            };

            const url = editingId ? `/api/discounts/${editingId}` : '/api/discounts';
            const method = editingId ? 'PATCH' : 'POST';

            await adminFetch(url, {
                method,
                body: JSON.stringify(body),
            });

            setShowModal(false);
            resetForm();
            await fetchDiscounts();
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Opslaan mislukt';
            alert(message);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingId, resetForm, fetchDiscounts]);

    // Delete discount
    const handleDelete = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Weet je zeker dat je deze kortingscode wilt verwijderen?')) {
            return false;
        }

        try {
            await adminFetch(`/api/discounts/${id}`, { method: 'DELETE' });
            await fetchDiscounts();
            return true;
        } catch (err) {
            console.error('Failed to delete discount:', err);
            return false;
        }
    }, [fetchDiscounts]);

    // Toggle active
    const handleToggleActive = useCallback(async (discount: DiscountCode): Promise<boolean> => {
        try {
            await adminFetch(`/api/discounts/${discount.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !discount.isActive }),
            });
            await fetchDiscounts();
            return true;
        } catch (err) {
            console.error('Failed to toggle discount:', err);
            return false;
        }
    }, [fetchDiscounts]);

    // Copy code to clipboard
    const copyCode = useCallback((code: string) => {
        navigator.clipboard.writeText(code);
    }, []);

    // Format discount value
    const formatDiscount = useCallback((discount: DiscountCode): string => {
        if (discount.type === 'PERCENTAGE') {
            return `${discount.value}%`;
        }
        return `€${Number(discount.value).toFixed(2)}`;
    }, []);

    // Get usage percentage
    const getUsagePercentage = useCallback((discount: DiscountCode): number => {
        if (!discount.usageLimit) return 0;
        return Math.min(100, (discount.usageCount / discount.usageLimit) * 100);
    }, []);

    return {
        // Data
        discounts,
        activeDiscounts,
        expiredDiscounts,

        // Loading states
        isLoading,
        isSaving,

        // Modal state
        showModal,
        editingId,
        formData,

        // Actions
        refresh: fetchDiscounts,
        openCreateModal,
        openEditModal,
        closeModal,
        setFormData,
        updateFormField,
        handleSubmit,
        handleDelete,
        handleToggleActive,
        copyCode,

        // Helpers
        isExpired,
        isLimitReached,
        formatDiscount,
        getUsagePercentage,
    };
}
