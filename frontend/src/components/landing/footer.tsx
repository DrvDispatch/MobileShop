"use client";

import Link from "next/link";
import { Smartphone, MapPin, Phone, Mail, Loader2, CheckCircle, Send } from "lucide-react";
import { useEffect, useState } from "react";
import { useSettingsStore } from "@/lib/store";
import { useFeatures } from "@/contexts/FeatureContext";

export function Footer() {
    const { settings, fetchSettings } = useSettingsStore();
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

    // Feature flags
    const { ecommerceEnabled, repairsEnabled } = useFeatures();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store, checkout } = settings;

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const res = await fetch('/api/marketing/subscribe', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            setSubmitResult(data);
            if (data.success) {
                setEmail("");
            }
        } catch {
            setSubmitResult({ success: false, message: "Er is iets misgegaan. Probeer later opnieuw." });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Build footer columns dynamically based on features
    // Rule: If column has zero items, remove the column entirely
    const shopLinks = ecommerceEnabled ? [
        { href: "/phones", label: "Toestellen" },
        { href: "/accessories", label: "Accessoires" },
    ] : [];

    const dienstenLinks = [
        ...(repairsEnabled ? [{ href: "/repair/book", label: "Reparaties" }] : []),
        { href: "/contact", label: "Contact" },
        { href: "/over-ons", label: "Over Ons" },
    ];

    return (
        <footer className="bg-white border-t border-zinc-100">
            {/* Newsletter Section */}
            <div className="bg-zinc-900 text-white py-12">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-center md:text-left">
                            <h3 className="text-xl font-semibold mb-2">Blijf op de hoogte</h3>
                            <p className="text-zinc-400 text-sm">
                                Ontvang als eerste onze aanbiedingen en nieuwtjes.
                            </p>
                        </div>
                        <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Je e-mailadres"
                                    required
                                    className="w-full sm:w-72 px-4 py-3 rounded-lg bg-zinc-800 border border-zinc-700 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-white/20"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-6 py-3 bg-white text-zinc-900 font-medium rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : submitResult?.success ? (
                                    <>
                                        <CheckCircle className="w-5 h-5" />
                                        Ingeschreven!
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4" />
                                        Inschrijven
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                    {submitResult && !submitResult.success && (
                        <p className="text-red-400 text-sm text-center mt-3">{submitResult.message}</p>
                    )}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Dynamic grid based on number of columns */}
                <div className={`grid grid-cols-2 ${shopLinks.length > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-8`}>
                    {/* Brand - always shown */}
                    <div className="col-span-2 md:col-span-1">
                        <Link href="/" className="flex items-center gap-2 mb-4">
                            <Smartphone className="w-5 h-5 text-zinc-900" />
                            <span className="font-semibold text-zinc-900">{store.name}</span>
                        </Link>
                        <p className="text-sm text-zinc-500 mb-4">
                            Uw lokale expert voor smartphones, tablets en professionele reparaties.
                        </p>
                        <div className="space-y-2 text-sm text-zinc-500 mb-4">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{store.address.line1}, {store.address.postalCode} {store.address.city}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <span>{store.phone}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <span>{store.email}</span>
                            </div>
                        </div>
                    </div>

                    {/* Shop - only if e-commerce enabled */}
                    {shopLinks.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-zinc-900 mb-4">Shop</h3>
                            <ul className="space-y-2 text-sm text-zinc-500">
                                {shopLinks.map(link => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="hover:text-zinc-900 transition-colors">
                                            {link.label}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Diensten - always shown but repairs links conditional */}
                    <div>
                        <h3 className="text-sm font-medium text-zinc-900 mb-4">Diensten</h3>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            {dienstenLinks.map(link => (
                                <li key={link.href}>
                                    <Link href={link.href} className="hover:text-zinc-900 transition-colors">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Juridisch */}
                    <div>
                        <h3 className="text-sm font-medium text-zinc-900 mb-4">Juridisch</h3>
                        <ul className="space-y-2 text-sm text-zinc-500">
                            <li><Link href="/privacy" className="hover:text-zinc-900 transition-colors">Privacybeleid</Link></li>
                            <li><Link href="/terms" className="hover:text-zinc-900 transition-colors">Algemene Voorwaarden</Link></li>
                            <li><Link href="/returns" className="hover:text-zinc-900 transition-colors">Retourbeleid</Link></li>
                        </ul>

                        {/* Google Reviews Badge */}
                        <a
                            href="https://maps.app.goo.gl/6bAP4qtykPysRhSF9"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-3 bg-zinc-100 hover:bg-zinc-200 rounded-xl px-4 py-3 transition-colors mt-6"
                        >
                            <svg className="w-8 h-8" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            <div className="flex flex-col">
                                <span className="text-sm text-zinc-500">Google Reviews</span>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-xl font-bold text-zinc-900">4.7</span>
                                    <div className="flex">
                                        {[1, 2, 3, 4].map((i) => (
                                            <svg key={i} className="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                        <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20">
                                            <defs>
                                                <linearGradient id="half-star-footer">
                                                    <stop offset="70%" stopColor="currentColor" />
                                                    <stop offset="70%" stopColor="#d1d5db" />
                                                </linearGradient>
                                            </defs>
                                            <path fill="url(#half-star-footer)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </a>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-12 pt-8 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-sm text-zinc-400">
                        © {new Date().getFullYear()} {store.name}. Alle rechten voorbehouden.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-zinc-400">
                        {store.vatNumber && <span>BTW {store.vatNumber}</span>}
                        <span>•</span>
                        <span>Prijzen {checkout.taxIncluded ? "incl." : "excl."} {checkout.taxLabel}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

