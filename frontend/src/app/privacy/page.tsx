"use client";

import { Navbar, Footer } from "@/components/landing";
import { useSettingsStore } from "@/lib/store";
import { useEffect } from "react";
import { Shield, Database, Eye, Lock, UserCheck, Globe, Clock, AlertTriangle, Mail, Settings } from "lucide-react";

export default function PrivacyPage() {
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store } = settings;

    const sections = [
        {
            icon: <Database className="w-5 h-5" />,
            title: "1. Welke gegevens verzamelen wij?",
            content: [
                "Persoonsgegevens die u aan ons verstrekt: naam, e-mailadres, telefoonnummer, adresgegevens voor levering en facturatie.",
                "Betalingsgegevens: deze worden veilig verwerkt door onze betalingsprovider Stripe. Wij slaan geen volledige creditcardnummers op.",
                "Apparaatinformatie bij reparaties: merk, model, serienummer en beschrijving van het probleem.",
                "Technische gegevens: IP-adres, browsertype, apparaattype en bezochte pagina's voor websiteoptimalisatie.",
                "Communicatiegegevens: correspondentie via e-mail, chat of telefoon voor klantenservice."
            ]
        },
        {
            icon: <Eye className="w-5 h-5" />,
            title: "2. Waarvoor gebruiken wij uw gegevens?",
            content: [
                "Uitvoering van overeenkomsten: verwerken van bestellingen, reparaties en betalingen.",
                "Communicatie: updates over uw bestelling of reparatie, beantwoorden van vragen.",
                "Marketing: met uw toestemming sturen wij nieuwsbrieven en aanbiedingen. U kunt zich altijd uitschrijven.",
                "Wettelijke verplichtingen: facturatie, boekhouding en eventuele juridische procedures.",
                "Verbetering van diensten: analyse van websitegebruik om onze service te optimaliseren."
            ]
        },
        {
            icon: <UserCheck className="w-5 h-5" />,
            title: "3. Juridische grondslagen",
            content: [
                "Uitvoering van de overeenkomst: verwerking is noodzakelijk om uw bestellingen en reparaties uit te voeren.",
                "Wettelijke verplichting: bewaren van facturen en boekhoudkundige gegevens.",
                "Toestemming: voor marketingcommunicatie en niet-essentiële cookies.",
                "Gerechtvaardigd belang: verbetering van onze diensten en fraudepreventie."
            ]
        },
        {
            icon: <Globe className="w-5 h-5" />,
            title: "4. Delen met derden",
            content: [
                "Bezorgdiensten: bpost en internationale vervoerders voor verzending van bestellingen.",
                "Betalingsprovider: Stripe voor veilige verwerking van betalingen.",
                "Hostingprovider: voor opslag van websitegegevens op beveiligde servers.",
                "Autoriteiten: alleen indien wettelijk verplicht.",
                "Wij verkopen of verhuren uw persoonsgegevens nooit aan derden voor commerciële doeleinden."
            ]
        },
        {
            icon: <Lock className="w-5 h-5" />,
            title: "5. Beveiliging",
            content: [
                "Alle gegevensoverdracht is versleuteld via SSL/TLS-technologie.",
                "Toegang tot persoonsgegevens is beperkt tot geautoriseerd personeel.",
                "Wij maken gebruik van beveiligde servers en regelmatige back-ups.",
                "Betalingsgegevens worden verwerkt conform PCI-DSS standaarden door Stripe.",
                "Wij voeren regelmatig beveiligingsaudits uit om kwetsbaarheden te identificeren."
            ]
        },
        {
            icon: <Clock className="w-5 h-5" />,
            title: "6. Bewaartermijnen",
            content: [
                "Klantgegevens: zolang u klant bent, plus 7 jaar na laatste aankoop (wettelijke verplichting).",
                "Facturen en boekhoudkundige gegevens: 7 jaar (wettelijke verplichting).",
                "Reparatiehistorie: 3 jaar voor garantiedoeleinden.",
                "Marketingvoorkeuren: tot u zich uitschrijft.",
                "Na afloop van de bewaartermijn worden gegevens veilig verwijderd of geanonimiseerd."
            ]
        },
        {
            icon: <Settings className="w-5 h-5" />,
            title: "7. Uw rechten (GDPR/AVG)",
            content: [
                "Recht op inzage: u kunt opvragen welke gegevens wij van u hebben.",
                "Recht op rectificatie: u kunt onjuiste gegevens laten corrigeren.",
                "Recht op verwijdering: u kunt verzoeken uw gegevens te wissen (met inachtneming van wettelijke verplichtingen).",
                "Recht op beperking: u kunt de verwerking van uw gegevens beperken.",
                "Recht op overdraagbaarheid: u kunt uw gegevens in een gangbaar formaat ontvangen.",
                "Recht op bezwaar: u kunt bezwaar maken tegen verwerking voor marketingdoeleinden.",
                "Recht om toestemming in te trekken: u kunt uw toestemming voor marketing op elk moment intrekken."
            ]
        },
        {
            icon: <AlertTriangle className="w-5 h-5" />,
            title: "8. Cookies",
            content: [
                "Essentiële cookies: noodzakelijk voor het functioneren van de website (winkelwagen, inloggen).",
                "Analytische cookies: om websitegebruik te meten en te verbeteren (geanonimiseerd).",
                "Marketing cookies: alleen met uw toestemming, voor gepersonaliseerde aanbiedingen.",
                "U kunt uw cookievoorkeuren aanpassen via uw browserinstellingen."
            ]
        }
    ];

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Shield className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-3">Privacybeleid</h1>
                    <p className="text-zinc-600 max-w-xl mx-auto">
                        Wij respecteren uw privacy en beschermen uw persoonsgegevens conform de Algemene Verordening Gegevensbescherming (AVG/GDPR).
                    </p>
                    <p className="text-sm text-zinc-400 mt-4">
                        Laatst bijgewerkt: 29 december 2024
                    </p>
                </div>

                {/* Intro Card */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 mb-8">
                    <h2 className="font-semibold text-zinc-900 mb-3">Samenvatting</h2>
                    <p className="text-zinc-600 text-sm leading-relaxed">
                        {store.name} verzamelt alleen de gegevens die nodig zijn om uw bestellingen en reparaties uit te voeren.
                        Wij delen uw gegevens nooit voor commerciële doeleinden en nemen passende maatregelen om uw gegevens te beschermen.
                        U heeft te allen tijde recht op inzage, correctie en verwijdering van uw gegevens.
                    </p>
                </div>

                {/* Sections */}
                <div className="space-y-6">
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
                                        <span className="text-emerald-500 mt-1.5">•</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Contact & Complaints */}
                <div className="mt-12 grid md:grid-cols-2 gap-6">
                    <div className="bg-zinc-50 rounded-2xl p-6">
                        <Mail className="w-8 h-8 mb-4 text-zinc-400" />
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Vragen of verzoeken?</h3>
                        <p className="text-zinc-600 text-sm mb-4">
                            Voor vragen over uw privacy of om uw rechten uit te oefenen, neem contact op:
                        </p>
                        <a
                            href={`mailto:${store.email}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors"
                        >
                            <Mail className="w-4 h-4" />
                            {store.email}
                        </a>
                    </div>

                    <div className="bg-zinc-50 rounded-2xl p-6">
                        <AlertTriangle className="w-8 h-8 mb-4 text-zinc-400" />
                        <h3 className="text-lg font-semibold text-zinc-900 mb-2">Klachten?</h3>
                        <p className="text-zinc-600 text-sm mb-4">
                            U heeft het recht een klacht in te dienen bij de Gegevensbeschermingsautoriteit:
                        </p>
                        <a
                            href="https://www.gegevensbeschermingsautoriteit.be"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-600 text-sm font-medium hover:underline"
                        >
                            www.gegevensbeschermingsautoriteit.be →
                        </a>
                    </div>
                </div>

                {/* Company Info */}
                <div className="mt-12 text-center text-sm text-zinc-400 border-t border-zinc-100 pt-8">
                    <p className="font-medium text-zinc-600 mb-2">Verwerkingsverantwoordelijke:</p>
                    <p>{store.name}</p>
                    <p>{store.address.line1}, {store.address.postalCode} {store.address.city}</p>
                    {store.vatNumber && <p>BTW: {store.vatNumber}</p>}
                    <p>{store.email}</p>
                </div>
            </div>

            <Footer />
        </main>
    );
}
