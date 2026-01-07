/**
 * Export Admin Hook
 * 
 * Business logic for admin export page.
 * Handles general data exports and Belgian accounting exports.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useCallback, useMemo } from 'react';

// Types
export interface ExportFilter {
    key: string;
    label: string;
    type: 'date' | 'checkbox';
}

export interface ExportOption {
    id: string;
    name: string;
    description: string;
    endpoint: string;
    filters?: ExportFilter[];
}

export type AccountingExportType = 'btw' | 'accountant' | 'annual';

// Export options configuration
export const EXPORT_OPTIONS: ExportOption[] = [
    {
        id: 'orders',
        name: 'Bestellingen',
        description: 'Alle bestellingen met klantgegevens, producten en bedragen',
        endpoint: '/api/export/orders',
        filters: [
            { key: 'startDate', label: 'Vanaf datum', type: 'date' },
            { key: 'endDate', label: 'Tot datum', type: 'date' },
        ],
    },
    {
        id: 'products',
        name: 'Producten',
        description: 'Complete productcatalogus met prijzen en voorraad',
        endpoint: '/api/export/products',
        filters: [
            { key: 'includeInactive', label: 'Inclusief inactieve producten', type: 'checkbox' },
            { key: 'lowStockOnly', label: 'Alleen lage voorraad', type: 'checkbox' },
        ],
    },
    {
        id: 'customers',
        name: 'Klanten',
        description: 'Klantenlijst met contactgegevens en besteloverzicht',
        endpoint: '/api/export/customers',
        filters: [
            { key: 'includeInactive', label: 'Inclusief inactieve accounts', type: 'checkbox' },
            { key: 'vipOnly', label: 'Alleen VIP klanten', type: 'checkbox' },
        ],
    },
    {
        id: 'refunds',
        name: 'Terugbetalingen',
        description: 'Overzicht van alle terugbetalingen en retouren',
        endpoint: '/api/export/refunds',
        filters: [
            { key: 'startDate', label: 'Vanaf datum', type: 'date' },
            { key: 'endDate', label: 'Tot datum', type: 'date' },
        ],
    },
    {
        id: 'reviews',
        name: 'Reviews',
        description: 'Alle productbeoordelingen van klanten',
        endpoint: '/api/export/reviews',
    },
];

// Quarter options
export const QUARTER_OPTIONS = [
    { value: 1, label: 'Q1 (Jan - Mar)' },
    { value: 2, label: 'Q2 (Apr - Jun)' },
    { value: 3, label: 'Q3 (Jul - Sep)' },
    { value: 4, label: 'Q4 (Oct - Dec)' },
];

// Helpers
export const getCurrentQuarter = (): number => Math.ceil((new Date().getMonth() + 1) / 3);
export const getCurrentYear = (): number => new Date().getFullYear();
export const getYearOptions = (count = 5): number[] =>
    Array.from({ length: count }, (_, i) => getCurrentYear() - i);

export interface UseExportReturn {
    // General export state
    exportOptions: ExportOption[];
    exporting: string | null;
    exported: string[];
    filters: Record<string, Record<string, string | boolean>>;

    // Accounting export state
    selectedQuarter: number;
    selectedYear: number;
    accountingExporting: string | null;
    accountingExported: string[];
    quarterOptions: typeof QUARTER_OPTIONS;
    yearOptions: number[];

    // Actions
    handleExport: (option: ExportOption) => Promise<boolean>;
    handleAccountingExport: (type: AccountingExportType) => Promise<boolean>;
    updateFilter: (optionId: string, key: string, value: string | boolean) => void;
    setSelectedQuarter: (quarter: number) => void;
    setSelectedYear: (year: number) => void;
    resetToCurrentQuarter: () => void;

    // Helpers
    isExporting: (optionId: string) => boolean;
    wasExported: (optionId: string) => boolean;
}

export function useExport(): UseExportReturn {
    // General export state
    const [exporting, setExporting] = useState<string | null>(null);
    const [exported, setExported] = useState<string[]>([]);
    const [filters, setFilters] = useState<Record<string, Record<string, string | boolean>>>({});

    // Accounting export state
    const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
    const [selectedYear, setSelectedYear] = useState(getCurrentYear());
    const [accountingExporting, setAccountingExporting] = useState<string | null>(null);
    const [accountingExported, setAccountingExported] = useState<string[]>([]);

    const yearOptions = useMemo(() => getYearOptions(), []);

    // Download helper
    const downloadBlob = useCallback((blob: Blob, filename: string) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    }, []);

    // Handle general export
    const handleExport = useCallback(async (option: ExportOption): Promise<boolean> => {
        setExporting(option.id);
        try {
            const token = localStorage.getItem('adminAccessToken');
            const params = new URLSearchParams();

            // Add filters
            const optionFilters = filters[option.id] || {};
            Object.entries(optionFilters).forEach(([key, value]) => {
                if (value !== undefined && value !== '' && value !== false) {
                    params.append(key, String(value));
                }
            });

            const response = await fetch(`${option.endpoint}?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const filename = `${option.id}-${new Date().toISOString().split('T')[0]}.csv`;
                downloadBlob(blob, filename);
                setExported(prev => [...prev, option.id]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        } finally {
            setExporting(null);
        }
    }, [filters, downloadBlob]);

    // Handle accounting export
    const handleAccountingExport = useCallback(async (type: AccountingExportType): Promise<boolean> => {
        setAccountingExporting(type);
        try {
            const token = localStorage.getItem('adminAccessToken');
            let endpoint = '';
            let filename = '';

            if (type === 'btw') {
                endpoint = `/api/export/btw-aangifte?quarter=${selectedQuarter}&year=${selectedYear}`;
                filename = `btw-aangifte-Q${selectedQuarter}-${selectedYear}.csv`;
            } else if (type === 'accountant') {
                endpoint = `/api/export/accountant?quarter=${selectedQuarter}&year=${selectedYear}`;
                filename = `boekhouding-Q${selectedQuarter}-${selectedYear}.csv`;
            } else {
                endpoint = `/api/export/annual-summary?year=${selectedYear}`;
                filename = `jaaroverzicht-${selectedYear}.csv`;
            }

            const response = await fetch(endpoint, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                downloadBlob(blob, filename);
                setAccountingExported(prev => [...prev, type]);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        } finally {
            setAccountingExporting(null);
        }
    }, [selectedQuarter, selectedYear, downloadBlob]);

    // Update filter
    const updateFilter = useCallback((optionId: string, key: string, value: string | boolean) => {
        setFilters(prev => ({
            ...prev,
            [optionId]: {
                ...(prev[optionId] || {}),
                [key]: value,
            },
        }));
    }, []);

    // Reset to current quarter
    const resetToCurrentQuarter = useCallback(() => {
        setSelectedQuarter(getCurrentQuarter());
        setSelectedYear(getCurrentYear());
    }, []);

    // Helper checks
    const isExporting = useCallback((optionId: string): boolean => {
        return exporting === optionId;
    }, [exporting]);

    const wasExported = useCallback((optionId: string): boolean => {
        return exported.includes(optionId);
    }, [exported]);

    return {
        // General export state
        exportOptions: EXPORT_OPTIONS,
        exporting,
        exported,
        filters,

        // Accounting export state
        selectedQuarter,
        selectedYear,
        accountingExporting,
        accountingExported,
        quarterOptions: QUARTER_OPTIONS,
        yearOptions,

        // Actions
        handleExport,
        handleAccountingExport,
        updateFilter,
        setSelectedQuarter,
        setSelectedYear,
        resetToCurrentQuarter,

        // Helpers
        isExporting,
        wasExported,
    };
}
