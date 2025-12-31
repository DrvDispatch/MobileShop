"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { SmartImage } from "@/components/ui/smart-image";
import { api, AuthResponse, removeToken } from "@/lib/api";
import {
    User, Package, Clock, Settings, LogOut, ChevronRight, Lock, Truck,
    ChevronDown, ChevronUp, ShoppingBag, Calendar, CreditCard, Star,
    Gift, Heart, Bell, Shield, FileDown
} from "lucide-react";

interface OrderItem {
    productName: string;
    productImage?: string | null;
    quantity: number;
    unitPrice?: number;
    totalPrice?: number;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", label: "In afwachting" },
    PAID: { bg: "bg-blue-100", text: "text-blue-700", label: "Betaald" },
    PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", label: "In behandeling" },
    SHIPPED: { bg: "bg-purple-100", text: "text-purple-700", label: "Verzonden" },
    DELIVERED: { bg: "bg-green-100", text: "text-green-700", label: "Afgeleverd" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", label: "Geannuleerd" },
    REFUNDED: { bg: "bg-orange-100", text: "text-orange-700", label: "Terugbetaald" },
};

export default function AccountPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthResponse["user"] | null>(null);
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [needsLogin, setNeedsLogin] = useState(false);
    const [showAllOrders, setShowAllOrders] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setNeedsLogin(true);
                setIsLoading(false);
                return;
            }

            try {
                const userData = await api.getMe();
                setUser(userData);

                // Load orders
                try {
                    const ordersData = await api.getMyOrders(userData.email);
                    setOrders(ordersData);
                } catch {
                    console.error('Failed to load orders');
                }
            } catch (error) {
                console.error('Failed to load user:', error);
                localStorage.removeItem('accessToken');
                setNeedsLogin(true);
            } finally {
                setIsLoading(false);
            }
        };
        loadData();
    }, []);

    const handleLogout = () => {
        removeToken();
        router.push("/");
    };

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status] || { bg: "bg-zinc-100", text: "text-zinc-700", label: status };
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <Navbar />
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-10 bg-zinc-200 rounded w-1/3" />
                        <div className="h-40 bg-zinc-200 rounded-2xl" />
                        <div className="h-64 bg-zinc-200 rounded-2xl" />
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (needsLogin) {
        return (
            <main className="min-h-screen bg-zinc-50">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-20 text-center">
                    <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-zinc-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-4">Welkom terug!</h1>
                    <p className="text-zinc-600 mb-8 text-lg">
                        Log in om je bestellingen te bekijken, reparaties te volgen en je accountinstellingen te beheren.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/login">
                            <Button size="lg" className="w-full sm:w-auto px-8">Inloggen</Button>
                        </Link>
                        <Link href="/register">
                            <Button variant="outline" size="lg" className="w-full sm:w-auto px-8">Registreren</Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    const displayedOrders = showAllOrders ? orders : orders.slice(0, 3);

    return (
        <main className="min-h-screen bg-zinc-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-zinc-900">Mijn Account</h1>
                    <p className="text-zinc-500 mt-1">Welkom terug, {user?.name?.split(' ')[0]}! Bekijk je bestellingen en beheer je account.</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Left Column - Profile & Quick Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Profile Card */}
                        <div className="bg-white rounded-2xl p-6 shadow-sm border border-zinc-100">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 bg-gradient-to-br from-zinc-900 to-zinc-700 rounded-full flex items-center justify-center text-white text-xl font-bold">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-xl font-semibold text-zinc-900 truncate">{user?.name}</h2>
                                    <p className="text-zinc-500 text-sm truncate">{user?.email}</p>
                                    {user && !user.emailVerified && (
                                        <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded mt-1 inline-block">
                                            ⚠️ Email niet geverifieerd
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Quick Links */}
                            <div className="space-y-2">
                                <Link href="/account/settings" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                                    <Settings className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />
                                    <span className="text-sm font-medium text-zinc-700">Account instellingen</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                                </Link>
                                <Link href="/account/afspraken" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                                    <Calendar className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />
                                    <span className="text-sm font-medium text-zinc-700">Mijn afspraken</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                                </Link>
                                <Link href="/track" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                                    <Truck className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />
                                    <span className="text-sm font-medium text-zinc-700">Track & Trace</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                                </Link>
                                <Link href="/account/wishlist" className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-50 transition-colors group">
                                    <Heart className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                                    <span className="text-sm font-medium text-zinc-700">Mijn Verlanglijstje</span>
                                    <ChevronRight className="w-4 h-4 text-zinc-300 ml-auto" />
                                </Link>
                                <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 transition-colors group w-full">
                                    <LogOut className="w-5 h-5 text-red-400 group-hover:text-red-500" />
                                    <span className="text-sm font-medium text-red-500">Uitloggen</span>
                                </button>
                            </div>
                        </div>

                        {/* Benefits Card */}
                        <div className="bg-gradient-to-br from-zinc-900 to-zinc-800 rounded-2xl p-6 text-white">
                            <h3 className="font-semibold text-lg mb-4">Klant Voordelen</h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <Shield className="w-5 h-5 text-emerald-400" />
                                    <span className="text-sm text-zinc-300">1 jaar garantie op reparaties</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Truck className="w-5 h-5 text-blue-400" />
                                    <span className="text-sm text-zinc-300">Gratis verzending vanaf €75</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Gift className="w-5 h-5 text-purple-400" />
                                    <span className="text-sm text-zinc-300">Exclusieve aanbiedingen</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <Star className="w-5 h-5 text-yellow-400" />
                                    <span className="text-sm text-zinc-300">Snelle klantenservice</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Orders */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 overflow-hidden">
                            {/* Orders Header */}
                            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Package className="w-6 h-6 text-zinc-900" />
                                    <h2 className="text-xl font-semibold text-zinc-900">Mijn Bestellingen</h2>
                                    <span className="bg-zinc-100 text-zinc-600 text-sm px-2.5 py-0.5 rounded-full">{orders.length}</span>
                                </div>
                                {orders.length > 0 && (
                                    <Link href="/account/orders" className="text-sm text-zinc-500 hover:text-zinc-900">
                                        Bekijk alles →
                                    </Link>
                                )}
                            </div>

                            {/* Orders List */}
                            {orders.length === 0 ? (
                                <div className="p-12 text-center">
                                    <ShoppingBag className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">Nog geen bestellingen</h3>
                                    <p className="text-zinc-500 mb-6 max-w-sm mx-auto">
                                        Je hebt nog geen bestellingen geplaatst. Ontdek onze collectie smartphones en accessoires!
                                    </p>
                                    <Link href="/phones">
                                        <Button>Bekijk producten</Button>
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {displayedOrders.map((order) => {
                                        const statusConfig = getStatusConfig(order.status);
                                        return (
                                            <Link
                                                key={order.id}
                                                href={`/account/orders/${order.id}`}
                                                className={`block p-5 hover:bg-zinc-50 transition-colors border-l-4
                                                    ${order.status === "PENDING" ? "border-l-yellow-500 bg-yellow-50/30" : ""}
                                                    ${order.status === "PAID" || order.status === "PROCESSING" ? "border-l-blue-500" : ""}
                                                    ${order.status === "SHIPPED" ? "border-l-purple-500" : ""}
                                                    ${order.status === "DELIVERED" ? "border-l-green-500" : ""}
                                                    ${order.status === "REFUNDED" ? "border-l-orange-500 bg-orange-50/30" : ""}
                                                    ${order.status === "CANCELLED" ? "border-l-red-500 bg-red-50/30 opacity-75" : ""}
                                                `}
                                            >
                                                {/* Order Header */}
                                                <div className="flex items-center justify-between mb-4">
                                                    <div>
                                                        <p className="font-semibold text-zinc-900">#{order.orderNumber}</p>
                                                        <p className="text-sm text-zinc-500">
                                                            {new Date(order.createdAt).toLocaleDateString("nl-BE", {
                                                                day: "numeric",
                                                                month: "long",
                                                                year: "numeric",
                                                            })}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            {order.status === "PENDING" && <span className="text-yellow-500">⏳</span>}
                                                            {order.status === "REFUNDED" && <span className="text-orange-500">💸</span>}
                                                            <p className={`font-bold text-lg 
                                                                ${order.status === "REFUNDED" ? "text-orange-600 line-through" : ""}
                                                                ${order.status === "CANCELLED" ? "text-red-400 line-through" : ""}
                                                                ${order.status !== "REFUNDED" && order.status !== "CANCELLED" ? "text-zinc-900" : ""}
                                                            `}>
                                                                €{Number(order.total).toFixed(2)}
                                                            </p>
                                                        </div>
                                                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                                                            {statusConfig.label}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Product Images */}
                                                <div className="flex items-center gap-3">
                                                    <div className="flex -space-x-3">
                                                        {order.items.slice(0, 4).map((item, i) => (
                                                            <div
                                                                key={i}
                                                                className="w-14 h-14 rounded-lg border-2 border-white bg-zinc-100 overflow-hidden flex-shrink-0 shadow-sm"
                                                            >
                                                                <SmartImage
                                                                    src={item.productImage}
                                                                    alt={item.productName}
                                                                    className="w-full h-full object-cover"
                                                                    fallbackClassName="w-full h-full flex items-center justify-center"
                                                                    fallbackIcon={<Package className="w-6 h-6 text-zinc-300" />}
                                                                />
                                                            </div>
                                                        ))}
                                                        {order.items.length > 4 && (
                                                            <div className="w-14 h-14 rounded-lg border-2 border-white bg-zinc-200 flex items-center justify-center flex-shrink-0">
                                                                <span className="text-sm font-medium text-zinc-600">+{order.items.length - 4}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0 ml-2">
                                                        <p className="text-sm text-zinc-600 truncate">
                                                            {order.items.map(item => `${item.quantity}× ${item.productName}`).join(', ')}
                                                        </p>
                                                        <p className="text-xs text-zinc-400 mt-1">
                                                            {order.items.length} {order.items.length === 1 ? 'product' : 'producten'}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                // Download invoice
                                                                const token = localStorage.getItem('accessToken');
                                                                if (token) {
                                                                    fetch(`/api/invoice/my/${order.id}`, {
                                                                        headers: { 'Authorization': `Bearer ${token}` }
                                                                    })
                                                                        .then(res => res.blob())
                                                                        .then(blob => {
                                                                            const url = window.URL.createObjectURL(blob);
                                                                            const a = document.createElement('a');
                                                                            a.href = url;
                                                                            a.download = `factuur-${order.orderNumber}.pdf`;
                                                                            a.click();
                                                                            window.URL.revokeObjectURL(url);
                                                                        });
                                                                }
                                                            }}
                                                            className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
                                                            title="Download factuur"
                                                        >
                                                            <FileDown className="w-5 h-5 text-zinc-500" />
                                                        </button>
                                                        <ChevronRight className="w-5 h-5 text-zinc-300" />
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Show more */}
                            {orders.length > 3 && (
                                <div className="p-4 border-t border-zinc-100">
                                    <button
                                        onClick={() => setShowAllOrders(!showAllOrders)}
                                        className="w-full py-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 flex items-center justify-center gap-1"
                                    >
                                        {showAllOrders ? (
                                            <>Toon minder <ChevronUp className="w-4 h-4" /></>
                                        ) : (
                                            <>Toon alle {orders.length} bestellingen <ChevronDown className="w-4 h-4" /></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Need Help Card */}
                        <div className="mt-6 bg-blue-50 rounded-2xl p-6 border border-blue-100">
                            <h3 className="font-semibold text-blue-900 mb-2">Hulp nodig?</h3>
                            <p className="text-blue-700 text-sm mb-4">
                                Heb je vragen over je bestelling of een probleem? Ons team staat voor je klaar!
                            </p>
                            <div className="flex gap-3">
                                <Link href="/support">
                                    <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-100">
                                        Klantenservice
                                    </Button>
                                </Link>
                                <Link href="/contact">
                                    <Button size="sm" variant="ghost" className="text-blue-600 hover:bg-blue-100">
                                        Contact opnemen
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main >
    );
}
