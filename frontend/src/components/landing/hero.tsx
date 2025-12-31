"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
    Truck,
    Shield,
    CreditCard,
    Check,
    Wrench,
    Smartphone
} from "lucide-react";
import { useTenantOptional } from "@/lib/TenantProvider";

// Types for CMS homepage content
interface HomepageContent {
    heroTitle: string;
    heroSubtitle: string;
    heroDescription?: string;
    heroCta1Text: string;
    heroCta1Link: string;
    heroCta2Text?: string;
    heroCta2Link?: string;
    trustBadge1: string;
    trustBadge2: string;
    trustBadge3: string;
    conversionTitle?: string;
    conversionFeature1?: string;
    conversionFeature2?: string;
    conversionFeature3?: string;
    showConversionStrip: boolean;
    showServices: boolean;
}

// Default content (fallback if CMS not configured)
const DEFAULT_CONTENT: HomepageContent = {
    heroTitle: "Problemen met uw toestel?",
    heroSubtitle: "Wij helpen u graag.",
    heroDescription: "Wij repareren jouw smartphone snel en professioneel, zodat jij zorgeloos verder kunt.",
    heroCta1Text: "Bekijk Toestellen",
    heroCta1Link: "/phones",
    heroCta2Text: "Maak Afspraak",
    heroCta2Link: "/repair/book",
    trustBadge1: "Gratis verzending",
    trustBadge2: "1 jaar garantie",
    trustBadge3: "Veilig betalen",
    conversionTitle: "Vandaag kapot. Vandaag opgelost.",
    conversionFeature1: "Binnen 60 minuten klaar",
    conversionFeature2: "Originele onderdelen",
    conversionFeature3: "Lokale service",
    showConversionStrip: true,
    showServices: true,
};

