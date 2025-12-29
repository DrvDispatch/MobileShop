"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
    Package,
    ShoppingCart,
    DollarSign,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Clock,
    Calendar,
    Users,
    Loader2,
    ChevronRight,
    Truck,
    CheckCircle,
    XCircle,
    RefreshCw,
    Download,
    BarChart3,
    Star,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface DashboardStats {
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

interface RecentOrder {
    id: string;
    orderNumber: string;
    customerName: string;
    customerEmail: string;
    total: number;
    status: string;
    createdAt: string;
}

interface RevenueData {
    date: string;
    revenue: number;
}

interface Trends {
    weekly: {
        current: { revenue: number; orders: number };
        previous: { revenue: number; orders: number };
        change: number;
    };
    monthly: {
        current: { revenue: number; orders: number };
        previous: { revenue: number; orders: number };
        change: number;
    };
}

interface Bestseller {
    productId: string;
    name: string;
    price: number;
    image: string | null;
    totalSold: number;
    revenue: number;
}

interface LowStockProduct {
    id: string;
    name: string;
    stockQty: number;
    lowStockThreshold: number;
    image?: string | null;
}

const STATUS_CONFIG: Record<string, { color: string; icon: React.ElementType }> = {
    PENDING: { color: "bg-yellow-100 text-yellow-700", icon: Clock },
    PAID: { color: "bg-blue-100 text-blue-700", icon: CheckCircle },
    PROCESSING: { color: "bg-blue-100 text-blue-700", icon: Package },
    SHIPPED: { color: "bg-purple-100 text-purple-700", icon: Truck },
    DELIVERED: { color: "bg-green-100 text-green-700", icon: CheckCircle },
    CANCELLED: { color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function AdminDashboard() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalProducts: 0,
        totalOrders: 0,
        pendingOrders: 0,
        processingOrders: 0,
        revenueToday: 0,
        revenueThisMonth: 0,
        lowStockItems: 0,
        totalUsers: 0,
        totalAppointments: 0,
        upcomingAppointments: 0,
    });
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
    const [trends, setTrends] = useState<Trends | null>(null);
    const [bestsellers, setBestsellers] = useState<Bestseller[]>([]);
    const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeChartPeriod, setActiveChartPeriod] = useState<7 | 14 | 30>(30);

    const loadDashboard = async () => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch all data in parallel
            const [productsRes, ordersRes, usersRes, appointmentsRes, revenueRes, trendsRes, bestsellersRes] = await Promise.all([
                api.getProducts({ limit: 1 }),
                fetch(`${API_URL}/api/orders/admin/all`, { headers }).then(r => r.json()),
                fetch(`${API_URL}/api/users?limit=1`, { headers }).then(r => r.json()).catch(() => ({ meta: { total: 0 } })),
                fetch(`${API_URL}/api/appointments`, { headers }).then(r => r.json()).catch(() => []),
                fetch(`${API_URL}/api/analytics/revenue?days=${activeChartPeriod}`, { headers }).then(r => r.json()).catch(() => ({ data: [] })),
                fetch(`${API_URL}/api/analytics/trends`, { headers }).then(r => r.json()).catch(() => null),
                fetch(`${API_URL}/api/analytics/bestsellers?limit=5`, { headers }).then(r => r.json()).catch(() => []),
            ]);

            // Calculate stats from orders
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

            const orders = Array.isArray(ordersRes) ? ordersRes : [];
            const pendingOrders = orders.filter((o: RecentOrder) => o.status === "PENDING").length;
            const processingOrders = orders.filter((o: RecentOrder) => o.status === "PROCESSING" || o.status === "PAID").length;

            const todaysOrders = orders.filter((o: RecentOrder) => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= today && o.status !== "CANCELLED";
            });
            const revenueToday = todaysOrders.reduce((sum: number, o: RecentOrder) => sum + Number(o.total), 0);

            const monthOrders = orders.filter((o: RecentOrder) => {
                const orderDate = new Date(o.createdAt);
                return orderDate >= monthStart && o.status !== "CANCELLED";
            });
            const revenueThisMonth = monthOrders.reduce((sum: number, o: RecentOrder) => sum + Number(o.total), 0);

            // Count low stock products and get their details
            const allProducts = await api.getProducts({ limit: 500 });
            const lowStock = allProducts.data
                .filter((p: { stockQty: number; lowStockThreshold?: number }) =>
                    p.stockQty <= (p.lowStockThreshold || 5) && p.stockQty >= 0
                )
                .map((p: { id: string; name: string; stockQty: number; lowStockThreshold?: number; images?: { url: string; isPrimary?: boolean }[] }) => ({
                    id: p.id,
                    name: p.name,
                    stockQty: p.stockQty,
                    lowStockThreshold: p.lowStockThreshold || 5,
                    image: p.images?.find((img: { isPrimary?: boolean }) => img.isPrimary)?.url || p.images?.[0]?.url || null,
                }))
                .sort((a: { stockQty: number }, b: { stockQty: number }) => a.stockQty - b.stockQty); // Sort by lowest stock first

            // Count appointments
            const appointments = Array.isArray(appointmentsRes) ? appointmentsRes : [];
            const upcomingAppointments = appointments.filter((a: { appointmentDate: string; status: string }) => {
                const apptDate = new Date(a.appointmentDate);
                return apptDate >= today && a.status === "CONFIRMED";
            }).length;

            setStats({
                totalProducts: productsRes.meta?.total || 0,
                totalOrders: orders.length,
                pendingOrders,
                processingOrders,
                revenueToday,
                revenueThisMonth,
                lowStockItems: lowStock.length,
                totalUsers: usersRes.meta?.total || 0,
                totalAppointments: appointments.length,
                upcomingAppointments,
            });

            // Set analytics data
            setRevenueData(revenueRes?.data || []);
            setTrends(trendsRes);
            setBestsellers(bestsellersRes || []);
            setLowStockProducts(lowStock);

            // Get recent orders (last 5)
            const recent = orders.slice(0, 5).map((order: RecentOrder) => ({
                id: order.id,
                orderNumber: order.orderNumber,
                customerName: order.customerName,
                customerEmail: order.customerEmail,
                total: Number(order.total),
                status: order.status,
                createdAt: order.createdAt,
            }));
            setRecentOrders(recent);
        } catch (error) {
            console.error("Failed to load dashboard:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await loadDashboard();
        setIsRefreshing(false);
    };

    const handleExport = async (type: 'revenue' | 'orders' | 'products') => {
        const token = localStorage.getItem("adminAccessToken");
        try {
            const response = await fetch(`${API_URL}/api/analytics/export?type=${type}&days=30`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (error) {
            console.error("Export failed:", error);
        }
    };

    useEffect(() => {
        loadDashboard();
    }, [activeChartPeriod]);

    // Calculate max revenue for chart scaling
    const maxRevenue = Math.max(...revenueData.map(d => d.revenue), 1);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
                    <p className="text-zinc-500">Welkom terug! Hier is een overzicht van vandaag.</p>
                </div>
                <div className="flex gap-2">
                    <div className="relative">
                        <Button variant="outline" size="sm" onClick={() => handleExport('orders')}>
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Revenue Today */}
                <Link href="/admin/orders" className="block">
                    <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl p-5 text-white hover:shadow-lg transition-shadow">
                        <div className="flex items-center justify-between mb-3">
                            <DollarSign className="w-8 h-8 opacity-80" />
                            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Vandaag</span>
                        </div>
                        <p className="text-3xl font-bold">€{stats.revenueToday.toFixed(2)}</p>
                        <p className="text-sm opacity-80">Omzet vandaag</p>
                    </div>
                </Link>

                {/* Revenue This Month with Trend */}
                <div className="bg-white rounded-xl border border-zinc-200 p-5 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-500" />
                        {trends && (
                            <span className={`text-xs px-2 py-1 rounded-full font-medium flex items-center gap-1 ${trends.monthly.change >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                }`}>
                                {trends.monthly.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {Math.abs(trends.monthly.change)}%
                            </span>
                        )}
                    </div>
                    <p className="text-2xl font-bold text-zinc-900">€{stats.revenueThisMonth.toFixed(2)}</p>
                    <p className="text-sm text-zinc-500">Omzet deze maand</p>
                </div>

                {/* Pending Orders */}
                <Link href="/admin/orders?status=PENDING" className="block">
                    <div className={`rounded-xl p-5 border transition-shadow hover:shadow-md ${stats.pendingOrders > 0 ? "bg-yellow-50 border-yellow-200" : "bg-white border-zinc-200"
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <Clock className={`w-6 h-6 ${stats.pendingOrders > 0 ? "text-yellow-600" : "text-zinc-400"}`} />
                            {stats.pendingOrders > 0 && (
                                <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full font-medium">
                                    Actie vereist
                                </span>
                            )}
                        </div>
                        <p className={`text-2xl font-bold ${stats.pendingOrders > 0 ? "text-yellow-700" : "text-zinc-900"}`}>
                            {stats.pendingOrders}
                        </p>
                        <p className={`text-sm ${stats.pendingOrders > 0 ? "text-yellow-600" : "text-zinc-500"}`}>
                            Wachtend op betaling
                        </p>
                    </div>
                </Link>

                {/* Processing Orders */}
                <Link href="/admin/orders?status=PROCESSING" className="block">
                    <div className={`rounded-xl p-5 border transition-shadow hover:shadow-md ${stats.processingOrders > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-zinc-200"
                        }`}>
                        <div className="flex items-center justify-between mb-3">
                            <Package className={`w-6 h-6 ${stats.processingOrders > 0 ? "text-blue-600" : "text-zinc-400"}`} />
                        </div>
                        <p className={`text-2xl font-bold ${stats.processingOrders > 0 ? "text-blue-700" : "text-zinc-900"}`}>
                            {stats.processingOrders}
                        </p>
                        <p className={`text-sm ${stats.processingOrders > 0 ? "text-blue-600" : "text-zinc-500"}`}>
                            Te verwerken
                        </p>
                    </div>
                </Link>
            </div>

            {/* Revenue Chart */}
            <div className="bg-white rounded-xl border border-zinc-200 p-5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-zinc-600" />
                        <h2 className="font-semibold text-zinc-900">Omzet Overzicht</h2>
                    </div>
                    <div className="flex gap-1">
                        {([7, 14, 30] as const).map(days => (
                            <button
                                key={days}
                                onClick={() => setActiveChartPeriod(days)}
                                className={`px-3 py-1 text-sm rounded-lg transition-colors ${activeChartPeriod === days
                                    ? "bg-zinc-900 text-white"
                                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                                    }`}
                            >
                                {days}d
                            </button>
                        ))}
                    </div>
                </div>

                {/* Chart with Y-Axis */}
                <div className="flex gap-3">
                    {/* Y-Axis Labels */}
                    <div className="flex flex-col justify-between text-xs text-zinc-400 py-1 w-12 text-right">
                        <span>€{maxRevenue > 0 ? Math.round(maxRevenue).toLocaleString() : '0'}</span>
                        <span>€{maxRevenue > 0 ? Math.round(maxRevenue * 0.75).toLocaleString() : '0'}</span>
                        <span>€{maxRevenue > 0 ? Math.round(maxRevenue * 0.5).toLocaleString() : '0'}</span>
                        <span>€{maxRevenue > 0 ? Math.round(maxRevenue * 0.25).toLocaleString() : '0'}</span>
                        <span>€0</span>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-1 relative">
                        {/* Grid Lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className="border-t border-zinc-100 w-full" />
                            ))}
                        </div>

                        {/* Bars */}
                        <div className="h-52 flex items-end gap-0.5 relative z-10">
                            {revenueData.slice(-activeChartPeriod).map((day) => {
                                const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                                const hasRevenue = day.revenue > 0;
                                return (
                                    <div
                                        key={day.date}
                                        className="flex-1 h-full group relative flex flex-col justify-end"
                                    >
                                        <div
                                            className={`w-full rounded-t-sm transition-all cursor-pointer ${hasRevenue
                                                ? "bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300"
                                                : "bg-zinc-100 hover:bg-zinc-200"
                                                }`}
                                            style={{ height: `${Math.max(height, hasRevenue ? 4 : 1)}%` }}
                                        />
                                        {/* Tooltip */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900 text-white text-xs px-3 py-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-lg">
                                            <div className="font-semibold">€{day.revenue.toLocaleString('nl-NL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                            <div className="text-zinc-400 text-[10px]">
                                                {new Date(day.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric', month: 'short' })}
                                            </div>
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* X-Axis Labels */}
                <div className="flex ml-14 mt-2">
                    <div className="flex-1 flex justify-between text-xs text-zinc-400">
                        <span>{revenueData.slice(-activeChartPeriod)[0]?.date?.split('-').slice(1).join('/')}</span>
                        <span>{revenueData.slice(-activeChartPeriod)[Math.floor(activeChartPeriod / 2)]?.date?.split('-').slice(1).join('/')}</span>
                        <span>{revenueData[revenueData.length - 1]?.date?.split('-').slice(1).join('/')}</span>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-4 mt-5 pt-5 border-t border-zinc-100">
                    <div className="text-center">
                        <p className="text-2xl font-bold text-emerald-600">
                            €{revenueData.slice(-activeChartPeriod).reduce((sum, d) => sum + d.revenue, 0).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-zinc-500">Totaal {activeChartPeriod} dagen</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-zinc-900">
                            €{(revenueData.slice(-activeChartPeriod).reduce((sum, d) => sum + d.revenue, 0) / activeChartPeriod).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </p>
                        <p className="text-xs text-zinc-500">Gem. per dag</p>
                    </div>
                    <div className="text-center">
                        <p className="text-2xl font-bold text-zinc-900">
                            {revenueData.slice(-activeChartPeriod).filter(d => d.revenue > 0).length}
                        </p>
                        <p className="text-xs text-zinc-500">Dagen met omzet</p>
                    </div>
                </div>
            </div>

            {/* Secondary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/admin/orders" className="block">
                    <div className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <ShoppingCart className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-900">{stats.totalOrders}</p>
                                <p className="text-sm text-zinc-500">Bestellingen</p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/products" className="block">
                    <div className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <Package className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-900">{stats.totalProducts}</p>
                                <p className="text-sm text-zinc-500">Producten</p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/users" className="block">
                    <div className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <Users className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-900">{stats.totalUsers}</p>
                                <p className="text-sm text-zinc-500">Gebruikers</p>
                            </div>
                        </div>
                    </div>
                </Link>

                <Link href="/admin/appointments" className="block">
                    <div className="bg-white rounded-xl border border-zinc-200 p-4 hover:shadow-md transition-all group">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-zinc-100 rounded-lg">
                                <Calendar className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <p className="text-xl font-bold text-zinc-900">{stats.upcomingAppointments}</p>
                                <p className="text-sm text-zinc-500">Afspraken</p>
                            </div>
                        </div>
                    </div>
                </Link>
            </div>

            {/* Two Column Layout: Bestsellers + Recent Orders */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Bestselling Products */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-500" />
                            <h2 className="font-semibold text-zinc-900">Bestsellers</h2>
                        </div>
                    </div>
                    {bestsellers.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Nog geen verkopen</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {bestsellers.map((product, index) => (
                                <div key={product.productId} className="p-4 flex items-center gap-4">
                                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? "bg-yellow-100 text-yellow-700" :
                                        index === 1 ? "bg-zinc-200 text-zinc-700" :
                                            index === 2 ? "bg-orange-100 text-orange-700" :
                                                "bg-zinc-100 text-zinc-500"
                                        }`}>
                                        {index + 1}
                                    </span>
                                    <div className="w-10 h-10 bg-zinc-100 rounded flex-shrink-0">
                                        {product.image && (
                                            <img src={product.image} alt="" className="w-full h-full object-cover rounded" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-zinc-900 truncate">{product.name}</p>
                                        <p className="text-sm text-zinc-500">{product.totalSold} verkocht</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-green-600">€{product.revenue.toFixed(0)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Recent Orders */}
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                    <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                        <h2 className="font-semibold text-zinc-900">Recente Bestellingen</h2>
                        <Link href="/admin/orders">
                            <Button variant="ghost" size="sm">
                                Bekijk alle <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="p-8 text-center text-zinc-500">
                            <ShoppingCart className="w-12 h-12 mx-auto mb-3 opacity-30" />
                            <p>Nog geen bestellingen</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-100">
                            {recentOrders.map((order) => {
                                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
                                const StatusIcon = statusConfig.icon;
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                                        className="p-4 hover:bg-zinc-50 cursor-pointer transition-colors flex items-center gap-4"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-medium text-zinc-900">{order.orderNumber}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium inline-flex items-center gap-1 ${statusConfig.color}`}>
                                                    <StatusIcon className="w-3 h-3" />
                                                    {order.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-zinc-500 truncate">{order.customerName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-zinc-900">€{order.total.toFixed(2)}</p>
                                            <p className="text-xs text-zinc-400">
                                                {new Date(order.createdAt).toLocaleDateString("nl-NL", {
                                                    day: "numeric",
                                                    month: "short",
                                                })}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-zinc-400" />
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Alert Section - Detailed */}
            {lowStockProducts.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl overflow-hidden">
                    <div className="p-4 flex items-center gap-4 border-b border-amber-200">
                        <div className="p-3 bg-amber-100 rounded-lg">
                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-amber-800">
                                {lowStockProducts.length} {lowStockProducts.length === 1 ? "product" : "producten"} met lage voorraad
                            </p>
                            <p className="text-sm text-amber-600">Voorraad bijna op - vul aan om zendingen niet te missen</p>
                        </div>
                        <Link href="/admin/inventory">
                            <Button variant="outline" size="sm" className="bg-white border-amber-300 text-amber-700 hover:bg-amber-100">
                                Voorraadbeheer
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </div>
                    <div className="divide-y divide-amber-100">
                        {lowStockProducts.slice(0, 5).map((product) => (
                            <div
                                key={product.id}
                                onClick={() => router.push(`/admin/products/${product.id}/edit`)}
                                className="p-3 flex items-center gap-3 hover:bg-amber-100/50 cursor-pointer transition-colors"
                            >
                                <div className="w-10 h-10 bg-white rounded border border-amber-200 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                    {product.image ? (
                                        <img src={product.image} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <Package className="w-5 h-5 text-amber-400" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-zinc-900 truncate">{product.name}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-bold ${product.stockQty === 0
                                            ? "bg-red-100 text-red-700"
                                            : product.stockQty <= 2
                                                ? "bg-orange-100 text-orange-700"
                                                : "bg-yellow-100 text-yellow-700"
                                        }`}>
                                        {product.stockQty === 0 ? (
                                            <>
                                                <XCircle className="w-3 h-3" />
                                                Uitverkocht
                                            </>
                                        ) : (
                                            <>
                                                {product.stockQty} stuks
                                            </>
                                        )}
                                    </span>
                                </div>
                                <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0" />
                            </div>
                        ))}
                    </div>
                    {lowStockProducts.length > 5 && (
                        <Link href="/admin/products?stock=low" className="block">
                            <div className="p-3 text-center text-sm font-medium text-amber-700 hover:bg-amber-100 transition-colors border-t border-amber-200">
                                + {lowStockProducts.length - 5} meer bekijken
                            </div>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}
