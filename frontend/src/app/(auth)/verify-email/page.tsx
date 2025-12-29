"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { Mail, CheckCircle, Loader2, RefreshCw } from "lucide-react";

function VerifyEmailContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");
    const email = searchParams.get("email");
    const isNew = searchParams.get("new") === "true";

    const [status, setStatus] = useState<"pending" | "verifying" | "success" | "error">(
        token ? "verifying" : "pending"
    );
    const [error, setError] = useState<string | null>(null);
    const [isResending, setIsResending] = useState(false);
    const [resendSuccess, setResendSuccess] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [countdown, setCountdown] = useState(3);
    const [shouldRedirect, setShouldRedirect] = useState(false);

    // Check if user is verified (for polling)
    const checkVerificationStatus = useCallback(async () => {
        if (!email) return false;

        try {
            // Try to get user status - if verified, the me endpoint will work
            const user = await api.getMe();
            if (user && user.emailVerified) {
                return true;
            }
        } catch {
            // Not logged in or not verified yet
        }
        return false;
    }, [email]);

    // Poll for verification status when in pending state
    useEffect(() => {
        if (status !== "pending" || !email) return;

        setIsPolling(true);
        const pollInterval = setInterval(async () => {
            const isVerified = await checkVerificationStatus();
            if (isVerified) {
                clearInterval(pollInterval);
                setStatus("success");
            }
        }, 3000); // Poll every 3 seconds

        return () => {
            clearInterval(pollInterval);
            setIsPolling(false);
        };
    }, [status, email, checkVerificationStatus]);

    // Countdown after success
    useEffect(() => {
        if (status !== "success") return;

        const countdownInterval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setShouldRedirect(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(countdownInterval);
    }, [status]);

    // Separate effect for redirect to avoid setState during render
    useEffect(() => {
        if (shouldRedirect) {
            router.push("/");
        }
    }, [shouldRedirect, router]);

    useEffect(() => {
        if (token) {
            verifyEmail();
        }
    }, [token]);

    const verifyEmail = async () => {
        if (!token) return;

        setStatus("verifying");
        try {
            await api.verifyEmail(token);
            setStatus("success");
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || "Failed to verify email");
            setStatus("error");
        }
    };

    const handleResend = async () => {
        if (!email) return;

        setIsResending(true);
        setResendSuccess(false);
        try {
            await api.resendVerification(email);
            setResendSuccess(true);
        } catch (err) {
            // Silently handle - API returns success message regardless for security
            setResendSuccess(true);
        } finally {
            setIsResending(false);
        }
    };

    // Verifying state
    if (status === "verifying") {
        return (
            <div className="text-center space-y-6 py-8">
                <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-violet-600 animate-spin" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-900">Verifying your email...</h2>
                    <p className="text-zinc-600">Please wait while we verify your email address.</p>
                </div>
            </div>
        );
    }

    // Success state with countdown
    if (status === "success") {
        return (
            <div className="text-center space-y-6 py-8">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-900">Email verified! ✓</h2>
                    <p className="text-zinc-600">
                        Your email has been verified successfully. Redirecting in {countdown}...
                    </p>
                </div>
                <Link href="/">
                    <Button size="lg">Go to homepage now</Button>
                </Link>
            </div>
        );
    }

    // Error state
    if (status === "error") {
        return (
            <div className="text-center space-y-6 py-8">
                <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                    <Mail className="w-8 h-8 text-red-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-900">Verification failed</h2>
                    <p className="text-zinc-600">{error}</p>
                </div>
                {email && (
                    <Button onClick={handleResend} disabled={isResending} variant="outline">
                        {isResending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Resend verification email
                            </>
                        )}
                    </Button>
                )}
                <div>
                    <Link href="/login" className="text-sm text-zinc-600 hover:text-zinc-900">
                        Back to login
                    </Link>
                </div>
            </div>
        );
    }

    // Pending state (check your email) - with polling indicator
    return (
        <div className="text-center space-y-6 py-8">
            <div className="mx-auto w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center relative">
                <Mail className="w-8 h-8 text-violet-600" />
                {isPolling && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
                )}
            </div>
            <div className="space-y-2">
                <h2 className="text-xl font-semibold text-zinc-900">
                    {isNew ? "Check your email" : "Verify your email"}
                </h2>
                <p className="text-zinc-600">
                    {email ? (
                        <>
                            We&apos;ve sent a verification link to <strong>{email}</strong>
                        </>
                    ) : (
                        "Please check your email for a verification link."
                    )}
                </p>
                {isPolling && (
                    <p className="text-sm text-green-600 flex items-center justify-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Waiting for verification...
                    </p>
                )}
            </div>

            {resendSuccess ? (
                <p className="text-sm text-green-600">Verification email sent! Check your inbox.</p>
            ) : (
                email && (
                    <Button onClick={handleResend} disabled={isResending} variant="outline">
                        {isResending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Sending...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4" />
                                Resend verification email
                            </>
                        )}
                    </Button>
                )
            )}

            <div className="pt-4 border-t border-zinc-200">
                <p className="text-sm text-zinc-500 mb-2">Already verified?</p>
                <Link href="/login">
                    <Button variant="ghost">Go to login</Button>
                </Link>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Card className="backdrop-blur-lg bg-white/80">
            <CardHeader className="text-center pb-0">
                <CardTitle className="text-2xl">Email Verification</CardTitle>
            </CardHeader>
            <CardContent>
                <Suspense fallback={
                    <div className="text-center py-8">
                        <Loader2 className="w-8 h-8 text-violet-600 animate-spin mx-auto" />
                    </div>
                }>
                    <VerifyEmailContent />
                </Suspense>
            </CardContent>
        </Card>
    );
}

