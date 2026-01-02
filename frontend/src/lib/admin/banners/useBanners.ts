/**
 * Banners Admin Hook
 * 
 * Business logic for admin banners page.
 * Handles CRUD operations, form state, and toggle functionality.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface Banner {
    id: string;
    title: string;
    message: string;
    linkUrl: string | null;
    linkText: string | null;
    bgColor: string;
    textColor: string;
    position: 'TICKER' | 'HEADER' | 'POPUP' | 'FOOTER';
    priority: number;
    startsAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export interface BannerFormData {
    title: string;
    message: string;
    linkUrl: string;
    linkText: string;
    bgColor: string;
    textColor: string;
    position: Banner['position'];
    priority: number;
    startsAt: string;
    expiresAt: string;
    isActive: boolean;
}

// Constants
export const POSITION_LABELS: Record<string, string> = {
    TICKER: 'Ticker (bovenaan)',
    HEADER: 'Header banner',
    POPUP: 'Popup',
    FOOTER: 'Footer banner',
};

export const DEFAULT_FORM_DATA: BannerFormData = {
    title: '',
    message: '',
    linkUrl: '',
    linkText: '',
    bgColor: '#7c3aed',
    textColor: '#ffffff',
    position: 'TICKER',
    priority: 0,
    startsAt: '',
    expiresAt: '',
    isActive: true,
};

export interface UseBannersReturn {
    // Data
    banners: Banner[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;

    // Modal state
    showModal: boolean;
    editingId: string | null;
    formData: BannerFormData;

    // Actions
    refresh: () => Promise<void>;
    openCreateModal: () => void;
    openEditModal: (banner: Banner) => void;
    closeModal: () => void;
    setFormData: React.Dispatch<React.SetStateAction<BannerFormData>>;
    updateFormField: <K extends keyof BannerFormData>(field: K, value: BannerFormData[K]) => void;
    handleSubmit: () => Promise<boolean>;
    handleDelete: (id: string) => Promise<boolean>;
    handleToggleActive: (banner: Banner) => Promise<boolean>;

    // Helpers
    isExpired: (banner: Banner) => boolean;
}

export function useBanners(): UseBannersReturn {
    // Data state
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<BannerFormData>(DEFAULT_FORM_DATA);

    // Fetch banners
    const fetchBanners = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<Banner[]>('/api/banners');
            setBanners(data);
        } catch (err) {
            console.error('Failed to fetch banners:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchBanners();
    }, [fetchBanners]);

    // Reset form
    const resetForm = useCallback(() => {
        setFormData(DEFAULT_FORM_DATA);
        setEditingId(null);
    }, []);

    // Open create modal
    const openCreateModal = useCallback(() => {
        resetForm();
        setShowModal(true);
    }, [resetForm]);

    // Open edit modal
    const openEditModal = useCallback((banner: Banner) => {
        setFormData({
            title: banner.title,
            message: banner.message,
            linkUrl: banner.linkUrl || '',
            linkText: banner.linkText || '',
            bgColor: banner.bgColor,
            textColor: banner.textColor,
            position: banner.position,
            priority: banner.priority,
            startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : '',
            expiresAt: banner.expiresAt ? banner.expiresAt.slice(0, 16) : '',
            isActive: banner.isActive,
        });
        setEditingId(banner.id);
        setShowModal(true);
    }, []);

    // Close modal
    const closeModal = useCallback(() => {
        setShowModal(false);
        resetForm();
    }, [resetForm]);

    // Update form field
    const updateFormField = useCallback(<K extends keyof BannerFormData>(
        field: K,
        value: BannerFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Submit form
    const handleSubmit = useCallback(async (): Promise<boolean> => {
        if (!formData.title.trim() || !formData.message.trim()) {
            alert('Vul titel en bericht in');
            return false;
        }

        setIsSaving(true);
        try {
            const body = {
                title: formData.title,
                message: formData.message,
                linkUrl: formData.linkUrl || null,
                linkText: formData.linkText || null,
                bgColor: formData.bgColor,
                textColor: formData.textColor,
                position: formData.position,
                priority: formData.priority,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
                isActive: formData.isActive,
            };

            const url = editingId ? `/api/banners/${editingId}` : '/api/banners';
            const method = editingId ? 'PATCH' : 'POST';

            await adminFetch(url, {
                method,
                body: JSON.stringify(body),
            });

            setShowModal(false);
            resetForm();
            await fetchBanners();
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Opslaan mislukt';
            alert(message);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingId, resetForm, fetchBanners]);

    // Delete banner
    const handleDelete = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Weet je zeker dat je deze banner wilt verwijderen?')) {
            return false;
        }

        try {
            await adminFetch(`/api/banners/${id}`, { method: 'DELETE' });
            await fetchBanners();
            return true;
        } catch (err) {
            console.error('Failed to delete banner:', err);
            return false;
        }
    }, [fetchBanners]);

    // Toggle active
    const handleToggleActive = useCallback(async (banner: Banner): Promise<boolean> => {
        try {
            await adminFetch(`/api/banners/${banner.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !banner.isActive }),
            });
            await fetchBanners();
            return true;
        } catch (err) {
            console.error('Failed to toggle banner:', err);
            return false;
        }
    }, [fetchBanners]);

    // Check if expired
    const isExpired = useCallback((banner: Banner): boolean => {
        if (!banner.expiresAt) return false;
        return new Date(banner.expiresAt) < new Date();
    }, []);

    // Refresh
    const refresh = useCallback(async () => {
        await fetchBanners();
    }, [fetchBanners]);

    return {
        // Data
        banners,

        // Loading states
        isLoading,
        isSaving,

        // Modal state
        showModal,
        editingId,
        formData,

        // Actions
        refresh,
        openCreateModal,
        openEditModal,
        closeModal,
        setFormData,
        updateFormField,
        handleSubmit,
        handleDelete,
        handleToggleActive,

        // Helpers
        isExpired,
    };
}
