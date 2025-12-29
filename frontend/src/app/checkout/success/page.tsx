"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CheckCircle, Package, Mail, ArrowRight } from "lucide-react";

interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

interface Order {
    id: string;
    orderNumber: string;
    status: string;
    customerEmail: string;
    customerName: string;
    total: number;
    items: OrderItem[];
    createdAt: string;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const clearCart = useCartStore((state) => state.clearCart);

    useEffect(() => {
        const loadOrder = async () => {
            if (!sessionId) {
                setIsLoading(false);
                return;
            }

            try {
                const orderData = await api.getOrderBySession(sessionId);
                setOrder(orderData);
                // Clear cart after successful payment
                clearCart();
            } catch (error) {
                console.error("Failed to load order:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadOrder();
    }, [sessionId, clearCart]);

    if (isLoading) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16">
                <div className="animate-pulse space-y-4 text-center">
                    <div className="w-16 h-16 bg-zinc-200 rounded-full mx-auto" />
                    <div className="h-8 bg-zinc-200 rounded w-1/2 mx-auto" />
                    <div className="h-4 bg-zinc-200 rounded w-3/4 mx-auto" />
                </div>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-zinc-900 mb-4">Order Not Found</h1>
                <p className="text-zinc-600 mb-8">We couldn&apos;t find your order. Please check your email for confirmation.</p>
                <Link href="/">
                    <Button>Go to Homepage</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-16">
            {/* Success Icon */}
            <div className="text-center mb-8">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Thank you for your order!</h1>
                <p className="text-zinc-600">
                    Order #{order.orderNumber} has been confirmed
                </p>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Order Details</h2>

                <div className="space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                            <div>
                                <p className="font-medium text-zinc-900">{item.productName}</p>
                                <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-zinc-900">€{Number(item.totalPrice).toFixed(2)}</p>
                        </div>
                    ))}

                    <div className="pt-4 border-t border-zinc-200">
                        <div className="flex justify-between text-lg font-semibold">
                            <span>Total</span>
                            <span>€{Number(order.total).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Confirmation Email Notice */}
            <div className="bg-zinc-50 rounded-xl p-6 mb-8">
                <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-zinc-400 mt-0.5" />
                    <div>
                        <p className="font-medium text-zinc-900">Confirmation email sent</p>
                        <p className="text-sm text-zinc-600 mt-1">
                            A confirmation email has been sent to <strong>{order.customerEmail}</strong> with your order details and tracking information.
                        </p>
                    </div>
                </div>
            </div>

            {/* Next Steps */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/account/orders">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Package className="w-4 h-4 mr-2" />
                        View My Orders
                    </Button>
                </Link>
                <Link href="/phones">
                    <Button className="w-full sm:w-auto">
                        Continue Shopping
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default function CheckoutSuccessPage() {
    return (
        <main className="min-h-screen bg-white">
            <Navbar />
            <Suspense fallback={
                <div className="max-w-2xl mx-auto px-4 py-16">
                    <div className="animate-pulse space-y-4 text-center">
                        <div className="w-16 h-16 bg-zinc-200 rounded-full mx-auto" />
                        <div className="h-8 bg-zinc-200 rounded w-1/2 mx-auto" />
                    </div>
                </div>
            }>
                <SuccessContent />
            </Suspense>
            <Footer />
        </main>
    );
}
