/**
 * @core-only
 * Privacy Page View Model
 */

'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store';

export interface LegalSectionVM {
    iconType: string;
    title: string;
    content: string[];
}

export interface PrivacyPageVM {
    storeName: string;
    storeEmail: string;
    storeAddress: { line1?: string; postalCode?: string; city?: string };
    vatNumber?: string;
    sections: LegalSectionVM[];
}

export function usePrivacyPageVM(): PrivacyPageVM {
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store } = settings;

    const sections: LegalSectionVM[] = [
        {
            iconType: "database",
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
            iconType: "eye",
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
            iconType: "user-check",
            title: "3. Juridische grondslagen",
            content: [
                "Uitvoering van de overeenkomst: verwerking is noodzakelijk om uw bestellingen en reparaties uit te voeren.",
                "Wettelijke verplichting: bewaren van facturen en boekhoudkundige gegevens.",
                "Toestemming: voor marketingcommunicatie en niet-essentiële cookies.",
                "Gerechtvaardigd belang: verbetering van onze diensten en fraudepreventie."
            ]
        },
        {
            iconType: "globe",
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
            iconType: "lock",
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
            iconType: "clock",
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
            iconType: "settings",
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
            iconType: "alert",
            title: "8. Cookies",
            content: [
                "Essentiële cookies: noodzakelijk voor het functioneren van de website (winkelwagen, inloggen).",
                "Analytische cookies: om websitegebruik te meten en te verbeteren (geanonimiseerd).",
                "Marketing cookies: alleen met uw toestemming, voor gepersonaliseerde aanbiedingen.",
                "U kunt uw cookievoorkeuren aanpassen via uw browserinstellingen."
            ]
        }
    ];

    return {
        storeName: store.name,
        storeEmail: store.email,
        storeAddress: store.address,
        vatNumber: store.vatNumber,
        sections,
    };
}
