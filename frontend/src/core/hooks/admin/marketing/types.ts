/**
 * Marketing Types and Constants
 * 
 * Shared types and email templates for marketing module.
 */

// ============================================
// TYPES
// ============================================

export interface MarketingSegment {
    segment: string;
    label: string;
    count: number;
}

export interface MarketingProduct {
    id: string;
    name: string;
    price: number;
    slug: string;
    images?: { url: string }[];
}

export interface EmailTemplate {
    id: string;
    name: string;
    description: string;
    subject: string;
    headline: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
}

export interface MarketingUser {
    id: string;
    email: string;
    name: string;
    lastOrder?: string;
    lastAppointment?: string;
    unsubscribedAt?: string;
    deviceBrand?: string;
    deviceModel?: string;
    repairType?: string;
    orderCount?: number;
    totalSpent?: number;
    phone?: string;
}

export interface SendResult {
    success: boolean;
    sent: number;
    failed: number;
}

// ============================================
// EMAIL TEMPLATES
// ============================================

export const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: 'new-arrivals',
        name: '🆕 Nieuwe Toestellen',
        description: 'Promoot nieuw binnengekomen smartphones',
        subject: 'Nieuw binnen! Bekijk de laatste toestellen 📱',
        headline: 'Verse voorraad zojuist aangekomen!',
        bodyHtml: `<p>We hebben weer een lading prachtige refurbished smartphones binnengekregen!</p>
<p>Van de nieuwste iPhones tot premium Samsung Galaxy's - allemaal professioneel gereviseerd en klaar voor een tweede leven.</p>
<p><strong>✓ 12 maanden garantie</strong><br>
<strong>✓ Batterij minimaal 90%</strong><br>
<strong>✓ Geen krasjes of deuken</strong></p>`,
        ctaText: 'Bekijk Alle Toestellen',
        ctaUrl: '',  // Will be set to tenant domain at runtime
    },
    {
        id: 'discount-sale',
        name: '💰 Korting Actie',
        description: 'Aankondiging van tijdelijke korting',
        subject: '🔥 Alleen dit weekend: Tot 25% korting!',
        headline: 'Exclusieve Weekendactie!',
        bodyHtml: `<p>Alleen dit weekend profiteert u van onze speciale actie!</p>
<p><strong>Tot 25% korting</strong> op geselecteerde refurbished smartphones.</p>
<p>De beste deals zijn snel weg, dus wees er snel bij!</p>
<p>⏰ <em>Actie loopt t/m zondag 23:59</em></p>`,
        ctaText: 'Shop Nu Met Korting',
        ctaUrl: '',  // Will be set to tenant domain at runtime
    },
    {
        id: 'repair-promo',
        name: '🔧 Reparatie Actie',
        description: 'Promoot reparatiediensten voor afgeronde klanten',
        subject: 'Uw telefoon kapot? Wij repareren snel & betrouwbaar!',
        headline: 'Professionele Smartphone Reparatie',
        bodyHtml: `<p>Heeft u een kapot scherm, lege batterij of andere problemen?</p>
<p>Wij repareren alle merken:</p>
<p><strong>📱 iPhone scherm vanaf €79</strong><br>
<strong>🔋 Batterij vervanging vanaf €49</strong><br>
<strong>⚡ Meestal dezelfde dag klaar!</strong></p>
<p>Boek direct uw afspraak en krijg 10% korting!</p>`,
        ctaText: 'Boek Reparatie Afspraak',
        ctaUrl: '',  // Will be set to tenant domain at runtime
    },
    {
        id: 'thank-you',
        name: '💝 Bedankt Bericht',
        description: 'Bedank klanten na aankoop of reparatie',
        subject: 'Bedankt voor uw vertrouwen! 🙏',
        headline: 'Hartelijk Dank!',
        bodyHtml: `<p>Wij willen u nogmaals bedanken voor uw bezoek.</p>
<p>Uw tevredenheid staat bij ons voorop. Heeft u nog vragen over uw aankoop of reparatie? Neem gerust contact met ons op!</p>
<p>Volg ons op social media voor de laatste aanbiedingen en tech tips.</p>
<p>Tot de volgende keer! 👋</p>`,
        ctaText: 'Bekijk Onze Laatste Aanbiedingen',
        ctaUrl: '',  // Will be set to tenant domain at runtime
    },
    {
        id: 'holiday-special',
        name: '🎄 Feestdagen Actie',
        description: 'Speciale kerst/nieuwjaar promotie',
        subject: '🎁 Feestdagen Special: Scoor nu de beste deals!',
        headline: 'Feestelijke Aanbiedingen!',
        bodyHtml: `<p>De feestdagen komen eraan en wat is er beter dan een nieuwe smartphone onder de boom?</p>
<p>Profiteer van onze <strong>feestdagen specials</strong>:</p>
<p>🎁 Gratis screenprotector bij elke aankoop<br>
📦 Snelle levering voor de feestdagen<br>
💯 14 dagen bedenktijd</p>
<p>Bestel voor 16:00 = morgen in huis!</p>`,
        ctaText: 'Shop Feestdagen Deals',
        ctaUrl: '',  // Will be set to tenant domain at runtime
    },
];

// ============================================
// SEGMENT ICONS
// ============================================

export const SEGMENT_ICONS = {
    all: 'Users',
    customers: 'ShoppingCart',
    appointment_completed: 'Calendar',
    unsubscribed: 'X',
    default: 'Mail',
} as const;

export function getSegmentIconName(segment: string): keyof typeof SEGMENT_ICONS {
    if (segment in SEGMENT_ICONS) return segment as keyof typeof SEGMENT_ICONS;
    return 'default';
}
