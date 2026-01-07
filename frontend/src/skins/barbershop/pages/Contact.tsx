'use client';

/**
 * Barbershop Skin - Contact Page
 * 
 * Simple contact page with location and hours.
 * Same VM as base skin, different visual presentation.
 * 
 * PROPS-ONLY: No hooks, no fetch, no logic.
 */

import Link from 'next/link';
import { MapPin, Phone, Mail, Clock, Calendar } from 'lucide-react';

export interface ContactPageVM {
    shopName: string;
    address: { line1?: string; line2?: string; city?: string; postalCode?: string } | null;
    phone: string | null;
    email: string | null;
    whatsappLink: string | null;
    openingHours: { day: string; hours: string | null }[];
    mapEmbedUrl: string | null;
    isLoading: boolean;
}

export function ContactPage({ vm }: { vm: ContactPageVM }) {
    const { shopName, address, phone, email, openingHours, isLoading } = vm;

    if (isLoading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-stone-50">
                <div className="animate-pulse text-stone-400">Loading...</div>
            </div>
        );
    }

    return (
        <div className="bg-stone-50 py-16">
            <div className="max-w-3xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-stone-900 mb-4">Visit Us</h1>
                    <p className="text-stone-600 max-w-md mx-auto">
                        Walk-ins welcome. For guaranteed availability, book online.
                    </p>
                </div>

                {/* Contact Cards */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Location */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                            <MapPin className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-stone-900 mb-2">Location</h3>
                        {address && (
                            <p className="text-stone-600">
                                {address.line1}<br />
                                {address.postalCode} {address.city}
                            </p>
                        )}
                    </div>

                    {/* Contact */}
                    <div className="bg-white rounded-2xl border border-stone-200 p-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                            <Phone className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-stone-900 mb-2">Contact</h3>
                        <div className="space-y-1 text-stone-600">
                            {phone && (
                                <a href={`tel:${phone}`} className="flex items-center gap-2 hover:text-amber-600">
                                    <Phone className="w-4 h-4" /> {phone}
                                </a>
                            )}
                            {email && (
                                <a href={`mailto:${email}`} className="flex items-center gap-2 hover:text-amber-600">
                                    <Mail className="w-4 h-4" /> {email}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Opening Hours */}
                <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-12">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-amber-600" />
                        </div>
                        <h3 className="font-bold text-stone-900">Opening Hours</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {openingHours.map((item) => (
                            <div key={item.day} className="flex justify-between py-2 border-b border-stone-100">
                                <span className="font-medium text-stone-700 capitalize">{item.day}</span>
                                <span className={item.hours ? 'text-stone-600' : 'text-red-500'}>
                                    {item.hours || 'Closed'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="text-center">
                    <Link
                        href="/repair/book"
                        className="inline-flex items-center gap-3 px-8 py-4 bg-amber-500 hover:bg-amber-400 text-stone-900 font-bold text-lg rounded-full transition-colors"
                    >
                        <Calendar className="w-5 h-5" />
                        Book Appointment
                    </Link>
                </div>
            </div>
        </div>
    );
}
