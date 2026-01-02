/**
 * Account Data Hook - User account page data fetching
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * 
 * This hook provides:
 * - User data from session
 * - Orders history
 * - Appointments history (optional)
 * - Loading and auth states
 * 
 * Can be used by any account page across themes.
 */

import { useState, useEffect, useCallback } from 'react';
import { api, getToken, removeToken } from '../api';

// Types
export interface OrderItem {
    productName: string;
    productImage?: string | null;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
}

export interface Appointment {
    id: string;
    customerName: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription: string;
    appointmentDate: string;
    timeSlot: string;
    status: string;
    createdAt: string;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    avatar?: string;
    phone?: string;
}

export interface UseAccountDataReturn {
    // User data
    user: User | null;

    // Orders
    orders: Order[];

    // Appointments
    appointments: Appointment[];

    // Status
    isLoading: boolean;
    needsLogin: boolean;

    // Actions
    logout: () => void;
    refreshData: () => Promise<void>;
}

// Status display configuration (shared)
export const ORDER_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "In afwachting" },
    PAID: { bg: "bg-blue-100", text: "text-blue-700", label: "Betaald" },
    PROCESSING: { bg: "bg-purple-100", text: "text-purple-700", label: "In behandeling" },
    SHIPPED: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Verzonden" },
    DELIVERED: { bg: "bg-green-100", text: "text-green-700", label: "Afgeleverd" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Geannuleerd" },
    REFUNDED: { bg: "bg-orange-100", text: "text-orange-700", label: "Terugbetaald" },
};

export const APPOINTMENT_STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    SCHEDULED: { bg: "bg-blue-100", text: "text-blue-700", label: "Gepland" },
    CONFIRMED: { bg: "bg-green-100", text: "text-green-700", label: "Bevestigd" },
    IN_PROGRESS: { bg: "bg-purple-100", text: "text-purple-700", label: "In behandeling" },
    COMPLETED: { bg: "bg-green-100", text: "text-green-700", label: "Afgerond" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Geannuleerd" },
};

export function getStatusConfig(status: string, configMap: Record<string, { bg: string; text: string; label: string }>) {
    return configMap[status] || { bg: "bg-zinc-100", text: "text-zinc-700", label: status };
}

/**
 * Download invoice for an order
 */
export async function downloadInvoice(orderId: string, orderNumber: string): Promise<void> {
    const token = getToken();

    try {
        const response = await fetch(`/api/invoice/my/${orderId}`, {
            credentials: 'include', // Include cookies for cookie-based auth
            headers: token && token !== 'cookie-based'
                ? { 'Authorization': `Bearer ${token}` }
                : undefined
        });

        if (!response.ok) {
            console.error('Invoice download failed:', response.status, response.statusText);
            return;
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `factuur-${orderNumber}.pdf`;
        a.click();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Failed to download invoice:', error);
    }
}

export function useAccountData(): UseAccountDataReturn {
    const [user, setUser] = useState<User | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [needsLogin, setNeedsLogin] = useState(false);

    // Load all data
    const loadData = useCallback(async () => {
        const token = getToken();
        if (!token) {
            setNeedsLogin(true);
            setIsLoading(false);
            return;
        }

        try {
            // Load user data
            const userData = await api.getMe();
            setUser(userData);

            // Load orders
            try {
                const ordersData = await api.getMyOrders(userData.email);
                setOrders(ordersData);
            } catch {
                console.error('Failed to load orders');
            }

            // Load appointments
            try {
                const appointmentsData = await api.getMyAppointments();
                setAppointments(appointmentsData);
            } catch {
                console.error('Failed to load appointments');
            }
        } catch (error) {
            console.error('Failed to load user:', error);
            removeToken();
            setNeedsLogin(true);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Logout
    const logout = useCallback(() => {
        removeToken();
        setUser(null);
        setOrders([]);
        setAppointments([]);
        setNeedsLogin(true);
    }, []);

    // Refresh data
    const refreshData = useCallback(async () => {
        setIsLoading(true);
        await loadData();
    }, [loadData]);

    return {
        user,
        orders,
        appointments,
        isLoading,
        needsLogin,
        logout,
        refreshData,
    };
}
