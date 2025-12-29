"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, AuthResponse } from "@/lib/api";
import { ChevronLeft, Save, Eye, EyeOff } from "lucide-react";

export default function AccountSettingsPage() {
    const router = useRouter();
    const [user, setUser] = useState<AuthResponse["user"] | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await api.getMe();
                setUser(userData);
                setFormData({
                    name: userData.name || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                });
            } catch (error) {
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        // TODO: Connect to update profile API
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert("Profile updated successfully!");
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        try {
            // TODO: Connect to change password API
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setPasswordSuccess(true);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPasswordForm(false);
        } catch (err) {
            setPasswordError("Failed to change password. Please check your current password.");
        }
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div className="animate-pulse space-y-4">
                        <div className="h-8 bg-zinc-200 rounded w-1/3" />
                        <div className="h-64 bg-zinc-200 rounded" />
                    </div>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/account" className="text-sm text-zinc-500 hover:text-zinc-900 flex items-center gap-1 mb-4">
                        <ChevronLeft className="w-4 h-4" />
                        Back to Account
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900">Account Settings</h1>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-zinc-50 rounded-xl p-6 space-y-6">
                        <h2 className="font-semibold text-zinc-900">Personal Information</h2>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Your name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    disabled
                                    className="bg-zinc-100"
                                />
                                <p className="text-xs text-zinc-500">
                                    Email cannot be changed. Contact support if needed.
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+32 465 63 81 06"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-zinc-50 rounded-xl p-6 space-y-6">
                        <h2 className="font-semibold text-zinc-900">Security</h2>

                        {!showPasswordForm ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-zinc-900">Password</p>
                                    <p className="text-sm text-zinc-500">Change your password</p>
                                </div>
                                <Button type="button" variant="outline" size="sm" onClick={() => setShowPasswordForm(true)}>
                                    Change Password
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <p className="font-medium text-zinc-900">Change Password</p>
                                    <Button type="button" variant="ghost" size="sm" onClick={() => {
                                        setShowPasswordForm(false);
                                        setPasswordError(null);
                                        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
                                    }}>
                                        Cancel
                                    </Button>
                                </div>

                                {passwordError && (
                                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
                                        {passwordError}
                                    </div>
                                )}

                                {passwordSuccess && (
                                    <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-600 text-sm">
                                        Password changed successfully!
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            value={passwordData.currentPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? "text" : "password"}
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            placeholder="Enter new password"
                                        />
                                        <button
                                            type="button"
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-zinc-500">Must be at least 8 characters</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={passwordData.confirmPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                    />
                                </div>

                                <Button type="button" variant="default" size="sm" onClick={handlePasswordChange}>
                                    Update Password
                                </Button>
                            </div>
                        )}
                    </div>

                    <Button type="submit" size="lg" className="w-full" disabled={isSaving}>
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                    </Button>
                </form>
            </div>

            <Footer />
        </main>
    );
}

