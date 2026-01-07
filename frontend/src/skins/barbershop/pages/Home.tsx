'use client';

/**
 * Barbershop Skin - Home Page
 * 
 * Hero-focused landing with prominent booking CTA.
 * Single-scroll narrative layout instead of grid sections.
 * 
 * PROPS-ONLY: No hooks, no fetch, no logic.
 */

import Link from 'next/link';
import { Scissors, Clock, Star, Calendar, MapPin, Phone, ChevronRight } from 'lucide-react';

// Using same VM type as base - we just render differently
export interface HomePageVM {
    // Currently uses no props - can be extended later
}

export function HomePage(_props: { vm?: HomePageVM }) {
    return (
        <div className="bg-stone-50">
            {/* Hero Section - Full viewport height */}
            <section className="min-h-[85vh] relative flex items-center justify-center bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 overflow-hidden">
                {/* Decorative Elements */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-20 w-64 h-64 border border-amber-500/30 rounded-full" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 border border-amber-500/20 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-amber-500/10 rounded-full" />
                </div>

                <div className="relative z-10 text-center px-6 max-w-3xl mx-auto">
                    {/* Logo Badge */}
                    <div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl shadow-amber-500/30">
                        <Scissors className="w-12 h-12 text-stone-900" />
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                        Your Style,<br />
                        <span className="text-amber-500">Our Expertise</span>
                    </h1>

                    <p className="text-lg sm:text-xl text-stone-300 mb-10 max-w-xl mx-auto">
                        Premium grooming experience. Walk-ins welcome, appointments preferred.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Link
                            href="/repair/book"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-lg rounded-full transition-all hover:scale-105 shadow-xl shadow-amber-500/25"
                        >
                            <Calendar className="w-5 h-5" />
                            Book Appointment
                        </Link>
                        <Link
                            href="/contact"
                            className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-transparent border-2 border-stone-600 hover:border-stone-400 text-white font-semibold text-lg rounded-full transition-colors"
                        >
                            <MapPin className="w-5 h-5" />
                            Find Us
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Strip */}
            <section className="bg-stone-900 py-6 border-t border-stone-800">
                <div className="max-w-5xl mx-auto px-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <Clock className="w-6 h-6 text-amber-500" />
                            <p className="text-white font-medium">Quick Service</p>
                            <p className="text-stone-400 text-sm">30-45 min</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Scissors className="w-6 h-6 text-amber-500" />
                            <p className="text-white font-medium">Expert Barbers</p>
                            <p className="text-stone-400 text-sm">10+ years exp</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Star className="w-6 h-6 text-amber-500" />
                            <p className="text-white font-medium">Top Rated</p>
                            <p className="text-stone-400 text-sm">4.9★ Google</p>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <Calendar className="w-6 h-6 text-amber-500" />
                            <p className="text-white font-medium">Easy Booking</p>
                            <p className="text-stone-400 text-sm">Online 24/7</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Services Preview - Vertical Scroll Cards */}
            <section className="py-20 bg-stone-50">
                <div className="max-w-3xl mx-auto px-6">
                    <h2 className="text-3xl font-bold text-stone-900 text-center mb-4">Our Services</h2>
                    <p className="text-stone-600 text-center mb-12 max-w-xl mx-auto">
                        From classic cuts to modern styles, we&apos;ve got you covered.
                    </p>

                    <div className="space-y-4">
                        {[
                            { name: 'Classic Haircut', duration: '30 min', price: '€25' },
                            { name: 'Beard Trim', duration: '20 min', price: '€15' },
                            { name: 'Full Grooming', duration: '45 min', price: '€40' },
                            { name: 'Hair & Beard Combo', duration: '45 min', price: '€35' },
                        ].map((service, index) => (
                            <Link
                                key={index}
                                href="/repair/book"
                                className="flex items-center justify-between p-6 bg-white rounded-2xl border border-stone-200 hover:border-amber-500 hover:shadow-lg transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                                        <Scissors className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-stone-900">{service.name}</h3>
                                        <p className="text-sm text-stone-500">{service.duration}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-lg font-bold text-stone-900">{service.price}</span>
                                    <ChevronRight className="w-5 h-5 text-stone-400 group-hover:text-amber-500 transition-colors" />
                                </div>
                            </Link>
                        ))}
                    </div>

                    <div className="text-center mt-10">
                        <Link
                            href="/repair/book"
                            className="inline-flex items-center gap-2 text-amber-600 hover:text-amber-700 font-semibold"
                        >
                            View all services
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-stone-900">
                <div className="max-w-3xl mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Ready for a fresh look?</h2>
                    <p className="text-stone-400 mb-8 max-w-xl mx-auto">
                        Book your appointment now and experience the difference.
                    </p>
                    <Link
                        href="/repair/book"
                        className="inline-flex items-center justify-center gap-3 px-10 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-lg rounded-full transition-all hover:scale-105"
                    >
                        <Calendar className="w-5 h-5" />
                        Book Now
                    </Link>
                </div>
            </section>
        </div>
    );
}
