/**
 * Invoice Settings Hook
 * 
 * Business logic for invoice settings management.
 */

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin';
import type { InvoiceSettings } from './types';
import { defaultInvoiceSettings } from './types';

export interface UseInvoiceSettingsReturn {
    settings: InvoiceSettings;
    setSettings: React.Dispatch<React.SetStateAction<InvoiceSettings>>;
    updateField: <K extends keyof InvoiceSettings>(field: K, value: InvoiceSettings[K]) => void;
    updateAddressField: (field: keyof InvoiceSettings['companyAddress'], value: string) => void;
    loading: boolean;
    saving: boolean;
    message: { type: 'success' | 'error'; text: string } | null;
    setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void;
    fetchSettings: () => Promise<void>;
    saveSettings: () => Promise<void>;
}

export function useInvoiceSettings(): UseInvoiceSettingsReturn {
    const [settings, setSettings] = useState<InvoiceSettings>(defaultInvoiceSettings);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const fetchSettings = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminFetch<InvoiceSettings>('/api/invoice/settings');
            setSettings(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const updateField = useCallback(<K extends keyof InvoiceSettings>(field: K, value: InvoiceSettings[K]) => {
        setSettings(prev => ({ ...prev, [field]: value }));
    }, []);

    const updateAddressField = useCallback((field: keyof InvoiceSettings['companyAddress'], value: string) => {
        setSettings(prev => ({
            ...prev,
            companyAddress: { ...prev.companyAddress, [field]: value },
        }));
    }, []);

    const saveSettings = useCallback(async () => {
        setSaving(true);
        try {
            await adminFetch('/api/invoice/settings', {
                method: 'PUT',
                body: JSON.stringify(settings),
            });
            setMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
        } catch {
            setMessage({ type: 'error', text: 'Fout bij opslaan instellingen' });
        } finally {
            setSaving(false);
        }
    }, [settings]);

    return {
        settings,
        setSettings,
        updateField,
        updateAddressField,
        loading,
        saving,
        message,
        setMessage,
        fetchSettings,
        saveSettings,
    };
}
