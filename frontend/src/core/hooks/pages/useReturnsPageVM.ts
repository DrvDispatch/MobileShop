/**
 * @core-only
 * Returns Page View Model
 */

'use client';

import { useEffect, useCallback } from 'react';
import { useSettingsStore } from '@/lib/store';

export interface ReturnStepVM {
    step: number;
    title: string;
    description: string;
    iconType: string;
}

export interface ReturnsPageVM {
    storeName: string;
    storeEmail: string;
    storeAddress: { line1?: string; postalCode?: string; city?: string };
    steps: ReturnStepVM[];
    includedItems: string[];
    excludedItems: string[];
    onOpenChat: () => void;
}

export function useReturnsPageVM(): ReturnsPageVM {
    const { settings, fetchSettings } = useSettingsStore();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    const { store } = settings;

    const steps: ReturnStepVM[] = [
        { step: 1, title: "Neem contact op", description: "Stuur een e-mail naar ons met uw ordernummer en reden voor retour. Wij bevestigen uw retourverzoek binnen 24 uur.", iconType: "mail" },
        { step: 2, title: "Verpak het product", description: "Verpak het product in de originele verpakking met alle accessoires. Voeg indien mogelijk het aankoopbewijs toe.", iconType: "package" },
        { step: 3, title: "Verstuur het pakket", description: "Stuur het pakket naar ons retouradres. Bewaar de verzendbevestiging als bewijs.", iconType: "truck" },
        { step: 4, title: "Ontvang uw terugbetaling", description: "Na ontvangst en controle storten wij het bedrag binnen 14 dagen terug via uw oorspronkelijke betaalmethode.", iconType: "credit-card" }
    ];

    const includedItems = [
        "Nieuwe, ongebruikte producten in originele verpakking",
        "Producten met fabricagefouten of defecten",
        "Verkeerd geleverde producten",
        "Beschadigde producten bij levering (direct melden)",
        "Refurbished toestellen binnen de garantieperiode"
    ];

    const excludedItems = [
        "Producten die langer dan 14 dagen geleden zijn geleverd",
        "Geopende verzegelde producten (hygiëne/veiligheidsredenen)",
        "Producten met duidelijke gebruikssporen of schade",
        "Gepersonaliseerde of op maat gemaakte producten",
        "Schade door ongelukken, water of verkeerd gebruik"
    ];

    const onOpenChat = useCallback(() => {
        window.dispatchEvent(new CustomEvent('openChatWidget'));
    }, []);

    return {
        storeName: store.name,
        storeEmail: store.email,
        storeAddress: store.address,
        steps,
        includedItems,
        excludedItems,
        onOpenChat,
    };
}
