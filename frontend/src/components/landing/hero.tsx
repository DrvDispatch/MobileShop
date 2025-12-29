"use client";

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

export function Hero() {
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
                                    Smartphone Service Antwerpen
                                </p>
                                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-zinc-900 tracking-tight leading-[1.1]">
                                    Problemen met uw toestel?
                                    <span className="block text-zinc-500 font-normal mt-2">
                                        Wij helpen u graag.
                                    </span>
                                </h1>
                                <p className="text-lg text-zinc-600 max-w-lg">
                                    Wij repareren jouw smartphone snel en professioneel, zodat jij zorgeloos verder kunt.
                                </p>
                                <p className="text-base font-medium text-zinc-500">
                                    Vermijd lange wachttijden — maak nu een afspraak
                                </p>
                            </div>

                            {/* CTA Buttons - Big and Bold */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-2">
                                <Link href="/phones">
                                    <Button
                                        size="lg"
                                        className="w-full sm:w-auto px-10 h-14 text-lg font-bold bg-zinc-900 hover:bg-zinc-800 hover:scale-105 transition-all duration-200 shadow-xl shadow-zinc-900/20"
                                    >
                                        Bekijk Toestellen
                                    </Button>
                                </Link>
                                <Link href="/repair/book">
                                    <Button
                                        variant="outline"
                                        size="lg"
                                        className="w-full sm:w-auto px-10 h-14 text-lg font-bold border-2 border-zinc-900 hover:bg-zinc-900 hover:text-white hover:scale-105 transition-all duration-200"
                                    >
                                        Maak Afspraak
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap items-center gap-6 pt-4 text-sm text-zinc-600">
                                <div className="flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-zinc-400" />
                                    <span>Gratis verzending</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4 text-zinc-400" />
                                    <span>1 jaar garantie</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <CreditCard className="w-4 h-4 text-zinc-400" />
                                    <span>Veilig betalen</span>
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
            <section className="bg-zinc-900">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
                    <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6">
                        Vandaag kapot. Vandaag opgelost.
                    </h2>
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-zinc-300 mb-8">
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span>Binnen 60 minuten klaar</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span>Originele onderdelen</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Check className="w-5 h-5 text-green-400" />
                            <span>Lokale service in Antwerpen</span>
                        </div>
                    </div>
                    <Link href="/repair/book">
                        <Button size="lg" className="bg-white text-zinc-900 hover:bg-zinc-100 px-8 h-12 text-base">
                            Plan je reparatie
                        </Button>
                    </Link>
                </div>
            </section>

            {/* ===== DECISION CARD ===== */}
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
        </>
    );
}
