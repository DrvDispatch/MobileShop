'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PublicTenantConfig } from '@/lib/tenant-types';

// API base URL - use relative path so requests go through Next.js rewrite proxy
// This preserves the Host header for proper tenant resolution
const API_URL = '/api';

// Context for tenant configuration
const TenantContext = createContext<PublicTenantConfig | null>(null);

// Hook to access tenant config
export function useTenant(): PublicTenantConfig {
    const ctx = useContext(TenantContext);
    if (!ctx) {
        throw new Error('useTenant must be used within TenantProvider. Ensure TenantProvider is at the root of your app.');
    }
    return ctx;
}

// Hook for optional tenant access (won't throw if not loaded)
export function useTenantOptional(): PublicTenantConfig | null {
    return useContext(TenantContext);
}

// Loading skeleton component
function TenantLoadingSkeleton() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Laden...</p>
            </div>
        </div>
    );
}

// Error component
function TenantErrorDisplay({ error, onRetry }: { error: string; onRetry: () => void }) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md p-6">
                <div className="text-red-500 text-5xl mb-4">⚠️</div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuratie Fout</h1>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                    onClick={onRetry}
                    className="bg-violet-600 text-white px-6 py-2 rounded-lg hover:bg-violet-700 transition-colors"
                >
                    Opnieuw proberen
                </button>
            </div>
        </div>
    );
}

/**
 * Apply theme CSS variables based on tenant configuration
 * Converts hex colors to CSS variable format and applies dark mode if enabled
 */
function applyTheme(config: PublicTenantConfig) {
    const root = document.documentElement;

    // Apply primary color
    if (config.branding.primaryColor) {
        root.style.setProperty('--primary-color', config.branding.primaryColor);
        // Also set as brand color for components that use it directly
        root.style.setProperty('--brand-color', config.branding.primaryColor);
    }

    // Apply secondary color
    if (config.branding.secondaryColor) {
        root.style.setProperty('--secondary-color', config.branding.secondaryColor);
    }

    // Apply accent color
    if (config.branding.accentColor) {
        root.style.setProperty('--accent-color', config.branding.accentColor);
    }

    // Apply border radius
    if (config.branding.borderRadius) {
        root.style.setProperty('--radius', config.branding.borderRadius);
    }

    // Apply dark mode
    if (config.branding.darkMode) {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
}

interface TenantProviderProps {
    children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    const [tenant, setTenant] = useState<PublicTenantConfig | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchTenantConfig = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_URL}/tenant/config`, {
                credentials: 'include',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Deze website is niet geconfigureerd. Neem contact op met de beheerder.');
                }
                throw new Error(`Fout bij laden configuratie (${response.status})`);
            }

            const config: PublicTenantConfig = await response.json();

            if (!config || !config.tenantId) {
                throw new Error('Ongeldige tenant configuratie ontvangen');
            }

            setTenant(config);

            // Apply theme CSS variables for customization
            applyTheme(config);

            // Update document title
            if (config.branding.shopName) {
                document.title = config.branding.shopName;
            }

        } catch (err) {
            console.error('Failed to load tenant config:', err);
            setError(err instanceof Error ? err.message : 'Onbekende fout bij laden configuratie');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantConfig();
    }, []);

    // Show loading skeleton while fetching
    if (loading) {
        return <TenantLoadingSkeleton />;
    }

    // Show error if config fetch failed
    if (error) {
        return <TenantErrorDisplay error={error} onRetry={fetchTenantConfig} />;
    }

    // Render children with tenant context
    return (
        <TenantContext.Provider value={tenant}>
            {children}
        </TenantContext.Provider>
    );
}
