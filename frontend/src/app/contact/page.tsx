"use client";

import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { useTenant } from "@/lib/TenantProvider";

// React Icons
import { FaWhatsapp, FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaCalendarAlt } from "react-icons/fa";
import { BiSupport } from "react-icons/bi";
import { HiExternalLink } from "react-icons/hi";
import { BsCheckCircleFill } from "react-icons/bs";

export default function ContactPage() {
    const tenant = useTenant();
    const { contact, branding, business } = tenant;

    // Format WhatsApp link from tenant config
    const formatWhatsAppLink = (num: string | null): string | null => {
        if (!num) return null;
        const cleaned = num.replace(/[^0-9+]/g, '').replace(/^\+/, '');
        return `https://wa.me/${cleaned}?text=Hallo,%20ik%20heb%20een%20vraag...`;
    };
    const whatsappLink = formatWhatsAppLink(contact.whatsappNumber);
    const whatsappDisplay = contact.whatsappNumber || '';

    // Store config from tenant
    const store = {
        name: branding.shopName,
        email: contact.email || '',
        phone: contact.phone || '',
        address: contact.address as { line1?: string; postalCode?: string; city?: string } || {}
    };

    // Google Maps link
    const address = `${store.address.line1 || ''}, ${store.address.postalCode || ''} ${store.address.city || ''}`;
    const googleMapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

    const openChatWidget = () => {
        window.dispatchEvent(new CustomEvent('openChatWidget'));
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                {/* Header */}
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">Contact</h1>
                    <p className="text-zinc-600 max-w-xl mx-auto">
                        Heeft u vragen over reparaties, prijzen of bestellingen? Neem contact met ons op.
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Contact Methods - Elegant white cards with subtle borders */}
                    <div className="space-y-3">
                        {/* WhatsApp - only show if configured */}
                        {whatsappLink && (
                            <a
                                href={whatsappLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 hover:border-green-300 hover:shadow-md transition-all group"
                            >
                                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FaWhatsapp className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-lg font-semibold text-zinc-900">WhatsApp</h3>
                                    <p className="text-sm text-zinc-500">Snelste manier om ons te bereiken</p>
                                </div>
                                <div className="text-green-600 font-medium flex items-center gap-1">
                                    {whatsappDisplay}
                                    <HiExternalLink className="w-4 h-4" />
                                </div>
                            </a>
                        )}

                        {/* Email */}
                        <a
                            href={`mailto:${store.email}`}
                            className="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaEnvelope className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-zinc-900">Email</h3>
                                <p className="text-sm text-zinc-500">Voor offertes en zakelijke vragen</p>
                            </div>
                            <span className="text-blue-600 font-medium">{store.email}</span>
                        </a>

                        {/* Support Ticket */}
                        <button
                            onClick={openChatWidget}
                            className="w-full flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 hover:border-zinc-300 hover:shadow-md transition-all group text-left"
                        >
                            <div className="w-12 h-12 bg-zinc-200 rounded-xl flex items-center justify-center flex-shrink-0">
                                <BiSupport className="w-6 h-6 text-zinc-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-zinc-900">Support Ticket</h3>
                                <p className="text-sm text-zinc-500">Start een gesprek met klantenservice</p>
                            </div>
                            <span className="text-zinc-600 font-medium">Open chat →</span>
                        </button>

                        {/* Phone */}
                        <a
                            href={`tel:${store.phone.replace(/\s/g, '')}`}
                            className="flex items-center gap-4 bg-white border border-zinc-200 rounded-xl p-5 hover:border-teal-300 hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaPhone className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-zinc-900">Telefoon</h3>
                                <p className="text-sm text-zinc-500">Bel ons direct</p>
                            </div>
                            <span className="text-teal-600 font-medium">{store.phone}</span>
                        </a>

                        {/* Book Appointment */}
                        <Link
                            href="/repair/book"
                            className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 rounded-xl p-5 hover:border-emerald-300 hover:shadow-md transition-all group"
                        >
                            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <FaCalendarAlt className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-zinc-900">Afspraak Maken</h3>
                                <p className="text-sm text-zinc-500">Plan een reparatie afspraak</p>
                            </div>
                            <span className="font-medium text-emerald-600">Boek nu →</span>
                        </Link>
                    </div>

                    {/* Location & Hours */}
                    <div className="space-y-4">
                        {/* Location Card with Embedded Map */}
                        <div className="bg-white rounded-xl overflow-hidden border border-zinc-200">
                            {/* OpenStreetMap Embed - No API key needed */}
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

                            <div className="p-5">
                                <div className="flex items-start gap-3 mb-4">
                                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <FaMapMarkerAlt className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900">{store.name}</h3>
                                        <p className="text-zinc-600 text-sm mt-1">
                                            {store.address.line1}<br />
                                            {store.address.postalCode} {store.address.city}
                                        </p>
                                    </div>
                                </div>

                                {/* Google Maps Link */}
                                <a
                                    href={googleMapsLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center gap-2 w-full bg-zinc-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-zinc-800 transition-all"
                                >
                                    <FaMapMarkerAlt className="w-4 h-4" />
                                    Routebeschrijving
                                    <HiExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>

                        {/* Opening Hours */}
                        <div className="bg-white rounded-xl p-5 border border-zinc-200">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <FaClock className="w-5 h-5 text-zinc-500" />
                                </div>
                                <h3 className="font-semibold text-zinc-900">Openingsuren</h3>
                            </div>

                            <div className="space-y-2 text-sm">
                                {(() => {
                                    const hours = business.openingHours as Record<string, { open: string; close: string } | null> | null;
                                    const dayNames: Record<string, string> = {
                                        monday: 'Maandag', tuesday: 'Dinsdag', wednesday: 'Woensdag',
                                        thursday: 'Donderdag', friday: 'Vrijdag', saturday: 'Zaterdag', sunday: 'Zondag'
                                    };
                                    if (!hours) {
                                        return <p className="text-zinc-500">Neem contact op voor openingsuren</p>;
                                    }
                                    return Object.entries(dayNames).map(([key, name]) => {
                                        const dayHours = hours[key];
                                        return (
                                            <div key={key} className="flex justify-between py-1">
                                                <span className="text-zinc-500">{name}</span>
                                                <span className={`font-medium ${!dayHours ? 'text-red-500' : 'text-zinc-700'}`}>
                                                    {dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Gesloten'}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Quick FAQ */}
                        <div className="bg-white rounded-xl p-5 border border-zinc-200">
                            <h3 className="font-semibold text-zinc-900 mb-3">Veelgestelde vragen</h3>
                            <ul className="space-y-2 text-sm text-zinc-600">
                                {[
                                    "Reparaties meestal binnen 60 minuten",
                                    "1 jaar garantie op alle reparaties",
                                    "Gratis diagnose zonder verplichtingen",
                                    "Originele en A-kwaliteit onderdelen",
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                        <BsCheckCircleFill className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
