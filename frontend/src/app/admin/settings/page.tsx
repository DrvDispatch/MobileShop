"use client";

/**
 * Admin Settings Page - UI Layer
 * 
 * This page is now a THIN UI LAYER that:
 * - Consumes the useSettingsForm hook for all form logic
 * - Renders the settings forms
 * - Applies styling and layout
 * 
 * All state management, form handling, and API calls are in the hook.
 * This component only handles presentation.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { useSettingsForm } from "@/lib/admin/settings";

export default function AdminSettingsPage() {
    const settings = useSettingsForm();

    if (settings.isLoading) {
        return (
            <div className="max-w-3xl mx-auto p-8 text-center">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-zinc-400" />
                <p className="text-zinc-500 mt-2">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-zinc-900">Settings</h1>
                <p className="text-zinc-500">Manage your store configuration</p>
            </div>

            {settings.success && (
                <div className="p-4 rounded-lg bg-green-50 border border-green-200 text-green-600">
                    Settings saved successfully! Changes are now live on the website.
                </div>
            )}

            {settings.error && (
                <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-600">
                    {settings.error}
                </div>
            )}

            <form onSubmit={settings.handleSubmit} className="space-y-6">
                {/* Store Info */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-4">
                    <h2 className="font-semibold text-zinc-900">Store Information</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2 space-y-2">
                            <Label htmlFor="storeName">Store Name</Label>
                            <Input
                                id="storeName"
                                value={settings.formData.storeName}
                                onChange={(e) => settings.setFormField("storeName", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storePhone">Phone</Label>
                            <Input
                                id="storePhone"
                                type="tel"
                                value={settings.formData.storePhone}
                                onChange={(e) => settings.setFormField("storePhone", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storeEmail">Email</Label>
                            <Input
                                id="storeEmail"
                                type="email"
                                value={settings.formData.storeEmail}
                                onChange={(e) => settings.setFormField("storeEmail", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="vatNumber">VAT Number</Label>
                            <Input
                                id="vatNumber"
                                value={settings.formData.vatNumber}
                                onChange={(e) => settings.setFormField("vatNumber", e.target.value)}
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
                                value={settings.formData.storeAddress}
                                onChange={(e) => settings.setFormField("storeAddress", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storeCity">City</Label>
                            <Input
                                id="storeCity"
                                value={settings.formData.storeCity}
                                onChange={(e) => settings.setFormField("storeCity", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storePostalCode">Postal Code</Label>
                            <Input
                                id="storePostalCode"
                                value={settings.formData.storePostalCode}
                                onChange={(e) => settings.setFormField("storePostalCode", e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="storeCountry">Country</Label>
                            <Input
                                id="storeCountry"
                                value={settings.formData.storeCountry}
                                onChange={(e) => settings.setFormField("storeCountry", e.target.value)}
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
                                value={settings.formData.currency}
                                onChange={(e) => settings.setFormField("currency", e.target.value)}
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
                                value={settings.formData.taxRate}
                                onChange={(e) => settings.setFormField("taxRate", e.target.value)}
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex items-center gap-2 cursor-pointer h-10">
                                <input
                                    type="checkbox"
                                    checked={settings.formData.taxIncluded}
                                    onChange={(e) => settings.setFormField("taxIncluded", e.target.checked)}
                                    className="w-4 h-4 rounded border-zinc-300"
                                />
                                <span className="text-sm text-zinc-700">Prices include tax</span>
                            </label>
                        </div>
                    </div>
                </div>

                <Button type="submit" disabled={settings.isSaving}>
                    {settings.isSaving ? (
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
