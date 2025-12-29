"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError } from "@/lib/api";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export function ForgotPasswordForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [email, setEmail] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await api.forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            const apiError = err as ApiError;
            setError(apiError.message || "Failed to send reset email. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-xl font-semibold text-zinc-900">Check your email</h2>
                    <p className="text-zinc-600">
                        We&apos;ve sent a password reset link to <strong>{email}</strong>
                    </p>
                </div>
                <p className="text-sm text-zinc-500">
                    Didn&apos;t receive the email?{" "}
                    <button
                        onClick={() => setSuccess(false)}
                        className="text-violet-600 hover:text-violet-700 font-medium"
                    >
                        Try again
                    </button>
                </p>
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="text-center space-y-2 mb-6">
                <div className="mx-auto w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-violet-600" />
                </div>
                <p className="text-sm text-zinc-600">
                    Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
            </div>

            {error && (
                <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                    {error}
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Send reset link
            </Button>

            <div className="text-center">
                <Link
                    href="/login"
                    className="inline-flex items-center gap-2 text-sm text-zinc-600 hover:text-zinc-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to login
                </Link>
            </div>
        </form>
    );
}
