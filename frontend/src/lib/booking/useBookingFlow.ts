/**
 * Booking Flow Hook - Core state machine for repair booking
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * 
 * This hook manages:
 * - Multi-step flow state (step 0-5)
 * - Selection state (device type, brand, device, repair)
 * - Customer data state
 * - Data fetching coordination
 * - Form submission
 * 
 * The hook is completely UI-agnostic. Any theme can use this hook
 * and render their own UI on top of the state it provides.
 */

import { useState, useEffect, useCallback } from 'react';
import {
    DeviceType,
    Brand,
    Device,
    RepairService,
    fetchDeviceTypes,
    fetchBrands,
    fetchDevices,
    fetchRepairServices,
    fetchAvailableSlots,
    createAppointment,
    getAvailableDates,
    DEFAULT_TIME_SLOTS,
} from './bookingApi';

// Flow steps
export enum BookingStep {
    DEVICE_TYPE = 0,
    BRAND = 1,
    DEVICE = 2,
    REPAIR = 3,
    DATE_TIME = 4,
    CONTACT = 5,
}

// Selection state
export interface BookingSelections {
    deviceType: DeviceType | null;
    brand: Brand | null;
    device: Device | null;
    repair: RepairService | null;
    date: Date | null;
    timeSlot: string;
}

// Customer data
export interface CustomerData {
    name: string;
    email: string;
    phone: string;
    notes: string;
}

// Hook return type
export interface UseBookingFlowReturn {
    // Current step
    step: BookingStep;
    setStep: (step: BookingStep) => void;

    // Selections
    selections: BookingSelections;

    // Customer data
    customerData: CustomerData;
    setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;

    // Lists
    deviceTypes: DeviceType[];
    brands: Brand[];
    devices: Device[];
    repairs: RepairService[];
    availableSlots: string[];
    availableDates: Date[];

    // Actions
    selectDeviceType: (dt: DeviceType) => void;
    selectBrand: (brand: Brand) => void;
    selectDevice: (device: Device) => void;
    selectRepair: (repair: RepairService) => void;
    selectDate: (date: Date) => void;
    selectTimeSlot: (slot: string) => void;

    // Navigation
    navigateToStep: (step: BookingStep) => void;
    goBack: () => void;
    goNext: () => void;
    canGoNext: boolean;

    // Search (for device list)
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    filteredDevices: Device[];

    // Status
    isLoading: boolean;
    isSubmitting: boolean;
    isSuccess: boolean;
    error: string | null;

    // Submit
    submit: () => Promise<void>;
    reset: () => void;
}

