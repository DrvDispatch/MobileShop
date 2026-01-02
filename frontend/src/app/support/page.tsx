"use client";

import { Navbar, Footer } from "@/components/landing";
import { Mail, Phone, MapPin, Clock, ChevronDown } from "lucide-react";
import { useTenant } from "@/lib/TenantProvider";

const faqs = [
    {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit cards (Visa, MasterCard, American Express), Bancontact, and iDEAL. All payments are processed securely through Stripe."
    },
    {
        question: "How long does shipping take?",
        answer: "Belgium: 2-3 business days via bpost. Netherlands & Luxembourg: 3-4 business days. Germany & France: 4-5 business days. Free shipping on orders over €75."
    },
    {
        question: "What is your return policy?",
        answer: "We offer a 14-day return policy for all unused items in original packaging, in accordance with Belgian consumer law. Defective products can be returned within 90 days for a full refund or replacement."
    },
    {
        question: "Do you offer warranty on repairs?",
        answer: "Yes, all our repairs come with a 90-day warranty covering parts and labor. If the same issue occurs within 90 days, we'll fix it for free."
    },
    {
        question: "How do I track my order?",
        answer: "Once your order ships, you'll receive an email with a bpost or international tracking number. You can also track your order by logging into your account."
    },
    {
        question: "Do you sell refurbished phones?",
        answer: "Yes, we offer certified refurbished phones that have been thoroughly tested and restored to like-new condition. All refurbished devices come with a 6-month warranty."
    },
    {
        question: "Are prices including VAT?",
        answer: "Yes, all prices on our website include 21% Belgian VAT (BTW). You will not pay any additional taxes at checkout."
    },
];

export default function SupportPage() {
    const tenant = useTenant();
    const { contact, branding, business } = tenant;

    // Format address from tenant config
    const formatAddress = () => {
        if (!contact.address) return null;
        const addr = contact.address as { line1?: string; city?: string; postalCode?: string };
        if (addr.line1 && addr.city && addr.postalCode) {
            return `${addr.line1}, ${addr.postalCode} ${addr.city}`;
        }
        return null;
    };

    // Format opening hours from tenant config
    const formatHoursForCard = () => {
        const hours = business.openingHours as Record<string, { open: string; close: string } | null> | null;
        if (!hours) return 'Mon-Sat, 9:00-18:00'; // Fallback

        // Check if there's at least one open day to build a summary
        const openDays = Object.entries(hours).filter(([, v]) => v !== null);
        if (openDays.length === 0) return 'Contact for hours';

        // Simple summary: use first open day's hours
        const firstOpen = openDays[0][1] as { open: string; close: string };
        return `${firstOpen.open} - ${firstOpen.close}`;
    };

    const formattedAddress = formatAddress();
    const shopPhone = contact.phone || contact.whatsappNumber;
    const shopEmail = contact.email;

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-zinc-900 mb-4">How can we help?</h1>
                    <p className="text-lg text-zinc-600 max-w-2xl mx-auto">
                        Find answers to common questions or get in touch with our support team.
                    </p>
                </div>

                {/* Contact Cards */}
                <div className="grid md:grid-cols-3 gap-6 mb-16">
                    {shopPhone && (
                        <div className="bg-zinc-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Phone className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-zinc-900 mb-2">Call Us</h3>
                            <p className="text-zinc-600 text-sm mb-3">{formatHoursForCard()}</p>
                            <a href={`tel:${shopPhone.replace(/\s/g, '')}`} className="text-zinc-900 font-medium hover:underline">
                                {shopPhone}
                            </a>
                        </div>
                    )}

                    {shopEmail && (
                        <div className="bg-zinc-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-zinc-900 mb-2">Email Us</h3>
                            <p className="text-zinc-600 text-sm mb-3">We reply within 24 hours</p>
                            <a href={`mailto:${shopEmail}`} className="text-zinc-900 font-medium hover:underline">
                                {shopEmail}
                            </a>
                        </div>
                    )}

                    {formattedAddress && (
                        <div className="bg-zinc-50 rounded-xl p-6 text-center">
                            <div className="w-12 h-12 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
                                <MapPin className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="font-semibold text-zinc-900 mb-2">Visit Us</h3>
                            <p className="text-zinc-600 text-sm mb-3">Walk-ins welcome</p>
                            <address className="text-zinc-900 font-medium not-italic">
                                {formattedAddress}
                            </address>
                        </div>
                    )}
                </div>

                {/* FAQ Section */}
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-zinc-900 mb-8 text-center">
                        Frequently Asked Questions
                    </h2>

                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <details
                                key={index}
                                className="group bg-zinc-50 rounded-xl overflow-hidden"
                            >
                                <summary className="flex items-center justify-between p-6 cursor-pointer list-none">
                                    <span className="font-medium text-zinc-900">{faq.question}</span>
                                    <ChevronDown className="w-5 h-5 text-zinc-400 group-open:rotate-180 transition-transform" />
                                </summary>
                                <div className="px-6 pb-6 text-zinc-600">
                                    {faq.answer}
                                </div>
                            </details>
                        ))}
                    </div>
                </div>

                {/* Store Hours */}
                <div className="mt-16 bg-zinc-900 rounded-2xl p-8 text-center text-white">
                    <Clock className="w-8 h-8 mx-auto mb-4 opacity-80" />
                    <h3 className="text-xl font-semibold mb-4">Store Hours</h3>
                    <div className="space-y-2 max-w-md mx-auto text-sm">
                        {(() => {
                            const hours = business.openingHours as Record<string, { open: string; close: string } | null> | null;
                            const dayNames: Record<string, string> = {
                                monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday',
                                thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday'
                            };
                            if (!hours) {
                                return <p className="opacity-60">Contact us for hours</p>;
                            }
                            return Object.entries(dayNames).map(([key, name]) => {
                                const dayHours = hours[key];
                                return (
                                    <div key={key} className="flex justify-between">
                                        <span className="opacity-60">{name}</span>
                                        <span className={`font-medium ${!dayHours ? 'text-red-400' : ''}`}>
                                            {dayHours ? `${dayHours.open} - ${dayHours.close}` : 'Closed'}
                                        </span>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}