export function Hero() {
    const tenant = useTenantOptional();
    const shopName = tenant?.branding.shopName || 'Smartphone Service';

    const [content, setContent] = useState<HomepageContent>(DEFAULT_CONTENT);

    useEffect(() => {
        // Fetch homepage content from CMS
        fetch('/api/tenant/homepage', { credentials: 'include' })
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data) {
                    setContent({
                        heroTitle: data.heroTitle || DEFAULT_CONTENT.heroTitle,
                        heroSubtitle: data.heroSubtitle || DEFAULT_CONTENT.heroSubtitle,
                        heroDescription: data.heroDescription || DEFAULT_CONTENT.heroDescription,
                        heroCta1Text: data.heroCta1Text || DEFAULT_CONTENT.heroCta1Text,
                        heroCta1Link: data.heroCta1Link || DEFAULT_CONTENT.heroCta1Link,
                        heroCta2Text: data.heroCta2Text || DEFAULT_CONTENT.heroCta2Text,
                        heroCta2Link: data.heroCta2Link || DEFAULT_CONTENT.heroCta2Link,
                        trustBadge1: data.trustBadge1 || DEFAULT_CONTENT.trustBadge1,
                        trustBadge2: data.trustBadge2 || DEFAULT_CONTENT.trustBadge2,
                        trustBadge3: data.trustBadge3 || DEFAULT_CONTENT.trustBadge3,
                        conversionTitle: data.conversionTitle || DEFAULT_CONTENT.conversionTitle,
                        conversionFeature1: data.conversionFeature1 || DEFAULT_CONTENT.conversionFeature1,
                        conversionFeature2: data.conversionFeature2 || DEFAULT_CONTENT.conversionFeature2,
                        conversionFeature3: data.conversionFeature3 || DEFAULT_CONTENT.conversionFeature3,
                        showConversionStrip: data.showConversionStrip ?? DEFAULT_CONTENT.showConversionStrip,
                        showServices: data.showServices ?? DEFAULT_CONTENT.showServices,
                    });
                }
            })
            .catch(err => {
                console.error('Failed to load homepage content:', err);
            });
    }, []);

    return (
        <>
            {/* ===== HERO SECTION ===== */}
            <section className="bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <p className="text-sm font-medium text-zinc-500 uppercase tracking-wider">
                                    {shopName}
                                </p>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.1]">
                                    {content.heroTitle}
                                    <span className="block text-zinc-500 font-normal mt-2">
                                        {content.heroSubtitle}
                                    </span>
                                </h1>
                                {content.heroDescription && (
                                    <p className="text-lg text-zinc-600 max-w-lg">
                                        {content.heroDescription}
                                    </p>
                                )}
                                <p className="text-base font-medium text-zinc-500">
                                    Vermijd lange wachttijden — maak nu een afspraak
                                </p>
                            </div>

                            {/* CTA Buttons - Big and Bold */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <Link href={content.heroCta1Link}>
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto px-10 h-14 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 hover:scale-105 transition-all duration-200 shadow-xl shadow-zinc-900/20"
                                    >
                                        {content.heroCta1Text}
                                    </Button>
                                </Link>
                                {content.heroCta2Text && content.heroCta2Link && (
                                    <Link href={content.heroCta2Link}>
                                        <Button
                                            variant="outline"
                                            size="lg"
                                            className="w-full sm:w-auto px-10 h-14 text-lg font-bold border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white hover:scale-105 transition-all duration-200"
                                        >
                                            {content.heroCta2Text}
                                        </Button>
                                    </Link>
                                )}
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-zinc-600">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-zinc-400" />
                                    <span>{content.trustBadge1}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-zinc-400" />
                                    <span>{content.trustBadge2}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-zinc-400" />
                                    <span>{content.trustBadge3}</span>
                                </div>
                            </div>
                        </div>

                        {/* Right Image */}
                        <div className="relative">
                            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-zinc-100">
                                <Image
                                    src="/hero-repair.png"
                                    alt="Professionele smartphone reparatie"
                                    fill
                                    className="object-cover"
                                    priority
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CONVERSION STRIP ===== */}
            {content.showConversionStrip && (
                <section className="bg-zinc-900">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                            {content.conversionTitle}
                        </h2>
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-zinc-300 mb-8">
                            {content.conversionFeature1 && (
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-400" />
                                    <span>{content.conversionFeature1}</span>
                                </div>
                            )}
                            {content.conversionFeature2 && (
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-400" />
                                    <span>{content.conversionFeature2}</span>
                                </div>
                            )}
                            {content.conversionFeature3 && (
                                <div className="flex items-center gap-2">
                                    <Check className="w-5 h-5 text-green-400" />
                                    <span>{content.conversionFeature3}</span>
                                </div>
                            )}
                        </div>
                        <Link href="/repair/book">
                            <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 px-8 h-12 text-base">
                                Plan je reparatie
                            </Button>
                        </Link>
                    </div>
                </section>
            )}

            {/* ===== DECISION CARD ===== */}
            {content.showServices && (
                <section className="bg-white">
                    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
                        <div className="text-center mb-10">
                            <h2 className="text-2xl font-bold text-zinc-900">Onze diensten</h2>
                        </div>

                        <div className="bg-white rounded-2xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden shadow-sm">
                            {/* Repair Option */}
                            <Link href="/repair/book" className="group block">
                                <div className="flex items-start gap-5 p-6 hover:bg-zinc-50 transition-colors">
                                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Wrench className="w-6 h-6 text-orange-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Reparatie</h3>
                                        <p className="text-zinc-600 mb-2">
                                            Scherm, batterij of waterschade — meestal binnen 60 minuten klaar.
                                        </p>
                                        <span className="text-sm font-medium text-orange-600 group-hover:text-orange-700 inline-flex items-center gap-1">
                                            Plan je reparatie
                                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>

                            {/* Shop Option */}
                            <Link href="/phones" className="group block">
                                <div className="flex items-start gap-5 p-6 hover:bg-zinc-50 transition-colors">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                        <Smartphone className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-lg font-semibold text-zinc-900 mb-1">Refurbished toestellen</h3>
                                        <p className="text-zinc-600 mb-2">
                                            Geteste iPhones & Samsung met garantie. Bespaar tot 50%.
                                        </p>
                                        <span className="text-sm font-medium text-blue-600 group-hover:text-blue-700 inline-flex items-center gap-1">
                                            Bekijk toestellen
                                            <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                            </svg>
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </div>
                </section>
            )}
        </>
    );
}
