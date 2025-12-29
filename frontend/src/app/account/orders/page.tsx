"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { ChevronLeft, Package, Loader2 } from "lucide-react";
import { api, getToken } from "@/lib/api";

interface OrderItem {
    productName: string;
    quantity: number;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { bg: string; text: string; border: string; label: string }> = {
    PENDING: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-l-yellow-500", label: "Wachtend op betaling" },
    PAID: { bg: "bg-blue-100", text: "text-blue-700", border: "border-l-blue-500", label: "Betaald" },
    PROCESSING: { bg: "bg-blue-100", text: "text-blue-700", border: "border-l-blue-500", label: "In behandeling" },
    SHIPPED: { bg: "bg-purple-100", text: "text-purple-700", border: "border-l-purple-500", label: "Verzonden" },
    DELIVERED: { bg: "bg-green-100", text: "text-green-700", border: "border-l-green-500", label: "Afgeleverd" },
    CANCELLED: { bg: "bg-red-100", text: "text-red-700", border: "border-l-red-500", label: "Geannuleerd" },
    REFUNDED: { bg: "bg-orange-100", text: "text-orange-700", border: "border-l-orange-500", label: "Terugbetaald" },
};

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        const loadOrders = async () => {
            try {
                // Check if user is logged in
                const token = getToken();
                if (!token) {
                    setIsLoading(false);
                    return;
                }

                // Get current user
                const user = await api.getMe();
                setUserEmail(user.email);

                // Fetch user's orders
                const ordersData = await api.getMyOrders(user.email);
                setOrders(ordersData);
            } catch (error) {
                console.error("Failed to load orders:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrders();
    }, []);

    const getStatusConfig = (status: string) => {
        return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
    };

    if (!isLoading && !userEmail) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-16 text-center">
                    <Package className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2">Login Required</h2>
                    <p className="text-zinc-600 mb-6">
                        Please log in to view your order history.
                    </p>
                    <Link href="/login" className="text-zinc-900 font-medium hover:underline">
                        Log in →
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Account
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900">My Orders</h1>
                    {userEmail && (
                        <p className="text-sm text-zinc-500 mt-1">Orders for {userEmail}</p>
                    )}
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-16">
                        <Package className="w-16 h-16 text-zinc-300 mx-auto mb-6" />
                        <h2 className="text-xl font-semibold text-zinc-900 mb-2">No orders yet</h2>
                        <p className="text-zinc-600 mb-6">
                            When you place an order, it will appear here.
                        </p>
                        <Link href="/phones" className="text-zinc-900 font-medium hover:underline">
                            Start shopping →
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {orders.map((order) => {
                            const config = getStatusConfig(order.status);
                            const isRefunded = order.status === "REFUNDED";
                            const isCancelled = order.status === "CANCELLED";
                            const isPending = order.status === "PENDING";

                            return (
                                <Link
                                    key={order.id}
                                    href={`/account/orders/${order.id}`}
                                    className={`block p-5 bg-zinc-50 rounded-xl hover:bg-zinc-100 transition-colors border border-zinc-100 border-l-4
                                    ${config.border}
                                    ${isPending ? "bg-yellow-50/50" : ""}
                                    ${isRefunded ? "bg-orange-50/50" : ""}
                                    ${isCancelled ? "bg-red-50/50 opacity-75" : ""}
                                `}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-semibold text-zinc-900">Bestelling #{order.orderNumber}</p>
                                            <p className="text-sm text-zinc-500 mt-1">
                                                {new Date(order.createdAt).toLocaleDateString("nl-BE", {
                                                    year: "numeric",
                                                    month: "long",
                                                    day: "numeric",
                                                })}
                                            </p>
                                            <p className="text-sm text-zinc-500">
                                                {order.items.length} {order.items.length === 1 ? "product" : "producten"}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {isPending && <span className="text-yellow-500">⏳</span>}
                                                {isRefunded && <span className="text-orange-500">💸</span>}
                                                <p className={`font-bold text-lg 
                                                ${isRefunded ? "text-orange-600 line-through" : ""}
                                                ${isCancelled ? "text-red-400 line-through" : ""}
                                                ${!isRefunded && !isCancelled ? "text-zinc-900" : ""}
                                            `}>
                                                    €{Number(order.total).toFixed(2)}
                                                </p>
                                            </div>
                                            <span className={`text-xs px-3 py-1 rounded-full font-medium ${config.bg} ${config.text}`}>
                                                {config.label}
                                            </span>
                                        </div>
                                    </div>
                                    {order.items.length > 0 && (
                                        <div className="mt-3 pt-3 border-t border-zinc-200">
                                            <p className="text-sm text-zinc-600">
                                                {order.items.slice(0, 2).map((item, i) => (
                                                    <span key={i}>
                                                        {item.quantity}x {item.productName}
                                                        {i < Math.min(order.items.length, 2) - 1 && ", "}
                                                    </span>
                                                ))}
                                                {order.items.length > 2 && ` +${order.items.length - 2} more`}
                                            </p>
                                        </div>
                                    )}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
