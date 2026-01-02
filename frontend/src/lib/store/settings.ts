import { create } from 'zustand';

// Types matching backend DTOs
export interface StoreInfo {
    name: string;
    phone: string;
    email: string;
    address: {
        line1: string;
        city: string;
        postalCode: string;
        country: string;
    };
    vatNumber?: string;
}

export interface CheckoutConfig {
    defaultCountry: string;
    currency: string;
    currencySymbol: string;
    taxIncluded: boolean;
    taxRate: number;
    taxLabel: string;
}

export interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    rate: number;
    freeAbove?: number;
    minDays: number;
    maxDays: number;
    carrier?: string;
    isActive: boolean;
    sortOrder: number;
}

export interface PublicSettings {
    store: StoreInfo;
    checkout: CheckoutConfig;
    shippingZones: ShippingZone[];
}

// Default values (fallback if API fails)
// These are generic placeholders - actual values come from backend API
const DEFAULT_SETTINGS: PublicSettings = {
    store: {
        name: 'Store',
        phone: '',
        email: '',
        address: {
            line1: '',
            city: '',
            postalCode: '',
            country: 'BE',
        },
        vatNumber: '',
    },
    checkout: {
        defaultCountry: 'BE',
        currency: 'EUR',
        currencySymbol: '€',
        taxIncluded: true,
        taxRate: 0.21,
        taxLabel: '21% VAT',
    },
    shippingZones: [],
};

interface SettingsStore {
    settings: PublicSettings;
    isLoading: boolean;
    isLoaded: boolean;
    error: string | null;
    fetchSettings: () => Promise<void>;
    refreshSettings: () => Promise<void>;
    updateSettings: (newSettings: Partial<PublicSettings>) => void;
    getShippingForCountry: (countryCode: string) => ShippingZone | undefined;
    formatPrice: (amount: number) => string;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
    settings: DEFAULT_SETTINGS,
    isLoading: false,
    isLoaded: false,
    error: null,

    fetchSettings: async () => {
        if (get().isLoaded) return; // Only fetch once

        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/settings/public');
            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }
            const data: PublicSettings = await response.json();
            set({ settings: data, isLoaded: true, isLoading: false });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            set({ error: 'Failed to load settings', isLoading: false, isLoaded: true });
            // Keep default settings on error
        }
    },

    // Force refresh settings from API (for admin panel after saving)
    refreshSettings: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await fetch('/api/settings/public');
            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }
            const data: PublicSettings = await response.json();
            set({ settings: data, isLoaded: true, isLoading: false });
        } catch (error) {
            console.error('Failed to refresh settings:', error);
            set({ error: 'Failed to refresh settings', isLoading: false });
        }
    },

    // Update settings locally (optimistic update)
    updateSettings: (newSettings: Partial<PublicSettings>) => {
        const { settings } = get();
        set({
            settings: {
                ...settings,
                ...newSettings,
                store: { ...settings.store, ...newSettings.store },
                checkout: { ...settings.checkout, ...newSettings.checkout },
            },
        });
    },

    getShippingForCountry: (countryCode: string) => {
        const { settings } = get();
        return settings.shippingZones.find(
            (zone) => zone.isActive && zone.countries.includes(countryCode.toUpperCase())
        );
    },

    formatPrice: (amount: number) => {
        const { settings } = get();
        return `${settings.checkout.currencySymbol}${amount.toFixed(2)}`;
    },
}));
