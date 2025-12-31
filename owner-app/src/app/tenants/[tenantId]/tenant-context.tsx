'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ownerApi } from '@/lib/owner-api';
import type { Tenant } from '@/types';
import { useRouter } from 'next/navigation';

interface TenantContextType {
    tenant: Tenant | null;
    loading: boolean;
    error: string;
    reloadTenant: () => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export function TenantProvider({
    children,
    tenantId
}: {
    children: ReactNode;
    tenantId: string;
}) {
    const router = useRouter();
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadTenant = async () => {
        try {
            setLoading(true);
            const data = await ownerApi.getTenant(tenantId);
            setTenant(data);
            setError('');
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load tenant';
            console.error('Error loading tenant:', err);
            setError(msg);

            if (msg.includes('Unauthorized')) {
                router.push('/login');
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            loadTenant();
        }
    }, [tenantId]);

    const reloadTenant = async () => {
        await loadTenant();
    };

    return (
        <TenantContext.Provider value={{ tenant, loading, error, reloadTenant }}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}
