/**
 * Dashboard Admin Hook
 * 
 * Business logic for admin dashboard page.
 * Handles stats, analytics, orders, low stock, and export.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

// Types
export interface DashboardStats {
    totalProducts: number;
    totalOrders: number;
    pendingOrders: number;
    processingOrders: number;
    revenueToday: number;
    revenueThisMonth: number;
    lowStockItems: number;
    totalUsers: number;
    totalAppointments: number;
    upcomingAppointments: number;
}

export interface RecentOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    createdAt: string;
}

export interface RevenueData {
    date: string;
    revenue: number;
}

export interface Trends {
    weekly: { current: { revenue: number; orders: number }; previous: { revenue: number; orders: number }; change: number };
    monthly: { current: { revenue: number; orders: number }; previous: { revenue: number; orders: number }; change: number };
}

export interface Bestseller {
    productId: string;
    name: string;
    price: number;
    image: string | null;
    totalSold: number;
    revenue: number;
}

export interface LowStockProduct {
    id: string;
    name: string;
    stockQty: number;
    lowStockThreshold: number;
    image?: string | null;
}

export interface UseDashboardReturn {
    // Data
    stats: DashboardStats;
    recentOrders: RecentOrder[];
    revenueData: RevenueData[];
    trends: Trends | null;
    bestsellers: Bestseller[];
    lowStockProducts: LowStockProduct[];

    // Loading
    isLoading: boolean;
    isRefreshing: boolean;

    // Chart
    activeChartPeriod: 7 | 14 | 30;
    setActiveChartPeriod: (period: 7 | 14 | 30) => void;
    maxRevenue: number;

    // Actions
    refresh: () => Promise<void>;
    handleExport: (type: 'revenue' | 'orders' | 'products') => Promise<void>;
}

const DEFAULT_STATS: DashboardStats = {
    totalProducts: 0, totalOrders: 0, pendingOrders: 0, processingOrders: 0,
    revenueToday: 0, revenueThisMonth: 0, lowStockItems: 0, totalUsers: 0,
    totalAppointments: 0, upcomingAppointments: 0,
};

export function useDashboard(): UseDashboardReturn {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>(DEFAULT_STATS);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [trends, setTrends] = useState<Trends | null>(null);
    const [bestsellers, setBestsellers] = useState<Bestseller[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeChartPeriod, setActiveChartPeriod] = useState<7 | 14 | 30>(30);

    const loadDashboard = useCallback(async () => {
        try {
            const token = localStorage.getItem('adminAccessToken');
            const headers = { Authorization: `Bearer ${token}` };

            const [productsRes, ordersRes, usersRes, appointmentsRes, revenueRes, trendsRes, bestsellersRes] = await Promise.all([
                api.getProducts({ limit: 1 }),
                fetch('/api/orders/admin/all', { headers }).then(r => r.json()).catch(() => []),
                fetch('/api/users?limit=1', { headers }).then(r => r.json()).catch(() => ({ meta: { total: 0 } })),
                fetch('/api/appointments', { headers }).then(r => r.json()).catch(() => []),
                fetch(`/api/analytics/revenue?days=${activeChartPeriod}`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
                fetch('/api/analytics/trends', { headers }).then(r => r.json()).catch(() => null),
                fetch('/api/analytics/bestsellers?limit=5', { headers }).then(r => r.json()).catch(() => []),
            ]);

            const today = new Date(); today.setHours(0, 0, 0, 0);
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

            const orders = Array.isArray(ordersRes) ? ordersRes : [];
            const pendingOrders = orders.filter((o: RecentOrder) => o.status === 'PENDING').length;
            const processingOrders = orders.filter((o: RecentOrder) => o.status === 'PROCESSING' || o.status === 'PAID').length;

            const todaysOrders = orders.filter((o: RecentOrder) => new Date(o.createdAt) >= today && o.status !== 'CANCELLED');
            const revenueToday = todaysOrders.reduce((sum: number, o: RecentOrder) => sum + Number(o.total), 0);

            const monthOrders = orders.filter((o: RecentOrder) => new Date(o.createdAt) >= monthStart && o.status !== 'CANCELLED');
            const revenueThisMonth = monthOrders.reduce((sum: number, o: RecentOrder) => sum + Number(o.total), 0);

            const allProducts = await api.getProducts({ limit: 500 });
            interface ProductWithStock { id: string; name: string; stockQty: number; lowStockThreshold?: number; images?: { url: string; isPrimary: boolean }[] }
            const lowStock: LowStockProduct[] = allProducts.data
                .filter((p: ProductWithStock) => p.stockQty <= (p.lowStockThreshold || 5) && p.stockQty >= 0)
                .map((p: ProductWithStock) => ({
                    id: p.id, name: p.name, stockQty: p.stockQty,
                    lowStockThreshold: p.lowStockThreshold || 5,
                    image: p.images?.find((img: { url: string; isPrimary: boolean }) => img.isPrimary)?.url || p.images?.[0]?.url || null,
                }))
                .sort((a: LowStockProduct, b: LowStockProduct) => a.stockQty - b.stockQty);

            interface AppointmentRecord { appointmentDate: string; status: string }
            const appointments = Array.isArray(appointmentsRes) ? appointmentsRes : [];
            const upcomingAppointments = appointments.filter((a: AppointmentRecord) => new Date(a.appointmentDate) >= today && a.status === 'CONFIRMED').length;

            setStats({
                totalProducts: productsRes.meta?.total || 0, totalOrders: orders.length,
                pendingOrders, processingOrders, revenueToday, revenueThisMonth,
                lowStockItems: lowStock.length, totalUsers: usersRes.meta?.total || 0,
                totalAppointments: appointments.length, upcomingAppointments,
            });

            setRevenueData(revenueRes?.data || []);
            setTrends(trendsRes);
            setBestsellers(bestsellersRes || []);
            setLowStockProducts(lowStock);

            setRecentOrders(orders.slice(0, 5).map((order: RecentOrder) => ({
                id: order.id, orderNumber: order.orderNumber, customerName: order.customerName,
                customerEmail: order.customerEmail, total: Number(order.total),
                status: order.status, createdAt: order.createdAt,
            })));
        } catch (error) {
            console.error('Failed to load dashboard:', error);
        } finally {
            setIsLoading(false);
        }
    }, [activeChartPeriod]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await loadDashboard();
        setIsRefreshing(false);
    }, [loadDashboard]);

    const handleExport = useCallback(async (type: 'revenue' | 'orders' | 'products') => {
        const token = localStorage.getItem('adminAccessToken');
        try {
            const response = await fetch(`/api/analytics/export?type=${type}&days=30`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (error) {
            console.error('Export failed:', error);
        }
    }, []);

    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);

    const maxRevenue = useMemo(() => Math.max(...revenueData.map(d => d.revenue), 1), [revenueData]);

    return {
        stats, recentOrders, revenueData, trends, bestsellers, lowStockProducts,
        isLoading, isRefreshing, activeChartPeriod, setActiveChartPeriod, maxRevenue,
        refresh, handleExport,
    };
}
