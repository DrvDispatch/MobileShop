"use client";

import { Navbar, Footer } from "@/components/landing";
import { useTenant } from "@/lib/TenantProvider";
import Link from "next/link";
import {
    Smartphone,
    Award,
    Users,
    Clock,
    MapPin,
    Shield,
    Wrench,
    Heart,
    CheckCircle,
    Star,
    Phone,
    Calendar
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

export default function AboutPage() {
    const tenant = useTenant();
    const { contact, branding, business } = tenant;

    // Create store-like object from tenant for compatibility
    const store = {
        name: branding.shopName,
        phone: contact.phone || '',
        address: contact.address as { line1?: string; postalCode?: string; city?: string } || {}
    };

    const stats = [
        { value: "5+", label: "Jaar ervaring", icon: <Clock className="w-5 h-5" /> },
        { value: "10.000+", label: "Tevreden klanten", icon: <Users className="w-5 h-5" /> },
        { value: "15.000+", label: "Reparaties", icon: <Wrench className="w-5 h-5" /> },
        { value: "4.7/5", label: "Google score", icon: <Star className="w-5 h-5" /> }
    ];

    const values = [
        {
            icon: <Shield className="w-6 h-6" />,
            title: "Kwaliteit eerst",
            description: "Wij gebruiken alleen originele en A-kwaliteit onderdelen voor elke reparatie. Geen compromissen."
        },
        {
            icon: <Heart className="w-6 h-6" />,
            title: "Klantgericht",
            description: "Uw tevredenheid staat centraal. Van advies tot nazorg, wij staan voor u klaar."
        },
        {
            icon: <Clock className="w-6 h-6" />,
            title: "Snelle service",
            description: "De meeste reparaties zijn binnen 60 minuten klaar. Wachten kan in onze gezellige wachtruimte."
        },
        {
            icon: <Award className="w-6 h-6" />,
            title: "Garantie",
            description: "1 jaar garantie op al onze reparaties. Zekerheid en vertrouwen voor onze klanten."
        }
    ];

    const services = [
        "Smartphone reparaties (scherm, batterij, oplaadpoort, etc.)",
        "Tablet reparaties",
        "Verkoop van nieuwe en refurbished toestellen",
        "Accessoires en beschermhoesjes",
        "Data recovery en backup",
        "Softwareondersteuning"
    ];

    // Format WhatsApp link from tenant config
    const formatWhatsAppLink = (num: string | null): string | null => {
        if (!num) return null;
        const cleaned = num.replace(/[^0-9+]/g, '').replace(/^\+/, '');
        return `https://wa.me/${cleaned}?text=Hallo,%20ik%20wil%20graag%20meer%20informatie...`;
    };
    const whatsappLink = formatWhatsAppLink(contact.whatsappNumber);

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            {/* Hero Section */}
            <div className="bg-gradient-to-b from-zinc-50 to-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center mx-auto mb-8">
                            <Smartphone className="w-10 h-10 text-white" />
                        </div>
                        <h1 className="text-4xl font-bold text-zinc-900 mb-4">Over {store.name}</h1>
                        <p className="text-xl text-zinc-600 leading-relaxed">
                            Uw lokale expert voor smartphone reparaties en verkoop in Antwerpen.
                            Wij combineren vakmanschap met eerlijke prijzen en uitstekende service.
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
                        {stats.map((stat, index) => (
                            <div key={index} className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-zinc-300 transition-colors">
                                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center mx-auto mb-3 text-zinc-600">
                                    {stat.icon}
                                </div>
                                <div className="text-2xl font-bold text-zinc-900">{stat.value}</div>
                                <div className="text-sm text-zinc-500">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Our Story */}
                <div className="mb-16">
                    <div className="max-w-3xl mx-auto text-center mb-12">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-4">Ons Verhaal</h2>
                        <div className="text-zinc-600 space-y-4 text-left sm:text-center">
                            <p>
                                {store.name} is ontstaan vanuit een passie voor technologie en de wens om klanten
                                de beste service te bieden tegen eerlijke prijzen. Wat begon als een kleine reparatieservice,
                                is uitgegroeid tot een volwaardige winkel waar u terecht kunt voor al uw smartphone behoeften.
                            </p>
                            <p>
                                Onze missie is simpel: wij willen dat iedereen toegang heeft tot betrouwbare smartphone
                                reparaties en kwalitatieve producten, zonder daarvoor de hoofdprijs te betalen.
                                Daarom werken wij transparant, met vaste prijzen en geen verrassingen achteraf.
                            </p>
                            <p>
                                Gelegen in het hart van Antwerpen, zijn wij gemakkelijk bereikbaar en staan wij
                                altijd klaar voor onze klanten – of het nu gaat om een snelle schermvervanging,
                                advies over een nieuw toestel, of hulp bij softwareproblemen.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Our Values */}
                <div className="mb-16">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">Waar wij voor staan</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {values.map((value, index) => (
                            <div key={index} className="bg-zinc-50 rounded-xl p-6 hover:bg-zinc-100 transition-colors">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mb-4 text-zinc-600 border border-zinc-200">
                                    {value.icon}
                                </div>
                                <h3 className="font-semibold text-zinc-900 mb-2">{value.title}</h3>
                                <p className="text-sm text-zinc-600">{value.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Services */}
                <div className="mb-16">
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold text-zinc-900 mb-6 text-center">Onze Diensten</h2>
                        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {services.map((service, index) => (
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
                            <iframe
                                title="Store Location"
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                src="https://www.openstreetmap.org/export/embed.html?bbox=4.4010%2C51.2180%2C4.4050%2C51.2210&layer=mapnik&marker=51.21945%2C4.4030"
                            />
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
                                <p className="font-medium text-zinc-900">{store.name}</p>
                                <p>{store.address.line1}</p>
                                <p>{store.address.postalCode} {store.address.city}</p>
                            </address>
                            <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${store.address.line1}, ${store.address.postalCode} ${store.address.city}`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white rounded-lg py-3 text-sm font-medium hover:bg-zinc-800 transition-all"
                            >
                                <MapPin className="w-4 h-4" />
                                Routebeschrijving
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
                            {(() => {
                                const hours = business.openingHours as Record<string, { open: string; close: string } | null> | null;
                                const dayNames: Record<string, string> = {
                                    monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
                                    thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag'
                                };
                                if (!hours) {
                                    return <p className="text-zinc-500 text-center">Neem contact op voor openingsuren</p>;
                                }
                                return Object.entries(dayNames).map(([key, name]) => {
                                    const dayHours = hours[key];
                                    return (
                                        <div key={key} className="flex justify-between py-2 border-b border-zinc-100 last:border-0">
                                            <span className="text-zinc-500">{name}</span>
                                            <span className={`font-medium ${!dayHours ? 'text-red-500' : 'text-zinc-900'}`}>
                                                {dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Gesloten'}
                                            </span>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="bg-zinc-900 rounded-2xl p-8 text-center text-white">
                    <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-80" />
                    <h2 className="text-2xl font-bold mb-3">Klaar om uw toestel te laten repareren?</h2>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                        Maak een afspraak of kom gewoon langs. Wij helpen u graag verder!
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <Link
                            href="/repair/book"
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
                        >
                            <Calendar className="w-5 h-5" />
                            Maak een afspraak
                        </Link>
                        {whatsappLink && (
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                            >
                                <FaWhatsapp className="w-5 h-5" />
                                WhatsApp
                            </a>
                        )}
                        <a
                            href={`tel:${store.phone.replace(/\s/g, '')}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                            <Phone className="w-5 h-5" />
                            Bel ons
                        </a>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