export function useBookingFlow(): UseBookingFlowReturn {
    // Step state
    const [step, setStep] = useState<BookingStep>(BookingStep.DEVICE_TYPE);

    // Selection state
    const [deviceType, setDeviceType] = useState<DeviceType | null>(null);
    const [brand, setBrand] = useState<Brand | null>(null);
    const [device, setDevice] = useState<Device | null>(null);
    const [repair, setRepair] = useState<RepairService | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState("");

    // Customer data
    const [customerData, setCustomerData] = useState<CustomerData>({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });

    // Lists state
    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [repairs, setRepairs] = useState<RepairService[]>([]);
    const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);

    // UI state
    const [searchQuery, setSearchQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Computed: available dates
    const availableDates = getAvailableDates();

    // Computed: filtered devices
    const filteredDevices = devices.filter(d =>
        d.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Computed: can go next
    const canGoNext = (() => {
        switch (step) {
            case BookingStep.DEVICE_TYPE: return deviceType !== null;
            case BookingStep.BRAND: return brand !== null;
            case BookingStep.DEVICE: return device !== null;
            case BookingStep.REPAIR: return repair !== null;
            case BookingStep.DATE_TIME: return selectedDate !== null && selectedSlot !== "";
            case BookingStep.CONTACT:
                return customerData.name !== "" &&
                    customerData.email !== "" &&
                    customerData.phone !== "";
            default: return false;
        }
    })();

    // Initial load
    useEffect(() => {
        loadDeviceTypes();
    }, []);

    // Load slots when date changes
    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots(selectedDate);
        }
    }, [selectedDate]);

    // Data loaders
    const loadDeviceTypes = async () => {
        setIsLoading(true);
        try {
            const data = await fetchDeviceTypes();
            setDeviceTypes(data);
        } finally {
            setIsLoading(false);
        }
    };

    const loadBrands = async (deviceTypeSlug: string) => {
        setIsLoading(true);
        try {
            const data = await fetchBrands(deviceTypeSlug);
            setBrands(data);
        } finally {
            setIsLoading(false);
        }
    };

    const loadDevices = async (brandSlug: string) => {
        setIsLoading(true);
        try {
            const data = await fetchDevices(brandSlug);
            setDevices(data);
        } finally {
            setIsLoading(false);
        }
    };

    const loadRepairs = async (deviceSlug: string) => {
        setIsLoading(true);
        try {
            const data = await fetchRepairServices(deviceSlug);
            setRepairs(data);
        } finally {
            setIsLoading(false);
        }
    };

    const loadAvailableSlots = async (date: Date) => {
        try {
            const slots = await fetchAvailableSlots(date);
            setAvailableSlots(slots);
        } catch {
            setAvailableSlots(DEFAULT_TIME_SLOTS);
        }
    };

    // Selection handlers
    const selectDeviceType = useCallback((dt: DeviceType) => {
        setDeviceType(dt);
        setBrand(null);
        setDevice(null);
        setRepair(null);
        setBrands([]);
        setDevices([]);
        setRepairs([]);
        setStep(BookingStep.BRAND);
        loadBrands(dt.slug);
    }, []);

    const selectBrand = useCallback((b: Brand) => {
        setBrand(b);
        setDevice(null);
        setRepair(null);
        setDevices([]);
        setRepairs([]);
        setStep(BookingStep.DEVICE);
        loadDevices(b.slug);
    }, []);

    const selectDevice = useCallback((d: Device) => {
        setDevice(d);
        setRepair(null);
        setRepairs([]);
        setStep(BookingStep.REPAIR);
        loadRepairs(d.slug);
    }, []);

    const selectRepair = useCallback((r: RepairService) => {
        setRepair(r);
        setStep(BookingStep.DATE_TIME);
    }, []);

    const selectDate = useCallback((date: Date) => {
        setSelectedDate(date);
        setSelectedSlot(""); // Reset slot when date changes
    }, []);

    const selectTimeSlot = useCallback((slot: string) => {
        setSelectedSlot(slot);
    }, []);

    // Navigation
    const navigateToStep = useCallback((targetStep: BookingStep) => {
        setSearchQuery("");

        // Reset downstream selections based on target step
        if (targetStep <= BookingStep.DEVICE_TYPE) {
            setDeviceType(null);
            setBrand(null);
            setDevice(null);
            setRepair(null);
            setBrands([]);
            setDevices([]);
            setRepairs([]);
        } else if (targetStep <= BookingStep.BRAND) {
            setDevice(null);
            setRepair(null);
            setDevices([]);
            setRepairs([]);
            if (deviceType) loadBrands(deviceType.slug);
        } else if (targetStep <= BookingStep.DEVICE) {
            setRepair(null);
            setRepairs([]);
            if (brand) loadDevices(brand.slug);
        } else if (targetStep <= BookingStep.REPAIR) {
            if (device) loadRepairs(device.slug);
        }

        setStep(targetStep);
    }, [deviceType, brand, device]);

    const goBack = useCallback(() => {
        if (step > 0) {
            setStep(step - 1);
        }
    }, [step]);

    const goNext = useCallback(() => {
        if (canGoNext && step < BookingStep.CONTACT) {
            setStep(step + 1);
        }
    }, [step, canGoNext]);

    // Submit
    const submit = async () => {
        if (!device || !repair || !selectedDate || !selectedSlot) {
            setError("Missing required booking information");
            return;
        }

        if (!customerData.name || !customerData.email || !customerData.phone) {
            setError("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            await createAppointment({
                customerName: customerData.name,
                customerEmail: customerData.email,
                customerPhone: customerData.phone,
                deviceBrand: brand?.name || "",
                deviceModel: device.name,
                repairType: "OTHER",
                problemDescription: `${repair.service?.name}: ${customerData.notes}`,
                appointmentDate: selectedDate.toISOString().split("T")[0],
                timeSlot: selectedSlot,
            });

            setIsSuccess(true);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Something went wrong";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset
    const reset = useCallback(() => {
        setStep(BookingStep.DEVICE_TYPE);
        setDeviceType(null);
        setBrand(null);
        setDevice(null);
        setRepair(null);
        setSelectedDate(null);
        setSelectedSlot("");
        setCustomerData({ name: "", email: "", phone: "", notes: "" });
        setBrands([]);
        setDevices([]);
        setRepairs([]);
        setSearchQuery("");
        setIsSuccess(false);
        setError(null);
    }, []);

    return {
        step,
        setStep,

        selections: {
            deviceType,
            brand,
            device,
            repair,
            date: selectedDate,
            timeSlot: selectedSlot,
        },

        customerData,
        setCustomerData,

        deviceTypes,
        brands,
        devices,
        repairs,
        availableSlots,
        availableDates,

        selectDeviceType,
        selectBrand,
        selectDevice,
        selectRepair,
        selectDate,
        selectTimeSlot,

        navigateToStep,
        goBack,
        goNext,
        canGoNext,

        searchQuery,
        setSearchQuery,
        filteredDevices,

        isLoading,
        isSubmitting,
        isSuccess,
        error,

        submit,
        reset,
    };
}
