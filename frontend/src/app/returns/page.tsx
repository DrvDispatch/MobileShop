"use client";

import { Navbar, Footer } from "@/components/landing";
import { useSettingsStore } from "@/lib/store";
import { useEffect } from "react";
import Link from "next/link";
import { Package, RotateCcw, Clock, CheckCircle, XCircle, AlertCircle, Truck, CreditCard, Mail, MessageSquare } from "lucide-react";

export default function ReturnsPage() {
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store } = settings;

    const steps = [
        {
            step: 1,
            title: "Neem contact op",
            description: "Stuur een e-mail naar ons met uw ordernummer en reden voor retour. Wij bevestigen uw retourverzoek binnen 24 uur.",
            icon: <Mail className="w-6 h-6" />
        },
        {
            step: 2,
            title: "Verpak het product",
            description: "Verpak het product in de originele verpakking met alle accessoires. Voeg indien mogelijk het aankoopbewijs toe.",
            icon: <Package className="w-6 h-6" />
        },
        {
            step: 3,
            title: "Verstuur het pakket",
            description: "Stuur het pakket naar ons retouradres. Bewaar de verzendbevestiging als bewijs.",
            icon: <Truck className="w-6 h-6" />
        },
        {
            step: 4,
            title: "Ontvang uw terugbetaling",
            description: "Na ontvangst en controle storten wij het bedrag binnen 14 dagen terug via uw oorspronkelijke betaalmethode.",
            icon: <CreditCard className="w-6 h-6" />
        }
    ];

    const included = [
        "Nieuwe, ongebruikte producten in originele verpakking",
        "Producten met fabricagefouten of defecten",
        "Verkeerd geleverde producten",
        "Beschadigde producten bij levering (direct melden)",
        "Refurbished toestellen binnen de garantieperiode"
    ];

    const excluded = [
        "Producten die langer dan 14 dagen geleden zijn geleverd",
        "Geopende verzegelde producten (hygiëne/veiligheidsredenen)",
        "Producten met duidelijke gebruikssporen of schade",
        "Gepersonaliseerde of op maat gemaakte producten",
        "Schade door ongelukken, water of verkeerd gebruik"
    ];

    const openChatWidget = () => {
        window.dispatchEvent(new CustomEvent('openChatWidget'));
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <RotateCcw className="w-8 h-8 text-blue-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">Retourbeleid</h1>
                    <p className="text-zinc-600 max-w-xl mx-auto">
                        Niet tevreden? Geen probleem. Wij hanteren een klantvriendelijk retourbeleid conform de Belgische wetgeving.
                    </p>
                </div>

                {/* Key Info Cards */}
                <div className="grid sm:grid-cols-3 gap-4 mb-12">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center">
                        <Clock className="w-8 h-8 text-blue-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-zinc-900 mb-1">14 dagen</h3>
                        <p className="text-sm text-zinc-600">Bedenktijd na ontvangst</p>
                    </div>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                        <CreditCard className="w-8 h-8 text-emerald-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-zinc-900 mb-1">100% terugbetaling</h3>
                        <p className="text-sm text-zinc-600">Bij geldige retour</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                        <Package className="w-8 h-8 text-amber-600 mx-auto mb-3" />
                        <h3 className="font-semibold text-zinc-900 mb-1">90 dagen</h3>
                        <p className="text-sm text-zinc-600">Voor defecte producten</p>
                    </div>
                </div>

                {/* Return Process Steps */}
                <div className="mb-12">
                    <h2 className="text-xl font-bold text-zinc-900 mb-6 text-center">Hoe werkt het?</h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {steps.map((item) => (
                            <div key={item.step} className="bg-white border border-zinc-200 rounded-xl p-5 relative">
                                <div className="absolute -top-3 -left-3 w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-bold">
                                    {item.step}
                                </div>
                                <div className="text-zinc-400 mb-3 pt-2">
                                    {item.icon}
                                </div>
                                <h3 className="font-semibold text-zinc-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-zinc-600">{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* What Can/Cannot Be Returned */}
                <div className="grid md:grid-cols-2 gap-6 mb-12">
                    {/* Included */}
                    <div className="bg-white border border-emerald-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                            </div>
                            <h3 className="font-semibold text-zinc-900">Wat kan wel retour</h3>
                        </div>
                        <ul className="space-y-3">
                            {included.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                                    <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Excluded */}
                    <div className="bg-white border border-red-200 rounded-xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                                <XCircle className="w-5 h-5 text-red-600" />
                            </div>
                            <h3 className="font-semibold text-zinc-900">Wat kan niet retour</h3>
                        </div>
                        <ul className="space-y-3">
                            {excluded.map((item, i) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-zinc-600">
                                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Important Notes */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-12">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-zinc-900 mb-2">Belangrijke informatie</h3>
                            <ul className="space-y-2 text-sm text-zinc-600">
                                <li>• <strong>Verzendkosten:</strong> Bij retour binnen de bedenktijd zijn de verzendkosten voor uw rekening. Bij defecte producten nemen wij de kosten op ons.</li>
                                <li>• <strong>Terugbetaling:</strong> Na goedkeuring ontvangt u uw geld binnen 14 kalenderdagen terug via de oorspronkelijke betaalmethode.</li>
                                <li>• <strong>Beschadigde levering:</strong> Meld dit binnen 48 uur met foto&apos;s van de schade voor een snelle afhandeling.</li>
                                <li>• <strong>Garantieclaim:</strong> Bij een defect binnen de garantieperiode bieden wij gratis reparatie of vervanging aan.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Return Address */}
                <div className="bg-zinc-50 rounded-2xl p-6 mb-12">
                    <h3 className="font-semibold text-zinc-900 mb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        Retouradres
                    </h3>
                    <address className="not-italic text-zinc-600">
                        <p className="font-medium text-zinc-900">{store.name}</p>
                        <p>T.a.v. Retour Afdeling</p>
                        <p>{store.address.line1}</p>
                        <p>{store.address.postalCode} {store.address.city}</p>
                        <p>België</p>
                    </address>
                </div>

                {/* Contact CTA */}
                <div className="bg-zinc-900 rounded-2xl p-8 text-center text-white">
                    <MessageSquare className="w-10 h-10 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-semibold mb-3">Hulp nodig bij uw retour?</h3>
                    <p className="text-zinc-400 mb-6 max-w-md mx-auto">
                        Ons team staat klaar om u te helpen met uw retourverzoek of eventuele vragen.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <a
                            href={`mailto:${store.email}`}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-zinc-900 rounded-lg font-medium hover:bg-zinc-100 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            {store.email}
                        </a>
                        <button
                            onClick={openChatWidget}
                            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-zinc-800 text-white rounded-lg font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
                        >
                            <MessageSquare className="w-4 h-4" />
                            Start een chat
                        </button>
                    </div>
                </div>

                {/* Link to Terms */}
                <div className="mt-8 text-center">
                    <p className="text-sm text-zinc-500">
                        Voor volledige informatie, zie onze{" "}
                        <Link href="/terms" className="text-zinc-900 font-medium hover:underline">
                            Algemene Voorwaarden
                        </Link>
                    </p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
