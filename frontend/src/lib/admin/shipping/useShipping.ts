/**
 * Shipping Admin Hook
 * 
 * Business logic for admin shipping zones page.
 * Handles CRUD for shipping zones.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    rate: string;
    freeAbove: string | null;
    minDays: number;
    maxDays: number;
    carrier: string | null;
    isActive: boolean;
    sortOrder: number;
}

export interface ShippingFormData {
    name: string;
    countries: string[];
    rate: string;
    freeAbove: string;
    minDays: string;
    maxDays: string;
    carrier: string;
    isActive: boolean;
}

export const COUNTRY_OPTIONS = [
    { code: 'BE', name: 'België' },
    { code: 'NL', name: 'Nederland' },
    { code: 'DE', name: 'Duitsland' },
    { code: 'FR', name: 'Frankrijk' },
    { code: 'LU', name: 'Luxemburg' },
    { code: 'GB', name: 'Verenigd Koninkrijk' },
    { code: 'AT', name: 'Oostenrijk' },
    { code: 'CH', name: 'Zwitserland' },
    { code: 'IT', name: 'Italië' },
    { code: 'ES', name: 'Spanje' },
    { code: 'PL', name: 'Polen' },
    { code: 'PT', name: 'Portugal' },
];

export const CARRIERS = [
    { id: 'bpost', name: 'bpost' },
    { id: 'postnl', name: 'PostNL' },
    { id: 'dhl', name: 'DHL' },
    { id: 'dpd', name: 'DPD' },
    { id: 'ups', name: 'UPS' },
    { id: 'fedex', name: 'FedEx' },
];

const DEFAULT_FORM: ShippingFormData = {
    name: '', countries: [], rate: '', freeAbove: '',
    minDays: '', maxDays: '', carrier: '', isActive: true,
};

export interface UseShippingReturn {
    zones: ShippingZone[];
    isLoading: boolean;
    isSaving: boolean;

    // Modal
    showModal: boolean;
    editingZone: ShippingZone | null;
    formData: ShippingFormData;
    setFormData: React.Dispatch<React.SetStateAction<ShippingFormData>>;

    // Actions
    openCreateModal: () => void;
    openEditModal: (zone: ShippingZone) => void;
    closeModal: () => void;
    handleSave: () => Promise<void>;
    handleDelete: (id: string) => Promise<void>;
    toggleCountry: (code: string) => void;
    refresh: () => Promise<void>;

    // Helpers
    getCountryName: (code: string) => string;
}

export function useShipping(): UseShippingReturn {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [formData, setFormData] = useState<ShippingFormData>(DEFAULT_FORM);

    const fetchZones = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<ShippingZone[]>('/api/shipping-zones');
            setZones(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Failed to fetch zones:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchZones();
    }, [fetchZones]);

    const openCreateModal = useCallback(() => {
        setEditingZone(null);
        setFormData(DEFAULT_FORM);
        setShowModal(true);
    }, []);

    const openEditModal = useCallback((zone: ShippingZone) => {
        setEditingZone(zone);
        setFormData({
            name: zone.name,
            countries: zone.countries,
            rate: zone.rate,
            freeAbove: zone.freeAbove || '',
            minDays: String(zone.minDays),
            maxDays: String(zone.maxDays),
            carrier: zone.carrier || '',
            isActive: zone.isActive,
        });
        setShowModal(true);
    }, []);

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingZone(null);
        setFormData(DEFAULT_FORM);
    }, []);

    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const payload = {
                name: formData.name,
                countries: formData.countries,
                rate: parseFloat(formData.rate) || 0,
                freeAbove: formData.freeAbove ? parseFloat(formData.freeAbove) : null,
                minDays: parseInt(formData.minDays) || 1,
                maxDays: parseInt(formData.maxDays) || 5,
                carrier: formData.carrier || null,
                isActive: formData.isActive,
            };

            if (editingZone) {
                await adminFetch(`/api/shipping-zones/${editingZone.id}`, {
                    method: 'PUT',
                    body: JSON.stringify(payload),
                });
            } else {
                await adminFetch('/api/shipping-zones', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            }

            await fetchZones();
            closeModal();
        } catch (err) {
            console.error('Save failed:', err);
            alert('Opslaan mislukt');
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingZone, fetchZones, closeModal]);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('Weet u zeker dat u deze zone wilt verwijderen?')) return;

        try {
            await adminFetch(`/api/shipping-zones/${id}`, { method: 'DELETE' });
            await fetchZones();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('Verwijderen mislukt');
        }
    }, [fetchZones]);

    const toggleCountry = useCallback((code: string) => {
        setFormData(prev => ({
            ...prev,
            countries: prev.countries.includes(code)
                ? prev.countries.filter(c => c !== code)
                : [...prev.countries, code],
        }));
    }, []);

    const getCountryName = useCallback((code: string) => {
        return COUNTRY_OPTIONS.find(c => c.code === code)?.name || code;
    }, []);

    return {
        zones, isLoading, isSaving,
        showModal, editingZone, formData, setFormData,
        openCreateModal, openEditModal, closeModal,
        handleSave, handleDelete, toggleCountry,
        refresh: fetchZones, getCountryName,
    };
}
