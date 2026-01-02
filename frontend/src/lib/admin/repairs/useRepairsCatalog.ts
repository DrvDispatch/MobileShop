/**
 * Repairs Catalog Admin Hook
 * 
 * Business logic for admin repairs catalog page.
 * Handles device types, brands, devices, service types, and import.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface DeviceType {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    _count?: { brands: number };
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    isActive: boolean;
    _count?: { devices: number };
}

export interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
    isActive: boolean;
    _count?: { services: number };
}

export interface ServiceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    isActive: boolean;
}

export interface ImportResult {
    success: boolean;
    message: string;
    stats?: {
        deviceTypes: number;
        brands: number;
        devices: number;
    };
}

export interface UseRepairsCatalogReturn {
    // Data
    deviceTypes: DeviceType[];
    brands: Brand[];
    devices: Device[];
    serviceTypes: ServiceType[];

    // Loading
    isLoading: boolean;
    isImporting: boolean;

    // Import
    importResult: ImportResult | null;
    handleFileImport: (file: File) => Promise<void>;
    clearImportResult: () => void;
    fileInputRef: React.RefObject<HTMLInputElement | null>;

    // Tabs
    activeTab: 'overview' | 'import';
    setActiveTab: (tab: 'overview' | 'import') => void;

    // Actions
    refresh: () => Promise<void>;
}

export function useRepairsCatalog(): UseRepairsCatalogReturn {
    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<ImportResult | null>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'import'>('overview');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch all catalog data
    const fetchAllData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [dtRes, brandsRes, devicesRes, stRes] = await Promise.all([
                fetch('/api/repairs/device-types'),
                fetch('/api/repairs/brands'),
                fetch('/api/repairs/devices'),
                fetch('/api/repairs/service-types'),
            ]);

            const dtData = dtRes.ok ? await dtRes.json().catch(() => []) : [];
            const brandsData = brandsRes.ok ? await brandsRes.json().catch(() => []) : [];
            const devicesData = devicesRes.ok ? await devicesRes.json().catch(() => []) : [];
            const stData = stRes.ok ? await stRes.json().catch(() => []) : [];

            setDeviceTypes(Array.isArray(dtData) ? dtData : []);
            setBrands(Array.isArray(brandsData) ? brandsData : []);
            setDevices(Array.isArray(devicesData) ? devicesData : []);
            setServiceTypes(Array.isArray(stData) ? stData : []);
        } catch (err) {
            console.error('Failed to fetch catalog data:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // Handle file import
    const handleFileImport = useCallback(async (file: File) => {
        setIsImporting(true);
        setImportResult(null);

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const result = await adminFetch<Record<string, number>>('/api/repairs/admin/import', {
                method: 'POST',
                body: JSON.stringify({ data: jsonData }),
            });

            setImportResult({
                success: true,
                message: 'Import succesvol!',
                stats: {
                    deviceTypes: result.deviceTypes || 0,
                    brands: result.brands || 0,
                    devices: result.devices || 0,
                },
            });

            await fetchAllData();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Import mislukt';
            setImportResult({ success: false, message });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    }, [fetchAllData]);

    const clearImportResult = useCallback(() => {
        setImportResult(null);
    }, []);

    return {
        deviceTypes,
        brands,
        devices,
        serviceTypes,
        isLoading,
        isImporting,
        importResult,
        handleFileImport,
        clearImportResult,
        fileInputRef,
        activeTab,
        setActiveTab,
        refresh: fetchAllData,
    };
}
