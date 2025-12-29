"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCartStore } from "@/lib/store";
import { api, getToken } from "@/lib/api";
import { ShoppingBag, ChevronLeft, Truck, MapPin, CreditCard, AlertCircle, Tag, Check, X, Loader2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Country phone prefixes
const COUNTRY_CODES = [
    { code: "BE", prefix: "+32", name: "Belgium" },
    { code: "NL", prefix: "+31", name: "Netherlands" },
    { code: "DE", prefix: "+49", name: "Germany" },
    { code: "FR", prefix: "+33", name: "France" },
    { code: "LU", prefix: "+352", name: "Luxembourg" },
    { code: "GB", prefix: "+44", name: "United Kingdom" },
    { code: "US", prefix: "+1", name: "United States" },
];

interface DiscountValidation {
    valid: boolean;
    discountId?: string;
    code?: string;
    type?: "PERCENTAGE" | "FIXED";
    discountAmount?: number;
    message?: string;
}

export default function CheckoutPage() {
    const { items, getTotal } = useCartStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const [phonePrefix, setPhonePrefix] = useState("+32");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidation | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: "",
        name: "",
        phone: "",
        line1: "",
        line2: "",
        city: "",
        state: "",
        postalCode: "",
        country: "BE",
    });

    useEffect(() => {
        setMounted(true);
        // Pre-fill from logged in user
        const loadUser = async () => {
            const token = getToken();
            if (token) {
                try {
                    const user = await api.getMe();
                    setFormData((prev) => ({
                        ...prev,
                        email: user.email,
                        name: user.name,
                    }));
                    setIsLoggedIn(true);
                } catch {
                    // Not logged in, ignore
                    setIsLoggedIn(false);
                }
            }
        };
        loadUser();
    }, []);

    const validateCoupon = async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError(null);

        try {
            const subtotal = getTotal();
            const res = await fetch(`${API_URL}/api/discounts/validate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    code: couponCode.toUpperCase(),
                    subtotal,
                    customerEmail: formData.email || undefined,
                    productIds: items.map(item => item.id),
                }),
            });

            const result: DiscountValidation = await res.json();

            if (result.valid) {
                setAppliedDiscount(result);
                setCouponError(null);
            } else {
                setCouponError(result.message || "Ongeldige kortingscode");
                setAppliedDiscount(null);
            }
        } catch (err) {
            setCouponError("Kon kortingscode niet controleren");
            setAppliedDiscount(null);
        } finally {
            setCouponLoading(false);
        }
    };

    const removeCoupon = () => {
        setAppliedDiscount(null);
        setCouponCode("");
        setCouponError(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const fullPhone = formData.phone ? `${phonePrefix} ${formData.phone}` : undefined;

            const checkoutData = {
                items: items.map((item) => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                })),
                customerEmail: formData.email,
                customerName: formData.name,
                customerPhone: fullPhone,
                fulfillmentType: "SHIPPING" as const,
                shippingAddress: {
                    line1: formData.line1,
                    line2: formData.line2 || undefined,
                    city: formData.city,
                    state: formData.state || undefined,
                    postalCode: formData.postalCode,
                    country: formData.country,
                },
                // Include discount code if applied
                ...(appliedDiscount?.discountId ? { discountCodeId: appliedDiscount.discountId } : {}),
            };

            const response = await api.createCheckout(checkoutData);

            // Redirect to Stripe Checkout
            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Checkout failed. Please try again.";
            setError(message);
            setIsLoading(false);
        }
    };

    if (!mounted) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-zinc-200 rounded w-1/3" />
                        <div className="h-64 bg-zinc-200 rounded" />
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    if (items.length === 0) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-md mx-auto px-4 py-16 text-center">
                    <ShoppingBag className="w-16 h-16 text-zinc-300 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-zinc-900 mb-2">Your cart is empty</h1>
                    <p className="text-zinc-600 mb-8">Add some items to your cart to checkout.</p>
                    <Link href="/phones">
                        <Button>Browse Products</Button>
                    </Link>
                </div>
                <Footer />
            </main>
        );
    }

    // Belgium: 21% VAT included in price
    const subtotal = getTotal();
    const discount = appliedDiscount?.discountAmount || 0;
    const shipping = formData.country === "BE" ? 5.95 : 9.95;  // Lower shipping for Belgium
    // VAT is already included in prices (Belgian standard)
    const total = subtotal - discount + shipping;

    return (
        <main className="min-h-screen bg-zinc-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <Link href="/cart" className="text-zinc-400 hover:text-zinc-600">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-zinc-900">Checkout</h1>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5" />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Left: Form */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Contact Info */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <CreditCard className="w-5 h-5 text-zinc-400" />
                                    <h2 className="text-lg font-semibold text-zinc-900">Contact Information</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="email">Email *</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            required
                                            value={formData.email}
                                            onChange={(e) => !isLoggedIn && setFormData({ ...formData, email: e.target.value })}
                                            placeholder="jan.peeters@email.be"
                                            readOnly={isLoggedIn}
                                            className={isLoggedIn ? "bg-zinc-100 cursor-not-allowed" : ""}
                                        />
                                        {isLoggedIn && (
                                            <p className="text-xs text-zinc-500 mt-1">
                                                Bestellingsbevestiging wordt verzonden naar uw account e-mail
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label htmlFor="name">Full Name *</Label>
                                        <Input
                                            id="name"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Jan Peeters"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="phone">Phone</Label>
                                        <div className="flex gap-2">
                                            <select
                                                value={phonePrefix}
                                                onChange={(e) => setPhonePrefix(e.target.value)}
                                                className="h-12 px-3 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500"
                                            >
                                                {COUNTRY_CODES.map((c) => (
                                                    <option key={c.code} value={c.prefix}>
                                                        {c.prefix}
                                                    </option>
                                                ))}
                                            </select>
                                            <Input
                                                id="phone"
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="478 12 34 56"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Address */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <MapPin className="w-5 h-5 text-zinc-400" />
                                    <h2 className="text-lg font-semibold text-zinc-900">Shipping Address</h2>
                                </div>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="country">Country *</Label>
                                        <select
                                            id="country"
                                            required
                                            value={formData.country}
                                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                                            className="w-full h-12 px-4 rounded-xl border-2 border-zinc-200 bg-white text-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-500/20 focus:border-zinc-500"
                                        >
                                            <option value="BE">Belgium</option>
                                            <option value="NL">Netherlands</option>
                                            <option value="DE">Germany</option>
                                            <option value="FR">France</option>
                                            <option value="LU">Luxembourg</option>
                                            <option value="GB">United Kingdom</option>
                                        </select>
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="line1">Street & House Number *</Label>
                                        <Input
                                            id="line1"
                                            required
                                            value={formData.line1}
                                            onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                                            placeholder="Grote Markt 1"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="line2">Apartment, Box, etc.</Label>
                                        <Input
                                            id="line2"
                                            value={formData.line2}
                                            onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
                                            placeholder="Bus 2A"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="postalCode">Postal Code *</Label>
                                        <Input
                                            id="postalCode"
                                            required
                                            value={formData.postalCode}
                                            onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                                            placeholder="1000"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="city">City *</Label>
                                        <Input
                                            id="city"
                                            required
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Brussels"
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <Label htmlFor="state">Province</Label>
                                        <Input
                                            id="state"
                                            value={formData.state}
                                            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                            placeholder="Brussels-Capital"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Shipping Method */}
                            <div className="bg-white rounded-xl p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-4">
                                    <Truck className="w-5 h-5 text-zinc-400" />
                                    <h2 className="text-lg font-semibold text-zinc-900">Shipping Method</h2>
                                </div>
                                <div className="border-2 border-zinc-900 rounded-xl p-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-zinc-900">
                                                {formData.country === "BE" ? "bpost Standard" : "Standard Shipping"}
                                            </p>
                                            <p className="text-sm text-zinc-500">
                                                {formData.country === "BE" ? "2-3 business days" : "5-7 business days"}
                                            </p>
                                        </div>
                                        <p className="font-medium text-zinc-900">€{shipping.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right: Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
                                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Order Summary</h2>

                                {/* Items */}
                                <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
                                    {items.map((item) => (
                                        <div key={item.id} className="flex gap-3">
                                            <div className="w-16 h-16 bg-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                                        <ShoppingBag className="w-6 h-6" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
                                                <p className="text-sm text-zinc-500">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900">
                                                €{(item.price * item.quantity).toFixed(2)}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Coupon Code */}
                                <div className="border-t border-zinc-200 pt-4 mb-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-4 h-4 text-zinc-400" />
                                        <span className="text-sm font-medium text-zinc-700">Kortingscode</span>
                                    </div>
                                    {appliedDiscount ? (
                                        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2">
                                                <Check className="w-4 h-4 text-green-600" />
                                                <div>
                                                    <span className="font-medium text-green-700">{appliedDiscount.code}</span>
                                                    <span className="text-sm text-green-600 ml-2">
                                                        -{appliedDiscount.type === "PERCENTAGE" ? `${appliedDiscount.discountAmount}%` : `€${appliedDiscount.discountAmount?.toFixed(2)}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeCoupon}
                                                className="text-zinc-400 hover:text-red-500"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <Input
                                                value={couponCode}
                                                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                                placeholder="KORTINGSCODE"
                                                className="uppercase"
                                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), validateCoupon())}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={validateCoupon}
                                                disabled={couponLoading || !couponCode.trim()}
                                            >
                                                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Toepassen"}
                                            </Button>
                                        </div>
                                    )}
                                    {couponError && (
                                        <p className="text-sm text-red-500 mt-2">{couponError}</p>
                                    )}
                                </div>

                                {/* Totals */}
                                <div className="border-t border-zinc-200 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600">Subtotal</span>
                                        <span className="text-zinc-900">€{subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-sm">
                                            <span className="text-green-600">Korting</span>
                                            <span className="text-green-600">-€{discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-zinc-600">Shipping</span>
                                        <span className="text-zinc-900">€{shipping.toFixed(2)}</span>
                                    </div>
                                    <p className="text-xs text-zinc-500">All prices include 21% VAT</p>
                                    <div className="border-t border-zinc-200 pt-2 mt-2">
                                        <div className="flex justify-between text-lg font-semibold">
                                            <span className="text-zinc-900">Total</span>
                                            <span className="text-zinc-900">€{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Submit */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full mt-6"
                                    isLoading={isLoading}
                                >
                                    Proceed to Payment
                                </Button>

                                <p className="text-xs text-zinc-500 text-center mt-4">
                                    Secure payment via Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <Footer />
        </main>
    );
}
