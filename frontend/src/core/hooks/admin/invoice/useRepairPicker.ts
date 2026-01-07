/**
 * Repair Picker Hook
 * 
 * Multi-step repair selection for invoice creation.
 * Handles device type -> brand -> device -> repair flow.
 */

import { useState, useEffect, useCallback } from 'react';
import type { DeviceType, Brand, Device, RepairOption, RepairService } from './types';

export interface UseRepairPickerReturn {
    step: number;
    loading: boolean;

    deviceTypes: DeviceType[];
    brands: Brand[];
    devices: Device[];
    repairs: RepairOption[];

    selectedDeviceType: DeviceType | null;
    selectedBrand: Brand | null;
    selectedDevice: Device | null;

    handleSelectDeviceType: (dt: DeviceType) => void;
    handleSelectBrand: (brand: Brand) => void;
    handleSelectDevice: (device: Device) => void;
    handleSelectRepair: (repair: RepairOption) => RepairService;

    goBack: () => void;
    resetPicker: () => void;
    getBreadcrumb: () => string;
    getStepTitle: () => string;
}

export function useRepairPicker(): UseRepairPickerReturn {
    const [step, setStep] = useState(0);
    const [loading, setLoading] = useState(false);

    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [repairs, setRepairs] = useState<RepairOption[]>([]);

    const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);

    // Fetch device types on mount
    useEffect(() => {
        const fetchDeviceTypes = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/repairs/device-types');
                if (res.ok) setDeviceTypes(await res.json());
            } catch (e) {
                console.error(e);
                setDeviceTypes([
                    { id: '1', name: 'Smartphone', slug: 'smartphone' },
                    { id: '2', name: 'Tablet', slug: 'tablet' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchDeviceTypes();
    }, []);

    const fetchBrands = useCallback(async (deviceTypeSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/brands?deviceType=${deviceTypeSlug}`);
            if (res.ok) setBrands(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDevices = useCallback(async (brandSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/devices?brand=${brandSlug}`);
            if (res.ok) setDevices(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchRepairs = useCallback(async (deviceSlug: string) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/repairs/services/${deviceSlug}`);
            if (res.ok) setRepairs(await res.json());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSelectDeviceType = useCallback((dt: DeviceType) => {
        setSelectedDeviceType(dt);
        fetchBrands(dt.slug);
        setStep(1);
    }, [fetchBrands]);

    const handleSelectBrand = useCallback((brand: Brand) => {
        setSelectedBrand(brand);
        fetchDevices(brand.slug);
        setStep(2);
    }, [fetchDevices]);

    const handleSelectDevice = useCallback((device: Device) => {
        setSelectedDevice(device);
        fetchRepairs(device.slug);
        setStep(3);
    }, [fetchRepairs]);

    const handleSelectRepair = useCallback((repair: RepairOption): RepairService => {
        return {
            id: repair.id,
            name: `${selectedBrand?.name} ${selectedDevice?.name} - ${repair.service?.name}`,
            price: Number(repair.price) || 0,
            deviceId: repair.deviceId,
            serviceId: repair.serviceId,
        };
    }, [selectedBrand, selectedDevice]);

    const goBack = useCallback(() => {
        if (step > 0) setStep(step - 1);
    }, [step]);

    const resetPicker = useCallback(() => {
        setStep(0);
        setSelectedDeviceType(null);
        setSelectedBrand(null);
        setSelectedDevice(null);
        setBrands([]);
        setDevices([]);
        setRepairs([]);
    }, []);

    const getBreadcrumb = useCallback(() => {
        const parts = [];
        if (selectedDeviceType) parts.push(selectedDeviceType.name);
        if (selectedBrand) parts.push(selectedBrand.name);
        if (selectedDevice) parts.push(selectedDevice.name);
        return parts.join(' → ');
    }, [selectedDeviceType, selectedBrand, selectedDevice]);

    const getStepTitle = useCallback(() => {
        switch (step) {
            case 0: return 'Kies type toestel';
            case 1: return 'Kies merk';
            case 2: return 'Kies toestel';
            case 3: return 'Kies reparatie';
            default: return '';
        }
    }, [step]);

    return {
        step,
        loading,
        deviceTypes,
        brands,
        devices,
        repairs,
        selectedDeviceType,
        selectedBrand,
        selectedDevice,
        handleSelectDeviceType,
        handleSelectBrand,
        handleSelectDevice,
        handleSelectRepair,
        goBack,
        resetPicker,
        getBreadcrumb,
        getStepTitle,
    };
}
