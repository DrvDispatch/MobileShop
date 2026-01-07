'use client';

/**
 * Base Skin - About Page (Over Ons)
 * PURE PRESENTATION ONLY
 */

import Link from 'next/link';
import type { AboutPageVM, StatVM, ValueVM } from '@core/hooks/pages/useAboutPageVM';
import { Smartphone, Award, Users, Clock, MapPin, Shield, Wrench, Heart, CheckCircle, Star, Phone, Calendar } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa';

export interface AboutPageProps {
    vm: AboutPageVM;
}

function StatIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case 'clock': return <Clock className={className} />;
        case 'users': return <Users className={className} />;
        case 'wrench': return <Wrench className={className} />;
        case 'star': return <Star className={className} />;
        default: return <Clock className={className} />;
    }
}

function ValueIcon({ type, className }: { type: string; className?: string }) {
    switch (type) {
        case 'shield': return <Shield className={className} />;
        case 'heart': return <Heart className={className} />;
        case 'clock': return <Clock className={className} />;
        case 'award': return <Award className={className} />;
        default: return <Shield className={className} />;
    }
}

function StatCard({ stat }: { stat: StatVM }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-zinc-300 transition-colors">
            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-zinc-600">
                <StatIcon type={stat.iconType} className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
            <div className="text-sm text-zinc-500">{stat.label}</div>
        </div>
    );
}

function ValueCard({ value }: { value: ValueVM }) {
    return (
        <div className="bg-zinc-50 rounded-xl p-6 hover:bg-zinc-100 transition-colors">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 text-zinc-600 border border-zinc-200">
                <ValueIcon type={value.iconType} className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-zinc-900 mb-2">{value.title}</h3>
            <p className="text-sm text-zinc-600">{value.description}</p>
        </div>
    );
}

export function AboutPage({ vm }: AboutPageProps) {
    const dayNames: Record<string, string> = {
        monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
        thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag'
    };

    return (
        <>
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-zinc-50 to-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <Smartphone className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Over {vm.storeName}</h1>
                        <p className="text-xl text-zinc-600 leading-relaxed">
                            Uw lokale expert voor smartphone reparaties en verkoop in Antwerpen.
                            Wij combineren vakmanschap met eerlijke prijzen en uitstekende service.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                        {vm.stats.map((stat, index) => <StatCard key={index} stat={stat} />)}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Our Story */}
                <div className="mb-16">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Ons Verhaal</h2>
                        <div className="text-zinc-600 space-y-4 text-left sm:text-center">
                            <p>{vm.storeName} is ontstaan vanuit een passie voor technologie en de wens om klanten de beste service te bieden tegen eerlijke prijzen.</p>
                            <p>Onze missie is simpel: wij willen dat iedereen toegang heeft tot betrouwbare smartphone reparaties en kwalitatieve producten, zonder daarvoor de hoofdprijs te betalen.</p>
                        </div>
                    </div>
                </div>

                {/* Our Values */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">Waar wij voor staan</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {vm.values.map((value, index) => <ValueCard key={index} value={value} />)}
                    </div>
                </div>

                {/* Services */}
                <div className="mb-16">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">Onze Diensten</h2>
                        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {vm.services.map((service, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                                    <span className="text-zinc-700">{service}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Location & Hours */}
                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    {/* Location */}
                    <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden">
                        <div className="w-full h-48">
                            <iframe title="Store Location" width="100%" height="100%" style={{ border: 0 }} loading="lazy"
                                src="https://www.openstreetmap.org/export/embed.html?bbox=4.4010%2C51.2180%2C4.4050%2C51.2210&layer=mapnik&marker=51.21945%2C4.4030" />
                        </div>
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                                    <MapPin className="w-5 h-5 text-red-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-zinc-900">Bezoek onze winkel</h3>
                                    <p className="text-sm text-zinc-500">Walk-ins welkom</p>
                                </div>
                            </div>
                            <address className="not-italic text-zinc-600 mb-4">
                                <p className="font-medium text-zinc-900">{vm.storeName}</p>
                                <p>{vm.address.line1}</p>
                                <p>{vm.address.postalCode} {vm.address.city}</p>
                            </address>
                            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${vm.address.line1}, ${vm.address.postalCode} ${vm.address.city}`)}`}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-zinc-800 transition-all">
                                <MapPin className="w-4 h-4" /> Routebeschrijving
                            </a>
                        </div>
                    </div>

                    {/* Hours */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-zinc-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-zinc-900">Openingsuren</h3>
                                <p className="text-sm text-zinc-500">Wij staan voor u klaar</p>
                            </div>
                        </div>
                        <div className="space-y-3">
                            {vm.openingHours ? Object.entries(dayNames).map(([key, name]) => {
                                const dayHours = vm.openingHours?.[key];
                                return (
                                    <div key={key} className="flex justify-between py-2 border-b border-zinc-100 last:border-0">
                                        <span className="text-zinc-500">{name}</span>
                                        <span className={`font-medium ${!dayHours ? 'text-red-500' : 'text-zinc-900'}`}>
                                            {dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Gesloten'}
                                        </span>
                                    </div>
                                );
                            }) : <p className="text-zinc-500 text-center">Neem contact op voor openingsuren</p>}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-zinc-900 rounded-2xl p-8 text-center text-white">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h2 className="text-2xl font-bold mb-3">Klaar om uw toestel te laten repareren?</h2>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">Maak een afspraak of kom gewoon langs. Wij helpen u graag verder!</p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link href="/repair/book" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors">
                            <Calendar className="w-5 h-5" /> Maak een afspraak
                        </Link>
                        {vm.whatsappLink && (
                            <a href={vm.whatsappLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                                <FaWhatsapp className="w-5 h-5" /> WhatsApp
                            </a>
                        )}
                        <a href={`tel:${vm.phone.replace(/\s/g, '')}`} className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700">
                            <Phone className="w-5 h-5" /> Bel ons
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
