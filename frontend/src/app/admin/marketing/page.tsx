"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Mail,
    Users,
    ShoppingCart,
    Calendar,
    Send,
    Loader2,
    CheckCircle,
    AlertTriangle,
    Search,
    Plus,
    X,
    Eye,
    FileText,
    ChevronRight,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

interface Segment {
    segment: string;
    label: string;
    count: number;
}

interface Product {
    id: string;
    name: string;
    price: number;
    slug: string;
    images?: { url: string }[];
}

interface EmailTemplate {
    id: string;
    name: string;
    description: string;
    subject: string;
    headline: string;
    bodyHtml: string;
    ctaText: string;
    ctaUrl: string;
}

interface MarketingUser {
    id: string;
    email: string;
    name: string;
    lastOrder?: string;
    lastAppointment?: string;
    unsubscribedAt?: string;
    // Additional context fields
    deviceBrand?: string;
    deviceModel?: string;
    repairType?: string;
    orderCount?: number;
    totalSpent?: number;
    phone?: string;
}

// Pre-made email templates
const EMAIL_TEMPLATES: EmailTemplate[] = [
    {
        id: "new-arrivals",
        name: "🆕 Nieuwe Toestellen",
        description: "Promoot nieuw binnengekomen smartphones",
        subject: "Nieuw binnen! Bekijk de laatste toestellen 📱",
        headline: "Verse voorraad zojuist aangekomen!",
        bodyHtml: `<p>We hebben weer een lading prachtige refurbished smartphones binnengekregen!</p>
<p>Van de nieuwste iPhones tot premium Samsung Galaxy's - allemaal professioneel gereviseerd en klaar voor een tweede leven.</p>
<p><strong>✓ 12 maanden garantie</strong><br>
<strong>✓ Batterij minimaal 90%</strong><br>
<strong>✓ Geen krasjes of deuken</strong></p>`,
        ctaText: "Bekijk Alle Toestellen",
        ctaUrl: "https://smartphoneservice.be/phones",
    },
    {
        id: "discount-sale",
        name: "💰 Korting Actie",
        description: "Aankondiging van tijdelijke korting",
        subject: "🔥 Alleen dit weekend: Tot 25% korting!",
        headline: "Exclusieve Weekendactie!",
        bodyHtml: `<p>Alleen dit weekend profiteert u van onze speciale actie!</p>
<p><strong>Tot 25% korting</strong> op geselecteerde refurbished smartphones.</p>
<p>De beste deals zijn snel weg, dus wees er snel bij!</p>
<p>⏰ <em>Actie loopt t/m zondag 23:59</em></p>`,
        ctaText: "Shop Nu Met Korting",
        ctaUrl: "https://smartphoneservice.be/phones",
    },
    {
        id: "repair-promo",
        name: "🔧 Reparatie Actie",
        description: "Promoot reparatiediensten voor afgeronde klanten",
        subject: "Uw telefoon kapot? Wij repareren snel & betrouwbaar!",
        headline: "Professionele Smartphone Reparatie",
        bodyHtml: `<p>Heeft u een kapot scherm, lege batterij of andere problemen?</p>
<p>Bij SmartphoneService repareren we alle merken:</p>
<p><strong>📱 iPhone scherm vanaf €79</strong><br>
<strong>🔋 Batterij vervanging vanaf €49</strong><br>
<strong>⚡ Meestal dezelfde dag klaar!</strong></p>
<p>Boek direct uw afspraak en krijg 10% korting!</p>`,
        ctaText: "Boek Reparatie Afspraak",
        ctaUrl: "https://smartphoneservice.be/repair",
    },
    {
        id: "thank-you",
        name: "💝 Bedankt Bericht",
        description: "Bedank klanten na aankoop of reparatie",
        subject: "Bedankt voor uw vertrouwen! 🙏",
        headline: "Hartelijk Dank!",
        bodyHtml: `<p>Wij willen u nogmaals bedanken voor uw bezoek aan SmartphoneService.</p>
<p>Uw tevredenheid staat bij ons voorop. Heeft u nog vragen over uw aankoop of reparatie? Neem gerust contact met ons op!</p>
<p>Volg ons op social media voor de laatste aanbiedingen en tech tips.</p>
<p>Tot de volgende keer! 👋</p>`,
        ctaText: "Bekijk Onze Laatste Aanbiedingen",
        ctaUrl: "https://smartphoneservice.be/phones",
    },
    {
        id: "holiday-special",
        name: "🎄 Feestdagen Actie",
        description: "Speciale kerst/nieuwjaar promotie",
        subject: "🎁 Feestdagen Special: Scoor nu de beste deals!",
        headline: "Feestelijke Aanbiedingen!",
        bodyHtml: `<p>De feestdagen komen eraan en wat is er beter dan een nieuwe smartphone onder de boom?</p>
<p>Profiteer van onze <strong>feestdagen specials</strong>:</p>
<p>🎁 Gratis screenprotector bij elke aankoop<br>
📦 Snelle levering voor de feestdagen<br>
💯 14 dagen bedenktijd</p>
<p>Bestel voor 16:00 = morgen in huis!</p>`,
        ctaText: "Shop Feestdagen Deals",
        ctaUrl: "https://smartphoneservice.be/phones",
    },
];

