'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ownerApi } from '@/lib/owner-api';
import { UpdateConfigDto } from '@/types';
import { useTenant } from '../tenant-context';

export default function ConfigPage() {
    const { tenant, reloadTenant } = useTenant();

    // Derived from context
    const tenantId = tenant?.id || '';

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Form state - always initialize with strings to avoid controlled/uncontrolled issues
    const [shopName, setShopName] = useState('');
    const [primaryColor, setPrimaryColor] = useState('#7c3aed');
    const [secondaryColor, setSecondaryColor] = useState('');
    const [accentColor, setAccentColor] = useState('');
    const [borderRadius, setBorderRadius] = useState('0.625rem');
    const [darkMode, setDarkMode] = useState(false);
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [locale, setLocale] = useState('nl');
    const [currency, setCurrency] = useState('EUR');
    const [timezone, setTimezone] = useState('Europe/Brussels');
    const [features, setFeatures] = useState({
        ecommerce: true,
        tickets: true,
        marketing: true,
    });

    useEffect(() => {
        if (tenant?.config) {
            // Populate form with existing config
            const config = tenant.config;
            setShopName(config.shopName ?? '');
            setPrimaryColor(config.primaryColor ?? '#7c3aed');
            setSecondaryColor(config.secondaryColor ?? '');
            setAccentColor(config.accentColor ?? '');
            setBorderRadius(config.borderRadius ?? '0.625rem');
            setDarkMode(config.darkMode ?? false);
            setEmail(config.email ?? '');
            setPhone(config.phone ?? '');
            setLocale(config.locale ?? 'nl');
            setCurrency(config.currency ?? 'EUR');
            setTimezone(config.timezone ?? 'Europe/Brussels');
            if (config.features && typeof config.features === 'object') {
                setFeatures({
                    ecommerce: config.features.ecommerce ?? true,
                    tickets: config.features.tickets ?? true,
                    marketing: config.features.marketing ?? true,
                });
            }
        }
    }, [tenant]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        setSuccessMessage('');

        try {
            const updateData: UpdateConfigDto = {
                shopName: shopName || undefined,
                primaryColor: primaryColor || undefined,
                secondaryColor: secondaryColor || undefined,
                accentColor: accentColor || undefined,
                borderRadius: borderRadius || undefined,
                darkMode,
                email: email || undefined,
                phone: phone || undefined,
                locale: locale || undefined,
                currency: currency || undefined,
                timezone: timezone || undefined,
                features,
            };

            await ownerApi.updateConfig(tenantId, updateData);
            setSuccessMessage('Configuration saved successfully!');
            await reloadTenant();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save configuration');
        } finally {
            setSaving(false);
        }
    };

    if (!tenant) return null;

    return (
        <div className="space-y-6">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Configuration</h2>
                <p className="text-gray-600 dark:text-gray-400">
                    Configure tenant branding, contact info, and localization
                </p>
            </div>

            {/* Messages */}
            {successMessage && (
                <div className="mb-6 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 p-4 rounded-lg">
                    {successMessage}
                </div>
            )}
            {error && (
                <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Configuration Form */}
            <form onSubmit={handleSave} className="space-y-6">
                {/* Branding */}
                <Card>
                    <CardHeader>
                        <CardTitle>Branding</CardTitle>
                        <CardDescription>Customize the tenant&apos;s brand appearance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="shopName" className="block text-sm font-medium mb-2">
                                Shop Name
                            </label>
                            <input
                                id="shopName"
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                placeholder="My Business"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <div>
                            <label htmlFor="primaryColor" className="block text-sm font-medium mb-2">
                                Primary Color
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="primaryColor"
                                    type="color"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300"
                                />
                                <input
                                    type="text"
                                    value={primaryColor}
                                    onChange={(e) => setPrimaryColor(e.target.value)}
                                    placeholder="#7c3aed"
                                    className="flex h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="secondaryColor" className="block text-sm font-medium mb-2">
                                Secondary Color
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="secondaryColor"
                                    type="color"
                                    value={secondaryColor || '#f3f4f6'}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300"
                                />
                                <input
                                    type="text"
                                    value={secondaryColor}
                                    onChange={(e) => setSecondaryColor(e.target.value)}
                                    placeholder="#f3f4f6 (optional)"
                                    className="flex h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="accentColor" className="block text-sm font-medium mb-2">
                                Accent Color
                            </label>
                            <div className="flex gap-3 items-center">
                                <input
                                    id="accentColor"
                                    type="color"
                                    value={accentColor || '#10b981'}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    className="h-10 w-20 rounded border border-gray-300"
                                />
                                <input
                                    type="text"
                                    value={accentColor}
                                    onChange={(e) => setAccentColor(e.target.value)}
                                    placeholder="#10b981 (optional)"
                                    className="flex h-10 flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="borderRadius" className="block text-sm font-medium mb-2">
                                    Border Radius
                                </label>
                                <select
                                    id="borderRadius"
                                    value={borderRadius}
                                    onChange={(e) => setBorderRadius(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                >
                                    <option value="0">None (0)</option>
                                    <option value="0.25rem">Small (0.25rem)</option>
                                    <option value="0.5rem">Medium (0.5rem)</option>
                                    <option value="0.625rem">Default (0.625rem)</option>
                                    <option value="1rem">Large (1rem)</option>
                                    <option value="1.5rem">Extra Large (1.5rem)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Dark Mode
                                </label>
                                <div className="flex items-center h-10">
                                    <input
                                        id="darkMode"
                                        type="checkbox"
                                        checked={darkMode}
                                        onChange={(e) => setDarkMode(e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="darkMode" className="ml-2 text-sm">
                                        Enable dark mode by default
                                    </label>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>Contact Information</CardTitle>
                        <CardDescription>Configure contact details</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="contact@example.com"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="block text-sm font-medium mb-2">
                                Phone
                            </label>
                            <input
                                id="phone"
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+32 XXX XX XX XX"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Localization */}
                <Card>
                    <CardHeader>
                        <CardTitle>Localization</CardTitle>
                        <CardDescription>Configure regional settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label htmlFor="locale" className="block text-sm font-medium mb-2">
                                Locale
                            </label>
                            <select
                                id="locale"
                                value={locale}
                                onChange={(e) => setLocale(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="en">English</option>
                                <option value="nl">Nederlands</option>
                                <option value="fr">Français</option>
                                <option value="de">Deutsch</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="currency" className="block text-sm font-medium mb-2">
                                Currency
                            </label>
                            <select
                                id="currency"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="USD">USD - US Dollar</option>
                                <option value="EUR">EUR - Euro</option>
                                <option value="GBP">GBP - British Pound</option>
                                <option value="JPY">JPY - Japanese Yen</option>
                            </select>
                        </div>
                        <div>
                            <label htmlFor="timezone" className="block text-sm font-medium mb-2">
                                Timezone
                            </label>
                            <select
                                id="timezone"
                                value={timezone}
                                onChange={(e) => setTimezone(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">America/New York</option>
                                <option value="Europe/Brussels">Europe/Brussels</option>
                                <option value="Europe/London">Europe/London</option>
                                <option value="Asia/Tokyo">Asia/Tokyo</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Features */}
                <Card>
                    <CardHeader>
                        <CardTitle>Features</CardTitle>
                        <CardDescription>Enable or disable features for this tenant</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">E-commerce</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enable product catalog and online sales
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={features.ecommerce}
                                onChange={(e) => setFeatures({ ...features, ecommerce: e.target.checked })}
                                className="h-5 w-5 rounded border-gray-300"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Support Tickets</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enable customer support ticket system
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={features.tickets}
                                onChange={(e) => setFeatures({ ...features, tickets: e.target.checked })}
                                className="h-5 w-5 rounded border-gray-300"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium">Marketing</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Enable marketing tools and campaigns
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                checked={features.marketing}
                                onChange={(e) => setFeatures({ ...features, marketing: e.target.checked })}
                                className="h-5 w-5 rounded border-gray-300"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button type="submit" disabled={saving} size="lg">
                        {saving ? 'Saving...' : 'Save Configuration'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
