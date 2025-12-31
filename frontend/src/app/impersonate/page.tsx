"use client";

import { useEffect, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ImpersonatePage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    // Prevent double execution in React StrictMode
    const exchangeAttempted = useRef(false);

    useEffect(() => {
        // Prevent double call in React StrictMode
        if (exchangeAttempted.current) return;
        exchangeAttempted.current = true;

        const code = searchParams.get("code");

        if (!code) {
            setStatus("error");
            setMessage("No impersonation code provided");
            return;
        }

        // Exchange the handoff code for a session
        fetch("/api/auth/impersonate/exchange", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code }),
            credentials: "include",
        })
            .then(async (res) => {
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.message || "Failed to establish impersonation session");
                }
                return data;
            })
            .then((data) => {
                setStatus("success");
                setMessage(`Logged in as ${data.user.email}`);

                // Store user data in localStorage so navbar can detect logged-in state
                // (HttpOnly cookie can't be read by JavaScript)
                if (data.user) {
                    localStorage.setItem("user", JSON.stringify(data.user));
                    // Set a flag indicating we have a valid auth cookie
                    localStorage.setItem("accessToken", "cookie-based");
                }

                // Redirect to dashboard after short delay
                setTimeout(() => {
                    router.replace("/");
                }, 1500);
            })
            .catch((err) => {
                setStatus("error");
                setMessage(err.message);
            });
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
            <Card className="w-full max-w-md bg-gray-800/50 border-gray-700 backdrop-blur">
                <CardHeader className="text-center">
                    {status === "loading" && (
                        <>
                            <div className="mx-auto w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-4">
                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                            </div>
                            <CardTitle className="text-2xl text-white">Establishing Session</CardTitle>
                            <CardDescription className="text-gray-400">
                                Please wait while we set up your impersonation session...
                            </CardDescription>
                        </>
                    )}

                    {status === "success" && (
                        <>
                            <div className="mx-auto w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-8 h-8 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl text-white">Session Established</CardTitle>
                            <CardDescription className="text-green-400">
                                {message}
                            </CardDescription>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <CardTitle className="text-2xl text-white">Session Failed</CardTitle>
                            <CardDescription className="text-red-400">
                                {message}
                            </CardDescription>
                        </>
                    )}
                </CardHeader>

                {status === "error" && (
                    <CardContent>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => window.close()}
                        >
                            Close Window
                        </Button>
                    </CardContent>
                )}
            </Card>
        </div>
    );
}
