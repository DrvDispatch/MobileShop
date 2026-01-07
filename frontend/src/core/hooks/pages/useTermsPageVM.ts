/**
 * @core-only
 * Terms Page View Model
 */

'use client';

import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/store';

export interface LegalSectionVM {
    iconType: string;
    title: string;
    content: string[];
}

export interface TermsPageVM {
    storeName: string;
    storeEmail: string;
    storeAddress: { line1?: string; postalCode?: string; city?: string };
    vatNumber?: string;
    sections: LegalSectionVM[];
}

export function useTermsPageVM(): TermsPageVM {
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store } = settings;

    const sections: LegalSectionVM[] = [
        {
            iconType: "file-text",
            title: "1. Algemeen",
            content: [
                `Deze algemene voorwaarden zijn van toepassing op alle bestellingen, overeenkomsten en diensten van ${store.name}, gevestigd te ${store.address.line1}, ${store.address.postalCode} ${store.address.city}.`,
                "Door een bestelling te plaatsen of gebruik te maken van onze diensten, gaat u akkoord met deze voorwaarden.",
                "Wij behouden ons het recht voor om deze voorwaarden te wijzigen. De meest recente versie is altijd beschikbaar op onze website."
            ]
        },
        {
            iconType: "credit-card",
            title: "2. Prijzen en Betaling",
            content: [
                "Alle prijzen op onze website zijn in euro's en inclusief 21% BTW, tenzij anders vermeld.",
                "Betaling geschiedt via de op de website aangeboden betaalmethoden: creditcard (Visa, Mastercard, American Express), Bancontact en iDEAL.",
                "Bestellingen worden pas verwerkt na ontvangst van de volledige betaling.",
                "Bij reparaties in de winkel kan contant of met kaart worden betaald."
            ]
        },
        {
            iconType: "truck",
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
            iconType: "refresh",
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
            iconType: "shield",
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
            iconType: "clock",
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
            iconType: "alert",
            title: "7. Aansprakelijkheid",
            content: [
                "Onze aansprakelijkheid is beperkt tot het aankoopbedrag van het product of de reparatie.",
                "Wij zijn niet aansprakelijk voor indirecte schade, gevolgschade of gederfde winst.",
                "Bij overmacht (oorlog, natuurrampen, stakingen, pandemieën) zijn wij ontheven van onze verplichtingen."
            ]
        },
        {
            iconType: "scale",
            title: "8. Toepasselijk Recht en Geschillen",
            content: [
                "Op alle overeenkomsten is het Belgische recht van toepassing.",
                "Geschillen worden in eerste instantie minnelijk opgelost.",
                "Bij voortdurende geschillen is de rechtbank van Antwerpen bevoegd.",
                "Consumenten kunnen ook terecht bij het Europees platform voor onlinegeschillenbeslechting: https://ec.europa.eu/consumers/odr/"
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
