/**
 * Marketing Admin Hook
 * 
 * Complete business logic for admin marketing email campaigns.
 * Handles segments, user preview, product selection, email composition,
 * templates, live preview, and send functionality.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

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
// CONSTANTS - EMAIL TEMPLATES
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

// Segment icon mapping
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

// ============================================
// HOOK INTERFACE
// ============================================

export interface UseMarketingReturn {
    // Segments
    segments: MarketingSegment[];
    selectedSegment: string;
    isLoadingSegments: boolean;
    setSelectedSegment: (s: string) => void;
    getSelectedSegmentInfo: () => MarketingSegment | undefined;

    // User preview modal
    showUserPreview: boolean;
    previewUsers: MarketingUser[];
    previewSegmentLabel: string;
    isLoadingUsers: boolean;
    fetchUsersForSegment: (segment: string, label: string) => Promise<void>;
    closeUserPreview: () => void;

    // Specific email (override segment)
    specificEmail: string;
    setSpecificEmail: (e: string) => void;

    // Products
    products: MarketingProduct[];
    selectedProducts: MarketingProduct[];
    isLoadingProducts: boolean;
    addProduct: (product: MarketingProduct) => void;
    removeProduct: (id: string) => void;
    filteredProducts: MarketingProduct[];

    // Product picker modal
    showProductPicker: boolean;
    productSearch: string;
    setShowProductPicker: (show: boolean) => void;
    setProductSearch: (q: string) => void;

    // Templates modal
    showTemplates: boolean;
    setShowTemplates: (show: boolean) => void;
    loadTemplate: (template: EmailTemplate) => void;

    // Email form
    subject: string;
    headline: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
    setSubject: (s: string) => void;
    setHeadline: (h: string) => void;
    setBodyHtml: (b: string) => void;
    setCtaText: (t: string) => void;
    setCtaUrl: (u: string) => void;

    // Preview modal
    showPreview: boolean;
    setShowPreview: (show: boolean) => void;

    // Confirmation modal
    showConfirmation: boolean;
    setShowConfirmation: (show: boolean) => void;

    // Sending
    isSending: boolean;
    sendResult: SendResult | null;
    handleSend: () => Promise<void>;

    // Validation
    isValid: boolean;
}

// ============================================
// HOOK IMPLEMENTATION
// ============================================

export function useMarketing(): UseMarketingReturn {
    // Segments
    const [segments, setSegments] = useState<MarketingSegment[]>([]);
    const [selectedSegment, setSelectedSegment] = useState('all');
    const [isLoadingSegments, setIsLoadingSegments] = useState(true);

    // User preview
    const [showUserPreview, setShowUserPreview] = useState(false);
    const [previewUsers, setPreviewUsers] = useState<MarketingUser[]>([]);
    const [previewSegmentLabel, setPreviewSegmentLabel] = useState('');
    const [isLoadingUsers, setIsLoadingUsers] = useState(false);

    // Specific email
    const [specificEmail, setSpecificEmail] = useState('');

    // Products
    const [products, setProducts] = useState<MarketingProduct[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<MarketingProduct[]>([]);
    const [isLoadingProducts, setIsLoadingProducts] = useState(false);

    // Product picker
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState('');

    // Templates
    const [showTemplates, setShowTemplates] = useState(false);

    // Email form
    const [subject, setSubject] = useState('');
    const [headline, setHeadline] = useState('');
    const [bodyHtml, setBodyHtml] = useState('');
    const [ctaText, setCtaText] = useState('');
    const [ctaUrl, setCtaUrl] = useState('');

    // Preview & confirmation
    const [showPreview, setShowPreview] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Sending
    const [isSending, setIsSending] = useState(false);
    const [sendResult, setSendResult] = useState<SendResult | null>(null);

    // Load data on mount
    useEffect(() => {
        fetchSegments();
        fetchProducts();
    }, []);

    // Fetch segments
    const fetchSegments = async () => {
        setIsLoadingSegments(true);
        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch('/api/marketing/segments', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setSegments([]);
                return;
            }
            const data = await res.json();
            setSegments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch segments:', error);
            setSegments([]);
        } finally {
            setIsLoadingSegments(false);
        }
    };

    // Fetch users for segment preview
    const fetchUsersForSegment = useCallback(async (segment: string, label: string) => {
        setIsLoadingUsers(true);
        setPreviewSegmentLabel(label);
        setShowUserPreview(true);
        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch(`/api/marketing/users?segment=${segment}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                setPreviewUsers([]);
                return;
            }
            const data = await res.json();
            setPreviewUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            setPreviewUsers([]);
        } finally {
            setIsLoadingUsers(false);
        }
    }, []);

    const closeUserPreview = useCallback(() => {
        setShowUserPreview(false);
    }, []);

    // Fetch products
    const fetchProducts = async () => {
        setIsLoadingProducts(true);
        try {
            const res = await fetch('/api/products?limit=50');
            const data = await res.json();
            let productList: MarketingProduct[] = [];
            if (Array.isArray(data)) productList = data;
            else if (Array.isArray(data.products)) productList = data.products;
            else if (Array.isArray(data.data)) productList = data.data;
            setProducts(productList);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setIsLoadingProducts(false);
        }
    };

    // Product actions
    const addProduct = useCallback((product: MarketingProduct) => {
        setSelectedProducts(prev => {
            if (prev.find(p => p.id === product.id)) return prev;
            return [...prev, product];
        });
        setShowProductPicker(false);
    }, []);

    const removeProduct = useCallback((id: string) => {
        setSelectedProducts(prev => prev.filter(p => p.id !== id));
    }, []);

    // Filtered products for picker
    const filteredProducts = useMemo(() => {
        if (!Array.isArray(products)) return [];
        return products.filter(p =>
            p.name?.toLowerCase().includes(productSearch.toLowerCase()) &&
            !selectedProducts.find(sp => sp.id === p.id)
        );
    }, [products, productSearch, selectedProducts]);

    // Get selected segment info
    const getSelectedSegmentInfo = useCallback(() => {
        return segments.find(s => s.segment === selectedSegment);
    }, [segments, selectedSegment]);

    // Load template
    const loadTemplate = useCallback((template: EmailTemplate) => {
        setSubject(template.subject);
        setHeadline(template.headline);
        setBodyHtml(template.bodyHtml);
        setCtaText(template.ctaText);
        setCtaUrl(template.ctaUrl);
        setShowTemplates(false);
    }, []);

    // Validation
    const isValid = subject.trim().length > 0 && headline.trim().length > 0 && bodyHtml.trim().length > 0;

    // Handle send
    const handleSend = useCallback(async () => {
        if (!isValid) return;

        setIsSending(true);
        setSendResult(null);

        try {
            const token = localStorage.getItem('adminAccessToken');
            const res = await fetch('/api/marketing/send', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    segment: selectedSegment,
                    specificEmail: specificEmail || undefined,
                    subject,
                    headline,
                    bodyHtml,
                    ctaText: ctaText || undefined,
                    ctaUrl: ctaUrl || undefined,
                    featuredProducts: selectedProducts.map(p => ({
                        name: p.name,
                        price: `€${Number(p.price).toFixed(2)}`,
                        imageUrl: p.images?.[0]?.url,
                        productUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL || ''}/phones/${p.slug}`,
                    })),
                }),
            });

            const data = await res.json();
            setSendResult(data);
        } catch (error) {
            console.error('Failed to send marketing email:', error);
            setSendResult({ success: false, sent: 0, failed: 1 });
        } finally {
            setIsSending(false);
        }
    }, [selectedSegment, specificEmail, subject, headline, bodyHtml, ctaText, ctaUrl, selectedProducts, isValid]);

    return {
        // Segments
        segments,
        selectedSegment,
        isLoadingSegments,
        setSelectedSegment,
        getSelectedSegmentInfo,

        // User preview
        showUserPreview,
        previewUsers,
        previewSegmentLabel,
        isLoadingUsers,
        fetchUsersForSegment,
        closeUserPreview,

        // Specific email
        specificEmail,
        setSpecificEmail,

        // Products
        products,
        selectedProducts,
        isLoadingProducts,
        addProduct,
        removeProduct,
        filteredProducts,

        // Product picker
        showProductPicker,
        productSearch,
        setShowProductPicker,
        setProductSearch,

        // Templates
        showTemplates,
        setShowTemplates,
        loadTemplate,

        // Email form
        subject,
        headline,
        bodyHtml,
        ctaText,
        ctaUrl,
        setSubject,
        setHeadline,
        setBodyHtml,
        setCtaText,
        setCtaUrl,

        // Preview & confirmation
        showPreview,
        setShowPreview,
        showConfirmation,
        setShowConfirmation,

        // Sending
        isSending,
        sendResult,
        handleSend,

        // Validation
        isValid,
    };
}
