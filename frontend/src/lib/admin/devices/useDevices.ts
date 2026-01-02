/**
 * Devices Admin Hook
 * 
 * Business logic for admin devices page.
 * Handles CRUD, seeding, import, filtering, and search.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch, getAdminAuthHeaders } from '@/lib/admin';

// Types
export interface Device {
    id: string;
    brand: string;
    model: string;
    isActive: boolean;
    sortOrder: number;
}

export interface DeviceFormData {
    brand: string;
    model: string;
    isActive: boolean;
}

export const DEFAULT_DEVICE_FORM: DeviceFormData = {
    brand: '',
    model: '',
    isActive: true,
};

export interface UseDevicesReturn {
    // Data
    devices: Device[];
    filteredDevices: Device[];
    groupedDevices: Record<string, Device[]>;
    uniqueBrands: string[];

    // Loading states
    isLoading: boolean;
    isSaving: boolean;
    isSeeding: boolean;
    isImporting: boolean;

    // Alerts
    error: string | null;
    success: string | null;
    setError: (e: string | null) => void;
    setSuccess: (s: string | null) => void;

    // Filters
    searchQuery: string;
    setSearchQuery: (q: string) => void;
    brandFilter: string;
    setBrandFilter: (b: string) => void;

    // Modal state
    isModalOpen: boolean;
    editingDevice: Device | null;
    formData: DeviceFormData;

    // Actions
    refresh: () => Promise<void>;
    openAddModal: () => void;
    openEditModal: (device: Device) => void;
    closeModal: () => void;
    setFormData: React.Dispatch<React.SetStateAction<DeviceFormData>>;
    handleSave: () => Promise<boolean>;
    handleDelete: (id: string) => Promise<boolean>;
    toggleActive: (device: Device) => Promise<boolean>;
    seedDevices: () => Promise<void>;
    handleFileUpload: (file: File) => Promise<void>;
}

export function useDevices(): UseDevicesReturn {
    // Data state
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Alert state
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');
    const [brandFilter, setBrandFilter] = useState('');

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [formData, setFormData] = useState<DeviceFormData>(DEFAULT_DEVICE_FORM);

    // Fetch devices
    const fetchDevices = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<Device[]>('/api/devices/admin/all');
            setDevices(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to fetch devices');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchDevices();
    }, [fetchDevices]);

    // Unique brands
    const uniqueBrands = useMemo(() =>
        [...new Set(devices.map(d => d.brand))].sort()
        , [devices]);

    // Filtered devices
    const filteredDevices = useMemo(() => {
        return devices.filter(d => {
            const matchesSearch =
                d.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
                d.model.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesBrand = !brandFilter || d.brand === brandFilter;
            return matchesSearch && matchesBrand;
        });
    }, [devices, searchQuery, brandFilter]);

    // Grouped by brand
    const groupedDevices = useMemo(() => {
        return filteredDevices.reduce((acc, device) => {
            if (!acc[device.brand]) acc[device.brand] = [];
            acc[device.brand].push(device);
            return acc;
        }, {} as Record<string, Device[]>);
    }, [filteredDevices]);

    // Modal actions
    const openAddModal = useCallback(() => {
        setEditingDevice(null);
        setFormData(DEFAULT_DEVICE_FORM);
        setIsModalOpen(true);
    }, []);

    const openEditModal = useCallback((device: Device) => {
        setEditingDevice(device);
        setFormData({
            brand: device.brand,
            model: device.model,
            isActive: device.isActive,
        });
        setIsModalOpen(true);
    }, []);

    const closeModal = useCallback(() => {
        setIsModalOpen(false);
        setEditingDevice(null);
        setFormData(DEFAULT_DEVICE_FORM);
    }, []);

    // Save device
    const handleSave = useCallback(async (): Promise<boolean> => {
        if (!formData.brand.trim() || !formData.model.trim()) {
            setError('Brand and model are required');
            return false;
        }

        setIsSaving(true);
        setError(null);
        try {
            if (editingDevice) {
                await adminFetch(`/api/devices/${editingDevice.id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(formData),
                });
                setSuccess('Device updated successfully');
            } else {
                await adminFetch('/api/devices', {
                    method: 'POST',
                    body: JSON.stringify(formData),
                });
                setSuccess('Device created successfully');
            }
            closeModal();
            await fetchDevices();
            return true;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to save device');
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [formData, editingDevice, closeModal, fetchDevices]);

    // Delete device
    const handleDelete = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Are you sure you want to delete this device?')) return false;

        try {
            await adminFetch(`/api/devices/${id}`, { method: 'DELETE' });
            setSuccess('Device deleted successfully');
            await fetchDevices();
            return true;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to delete device');
            return false;
        }
    }, [fetchDevices]);

    // Toggle active
    const toggleActive = useCallback(async (device: Device): Promise<boolean> => {
        try {
            await adminFetch(`/api/devices/${device.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive: !device.isActive }),
            });
            await fetchDevices();
            return true;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to update device');
            return false;
        }
    }, [fetchDevices]);

    // Seed devices
    const seedDevices = useCallback(async () => {
        setIsSeeding(true);
        setError(null);
        try {
            const result = await adminFetch<{ created: number; skipped: number }>('/api/devices/seed', {
                method: 'POST',
            });
            setSuccess(`Devices seeded: ${result.created} created, ${result.skipped} skipped`);
            await fetchDevices();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to seed devices');
        } finally {
            setIsSeeding(false);
        }
    }, [fetchDevices]);

    // Import from file
    const handleFileUpload = useCallback(async (file: File) => {
        setIsImporting(true);
        setError(null);
        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const result = await adminFetch<{ created: number; skipped: number; breakdown?: { brand: string; smartphones: number; tablets: number }[] }>(
                '/api/devices/import',
                { method: 'POST', body: JSON.stringify(jsonData) }
            );

            const breakdown = result.breakdown?.map(b =>
                `${b.brand}: ${b.smartphones} phones, ${b.tablets} tablets`
            ).join(' | ') || '';

            setSuccess(`Import complete: ${result.created} created, ${result.skipped} skipped. ${breakdown}`);
            await fetchDevices();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Failed to parse JSON file');
        } finally {
            setIsImporting(false);
        }
    }, [fetchDevices]);

    return {
        // Data
        devices,
        filteredDevices,
        groupedDevices,
        uniqueBrands,

        // Loading states
        isLoading,
        isSaving,
        isSeeding,
        isImporting,

        // Alerts
        error,
        success,
        setError,
        setSuccess,

        // Filters
        searchQuery,
        setSearchQuery,
        brandFilter,
        setBrandFilter,

        // Modal state
        isModalOpen,
        editingDevice,
        formData,

        // Actions
        refresh: fetchDevices,
        openAddModal,
        openEditModal,
        closeModal,
        setFormData,
        handleSave,
        handleDelete,
        toggleActive,
        seedDevices,
        handleFileUpload,
    };
}
