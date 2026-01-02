/**
 * Settings Form Hook
 * 
 * Business logic for admin settings form.
 * Manages form state, validation, and save operations.
 * Works with the existing useSettingsStore for data fetching.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/lib/store';

// Types
export interface SettingsFormData {
    storeName: string;
    storePhone: string;
    storeEmail: string;
    storeAddress: string;
    storeCity: string;
    storePostalCode: string;
    storeCountry: string;
    vatNumber: string;
    currency: string;
    taxRate: string;
    taxIncluded: boolean;
}

const DEFAULT_FORM_DATA: SettingsFormData = {
    storeName: "",
    storePhone: "",
    storeEmail: "",
    storeAddress: "",
    storeCity: "",
    storePostalCode: "",
    storeCountry: "",
    vatNumber: "",
    currency: "EUR",
    taxRate: "21",
    taxIncluded: true,
};

export interface UseSettingsFormReturn {
    // Form data
    formData: SettingsFormData;
    setFormField: <K extends keyof SettingsFormData>(field: K, value: SettingsFormData[K]) => void;

    // Submission state
    isSaving: boolean;
    success: boolean;
    error: string | null;

    // Actions
    handleSubmit: (e?: React.FormEvent) => Promise<void>;
    resetForm: () => void;

    // Loading state (from settings store)
    isLoading: boolean;
}

const getAdminHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem("adminAccessToken") : null;
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export function useSettingsForm(): UseSettingsFormReturn {
    const { settings, fetchSettings, refreshSettings, isLoading } = useSettingsStore();

    const [formData, setFormData] = useState<SettingsFormData>(DEFAULT_FORM_DATA);
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Populate form when settings load
    useEffect(() => {
        if (settings) {
            setFormData({
                storeName: settings.store.name,
                storePhone: settings.store.phone,
                storeEmail: settings.store.email,
                storeAddress: settings.store.address.line1,
                storeCity: settings.store.address.city,
                storePostalCode: settings.store.address.postalCode,
                storeCountry: settings.store.address.country,
                vatNumber: settings.store.vatNumber || "",
                currency: settings.checkout.currency,
                taxRate: (settings.checkout.taxRate * 100).toString(),
                taxIncluded: settings.checkout.taxIncluded,
            });
        }
    }, [settings]);

    // Update a single form field
    const setFormField = useCallback(<K extends keyof SettingsFormData>(
        field: K,
        value: SettingsFormData[K]
    ) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    // Reset form to original settings
    const resetForm = useCallback(() => {
        if (settings) {
            setFormData({
                storeName: settings.store.name,
                storePhone: settings.store.phone,
                storeEmail: settings.store.email,
                storeAddress: settings.store.address.line1,
                storeCity: settings.store.address.city,
                storePostalCode: settings.store.address.postalCode,
                storeCountry: settings.store.address.country,
                vatNumber: settings.store.vatNumber || "",
                currency: settings.checkout.currency,
                taxRate: (settings.checkout.taxRate * 100).toString(),
                taxIncluded: settings.checkout.taxIncluded,
            });
        }
    }, [settings]);

    // Build settings to save
    const buildSettingsToSave = useCallback(() => {
        return [
            { key: "store.name", value: formData.storeName },
            { key: "store.phone", value: formData.storePhone },
            { key: "store.email", value: formData.storeEmail },
            {
                key: "store.address",
                value: {
                    line1: formData.storeAddress,
                    city: formData.storeCity,
                    postalCode: formData.storePostalCode,
                    country: formData.storeCountry,
                },
            },
            { key: "store.vatNumber", value: formData.vatNumber },
            { key: "checkout.currency", value: formData.currency },
            {
                key: "checkout.currencySymbol",
                value: formData.currency === "EUR" ? "€" : formData.currency === "USD" ? "$" : "£",
            },
            { key: "checkout.taxRate", value: parseFloat(formData.taxRate) / 100 },
            { key: "checkout.taxLabel", value: `${formData.taxRate}% VAT` },
            { key: "checkout.taxIncluded", value: formData.taxIncluded },
        ];
    }, [formData]);

    // Handle form submission
    const handleSubmit = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setIsSaving(true);
        setSuccess(false);
        setError(null);

        try {
            const settingsToSave = buildSettingsToSave();

            // Save each setting via PUT /api/settings/:key
            for (const setting of settingsToSave) {
                const res = await fetch(`/api/settings/${setting.key}`, {
                    method: "PUT",
                    headers: getAdminHeaders(),
                    body: JSON.stringify({ value: setting.value }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to save ${setting.key}`);
                }
            }

            // Refresh the global settings store so the entire website updates in real-time
            await refreshSettings();

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error("Failed to save settings:", err);
            const message = err instanceof Error ? err.message : "Failed to save settings";
            setError(message);
        } finally {
            setIsSaving(false);
        }
    }, [buildSettingsToSave, refreshSettings]);

    return {
        formData,
        setFormField,
        isSaving,
        success,
        error,
        handleSubmit,
        resetForm,
        isLoading,
    };
}
