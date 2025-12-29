"use client";

import { Navbar, Footer } from "@/components/landing";
import { useSettingsStore } from "@/lib/store";
import { useEffect } from "react";
import { FileText, AlertCircle, Clock, Shield, CreditCard, Truck, RefreshCw, Scale, Mail } from "lucide-react";

export default function TermsPage() {
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store } = settings;

    const sections = [
        {
            icon: <FileText className="w-5 h-5" />,
            title: "1. Algemeen",
            content: [
                `Deze algemene voorwaarden zijn van toepassing op alle bestellingen, overeenkomsten en diensten van ${store.name}, gevestigd te ${store.address.line1}, ${store.address.postalCode} ${store.address.city}.`,
                "Door een bestelling te plaatsen of gebruik te maken van onze diensten, gaat u akkoord met deze voorwaarden.",
                "Wij behouden ons het recht voor om deze voorwaarden te wijzigen. De meest recente versie is altijd beschikbaar op onze website."
            ]
        },
        {
            icon: <CreditCard className="w-5 h-5" />,
            title: "2. Prijzen en Betaling",
            content: [
                "Alle prijzen op onze website zijn in euro's en inclusief 21% BTW, tenzij anders vermeld.",
                "Betaling geschiedt via de op de website aangeboden betaalmethoden: creditcard (Visa, Mastercard, American Express), Bancontact en iDEAL.",
                "Bestellingen worden pas verwerkt na ontvangst van de volledige betaling.",
                "Bij reparaties in de winkel kan contant of met kaart worden betaald."
            ]
        },
        {
            icon: <Truck className="w-5 h-5" />,
            title: "3. Levering",
            content: [
                "Wij streven ernaar bestellingen binnen 2-3 werkdagen te verzenden.",
                "Levertijden: België 2-3 werkdagen, Nederland & Luxemburg 3-4 werkdagen, Duitsland & Frankrijk 4-5 werkdagen.",
                "Gratis verzending bij bestellingen boven €75 binnen België.",
                "Het risico van de producten gaat over op de klant bij aflevering.",
                "Bij ongeldige levergegevens zijn de extra kosten voor rekening van de klant."
            ]
        },
        {
            icon: <RefreshCw className="w-5 h-5" />,
            title: "4. Herroepingsrecht",
            content: [
                "Conform de Belgische wetgeving heeft u als consument het recht om binnen 14 kalenderdagen na ontvangst van uw bestelling af te zien van de aankoop, zonder opgave van reden.",
                "Producten dienen in originele, onbeschadigde staat en verpakking te worden geretourneerd.",
                "De kosten voor retourzending zijn voor rekening van de klant, tenzij het product defect is.",
                "Na ontvangst en controle van de retour wordt het aankoopbedrag binnen 14 dagen teruggestort.",
                "Gepersonaliseerde producten en geopende verzegelde producten zijn uitgesloten van retour."
            ]
        },
        {
            icon: <Shield className="w-5 h-5" />,
            title: "5. Garantie",
            content: [
                "Op alle nieuwe producten geldt de wettelijke garantie van 2 jaar.",
                "Op refurbished toestellen geldt een garantie van 6 maanden.",
                "Garantie op reparaties bedraagt 90 dagen voor onderdelen en arbeidsloon.",
                "Garantie vervalt bij water- en valschade, ongeautoriseerde reparaties of onjuist gebruik.",
                "Bij een geldige garantieclaim ontvangt u kosteloos reparatie of vervanging."
            ]
        },
        {
            icon: <Clock className="w-5 h-5" />,
            title: "6. Reparatiediensten",
            content: [
                "Reparaties worden uitgevoerd in onze winkel of via een afspraaksysteem.",
                "Wij streven ernaar de meeste reparaties binnen 60 minuten af te ronden.",
                "Een gratis diagnose wordt aangeboden. Bij annulering na diagnose kunnen kosten in rekening worden gebracht.",
                "Wij zijn niet aansprakelijk voor dataverlies. Maak altijd een back-up voor reparatie.",
                "Onafgehaalde toestellen worden na 30 dagen eigendom van de winkel na twee waarschuwingen."
            ]
        },
        {
            icon: <AlertCircle className="w-5 h-5" />,
            title: "7. Aansprakelijkheid",
            content: [
                "Onze aansprakelijkheid is beperkt tot het aankoopbedrag van het product of de reparatie.",
                "Wij zijn niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst.",
                "Bij overmacht (oorlog, natuurrampen, stakingen, pandemieën) zijn wij ontheven van onze verplichtingen."
            ]
        },
        {
            icon: <Scale className="w-5 h-5" />,
            title: "8. Toepasselijk Recht en Geschillen",
            content: [
                "Op alle overeenkomsten is het Belgische recht van toepassing.",
                "Geschillen worden in eerste instantie minnelijk opgelost.",
                "Bij voortdurende geschillen is de rechtbank van Antwerpen bevoegd.",
                "Consumenten kunnen ook terecht bij het Europees platform voor onlinegeschillenbeslechting: https://ec.europa.eu/consumers/odr/"
            ]
        }
    ];

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-8 h-8 text-zinc-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">Algemene Voorwaarden</h1>
                    <p className="text-zinc-600 max-w-xl mx-auto">
                        Lees onze algemene voorwaarden zorgvuldig door voordat u een aankoop doet of gebruik maakt van onze diensten.
                    </p>
                    <p className="text-sm text-zinc-400 mt-4">
                        Laatst bijgewerkt: 29 december 2024
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-8">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className="bg-white border border-zinc-200 rounded-xl p-6 hover:border-zinc-300 transition-colors"
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center flex-shrink-0 text-zinc-600">
                                    {section.icon}
                                </div>
                                <h2 className="text-lg font-semibold text-zinc-900">{section.title}</h2>
                            </div>
                            <ul className="space-y-3">
                                {section.content.map((item, i) => (
                                    <li key={i} className="text-zinc-600 text-sm leading-relaxed flex items-start gap-2">
                                        <span className="text-zinc-400 mt-1.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact Section */}
                <div className="mt-12 bg-zinc-50 rounded-2xl p-8 text-center">
                    <Mail className="w-8 h-8 mx-auto mb-4 text-zinc-400" />
                    <h3 className="text-lg font-semibold text-zinc-900 mb-2">Vragen over onze voorwaarden?</h3>
                    <p className="text-zinc-600 text-sm mb-4">
                        Neem gerust contact met ons op voor verdere verduidelijking.
                    </p>
                    <a
                        href={`mailto:${store.email}`}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                    >
                        <Mail className="w-4 h-4" />
                        {store.email}
                    </a>
                </div>

                {/* Company Info */}
                <div className="mt-8 text-center text-sm text-zinc-400">
                    <p>{store.name}</p>
                    <p>{store.address.line1}, {store.address.postalCode} {store.address.city}</p>
                    {store.vatNumber && <p>BTW: {store.vatNumber}</p>}
                </div>
            </div>

            <Footer />
        </main>
    );
}
