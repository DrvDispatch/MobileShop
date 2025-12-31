"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/lib/store";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

const getAdminHeaders = () => {
    const token = localStorage.getItem("adminAccessToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export default function AdminSettingsPage() {
    const { settings, fetchSettings, refreshSettings } = useSettingsStore();
    const [isSaving, setIsSaving] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        storeName: "",
        storePhone: "",
        storeEmail: "",
        storeAddress: "",
        storeCity: "",
        storePostalCode: "",
        storeCountry: "",
        vatNumber: "",
        currency: "EUR",
        taxRate: "21",
        taxIncluded: true,
    });

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        if (settings) {
            setFormData({
                storeName: settings.store.name,
                storePhone: settings.store.phone,
                storeEmail: settings.store.email,
                storeAddress: settings.store.address.line1,
                storeCity: settings.store.address.city,
                storePostalCode: settings.store.address.postalCode,
                storeCountry: settings.store.address.country,
                vatNumber: settings.store.vatNumber || "",
                currency: settings.checkout.currency,
                taxRate: (settings.checkout.taxRate * 100).toString(),
                taxIncluded: settings.checkout.taxIncluded,
            });
        }
    }, [settings]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setSuccess(false);
        setError(null);

        try {
            // Save all settings to the backend
            const settingsToSave = [
                { key: "store.name", value: formData.storeName },
                { key: "store.phone", value: formData.storePhone },
                { key: "store.email", value: formData.storeEmail },
                {
                    key: "store.address",
                    value: {
                        line1: formData.storeAddress,
                        city: formData.storeCity,
                        postalCode: formData.storePostalCode,
                        country: formData.storeCountry,
                    },
                },
                { key: "store.vatNumber", value: formData.vatNumber },
                { key: "checkout.currency", value: formData.currency },
                {
                    key: "checkout.currencySymbol",
                    value: formData.currency === "EUR" ? "€" : formData.currency === "USD" ? "$" : "£",
                },
                { key: "checkout.taxRate", value: parseFloat(formData.taxRate) / 100 },
                { key: "checkout.taxLabel", value: `${formData.taxRate}% VAT` },
                { key: "checkout.taxIncluded", value: formData.taxIncluded },
            ];

            // Save each setting via PUT /api/settings/:key
            for (const setting of settingsToSave) {
                const res = await fetch(`/api/settings/${setting.key}`, {
                    method: "PUT",
                    headers: getAdminHeaders(),
                    body: JSON.stringify({ value: setting.value }),
                });

                if (!res.ok) {
                    const errData = await res.json().catch(() => ({}));
                    throw new Error(errData.message || `Failed to save ${setting.key}`);
                }
            }

            // Refresh the global settings store so the entire website updates in real-time
            await refreshSettings();

            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error("Failed to save settings:", err);
            setError(err.message || "Failed to save settings");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
                <p className="text-zinc-500">Manage your store configuration</p>
            </div>

            {success && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-600">
                    Settings saved successfully! Changes are now live on the website.
                </div>
            )}

            {error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Store Info */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900">Store Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="storeName">Store Name</Label>
                            <Input
                                id="storeName"
                                value={formData.storeName}
                                onChange={(e) =>
                                    setFormData({ ...formData, storeName: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storePhone">Phone</Label>
                            <Input
                                id="storePhone"
                                type="tel"
                                value={formData.storePhone}
                                onChange={(e) =>
                                    setFormData({ ...formData, storePhone: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storeEmail">Email</Label>
                            <Input
                                id="storeEmail"
                                type="email"
                                value={formData.storeEmail}
                                onChange={(e) =>
                                    setFormData({ ...formData, storeEmail: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vatNumber">VAT Number</Label>
                            <Input
                                id="vatNumber"
                                value={formData.vatNumber}
                                onChange={(e) =>
                                    setFormData({ ...formData, vatNumber: e.target.value })
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900">Store Address</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="storeAddress">Street Address</Label>
                            <Input
                                id="storeAddress"
                                value={formData.storeAddress}
                                onChange={(e) =>
                                    setFormData({ ...formData, storeAddress: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storeCity">City</Label>
                            <Input
                                id="storeCity"
                                value={formData.storeCity}
                                onChange={(e) =>
                                    setFormData({ ...formData, storeCity: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storePostalCode">Postal Code</Label>
                            <Input
                                id="storePostalCode"
                                value={formData.storePostalCode}
                                onChange={(e) =>
                                    setFormData({ ...formData, storePostalCode: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storeCountry">Country</Label>
                            <Input
                                id="storeCountry"
                                value={formData.storeCountry}
                                onChange={(e) =>
                                    setFormData({ ...formData, storeCountry: e.target.value })
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Checkout Settings */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900">Checkout Settings</h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="currency">Currency</Label>
                            <select
                                id="currency"
                                value={formData.currency}
                                onChange={(e) =>
                                    setFormData({ ...formData, currency: e.target.value })
                                }
                                className="w-full h-10 px-3 rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900"
                            >
                                <option value="EUR">EUR (€)</option>
                                <option value="USD">USD ($)</option>
                                <option value="GBP">GBP (£)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="taxRate">Tax Rate (%)</Label>
                            <Input
                                id="taxRate"
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={formData.taxRate}
                                onChange={(e) =>
                                    setFormData({ ...formData, taxRate: e.target.value })
                                }
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer h-10">
                                <input
                                    type="checkbox"
                                    checked={formData.taxIncluded}
                                    onChange={(e) =>
                                        setFormData({ ...formData, taxIncluded: e.target.checked })
                                    }
                                    className="w-4 h-4 rounded border-zinc-300"
                                />
                                <span className="text-sm text-zinc-700">Prices include tax</span>
                            </label>
                        </div>
                    </div>
                </div>

                <Button type="submit" disabled={isSaving}>
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>
            </form>
        </div>
    );
}
