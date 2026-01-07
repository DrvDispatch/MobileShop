'use client';

/**
 * @core-only
 * 
 * Feature flags context provider. Skins must NOT call useFeatures() directly.
 * Feature flags are passed as boolean props to skin components by route adapters.
 */

import { createContext, useContext, ReactNode } from 'react';
import useSWR from 'swr';

/**
 * Feature flags for the current tenant
 * Loaded once at root level, shared across all components
 */
export interface FeatureFlags {
    // E-Commerce
    ecommerceEnabled: boolean;
    refurbishedGrading: boolean;
    wishlistEnabled: boolean;
    stockNotifications: boolean;
    couponsEnabled: boolean;
    // Repairs
    repairsEnabled: boolean;
    quoteOnRequest: boolean;
    mailInRepairs: boolean;
    walkInQueue: boolean;
    // Tickets
    ticketsEnabled: boolean;
    liveChatWidget: boolean;
    // Invoicing
    invoicingEnabled: boolean;
    vatCalculation: boolean;
    pdfGeneration: boolean;
    // Inventory
    inventoryEnabled: boolean;
    advancedInventory: boolean;
    // Team
    employeeManagement: boolean;
    maxAdminUsers: number;
    // Analytics
    analyticsEnabled: boolean;
}

/**
 * Default features (all enabled) - used while loading
 * Prevents flash of missing content
 */
const DEFAULT_FEATURES: FeatureFlags = {
    ecommerceEnabled: true,
    refurbishedGrading: true,
    wishlistEnabled: true,
    stockNotifications: true,
    couponsEnabled: true,
    repairsEnabled: true,
    quoteOnRequest: false,
    mailInRepairs: false,
    walkInQueue: false,
    ticketsEnabled: true,
    liveChatWidget: true,
    invoicingEnabled: true,
    vatCalculation: true,
    pdfGeneration: true,
    inventoryEnabled: true,
    advancedInventory: false,
    employeeManagement: false,
    maxAdminUsers: 1,
    analyticsEnabled: true,
};

const FeatureContext = createContext<FeatureFlags | null>(null);

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(res => res.json());

interface FeatureProviderProps {
    children: ReactNode;
}

/**
 * FeatureProvider - Root-level context for feature flags
 * 
 * Mount this at the top of your app layout.
 * Features are fetched once and cached.
 */
export function FeatureProvider({ children }: FeatureProviderProps) {
    const { data, error } = useSWR<FeatureFlags>('/api/tenant/features', fetcher, {
        revalidateOnFocus: false,
        revalidateOnReconnect: false,
        dedupingInterval: 60000, // 1 minute cache
    });

    // Use defaults while loading to prevent flash
    const features = data || DEFAULT_FEATURES;

    // If error, still render with defaults (graceful degradation)
    if (error) {
        console.warn('[FeatureProvider] Failed to load features, using defaults');
    }

    return (
        <FeatureContext.Provider value={features}>
            {children}
        </FeatureContext.Provider>
    );
}

/**
 * useFeatures - Hook to access feature flags
 * 
 * Usage:
 * ```tsx
 * const { ecommerceEnabled, repairsEnabled } = useFeatures();
 * 
 * if (!ecommerceEnabled) return null;
 * ```
 */
export function useFeatures(): FeatureFlags {
    const ctx = useContext(FeatureContext);
    if (!ctx) {
        // If used outside provider, return defaults (graceful fallback)
        console.warn('[useFeatures] Used outside FeatureProvider, using defaults');
        return DEFAULT_FEATURES;
    }
    return ctx;
}

/**
 * Helper: Check if a feature is enabled (respects parent-child)
 * 
 * Parent features gate their children:
 * - ecommerceEnabled gates: wishlistEnabled, etc.
 * - repairsEnabled gates: quoteOnRequest, etc.
 */
export function isFeatureEnabled(features: FeatureFlags, feature: keyof FeatureFlags): boolean {
    const parentMap: Record<string, keyof FeatureFlags> = {
        refurbishedGrading: 'ecommerceEnabled',
        wishlistEnabled: 'ecommerceEnabled',
        stockNotifications: 'ecommerceEnabled',
        couponsEnabled: 'ecommerceEnabled',
        quoteOnRequest: 'repairsEnabled',
        mailInRepairs: 'repairsEnabled',
        walkInQueue: 'repairsEnabled',
        liveChatWidget: 'ticketsEnabled',
        vatCalculation: 'invoicingEnabled',
        pdfGeneration: 'invoicingEnabled',
        advancedInventory: 'inventoryEnabled',
    };

    const parent = parentMap[feature];
    if (parent && !features[parent]) {
        return false; // Parent is off, child is implicitly off
    }

    return Boolean(features[feature]);
}
