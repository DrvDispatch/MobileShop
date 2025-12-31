"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ERROR_MESSAGES: Record<string, string> = {
    tenant_not_found: "De winkel waarvoor u probeert in te loggen kon niet worden gevonden.",
    invalid_state: "Er is een beveiligingsprobleem opgetreden. Probeer opnieuw in te loggen.",
    oauth_failed: "Inloggen via Google is mislukt. Probeer het opnieuw.",
    default: "Er is een fout opgetreden bij het inloggen.",
};

function ErrorContent() {
    const searchParams = useSearchParams();
    const errorCode = searchParams.get("message") || "default";
    const errorMessage = ERROR_MESSAGES[errorCode] || ERROR_MESSAGES.default;

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
            <div className="text-center max-w-md">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                </div>

                <h1 className="text-2xl font-bold text-zinc-900 mb-3">
                    Inloggen mislukt
                </h1>

                <p className="text-zinc-600 mb-8">
                    {errorMessage}
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link href="/login">
                        <Button>
                            Opnieuw proberen
                        </Button>
                    </Link>
                    <Link href="/">
                        <Button variant="outline">
                            Naar home
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function AuthErrorPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
            </div>
        }>
            <ErrorContent />
        </Suspense>
    );
}