export default function AdminMarketingPage() {
    const router = useRouter();

    // Segments
    const [segments, setSegments] = useState<Segment[]>([]);
    const [selectedSegment, setSelectedSegment] = useState("all");
    const [loadingSegments, setLoadingSegments] = useState(true);

    // Email Form
    const [subject, setSubject] = useState("");
    const [headline, setHeadline] = useState("");
    const [bodyHtml, setBodyHtml] = useState("");
    const [ctaText, setCtaText] = useState("");
    const [ctaUrl, setCtaUrl] = useState("");
    const [specificEmail, setSpecificEmail] = useState("");

    // Products for featuring
    const [products, setProducts] = useState<Product[]>([]);
    const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
    const [showProductPicker, setShowProductPicker] = useState(false);
    const [productSearch, setProductSearch] = useState("");

    // Templates and Preview
    const [showTemplates, setShowTemplates] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Sending state
    const [sending, setSending] = useState(false);
    const [sendResult, setSendResult] = useState<{
        success: boolean;
        sent: number;
        failed: number;
    } | null>(null);

    // User preview modal
    const [showUserPreview, setShowUserPreview] = useState(false);
    const [previewUsers, setPreviewUsers] = useState<MarketingUser[]>([]);
    const [previewSegmentLabel, setPreviewSegmentLabel] = useState("");
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Load template
    const loadTemplate = (template: EmailTemplate) => {
        setSubject(template.subject);
        setHeadline(template.headline);
        setBodyHtml(template.bodyHtml);
        setCtaText(template.ctaText);
        setCtaUrl(template.ctaUrl);
        setShowTemplates(false);
    };

    useEffect(() => {
        fetchSegments();
        fetchProducts();
    }, []);


    const fetchSegments = async () => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/marketing/segments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                console.error("Segments API returned:", res.status);
                setSegments([]);
                return;
            }
            const data = await res.json();
            // Ensure we always have an array
            setSegments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch segments:", error);
            setSegments([]);
        } finally {
            setLoadingSegments(false);
        }
    };

    const fetchUsersForSegment = async (segment: string, label: string) => {
        setLoadingUsers(true);
        setPreviewSegmentLabel(label);
        setShowUserPreview(true);
        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/marketing/users?segment=${segment}&limit=100`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                console.error("Users API returned:", res.status);
                setPreviewUsers([]);
                return;
            }
            const data = await res.json();
            setPreviewUsers(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setPreviewUsers([]);
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchProducts = async () => {
        try {
            const res = await fetch(`/api/products?limit=50`);
            const data = await res.json();
            // Handle different response formats
            let productList: Product[] = [];
            if (Array.isArray(data)) {
                productList = data;
            } else if (Array.isArray(data.products)) {
                productList = data.products;
            } else if (Array.isArray(data.data)) {
                productList = data.data;
            }
            setProducts(productList);
        } catch (error) {
            console.error("Failed to fetch products:", error);
            setProducts([]);
        }
    };

    const handleSend = async () => {
        if (!subject || !headline || !bodyHtml) {
            alert("Vul alle verplichte velden in");
            return;
        }

        if (!confirm("Weet u zeker dat u deze email wilt versturen?")) {
            return;
        }

        setSending(true);
        setSendResult(null);

        try {
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/marketing/send`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    segment: selectedSegment,
                    specificEmail: specificEmail || undefined,
                    subject,
                    headline,
                    bodyHtml,
                    ctaText: ctaText || undefined,
                    ctaUrl: ctaUrl || undefined,
                    featuredProducts: selectedProducts.map((p) => ({
                        name: p.name,
                        price: `€${Number(p.price).toFixed(2)}`,
                        imageUrl: p.images?.[0]?.url,
                        productUrl: `${process.env.NEXT_PUBLIC_FRONTEND_URL || "https://smartphoneservice.be"}/phones/${p.slug}`,
                    })),
                }),
            });

            const data = await res.json();
            setSendResult(data);
        } catch (error) {
            console.error("Failed to send marketing email:", error);
            setSendResult({ success: false, sent: 0, failed: 1 });
        } finally {
            setSending(false);
        }
    };

    const getSegmentIcon = (segment: string) => {
        switch (segment) {
            case "all":
                return <Users className="w-5 h-5" />;
            case "customers":
                return <ShoppingCart className="w-5 h-5" />;
            case "appointment_completed":
                return <Calendar className="w-5 h-5" />;
            case "unsubscribed":
                return <X className="w-5 h-5" />;
            default:
                return <Mail className="w-5 h-5" />;
        }
    };

    // Safe filtering with Array.isArray check
    const filteredProducts = Array.isArray(products)
        ? products.filter(
            (p) =>
                p.name?.toLowerCase().includes(productSearch.toLowerCase()) &&
                !selectedProducts.find((sp) => sp.id === p.id)
        )
        : [];


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Marketing Emails</h1>
                    <p className="text-zinc-500">Verstuur promotie-emails naar klanten</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side - Segment Selection */}
                <div className="space-y-6">
                    {/* Segment Cards */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <h3 className="font-semibold text-zinc-900 mb-4">Doelgroep</h3>
                        {loadingSegments ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {segments.map((seg) => (
                                    <div
                                        key={seg.segment}
                                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer hover:bg-zinc-50 ${selectedSegment === seg.segment
                                            ? "border-purple-500 bg-purple-50"
                                            : "border-zinc-200"
                                            }`}
                                        onClick={() => {
                                            setSelectedSegment(seg.segment);
                                            setSpecificEmail("");
                                        }}
                                    >
                                        {/* Selection Radio */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedSegment(seg.segment);
                                                setSpecificEmail("");
                                            }}
                                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${selectedSegment === seg.segment
                                                ? "border-purple-500 bg-purple-500"
                                                : "border-zinc-300 hover:border-zinc-400"
                                                }`}
                                        >
                                            {selectedSegment === seg.segment && (
                                                <div className="w-2 h-2 rounded-full bg-white" />
                                            )}
                                        </button>
                                        <div
                                            className={`${selectedSegment === seg.segment
                                                ? "text-purple-600"
                                                : "text-zinc-400"
                                                }`}
                                        >
                                            {getSegmentIcon(seg.segment)}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-zinc-900">{seg.label}</p>
                                            <p className="text-sm text-zinc-500">
                                                {seg.count} {seg.count === 1 ? "gebruiker" : "gebruikers"}
                                            </p>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                fetchUsersForSegment(seg.segment, seg.label);
                                            }}
                                            className="p-1 hover:bg-zinc-200 rounded transition-colors"
                                            title="Bekijk gebruikers"
                                        >
                                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Specific Email Option */}
                        <div className="mt-4 pt-4 border-t border-zinc-200">
                            <label className="block text-sm font-medium text-zinc-700 mb-2">
                                Of stuur naar specifiek adres:
                            </label>
                            <input
                                type="email"
                                value={specificEmail}
                                onChange={(e) => setSpecificEmail(e.target.value)}
                                placeholder="email@voorbeeld.nl"
                                className="w-full px-3 py-2 border border-zinc-200 rounded-lg text-sm"
                            />
                        </div>
                    </div>

                    {/* Featured Products */}
                    <div className="bg-white rounded-xl border border-zinc-200 p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-zinc-900">Uitgelichte Producten</h3>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowProductPicker(true)}
                            >
                                <Plus className="w-4 h-4 mr-1" /> Toevoegen
                            </Button>
                        </div>

                        {selectedProducts.length === 0 ? (
                            <p className="text-zinc-500 text-sm">
                                Geen producten geselecteerd
                            </p>
                        ) : (
                            <div className="space-y-2">
                                {selectedProducts.map((product) => (
                                    <div
                                        key={product.id}
                                        className="flex items-center gap-3 p-2 bg-zinc-50 rounded-lg"
                                    >
                                        <div className="flex-1">
                                            <p className="text-sm font-medium truncate">
                                                {product.name}
                                            </p>
                                            <p className="text-xs text-purple-600">
                                                €{Number(product.price).toFixed(2)}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setSelectedProducts((prev) =>
                                                    prev.filter((p) => p.id !== product.id)
                                                )
                                            }
                                            className="p-1 hover:bg-zinc-200 rounded"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side - Email Composer with Live Preview */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-zinc-900">Email Opstellen</h3>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowTemplates(true)}
                        >
                            <FileText className="w-4 h-4 mr-1" /> Templates
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {/* Left: Form Fields */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Onderwerp *
                                </label>
                                <input
                                    type="text"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    placeholder="Bv: Speciale aanbieding deze week! 📱"
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Headline *
                                </label>
                                <input
                                    type="text"
                                    value={headline}
                                    onChange={(e) => setHeadline(e.target.value)}
                                    placeholder="Bv: Tot 30% korting op alle iPhones!"
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Inhoud * (HTML ondersteund)
                                </label>
                                <textarea
                                    value={bodyHtml}
                                    onChange={(e) => setBodyHtml(e.target.value)}
                                    placeholder="Schrijf hier de inhoud van uw email..."
                                    className="w-full px-4 py-3 border border-zinc-200 rounded-lg h-32"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        CTA Knop Tekst
                                    </label>
                                    <input
                                        type="text"
                                        value={ctaText}
                                        onChange={(e) => setCtaText(e.target.value)}
                                        placeholder="Bv: Bekijk Aanbiedingen"
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        CTA URL
                                    </label>
                                    <input
                                        type="url"
                                        value={ctaUrl}
                                        onChange={(e) => setCtaUrl(e.target.value)}
                                        placeholder="https://..."
                                        className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                                    />
                                </div>
                            </div>

                            {/* Send Result */}
                            {sendResult && (
                                <div
                                    className={`p-4 rounded-lg ${sendResult.success
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-red-50 border border-red-200"
                                        }`}
                                >
                                    <div className="flex items-center gap-2">
                                        {sendResult.success ? (
                                            <CheckCircle className="w-5 h-5 text-green-600" />
                                        ) : (
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                        )}
                                        <p
                                            className={
                                                sendResult.success ? "text-green-700" : "text-red-700"
                                            }
                                        >
                                            {sendResult.sent} emails verstuurd
                                            {sendResult.failed > 0 &&
                                                `, ${sendResult.failed} mislukt`}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Send Button - Opens Confirmation */}
                            <div className="flex justify-end pt-4 border-t border-zinc-200">
                                <Button
                                    onClick={() => setShowConfirmation(true)}
                                    disabled={sending || !subject || !headline || !bodyHtml}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                                >
                                    <Send className="w-4 h-4 mr-2" />
                                    Versturen
                                </Button>
                            </div>
                        </div>

                        {/* Right: Live Preview */}
                        <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 flex items-center gap-2">
                                <Eye className="w-4 h-4 text-zinc-500" />
                                <span className="text-sm font-medium text-zinc-600">Live Preview</span>
                            </div>
                            <div className="bg-zinc-50 p-4 overflow-y-auto max-h-[600px]">
                                <div style={{ maxWidth: '500px', margin: '0 auto', fontFamily: 'Arial, sans-serif', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                    {/* Black Header */}
                                    <div style={{ background: '#000', padding: '24px 32px', textAlign: 'center' as const }}>
                                        <p style={{ color: '#fff', fontSize: '13px', fontWeight: 500, letterSpacing: '0.5px', margin: 0 }}>
                                            SMARTPHONESERVICE
                                        </p>
                                    </div>
                                    {/* Headline Banner */}
                                    <div style={{ background: '#000', padding: '16px 32px', borderTop: '1px solid #222' }}>
                                        <p style={{ color: '#fff', fontSize: '18px', fontWeight: 600, textAlign: 'center' as const, margin: 0 }}>
                                            {headline || 'Je headline hier...'}
                                        </p>
                                    </div>
                                    {/* White Body */}
                                    <div style={{ padding: '24px 32px' }}>
                                        <p style={{ color: '#333', fontSize: '14px', lineHeight: 1.6, margin: '0 0 16px' }}>
                                            Beste [Klantnaam],
                                        </p>
                                        <div
                                            style={{ color: '#333', fontSize: '14px', lineHeight: 1.6, margin: '0 0 20px' }}
                                            dangerouslySetInnerHTML={{ __html: bodyHtml || '<p style="color:#999">Inhoud van de email...</p>' }}
                                        />
                                        {ctaText && ctaUrl && (
                                            <div style={{ textAlign: 'center' as const, margin: '24px 0' }}>
                                                <span style={{ display: 'inline-block', background: '#000', color: '#fff', textDecoration: 'none', padding: '12px 24px', borderRadius: '6px', fontWeight: 500, fontSize: '13px' }}>
                                                    {ctaText}
                                                </span>
                                            </div>
                                        )}
                                        {/* Featured Products Preview */}
                                        {selectedProducts.length > 0 && (
                                            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                                                <p style={{ color: '#888', fontSize: '10px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 12px' }}>
                                                    AANBEVOLEN VOOR U
                                                </p>
                                                <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '8px' }}>
                                                    {selectedProducts.slice(0, 3).map((p) => (
                                                        <div key={p.id} style={{ flex: 1, minWidth: '80px', maxWidth: '120px', textAlign: 'center' as const, border: '1px solid #eee', borderRadius: '6px', padding: '10px' }}>
                                                            <p style={{ color: '#000', fontSize: '11px', margin: '0 0 2px', fontWeight: 500 }}>{p.name}</p>
                                                            <p style={{ color: '#000', fontSize: '12px', margin: 0, fontWeight: 600 }}>€{Number(p.price).toFixed(2)}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {/* Footer */}
                                        <p style={{ color: '#999', fontSize: '10px', textAlign: 'center' as const, margin: '24px 0 0' }}>
                                            <span style={{ color: '#999' }}>Uitschrijven</span> van promotionele emails
                                        </p>
                                    </div>
                                </div>
                                {/* Subject line indicator */}
                                <div className="mt-4 p-3 bg-white rounded-lg border border-zinc-200">
                                    <p className="text-xs text-zinc-500">Onderwerp:</p>
                                    <p className="text-sm font-medium text-zinc-800">{subject || '(geen onderwerp)'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Picker Modal */}
            {showProductPicker && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden m-4">
                        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                            <h3 className="font-semibold">Product Selecteren</h3>
                            <button
                                onClick={() => setShowProductPicker(false)}
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 border-b border-zinc-200">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                                <input
                                    type="text"
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Zoek product..."
                                    className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg"
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto max-h-80 p-4">
                            {filteredProducts.length === 0 ? (
                                <p className="text-center text-zinc-500 py-8">
                                    Geen producten gevonden
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {filteredProducts.slice(0, 20).map((product) => (
                                        <button
                                            key={product.id}
                                            onClick={() => {
                                                setSelectedProducts((prev) => [...prev, product]);
                                                setShowProductPicker(false);
                                            }}
                                            className="w-full flex items-center gap-3 p-3 hover:bg-zinc-50 rounded-lg text-left"
                                        >
                                            <div className="flex-1">
                                                <p className="font-medium">{product.name}</p>
                                                <p className="text-sm text-purple-600">
                                                    €{Number(product.price).toFixed(2)}
                                                </p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Templates Modal */}
            {showTemplates && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden m-4">
                        <div className="p-4 border-b border-zinc-200 flex items-center justify-between">
                            <h3 className="font-semibold">Email Templates</h3>
                            <button
                                onClick={() => setShowTemplates(false)}
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-96 p-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {EMAIL_TEMPLATES.map((template) => (
                                    <button
                                        key={template.id}
                                        onClick={() => loadTemplate(template)}
                                        className="text-left p-4 border border-zinc-200 rounded-lg hover:bg-purple-50 hover:border-purple-300 transition-colors"
                                    >
                                        <p className="font-semibold text-zinc-900">{template.name}</p>
                                        <p className="text-sm text-zinc-500 mt-1">{template.description}</p>
                                        <p className="text-xs text-purple-600 mt-2 truncate">
                                            {template.subject}
                                        </p>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Email Preview Modal */}
            {showPreview && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
                    <div className="bg-zinc-100 rounded-xl w-full max-w-2xl m-4">
                        <div className="p-4 bg-white rounded-t-xl border-b border-zinc-200 flex items-center justify-between">
                            <div>
                                <h3 className="font-semibold">Email Preview</h3>
                                <p className="text-sm text-zinc-500">Zo ziet de email eruit voor ontvangers</p>
                            </div>
                            <button
                                onClick={() => setShowPreview(false)}
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4">
                            {/* Email Preview - New Black & White Design */}
                            <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", backgroundColor: '#f5f5f5', padding: '40px 20px' }}>
                                <div style={{ maxWidth: '600px', margin: '0 auto' }}>
                                    {/* Card Container */}
                                    <div style={{ background: 'white', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                        {/* Black Header */}
                                        <div style={{ background: '#000000', padding: '32px 40px', textAlign: 'center' as const }}>
                                            <h1 style={{ color: 'white', margin: 0, fontSize: '22px', fontWeight: 600, letterSpacing: '-0.5px' }}>
                                                {headline || 'Headline'} ✓
                                            </h1>
                                        </div>
                                        {/* White Body */}
                                        <div style={{ padding: '32px 40px' }}>
                                            <p style={{ color: '#333', fontSize: '15px', lineHeight: 1.6, margin: '0 0 20px' }}>
                                                Beste [Klantnaam],
                                            </p>
                                            <div
                                                style={{ color: '#333', fontSize: '15px', lineHeight: 1.6, margin: '0 0 24px' }}
                                                dangerouslySetInnerHTML={{ __html: bodyHtml || '<p>Inhoud van de email...</p>' }}
                                            />
                                            {ctaText && ctaUrl && (
                                                <div style={{ textAlign: 'center' as const, margin: '32px 0' }}>
                                                    <a href={ctaUrl} style={{ display: 'inline-block', background: '#000', color: '#fff', textDecoration: 'none', padding: '14px 28px', borderRadius: '6px', fontWeight: 500, fontSize: '14px' }}>
                                                        {ctaText}
                                                    </a>
                                                </div>
                                            )}
                                            {/* Featured Products */}
                                            {selectedProducts.length > 0 && (
                                                <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #eee' }}>
                                                    <p style={{ color: '#888', fontSize: '11px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 16px' }}>
                                                        AANBEVOLEN VOOR U
                                                    </p>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: '12px' }}>
                                                        {selectedProducts.slice(0, 3).map((p) => (
                                                            <div key={p.id} style={{ flex: 1, minWidth: '140px', maxWidth: '180px', textAlign: 'center' as const, border: '1px solid #eee', borderRadius: '8px', padding: '16px' }}>
                                                                <p style={{ color: '#000', fontSize: '13px', margin: '0 0 4px', fontWeight: 500 }}>{p.name}</p>
                                                                <p style={{ color: '#000', fontSize: '15px', margin: 0, fontWeight: 600 }}>€{Number(p.price).toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Footer */}
                                            <p style={{ color: '#999', fontSize: '11px', textAlign: 'center' as const, margin: '32px 0 0' }}>
                                                <a href="#" style={{ color: '#999' }}>Uitschrijven</a> van promotionele emails
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-b-xl border-t border-zinc-200 flex justify-between">
                            <p className="text-sm text-zinc-500">Onderwerp: <strong>{subject || '(geen onderwerp)'}</strong></p>
                            <Button onClick={() => setShowPreview(false)}>Sluiten</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* User Preview Modal */}
            {showUserPreview && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                            <h2 className="text-lg font-semibold text-zinc-900">
                                {previewSegmentLabel} ({previewUsers.length} gebruikers)
                            </h2>
                            <button
                                onClick={() => setShowUserPreview(false)}
                                className="text-zinc-400 hover:text-zinc-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-y-auto max-h-[calc(80vh-120px)]">
                            {loadingUsers ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                                </div>
                            ) : previewUsers.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    Geen gebruikers gevonden in dit segment.
                                </div>
                            ) : (
                                <div className="grid gap-3 p-4">
                                    {previewUsers.map((user) => (
                                        <div key={user.id} className="bg-zinc-50 rounded-lg p-4 hover:bg-zinc-100 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-medium text-zinc-900">{user.name}</p>
                                                        {user.orderCount !== undefined && user.orderCount > 0 && (
                                                            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                                                                {user.orderCount} bestelling{user.orderCount !== 1 ? 'en' : ''}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-zinc-600 mt-0.5">{user.email}</p>
                                                    {user.phone && (
                                                        <p className="text-sm text-zinc-500 mt-1">📞 {user.phone}</p>
                                                    )}
                                                </div>
                                                <div className="text-right text-sm">
                                                    {user.lastOrder && (
                                                        <p className="text-zinc-500">
                                                            Laatste bestelling: {new Date(user.lastOrder).toLocaleDateString('nl-NL')}
                                                        </p>
                                                    )}
                                                    {user.lastAppointment && (
                                                        <p className="text-zinc-500">
                                                            Afspraak: {new Date(user.lastAppointment).toLocaleDateString('nl-NL')}
                                                        </p>
                                                    )}
                                                    {user.unsubscribedAt && (
                                                        <p className="text-red-500">
                                                            Uitgeschreven: {new Date(user.unsubscribedAt).toLocaleDateString('nl-NL')}
                                                        </p>
                                                    )}
                                                    {user.totalSpent !== undefined && user.totalSpent > 0 && (
                                                        <p className="text-green-600 font-medium mt-1">
                                                            €{user.totalSpent.toFixed(2)} totaal
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {/* Device info for repairs */}
                                            {(user.deviceBrand || user.deviceModel || user.repairType) && (
                                                <div className="mt-3 pt-3 border-t border-zinc-200 flex flex-wrap gap-2">
                                                    {user.deviceBrand && user.deviceModel && (
                                                        <span className="px-2 py-1 bg-white border border-zinc-200 text-zinc-700 text-xs rounded">
                                                            📱 {user.deviceBrand} {user.deviceModel}
                                                        </span>
                                                    )}
                                                    {user.repairType && (
                                                        <span className="px-2 py-1 bg-white border border-zinc-200 text-zinc-700 text-xs rounded">
                                                            🔧 {user.repairType.replace('_', ' ')}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="p-4 border-t border-zinc-200">
                            <Button onClick={() => setShowUserPreview(false)} className="w-full">
                                Sluiten
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Send Confirmation Modal */}
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden m-4">
                        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 text-white">
                            <h2 className="text-lg font-semibold">Bevestig Verzending</h2>
                            <p className="text-sm text-white/80">Controleer de email voordat je verstuurt</p>
                        </div>

                        {/* Recipient Info */}
                        <div className="px-6 py-3 bg-zinc-50 border-b border-zinc-200">
                            <div className="flex items-center gap-4 text-sm">
                                <span className="text-zinc-500">Naar:</span>
                                <span className="font-medium text-zinc-800">
                                    {specificEmail || segments.find(s => s.segment === selectedSegment)?.label || selectedSegment}
                                </span>
                                {!specificEmail && (
                                    <span className="text-zinc-500">
                                        ({segments.find(s => s.segment === selectedSegment)?.count || 0} ontvangers)
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-4 text-sm mt-1">
                                <span className="text-zinc-500">Onderwerp:</span>
                                <span className="font-medium text-zinc-800">{subject}</span>
                            </div>
                        </div>

                        {/* Email Preview */}
                        <div className="overflow-y-auto max-h-[50vh] bg-zinc-100 p-4">
                            <div style={{ maxWidth: '400px', margin: '0 auto', fontFamily: 'Arial, sans-serif', background: '#fff', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                                {/* Black Header */}
                                <div style={{ background: '#000', padding: '20px', textAlign: 'center' as const }}>
                                    <p style={{ color: '#fff', fontSize: '12px', fontWeight: 500, letterSpacing: '0.5px', margin: 0 }}>
                                        SMARTPHONESERVICE
                                    </p>
                                </div>
                                {/* Headline Banner */}
                                <div style={{ background: '#000', padding: '12px 20px', borderTop: '1px solid #222' }}>
                                    <p style={{ color: '#fff', fontSize: '16px', fontWeight: 600, textAlign: 'center' as const, margin: 0 }}>
                                        {headline}
                                    </p>
                                </div>
                                {/* White Body */}
                                <div style={{ padding: '20px' }}>
                                    <p style={{ color: '#333', fontSize: '13px', lineHeight: 1.5, margin: '0 0 12px' }}>
                                        Beste [Klantnaam],
                                    </p>
                                    <div
                                        style={{ color: '#333', fontSize: '13px', lineHeight: 1.5, margin: '0 0 16px' }}
                                        dangerouslySetInnerHTML={{ __html: bodyHtml }}
                                    />
                                    {ctaText && ctaUrl && (
                                        <div style={{ textAlign: 'center' as const, margin: '20px 0' }}>
                                            <span style={{ display: 'inline-block', background: '#000', color: '#fff', padding: '10px 20px', borderRadius: '6px', fontWeight: 500, fontSize: '12px' }}>
                                                {ctaText}
                                            </span>
                                        </div>
                                    )}
                                    {selectedProducts.length > 0 && (
                                        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
                                            <p style={{ color: '#888', fontSize: '9px', fontWeight: 500, textTransform: 'uppercase' as const, letterSpacing: '0.5px', margin: '0 0 8px' }}>
                                                AANBEVOLEN VOOR U
                                            </p>
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {selectedProducts.slice(0, 3).map((p) => (
                                                    <div key={p.id} style={{ flex: 1, textAlign: 'center' as const, border: '1px solid #eee', borderRadius: '4px', padding: '8px' }}>
                                                        <p style={{ color: '#000', fontSize: '10px', margin: 0, fontWeight: 500 }}>{p.name}</p>
                                                        <p style={{ color: '#000', fontSize: '11px', margin: '2px 0 0', fontWeight: 600 }}>€{Number(p.price).toFixed(2)}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="px-6 py-4 border-t border-zinc-200 flex justify-between items-center gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setShowConfirmation(false)}
                                disabled={sending}
                            >
                                Annuleren
                            </Button>
                            <Button
                                onClick={() => {
                                    setShowConfirmation(false);
                                    handleSend();
                                }}
                                disabled={sending}
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                            >
                                {sending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Versturen...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Bevestigen & Versturen
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

