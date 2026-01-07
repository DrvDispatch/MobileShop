/**
 * @core-only
 * 
 * Book Services Page View Model
 * 
 * Wraps useGenericBookingFlow and useUIConfig to provide all data 
 * for the generic booking skin page.
 * 
 * This VM supports any vertical's service catalog (not just mobile repair).
 */

'use client';

import { useGenericBookingFlow } from '@/lib/booking/useGenericBookingFlow';
import { useUIConfig } from '@/lib/useUIConfig';
import type { Service, ServiceCategory, ServiceCatalog, BookingFlowConfig } from '@/lib/booking/bookingApi';

// Re-export types for skin usage
export type { Service, ServiceCategory, ServiceCatalog, BookingFlowConfig };

// Step type for skin reference
export type BookingStepType = 'select_category' | 'select_service' | 'select_time' | 'contact' | 'confirm';

// Selections state type
export interface BookingSelections {
    categoryPath: ServiceCategory[];
    service: Service | null;
    date: Date | null;
    timeSlot: string;
}

// Customer data type
export interface CustomerData {
    name: string;
    email: string;
    phone: string;
    notes: string;
}

// Full View Model interface
export interface BookServicesPageVM {
    // Configuration
    flowConfig: BookingFlowConfig | null;
    steps: BookingStepType[];
    currentStepIndex: number;
    currentStep: BookingStepType;

    // Catalog data
    catalog: ServiceCatalog | null;
    currentCategories: ServiceCategory[];
    currentServices: Service[];

    // Selections
    selections: BookingSelections;

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

    // Terminology
    getLabel: (key: string) => string;

    // UI Config
    uiConfig: {
        labels: {
            booking: {
                navigation: { previous: string; next: string; confirm: string };
                success: { title: string; thanks: string; confirmationText: string; backToHome: string };
                emptyStates: { noRepairs: string };
                datetime: { selectDate: string; selectTime: string };
                form: {
                    nameLabel: string; namePlaceholder: string;
                    phoneLabel: string; phonePlaceholder: string;
                    emailLabel: string; emailPlaceholder: string;
                    notesLabel: string; notesPlaceholder: string;
                };
            };
        };
        formatting: { dateLocale: string };
    };
}

export function useBookServicesPageVM(): BookServicesPageVM {
    const bookingFlow = useGenericBookingFlow();
    const { uiConfig } = useUIConfig();

    return {
        // Config
        flowConfig: bookingFlow.flowConfig,
        steps: bookingFlow.steps,
        currentStepIndex: bookingFlow.currentStepIndex,
        currentStep: bookingFlow.currentStep,

        // Catalog
        catalog: bookingFlow.catalog,
        currentCategories: bookingFlow.currentCategories,
        currentServices: bookingFlow.currentServices,

        // Selections
        selections: bookingFlow.selections,

        // Customer
        customerData: bookingFlow.customerData,
        setCustomerData: bookingFlow.setCustomerData,

        // Time
        availableSlots: bookingFlow.availableSlots,
        availableDates: bookingFlow.availableDates,

        // Actions
        selectCategory: bookingFlow.selectCategory,
        selectService: bookingFlow.selectService,
        selectDate: bookingFlow.selectDate,
        selectTimeSlot: bookingFlow.selectTimeSlot,

        // Navigation
        goBack: bookingFlow.goBack,
        goNext: bookingFlow.goNext,
        goToStep: bookingFlow.goToStep,
        canGoNext: bookingFlow.canGoNext,
        canGoBack: bookingFlow.canGoBack,

        // Status
        isLoading: bookingFlow.isLoading,
        isSubmitting: bookingFlow.isSubmitting,
        isSuccess: bookingFlow.isSuccess,
        error: bookingFlow.error,

        // Submit
        submit: bookingFlow.submit,
        reset: bookingFlow.reset,

        // Terminology
        getLabel: bookingFlow.getLabel,

        // UI Config
        uiConfig,
    };
}
