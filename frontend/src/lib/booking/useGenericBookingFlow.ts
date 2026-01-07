/**
 * @core-only
 * 
 * Generic Booking Flow Hook - Data-driven booking for any vertical
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * 
 * This hook manages:
 * - Dynamic steps from BookingFlowConfig
 * - Service catalog navigation
 * - Customer data state
 * - Booking submission
 * 
 * The hook is completely UI-agnostic. Any skin can use this hook
 * and render their own UI on top of the state it provides.
 * 
 * Unlike useBookingFlow (which is hardcoded to mobile repair), this hook
 * supports any vertical through data-driven configuration.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    Service,
    ServiceCategory,
    ServiceCatalog,
    BookingFlowConfig,
    fetchServiceCatalog,
    fetchBookingFlowConfig,
    fetchAvailableSlots,
    getAvailableDates,
    DEFAULT_TIME_SLOTS,
} from './bookingApi';

// Standard booking step types
export type BookingStepType =
    | 'select_category'  // Navigate category hierarchy
    | 'select_service'   // Select a service
    | 'select_time'      // Pick date/time
    | 'contact'          // Enter customer info
    | 'confirm';         // Review & submit

// Selection state
export interface GenericBookingSelections {
    categoryPath: ServiceCategory[]; // Breadcrumb of selected categories
    service: Service | null;
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
export interface UseGenericBookingFlowReturn {
    // Configuration
    flowConfig: BookingFlowConfig | null;
    steps: BookingStepType[];
    currentStepIndex: number;
    currentStep: BookingStepType;

    // Catalog data
    catalog: ServiceCatalog | null;
    currentCategories: ServiceCategory[]; // Categories at current depth
    currentServices: Service[]; // Services available for selection

    // Selections
    selections: GenericBookingSelections;

    // Customer data
    customerData: CustomerData;
    setCustomerData: React.Dispatch<React.SetStateAction<CustomerData>>;

    // Time selection
    availableSlots: string[];
    availableDates: Date[];

    // Actions
    selectCategory: (category: ServiceCategory) => void;
    selectService: (service: Service) => void;
    selectDate: (date: Date) => void;
    selectTimeSlot: (slot: string) => void;

    // Navigation
    goBack: () => void;
    goNext: () => void;
    goToStep: (stepIndex: number) => void;
    canGoNext: boolean;
    canGoBack: boolean;

    // Status
    isLoading: boolean;
    isSubmitting: boolean;
    isSuccess: boolean;
    error: string | null;

    // Submit
    submit: () => Promise<void>;
    reset: () => void;

    // Terminology (for skin labels)
    getLabel: (key: string) => string;
}

const DEFAULT_STEPS: BookingStepType[] = ['select_service', 'select_time', 'contact'];

export function useGenericBookingFlow(): UseGenericBookingFlowReturn {
    // Configuration state
    const [flowConfig, setFlowConfig] = useState<BookingFlowConfig | null>(null);
    const [catalog, setCatalog] = useState<ServiceCatalog | null>(null);

    // Step state
    const [currentStepIndex, setCurrentStepIndex] = useState(0);

    // Selection state
    const [categoryPath, setCategoryPath] = useState<ServiceCategory[]>([]);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState("");

    // Customer data
    const [customerData, setCustomerData] = useState<CustomerData>({
        name: "",
        email: "",
        phone: "",
        notes: "",
    });

    // Time slots
    const [availableSlots, setAvailableSlots] = useState<string[]>(DEFAULT_TIME_SLOTS);

    // UI state
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Computed: steps from config
    const steps = useMemo<BookingStepType[]>(() => {
        if (!flowConfig) return DEFAULT_STEPS;
        return flowConfig.steps as BookingStepType[];
    }, [flowConfig]);

    const currentStep = steps[currentStepIndex] || 'select_service';

    // Computed: available dates
    const availableDates = useMemo(() => getAvailableDates(), []);

    // Computed: current categories (based on category path)
    const currentCategories = useMemo<ServiceCategory[]>(() => {
        if (!catalog) return [];

        if (categoryPath.length === 0) {
            // Show root categories
            return catalog.categories;
        }

        // Show children of last selected category
        const lastCategory = categoryPath[categoryPath.length - 1];
        return lastCategory.children || [];
    }, [catalog, categoryPath]);

    // Computed: current services
    const currentServices = useMemo<Service[]>(() => {
        if (!catalog) return [];

        if (categoryPath.length === 0) {
            // Show uncategorized services + services from root categories
            return catalog.services;
        }

        // Show services from current category
        const lastCategory = categoryPath[categoryPath.length - 1];
        return lastCategory.services || [];
    }, [catalog, categoryPath]);

    // Computed: can go next
    const canGoNext = useMemo(() => {
        switch (currentStep) {
            case 'select_category':
                // Can proceed if there are services available or a category is selected
                return currentServices.length > 0 || categoryPath.length > 0;
            case 'select_service':
                return selectedService !== null;
            case 'select_time':
                return selectedDate !== null && selectedSlot !== "";
            case 'contact':
                return customerData.name !== "" &&
                    customerData.email !== "" &&
                    customerData.phone !== "";
            case 'confirm':
                return true;
            default:
                return false;
        }
    }, [currentStep, selectedService, selectedDate, selectedSlot, customerData, currentServices, categoryPath]);

    // Computed: can go back
    const canGoBack = useMemo(() => {
        if (currentStepIndex > 0) return true;
        // During category selection, can go back to parent category
        if (currentStep === 'select_category' && categoryPath.length > 0) return true;
        return false;
    }, [currentStepIndex, currentStep, categoryPath]);

    // Load config and catalog on mount
    useEffect(() => {
        loadInitialData();
    }, []);

    // Load slots when date changes
    useEffect(() => {
        if (selectedDate) {
            loadAvailableSlots(selectedDate);
        }
    }, [selectedDate]);

    const loadInitialData = async () => {
        setIsLoading(true);
        try {
            const [configData, catalogData] = await Promise.all([
                fetchBookingFlowConfig(),
                fetchServiceCatalog(),
            ]);
            setFlowConfig(configData);
            setCatalog(catalogData);
        } catch (err) {
            console.error('Failed to load booking data:', err);
            setError('Failed to load booking configuration');
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

    // Actions
    const selectCategory = useCallback((category: ServiceCategory) => {
        setCategoryPath(prev => [...prev, category]);
        // If category has no children, show its services
        if (!category.children || category.children.length === 0) {
            // Stay on same step but show services
        }
    }, []);

    const selectService = useCallback((service: Service) => {
        setSelectedService(service);
        // Auto-advance to next step
        setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
    }, [steps.length]);

    const selectDate = useCallback((date: Date) => {
        setSelectedDate(date);
        setSelectedSlot(""); // Reset slot when date changes
    }, []);

    const selectTimeSlot = useCallback((slot: string) => {
        setSelectedSlot(slot);
    }, []);

    // Navigation
    const goBack = useCallback(() => {
        // If we're in category selection with a path, go up one level
        if (currentStep === 'select_category' && categoryPath.length > 0) {
            setCategoryPath(prev => prev.slice(0, -1));
            return;
        }

        // Otherwise go to previous step
        if (currentStepIndex > 0) {
            setCurrentStepIndex(prev => prev - 1);
        }
    }, [currentStep, categoryPath, currentStepIndex]);

    const goNext = useCallback(() => {
        if (canGoNext && currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
        }
    }, [canGoNext, currentStepIndex, steps.length]);

    const goToStep = useCallback((stepIndex: number) => {
        if (stepIndex >= 0 && stepIndex < steps.length) {
            setCurrentStepIndex(stepIndex);
        }
    }, [steps.length]);

    // Submit
    const submit = async () => {
        if (!selectedService || !selectedDate || !selectedSlot) {
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
            // TODO: Call new generic booking API when implemented
            // For now, use legacy appointment API with mapped data
            const { createAppointment } = await import('./bookingApi');

            await createAppointment({
                customerName: customerData.name,
                customerEmail: customerData.email,
                customerPhone: customerData.phone,
                deviceBrand: categoryPath.length > 0 ? categoryPath[0].name : "",
                deviceModel: categoryPath.length > 1 ? categoryPath[1].name : selectedService.name,
                repairType: "OTHER",
                problemDescription: `${selectedService.name}: ${customerData.notes}`,
                appointmentDate: selectedDate.toISOString().split("T")[0],
                timeSlot: selectedSlot,
            });

            setIsSuccess(true);
        } catch (err) {
            console.error("Booking submission failed:", err);
            setError(err instanceof Error ? err.message : "Booking failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reset
    const reset = useCallback(() => {
        setCurrentStepIndex(0);
        setCategoryPath([]);
        setSelectedService(null);
        setSelectedDate(null);
        setSelectedSlot("");
        setCustomerData({ name: "", email: "", phone: "", notes: "" });
        setIsSuccess(false);
        setError(null);
    }, []);

    // Terminology helper
    const getLabel = useCallback((key: string): string => {
        if (flowConfig?.terminology && flowConfig.terminology[key]) {
            return flowConfig.terminology[key];
        }
        // Default labels
        const defaults: Record<string, string> = {
            serviceLabel: 'Service',
            categoryLabel: 'Category',
            bookingLabel: 'Booking',
            dateLabel: 'Date',
            timeLabel: 'Time',
            contactLabel: 'Contact',
        };
        return defaults[key] || key;
    }, [flowConfig]);

    return {
        // Configuration
        flowConfig,
        steps,
        currentStepIndex,
        currentStep,

        // Catalog data
        catalog,
        currentCategories,
        currentServices,

        // Selections
        selections: {
            categoryPath,
            service: selectedService,
            date: selectedDate,
            timeSlot: selectedSlot,
        },

        // Customer data
        customerData,
        setCustomerData,

        // Time selection
        availableSlots,
        availableDates,

        // Actions
        selectCategory,
        selectService,
        selectDate,
        selectTimeSlot,

        // Navigation
        goBack,
        goNext,
        goToStep,
        canGoNext,
        canGoBack,

        // Status
        isLoading,
        isSubmitting,
        isSuccess,
        error,

        // Submit
        submit,
        reset,

        // Terminology
        getLabel,
    };
}
