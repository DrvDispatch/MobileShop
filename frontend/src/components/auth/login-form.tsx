"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, saveToken, ApiError } from "@/lib/api";

export function LoginForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    });

    /**
     * Map backend error messages to user-friendly descriptions with helpful suggestions
     */
    const getErrorMessage = (error: ApiError): string => {
        const message = error.message?.toLowerCase() || '';

        // Map common error messages to user-friendly text
        if (message.includes('invalid credentials')) {
            return 'Incorrect email or password. Please check your credentials and try again.';
        }
        if (message.includes('email is not verified') || message.includes('verify your email')) {
            return 'Please verify your email address first. Check your inbox for a verification link.';
        }
        if (message.includes('account is deactivated') || message.includes('inactive')) {
            return 'Your account has been deactivated. Please contact support for assistance.';
        }
        if (message.includes('google')) {
            return 'This account uses Google Sign-In. Please use the "Continue with Google" button.';
        }
        if (error.statusCode === 429) {
            return 'Too many login attempts. Please wait a few minutes before trying again.';
        }
        if (error.statusCode >= 500) {
            return 'Server error. Please try again later or contact support if the issue persists.';
        }

        // Return original message if no mapping found
        return error.message || 'Login failed. Please try again.';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await api.login(formData.email, formData.password);
            saveToken(response.accessToken);

            // Redirect based on verification status
            if (!response.user.emailVerified) {
                router.push("/verify-email?email=" + encodeURIComponent(response.user.email));
            } else {
                router.push("/");
            }
        } catch (err) {
            const apiError = err as ApiError;
            setError(getErrorMessage(apiError));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
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
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    autoComplete="email"
                />
            </div>

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                        href="/forgot-password"
                        className="text-sm text-zinc-600 hover:text-zinc-900 font-medium"
                    >
                        Forgot password?
                    </Link>
                </div>
                <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required
                    autoComplete="current-password"
                />
            </div>

            <Button type="submit" className="w-full" size="lg" isLoading={isLoading}>
                Sign in
            </Button>
        </form>
    );
}
