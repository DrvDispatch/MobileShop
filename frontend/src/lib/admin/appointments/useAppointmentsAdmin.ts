/**
 * Appointments Admin Hook
 * 
 * Business logic for admin appointments page.
 * Uses shared admin utilities and adds appointment-specific functionality.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    adminFetch,
    APPOINTMENT_STATUS_CONFIG,
    PRIORITY_CONFIG,
    REPAIR_TYPE_LABELS,
    TIME_SLOTS,
    getStatusConfig,
} from '@/lib/admin';

// Re-export configs
export { APPOINTMENT_STATUS_CONFIG, PRIORITY_CONFIG, REPAIR_TYPE_LABELS, TIME_SLOTS };

// Types
export interface Appointment {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription?: string;
    damageImageUrl?: string;
    appointmentDate: string;
    timeSlot: string;
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    priority: 'NORMAL' | 'URGENT' | 'VIP';
    adminNotes?: string;
    repairDuration?: number;
    createdAt: string;
}

export type DateRange = 'all' | 'today' | 'week' | 'month';
export type ViewMode = 'list' | 'calendar';

export interface UseAppointmentsAdminOptions {
    autoRefresh?: boolean;
    refreshInterval?: number;
}

export interface UseAppointmentsAdminReturn {
    // Data
    appointments: Appointment[];
    filteredAppointments: Appointment[];

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;
    isSaving: boolean;
    error: string | null;

    // Filters
    filterStatus: string;
    setFilterStatus: (status: string) => void;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;

    // View mode
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    showAnalytics: boolean;
    setShowAnalytics: (show: boolean) => void;
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;

    // Selection
    selectedAppointment: Appointment | null;
    selectAppointment: (appointment: Appointment | null) => void;

    // Editing state
    editingNotes: string;
    setEditingNotes: (notes: string) => void;
    editingDuration: number | '';
    setEditingDuration: (duration: number | '') => void;
    editingPriority: 'NORMAL' | 'URGENT' | 'VIP';
    setEditingPriority: (priority: 'NORMAL' | 'URGENT' | 'VIP') => void;

    // Reschedule
    isRescheduling: boolean;
    setIsRescheduling: (rescheduling: boolean) => void;
    rescheduleDate: string;
    setRescheduleDate: (date: string) => void;
    rescheduleTime: string;
    setRescheduleTime: (time: string) => void;
    availableSlots: string[];

    // Actions
    refresh: () => Promise<void>;
    updateAppointment: (id: string, data: Partial<Appointment>) => Promise<boolean>;
    updateStatus: (id: string, status: Appointment['status']) => Promise<boolean>;
    deleteAppointment: (id: string) => Promise<boolean>;
    handleReschedule: () => Promise<boolean>;
    handleSaveDetails: () => Promise<boolean>;
    exportToCSV: () => void;

    // Analytics
    analytics: {
        total: number;
        confirmed: number;
        completed: number;
        cancelled: number;
        noShow: number;
        todayCount: number;
        completionRate: number;
    };
}

export function useAppointmentsAdmin(
    options: UseAppointmentsAdminOptions = {}
): UseAppointmentsAdminReturn {
    const { autoRefresh = false, refreshInterval = 30000 } = options;

    // Core data state
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filter state
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState<DateRange>('all');

    // View state
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [showAnalytics, setShowAnalytics] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Selection state
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // Editing state
    const [editingNotes, setEditingNotes] = useState('');
    const [editingDuration, setEditingDuration] = useState<number | ''>('');
    const [editingPriority, setEditingPriority] = useState<'NORMAL' | 'URGENT' | 'VIP'>('NORMAL');

    // Reschedule state
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState('');
    const [rescheduleTime, setRescheduleTime] = useState('');
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // Fetch appointments
    const fetchAppointments = useCallback(async (silent = false) => {
        if (!silent) setIsLoading(true);
        if (silent) setIsRefreshing(true);
        setError(null);

        try {
            const data = await adminFetch<Appointment[]>('/api/appointments');
            setAppointments(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Error fetching appointments');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchAppointments();

        // Request notification permission
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [fetchAppointments]);

    // Auto refresh
    useEffect(() => {
        if (!autoRefresh) return;
        const interval = setInterval(() => fetchAppointments(true), refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, refreshInterval, fetchAppointments]);

    // Populate edit fields when selecting appointment
    useEffect(() => {
        if (selectedAppointment) {
            setEditingNotes(selectedAppointment.adminNotes || '');
            setEditingDuration(selectedAppointment.repairDuration || '');
            setEditingPriority(selectedAppointment.priority || 'NORMAL');
            setIsRescheduling(false);
            setRescheduleDate('');
            setRescheduleTime('');
        }
    }, [selectedAppointment]);

    // Fetch available slots when reschedule date changes
    useEffect(() => {
        if (!rescheduleDate) return;

        adminFetch<{ slots: string[] }>(`/api/appointments/slots?date=${rescheduleDate}`)
            .then(data => setAvailableSlots(data.slots || []))
            .catch(() => setAvailableSlots(TIME_SLOTS));
    }, [rescheduleDate]);

    // Filtered appointments
    const filteredAppointments = useMemo(() => {
        let filtered = [...appointments];

        // Status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(a => a.status === filterStatus);
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.customerName.toLowerCase().includes(query) ||
                a.customerEmail.toLowerCase().includes(query) ||
                a.customerPhone.includes(query) ||
                a.deviceBrand.toLowerCase().includes(query) ||
                a.deviceModel.toLowerCase().includes(query)
            );
        }

        // Date range filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (dateRange === 'today') {
            filtered = filtered.filter(a => {
                const date = new Date(a.appointmentDate);
                date.setHours(0, 0, 0, 0);
                return date.getTime() === today.getTime();
            });
        } else if (dateRange === 'week') {
            const weekEnd = new Date(today);
            weekEnd.setDate(weekEnd.getDate() + 7);
            filtered = filtered.filter(a => {
                const date = new Date(a.appointmentDate);
                return date >= today && date <= weekEnd;
            });
        } else if (dateRange === 'month') {
            const monthEnd = new Date(today);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            filtered = filtered.filter(a => {
                const date = new Date(a.appointmentDate);
                return date >= today && date <= monthEnd;
            });
        }

        // Sort by date (newest first for past, soonest first for future)
        filtered.sort((a, b) =>
            new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
        );

        return filtered;
    }, [appointments, filterStatus, searchQuery, dateRange]);

    // Analytics
    const analytics = useMemo(() => {
        const today = new Date().toDateString();
        const todayAppts = appointments.filter(a =>
            new Date(a.appointmentDate).toDateString() === today
        );

        const completed = appointments.filter(a => a.status === 'COMPLETED').length;
        const total = appointments.length;

        return {
            total,
            confirmed: appointments.filter(a => a.status === 'CONFIRMED').length,
            completed,
            cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
            noShow: appointments.filter(a => a.status === 'NO_SHOW').length,
            todayCount: todayAppts.length,
            completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        };
    }, [appointments]);

    // Update appointment
    const updateAppointment = useCallback(async (id: string, data: Partial<Appointment>): Promise<boolean> => {
        setIsSaving(true);
        try {
            await adminFetch(`/api/appointments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            });
            await fetchAppointments(true);
            if (data.status) setSelectedAppointment(null);
            return true;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Update failed';
            alert(message);
            return false;
        } finally {
            setIsSaving(false);
        }
    }, [fetchAppointments]);

    // Update status
    const updateStatus = useCallback(async (id: string, status: Appointment['status']): Promise<boolean> => {
        return updateAppointment(id, { status });
    }, [updateAppointment]);

    // Delete appointment
    const deleteAppointment = useCallback(async (id: string): Promise<boolean> => {
        if (!confirm('Weet u zeker dat u deze afspraak wilt verwijderen?')) return false;

        try {
            await adminFetch(`/api/appointments/${id}`, { method: 'DELETE' });
            setAppointments(prev => prev.filter(a => a.id !== id));
            setSelectedAppointment(null);
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    }, []);

    // Handle reschedule
    const handleReschedule = useCallback(async (): Promise<boolean> => {
        if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return false;

        const success = await updateAppointment(selectedAppointment.id, {
            appointmentDate: rescheduleDate,
            timeSlot: rescheduleTime,
        });

        if (success) {
            setIsRescheduling(false);
            setSelectedAppointment(null);
        }
        return success;
    }, [selectedAppointment, rescheduleDate, rescheduleTime, updateAppointment]);

    // Handle save details
    const handleSaveDetails = useCallback(async (): Promise<boolean> => {
        if (!selectedAppointment) return false;

        return updateAppointment(selectedAppointment.id, {
            adminNotes: editingNotes || undefined,
            repairDuration: editingDuration || undefined,
            priority: editingPriority,
        });
    }, [selectedAppointment, editingNotes, editingDuration, editingPriority, updateAppointment]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        const headers = ['Datum', 'Tijd', 'Klant', 'Email', 'Telefoon', 'Toestel', 'Reparatie', 'Status', 'Prioriteit', 'Duur (min)', 'Notities'];
        const rows = filteredAppointments.map(a => [
            new Date(a.appointmentDate).toLocaleDateString('nl-NL'),
            a.timeSlot,
            a.customerName,
            a.customerEmail,
            a.customerPhone,
            `${a.deviceBrand} ${a.deviceModel}`,
            REPAIR_TYPE_LABELS[a.repairType] || a.repairType,
            getStatusConfig(a.status, APPOINTMENT_STATUS_CONFIG).label,
            PRIORITY_CONFIG[a.priority]?.label || a.priority,
            a.repairDuration || '',
            a.adminNotes || '',
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `afspraken-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }, [filteredAppointments]);

    // Refresh
    const refresh = useCallback(async () => {
        await fetchAppointments(true);
    }, [fetchAppointments]);

    // Select appointment
    const selectAppointment = useCallback((appointment: Appointment | null) => {
        setSelectedAppointment(appointment);
    }, []);

    return {
        // Data
        appointments,
        filteredAppointments,

        // Loading states
        isLoading,
        isRefreshing,
        isSaving,
        error,

        // Filters
        filterStatus,
        setFilterStatus,
        searchQuery,
        setSearchQuery,
        dateRange,
        setDateRange,

        // View mode
        viewMode,
        setViewMode,
        showAnalytics,
        setShowAnalytics,
        selectedDate,
        setSelectedDate,

        // Selection
        selectedAppointment,
        selectAppointment,

        // Editing state
        editingNotes,
        setEditingNotes,
        editingDuration,
        setEditingDuration,
        editingPriority,
        setEditingPriority,

        // Reschedule
        isRescheduling,
        setIsRescheduling,
        rescheduleDate,
        setRescheduleDate,
        rescheduleTime,
        setRescheduleTime,
        availableSlots,

        // Actions
        refresh,
        updateAppointment,
        updateStatus,
        deleteAppointment,
        handleReschedule,
        handleSaveDetails,
        exportToCSV,

        // Analytics
        analytics,
    };
}
