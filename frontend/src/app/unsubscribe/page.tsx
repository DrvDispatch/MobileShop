"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle, ChevronDown, AlertCircle, Loader2 } from "lucide-react";

// Backend has global prefix 'api' so we need to ensure /api is in the URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;

function UnsubscribeContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get("email") || "";

    const [unsubscribing, setUnsubscribing] = useState(false);
    const [unsubscribed, setUnsubscribed] = useState(false);
    const [reason, setReason] = useState("");
    const [error, setError] = useState<string | null>(null);

    const handleUnsubscribe = async () => {
        if (!email || unsubscribing) return;

        setUnsubscribing(true);
        setError(null);

        try {
            const res = await fetch(`${API_URL}/marketing/unsubscribe`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    reason: reason.trim() || undefined,
                }),
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "Uitschrijven mislukt");
            }

            setUnsubscribed(true);
        } catch (err: any) {
            setError(err.message || "Er is iets misgegaan. Probeer het later opnieuw.");
        } finally {
            setUnsubscribing(false);
        }
    };

    // No email provided
    if (!email) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md w-full">
                    <div className="bg-black px-8 py-6 text-center">
                        <h1 className="text-xl font-semibold text-white">Ongeldige Link</h1>
                    </div>
                    <div className="p-8 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <p className="text-gray-600">
                            Er is geen e-mailadres opgegeven. Controleer uw link en probeer het opnieuw.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Successfully unsubscribed
    if (unsubscribed) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md w-full">
                    <div className="bg-black px-8 py-6 text-center">
                        <h1 className="text-xl font-semibold text-white">
                            Uitschrijving Bevestigd ✓
                        </h1>
                    </div>
                    <div className="p-8 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
                        <p className="text-gray-600 mb-4">
                            U ontvangt geen promotionele e-mails meer op:
                        </p>
                        <p className="text-gray-900 font-mono bg-gray-100 px-4 py-2 rounded inline-block text-sm">
                            {email}
                        </p>
                        <p className="text-gray-400 text-sm mt-6">
                            U blijft service-gerelateerde e-mails ontvangen over uw bestellingen en afspraken.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Unsubscribe form
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden max-w-md w-full">
                {/* Black Header */}
                <div className="bg-black px-8 py-6 text-center">
                    <h1 className="text-xl font-semibold text-white">Uitschrijven</h1>
                </div>

                {/* White Body */}
                <div className="p-8">
                    <p className="text-gray-600 text-center mb-6">
                        Weet u zeker dat u geen promotionele e-mails meer wilt ontvangen?
                    </p>

                    {/* Email Display */}
                    <div className="mb-6 pb-6 border-b border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
                            E-MAILADRES
                        </p>
                        <p className="text-gray-900 font-mono text-sm break-all">{email}</p>
                    </div>

                    {/* Optional Reason */}
                    <div className="mb-6">
                        <label className="block text-xs text-gray-400 uppercase tracking-wide mb-2">
                            REDEN (OPTIONEEL)
                        </label>
                        <div className="relative">
                            <select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full appearance-none bg-white border border-gray-200 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent cursor-pointer pr-10"
                            >
                                <option value="">Selecteer een reden...</option>
                                <option value="too_many">Te veel e-mails</option>
                                <option value="not_relevant">Niet relevant voor mij</option>
                                <option value="never_subscribed">Nooit ingeschreven</option>
                                <option value="other">Anders</option>
                            </select>
                            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                            <p className="text-red-700 text-sm">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleUnsubscribe}
                        disabled={unsubscribing}
                        className={`w-full py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${unsubscribing
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-black text-white hover:bg-gray-800"
                            }`}
                    >
                        {unsubscribing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Bezig met uitschrijven...
                            </>
                        ) : (
                            "Uitschrijven"
                        )}
                    </button>

                    {/* Info Text */}
                    <p className="text-gray-400 text-xs text-center mt-6">
                        U blijft service-gerelateerde e-mails ontvangen over uw bestellingen en afspraken.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function UnsubscribePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
                    <p className="text-gray-500 text-sm">Laden...</p>
                </div>
            </div>
        }>
            <UnsubscribeContent />
        </Suspense>
    );
}
