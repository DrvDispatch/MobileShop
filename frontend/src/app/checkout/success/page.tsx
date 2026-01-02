"use client";

/**
 * Checkout Success Page
 * 
 * MULTI-TENANT SaaS ARCHITECTURE:
 * 
 * This page serves two purposes:
 * 1. PLATFORM RESOLVER: When accessed on platform domain (servicespulse.com),
 *    it resolves the tenant from Stripe session and redirects to tenant domain
 * 
 * 2. TENANT SUCCESS PAGE: When accessed on tenant domain (smartphoneservice.be),
 *    it displays the order confirmation
 * 
 * Flow:
 *   Stripe payment → Platform success page → Resolve tenant → Redirect → Tenant success page
 */

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { api } from "@/lib/api";
import { CheckCircle, Package, Mail, ArrowRight, Loader2 } from "lucide-react";

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

interface ResolvedOrder {
    orderId: string;
    orderNumber: string;
    status: string;
    customerName: string;
    total: number;
    tenantId: string;
    tenantDomain: string | null;
}

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session_id");
    const orderIdParam = searchParams.get("orderId"); // For tenant-side display

    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isResolving, setIsResolving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const clearCart = useCartStore((state) => state.clearCart);

    useEffect(() => {
        const loadOrder = async () => {
            // Case 1: Session ID from Stripe redirect - need to resolve tenant first
            if (sessionId) {
                setIsResolving(true);
                try {
                    // Call platform-level resolve endpoint
                    const response = await fetch(`/api/orders/resolve-session/${sessionId}`);

                    if (!response.ok) {
                        throw new Error("Could not resolve order");
                    }

                    const resolvedOrder: ResolvedOrder = await response.json();

                    // Check if we need to redirect to tenant domain
                    const currentHost = typeof window !== 'undefined' ? window.location.hostname : '';

                    if (resolvedOrder.tenantDomain &&
                        resolvedOrder.tenantDomain !== currentHost &&
                        !currentHost.includes('localhost')) {

                        // Redirect to tenant domain with orderId
                        const tenantUrl = `https://${resolvedOrder.tenantDomain}/checkout/success?orderId=${resolvedOrder.orderId}`;
                        console.log(`Redirecting to tenant domain: ${tenantUrl}`);
                        window.location.href = tenantUrl;
                        return;
                    }

                    // We're on the correct domain (or localhost), load full order
                    const orderData = await api.getOrderBySession(sessionId);
                    setOrder(orderData);
                    clearCart();

                } catch (err) {
                    console.error("Failed to resolve order:", err);
                    setError("Bestelling kon niet worden gevonden. Controleer uw e-mail voor bevestiging.");
                } finally {
                    setIsLoading(false);
                    setIsResolving(false);
                }
                return;
            }

            // Case 2: Order ID provided directly (after redirect from platform to tenant)
            if (orderIdParam) {
                try {
                    const orderData = await api.getOrderById(orderIdParam);
                    setOrder(orderData);
                    clearCart();
                } catch (err) {
                    console.error("Failed to load order:", err);
                    setError("Bestelling kon niet worden gevonden.");
                } finally {
                    setIsLoading(false);
                }
                return;
            }

            // No session_id or orderId
            setIsLoading(false);
            setError("Geen bestelling informatie gevonden.");
        };

        loadOrder();
    }, [sessionId, orderIdParam, clearCart]);

    // Resolving state (redirecting to tenant)
    if (isResolving) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-16">
                <div className="text-center space-y-4">
                    <Loader2 className="w-16 h-16 text-green-500 animate-spin mx-auto" />
                    <h2 className="text-xl font-semibold text-zinc-900">Even geduld...</h2>
                    <p className="text-zinc-600">We verwerken uw betaling en leiden u door naar uw bevestiging.</p>
                </div>
            </div>
        );
    }

    // Loading state
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

    // Error state
    if (error || !order) {
        return (
            <div className="max-w-md mx-auto px-4 py-16 text-center">
                <h1 className="text-2xl font-bold text-zinc-900 mb-4">Bestelling niet gevonden</h1>
                <p className="text-zinc-600 mb-8">
                    {error || "We konden uw bestelling niet vinden. Controleer uw e-mail voor bevestiging."}
                </p>
                <Link href="/">
                    <Button>Naar homepagina</Button>
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
                <h1 className="text-3xl font-bold text-zinc-900 mb-2">Bedankt voor uw bestelling!</h1>
                <p className="text-zinc-600">
                    Bestelling #{order.orderNumber} is bevestigd
                </p>
            </div>

            {/* Order Details */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Bestelgegevens</h2>

                <div className="space-y-4">
                    {order.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center py-2 border-b border-zinc-100 last:border-0">
                            <div>
                                <p className="font-medium text-zinc-900">{item.productName}</p>
                                <p className="text-sm text-zinc-500">Aantal: {item.quantity}</p>
                            </div>
                            <p className="font-medium text-zinc-900">€{Number(item.totalPrice).toFixed(2)}</p>
                        </div>
                    ))}

                    <div className="pt-4 border-t border-zinc-200">
                        <div className="flex justify-between text-lg font-semibold">
                            <span>Totaal</span>
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
                        <p className="font-medium text-zinc-900">Bevestigingsmail verzonden</p>
                        <p className="text-sm text-zinc-600 mt-1">
                            Een bevestigingsmail is verzonden naar <strong>{order.customerEmail}</strong> met uw bestelgegevens en track & trace informatie.
                        </p>
                    </div>
                </div>
            </div>

            {/* Next Steps */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/account/orders">
                    <Button variant="outline" className="w-full sm:w-auto">
                        <Package className="w-4 h-4 mr-2" />
                        Mijn bestellingen
                    </Button>
                </Link>
                <Link href="/phones">
                    <Button className="w-full sm:w-auto">
                        Verder winkelen
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
