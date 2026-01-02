/**
 * Repairs Admin Hook
 * 
 * Business logic for admin repairs page.
 * Handles repair listing, filtering, and status management.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface Repair {
    id: string;
    repairNumber: string;
    status: string;
    device: string;
    deviceBrand: string;
    deviceModel: string;
    service: string;
    price: number;
    estimatedTime?: string;
    notes?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    createdAt: string;
    completedAt?: string;
}

// Status configs
export const REPAIR_STATUS_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'In afwachting', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    DIAGNOSING: { label: 'Diagnose', color: 'text-blue-600', bg: 'bg-blue-100' },
    WAITING_PARTS: { label: 'Wacht op onderdelen', color: 'text-orange-600', bg: 'bg-orange-100' },
    REPAIRING: { label: 'In reparatie', color: 'text-purple-600', bg: 'bg-purple-100' },
    TESTING: { label: 'Testen', color: 'text-indigo-600', bg: 'bg-indigo-100' },
    COMPLETED: { label: 'Voltooid', color: 'text-green-600', bg: 'bg-green-100' },
    CANCELLED: { label: 'Geannuleerd', color: 'text-red-600', bg: 'bg-red-100' },
};

export interface UseRepairsReturn {
    // Data
    repairs: Repair[];
    filteredRepairs: Repair[];

    // Loading
    isLoading: boolean;
    isUpdating: boolean;

    // Filters
    searchQuery: string;
    statusFilter: string;
    setSearchQuery: (q: string) => void;
    setStatusFilter: (s: string) => void;

    // Actions
    refresh: () => Promise<void>;
    updateRepairStatus: (id: string, status: string) => Promise<boolean>;
    updateRepairNotes: (id: string, notes: string) => Promise<boolean>;
}

export function useRepairs(): UseRepairsReturn {
    const [repairs, setRepairs] = useState<Repair[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    // Fetch repairs
    const fetchRepairs = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<Repair[]>('/api/repairs');
            setRepairs(data);
        } catch (err) {
            console.error('Failed to fetch repairs:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRepairs();
    }, [fetchRepairs]);

    // Filtered repairs
    const filteredRepairs = useMemo(() => {
        return repairs.filter(r => {
            const matchesSearch = !searchQuery ||
                r.repairNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.deviceModel.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = !statusFilter || r.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [repairs, searchQuery, statusFilter]);

    // Update repair status
    const updateRepairStatus = useCallback(async (id: string, status: string): Promise<boolean> => {
        setIsUpdating(true);
        try {
            await adminFetch(`/api/repairs/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            });
            await fetchRepairs();
            return true;
        } catch (err) {
            console.error('Failed to update repair:', err);
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [fetchRepairs]);

    // Update repair notes
    const updateRepairNotes = useCallback(async (id: string, notes: string): Promise<boolean> => {
        setIsUpdating(true);
        try {
            await adminFetch(`/api/repairs/${id}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes }),
            });
            await fetchRepairs();
            return true;
        } catch (err) {
            console.error('Failed to update repair notes:', err);
            return false;
        } finally {
            setIsUpdating(false);
        }
    }, [fetchRepairs]);

    return {
        repairs,
        filteredRepairs,
        isLoading,
        isUpdating,
        searchQuery,
        statusFilter,
        setSearchQuery,
        setStatusFilter,
        refresh: fetchRepairs,
        updateRepairStatus,
        updateRepairNotes,
    };
}
