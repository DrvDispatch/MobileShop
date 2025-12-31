"use client";

import { useEffect, Suspense, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

/**
 * OAuth callback page - handles the handoff code exchange
 * 
 * Flow:
 * 1. User arrives with ?code=ONE_TIME_CODE from OAuth callback
 * 2. We call POST /api/auth/exchange (same-origin via proxy)
 * 3. Backend sets HttpOnly cookie and returns returnPath
 * 4. We redirect to returnPath
 */
function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [errorMessage, setErrorMessage] = useState<string>("");
    const exchangeAttempted = useRef(false);  // Prevent double call in StrictMode

    useEffect(() => {
        // Prevent double execution in React StrictMode
        if (exchangeAttempted.current) return;
        exchangeAttempted.current = true;

        const exchangeCode = async () => {
            // Check for one-time code from OAuth handoff
            const code = searchParams.get("code");

            // Legacy: check for token in URL (for email/password flows)
            const token = searchParams.get("token");

            if (token) {
                // Legacy token flow - store in localStorage
                localStorage.setItem("accessToken", token);
                setStatus("success");
                const returnUrl = searchParams.get("returnUrl") || "/";
                setTimeout(() => router.push(returnUrl), 500);
                return;
            }

            if (!code) {
                setStatus("error");
                setErrorMessage("Geen autorisatiecode ontvangen");
                return;
            }

            try {
                // Exchange the handoff code for a cookie (same-origin request)
                const response = await fetch("/api/auth/exchange", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ code }),
                    credentials: "include", // Important for receiving cookies
                });

                if (!response.ok) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data.message || "Code exchange mislukt");
                }

                const data = await response.json();

                // Store user data in localStorage so navbar can detect logged-in state
                // (HttpOnly cookie can't be read by JavaScript)
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    // Set a flag indicating we have a valid auth cookie
                    localStorage.setItem("accessToken", "cookie-based");
                }

                setStatus("success");

                // Redirect to the intended path
                setTimeout(() => {
                    router.push(data.returnPath || "/");
                }, 500);

            } catch (error) {
                console.error("OAuth exchange failed:", error);
                setStatus("error");
                setErrorMessage(
                    error instanceof Error
                        ? error.message
                        : "Er is iets misgegaan bij het inloggen"
                );
            }
        };

        exchangeCode();
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
            <div className="text-center max-w-md p-6">
                {status === "loading" && (
                    <>
                        <Loader2 className="w-12 h-12 text-zinc-400 animate-spin mx-auto mb-4" />
                        <p className="text-lg text-zinc-600">Inloggen...</p>
                        <p className="text-sm text-zinc-400 mt-2">Even geduld terwijl we je inloggen</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                        <p className="text-lg font-medium text-zinc-900">Ingelogd!</p>
                        <p className="text-sm text-zinc-500 mt-1">Je wordt doorgestuurd...</p>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        </div>
                        <p className="text-lg font-medium text-zinc-900">Inloggen mislukt</p>
                        <p className="text-sm text-zinc-500 mt-2 mb-4">{errorMessage}</p>
                        <button
                            onClick={() => router.push("/login")}
                            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
                        >
                            Opnieuw proberen
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-zinc-50">
                <Loader2 className="w-12 h-12 text-zinc-400 animate-spin" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
