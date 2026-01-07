'use client';

/**
 * Base Skin - Checkout Success Page
 * 
 * Purely presentational. Receives data via props from CheckoutSuccessPageVM.
 * NOTE: Layout (Navbar/Footer) is provided by PublicLayout wrapper.
 */

import Link from 'next/link';
import { Button } from '../components/ui/button';
import { CheckCircle, Package, Mail, ArrowRight, Loader2 } from 'lucide-react';

export interface OrderItem {
    id: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Order {
    id: string;
    orderNumber: string;
    status: string;
    customerEmail: string;
    customerName: string;
    total: number;
    items: OrderItem[];
    createdAt: string;
}

export interface CheckoutSuccessPageVM {
    order: Order | null;
    isLoading: boolean;
    isResolving: boolean;
    error: string | null;
}

export function CheckoutSuccessPage({ vm }: { vm: CheckoutSuccessPageVM }) {
    const { order, isLoading, isResolving, error } = vm;

    // Resolving state
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
