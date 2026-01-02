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
    const [whatsappNumber, setWhatsappNumber] = useState('');
    const [locale, setLocale] = useState('nl');
    const [currency, setCurrency] = useState('EUR');
    const [timezone, setTimezone] = useState('Europe/Brussels');
    const [features, setFeatures] = useState({
        ecommerce: true,
        tickets: true,
        marketing: true,
    });

    // Company/Invoice Settings
    const [companyName, setCompanyName] = useState('');
    const [vatNumber, setVatNumber] = useState('');
    const [addressLine1, setAddressLine1] = useState('');
    const [addressPostalCode, setAddressPostalCode] = useState('');
    const [addressCity, setAddressCity] = useState('');
    const [bankAccount, setBankAccount] = useState('');
    const [bankName, setBankName] = useState('');
    const [invoicePrefix, setInvoicePrefix] = useState('INV');
    const [invoiceFooter, setInvoiceFooter] = useState('');
    const [website, setWebsite] = useState('');

    // Business Hours Settings
    const [openingHours, setOpeningHours] = useState<Record<string, { open: string; close: string } | null>>({
        monday: { open: '09:00', close: '18:00' },
        tuesday: { open: '09:00', close: '18:00' },
        wednesday: { open: '09:00', close: '18:00' },
        thursday: { open: '09:00', close: '18:00' },
        friday: { open: '09:00', close: '18:00' },
        saturday: { open: '10:00', close: '17:00' },
        sunday: null,
    });
    const [timeSlotsInput, setTimeSlotsInput] = useState('09:00, 10:00, 11:00, 14:00, 15:00, 16:00, 17:00');
    const [closedDays, setClosedDays] = useState<number[]>([0]); // 0 = Sunday

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
            setWhatsappNumber(config.whatsappNumber ?? '');
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
            // Company/Invoice Settings
            setCompanyName(config.companyName ?? '');
            setVatNumber(config.vatNumber ?? '');
            if (config.address) {
                setAddressLine1(config.address.line1 ?? '');
                setAddressPostalCode(config.address.postalCode ?? '');
                setAddressCity(config.address.city ?? '');
            }
            setBankAccount(config.bankAccount ?? '');
            setBankName(config.bankName ?? '');
            setInvoicePrefix(config.invoicePrefix ?? 'INV');
            setInvoiceFooter(config.invoiceFooter ?? '');
            setWebsite(config.website ?? '');
            // Business Hours Settings
            if (config.openingHours) {
                setOpeningHours(config.openingHours);
            }
            if (config.timeSlots) {
                setTimeSlotsInput(config.timeSlots.join(', '));
            }
            if (config.closedDays) {
                setClosedDays(config.closedDays);
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
                whatsappNumber: whatsappNumber || undefined,
                locale: locale || undefined,
                currency: currency || undefined,
                timezone: timezone || undefined,
                features,
                // Company/Invoice Settings
                companyName: companyName || undefined,
                vatNumber: vatNumber || undefined,
                address: (addressLine1 || addressPostalCode || addressCity) ? {
                    line1: addressLine1 || undefined,
                    postalCode: addressPostalCode || undefined,
                    city: addressCity || undefined,
                } : undefined,
                bankAccount: bankAccount || undefined,
                bankName: bankName || undefined,
                invoicePrefix: invoicePrefix || undefined,
                invoiceFooter: invoiceFooter || undefined,
                website: website || undefined,
                // Business Hours Settings
                openingHours: openingHours,
                timeSlots: timeSlotsInput.split(',').map(s => s.trim()).filter(Boolean),
                closedDays: closedDays,
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
                        <div>
                            <label htmlFor="whatsappNumber" className="block text-sm font-medium mb-2">
                                WhatsApp Number
                            </label>
                            <input
                                id="whatsappNumber"
                                type="tel"
                                value={whatsappNumber}
                                onChange={(e) => setWhatsappNumber(e.target.value)}
                                placeholder="+32 4XX XX XX XX"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Used for chat widget and ticket support links
                            </p>
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

                {/* Company Details */}
                <Card>
                    <CardHeader>
                        <CardTitle>Company Details</CardTitle>
                        <CardDescription>Legal business information for invoices</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium mb-2">
                                    Company Name
                                </label>
                                <input
                                    id="companyName"
                                    type="text"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="My Company BV"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label htmlFor="vatNumber" className="block text-sm font-medium mb-2">
                                    VAT Number
                                </label>
                                <input
                                    id="vatNumber"
                                    type="text"
                                    value={vatNumber}
                                    onChange={(e) => setVatNumber(e.target.value)}
                                    placeholder="BE0123456789"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="addressLine1" className="block text-sm font-medium mb-2">
                                Address
                            </label>
                            <input
                                id="addressLine1"
                                type="text"
                                value={addressLine1}
                                onChange={(e) => setAddressLine1(e.target.value)}
                                placeholder="Street address"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="addressPostalCode" className="block text-sm font-medium mb-2">
                                    Postal Code
                                </label>
                                <input
                                    id="addressPostalCode"
                                    type="text"
                                    value={addressPostalCode}
                                    onChange={(e) => setAddressPostalCode(e.target.value)}
                                    placeholder="1000"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label htmlFor="addressCity" className="block text-sm font-medium mb-2">
                                    City
                                </label>
                                <input
                                    id="addressCity"
                                    type="text"
                                    value={addressCity}
                                    onChange={(e) => setAddressCity(e.target.value)}
                                    placeholder="Brussels"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="website" className="block text-sm font-medium mb-2">
                                Website
                            </label>
                            <input
                                id="website"
                                type="url"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                placeholder="https://example.com"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Invoice Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle>Invoice Settings</CardTitle>
                        <CardDescription>Configure invoice generation preferences</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="invoicePrefix" className="block text-sm font-medium mb-2">
                                    Invoice Prefix
                                </label>
                                <input
                                    id="invoicePrefix"
                                    type="text"
                                    value={invoicePrefix}
                                    onChange={(e) => setInvoicePrefix(e.target.value)}
                                    placeholder="INV"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                            <div>
                                <label htmlFor="bankAccount" className="block text-sm font-medium mb-2">
                                    Bank Account (IBAN)
                                </label>
                                <input
                                    id="bankAccount"
                                    type="text"
                                    value={bankAccount}
                                    onChange={(e) => setBankAccount(e.target.value)}
                                    placeholder="BE00 0000 0000 0000"
                                    className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="bankName" className="block text-sm font-medium mb-2">
                                Bank Name
                            </label>
                            <input
                                id="bankName"
                                type="text"
                                value={bankName}
                                onChange={(e) => setBankName(e.target.value)}
                                placeholder="ING Bank"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                        <div>
                            <label htmlFor="invoiceFooter" className="block text-sm font-medium mb-2">
                                Invoice Footer Text
                            </label>
                            <textarea
                                id="invoiceFooter"
                                value={invoiceFooter}
                                onChange={(e) => setInvoiceFooter(e.target.value)}
                                placeholder="Thank you for your business! Payment is due within 30 days."
                                rows={3}
                                className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Business Hours */}
                <Card>
                    <CardHeader>
                        <CardTitle>Business Hours</CardTitle>
                        <CardDescription>Configure opening hours and appointment time slots</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Opening Hours per Day */}
                        <div>
                            <label className="block text-sm font-medium mb-3">Opening Hours</label>
                            <div className="space-y-2">
                                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                                    <div key={day} className="flex items-center gap-3">
                                        <div className="w-24 text-sm capitalize">{day}</div>
                                        <input
                                            type="checkbox"
                                            checked={openingHours[day] !== null}
                                            onChange={(e) => {
                                                setOpeningHours(prev => ({
                                                    ...prev,
                                                    [day]: e.target.checked ? { open: '09:00', close: '18:00' } : null
                                                }));
                                            }}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        {openingHours[day] && (
                                            <>
                                                <input
                                                    type="time"
                                                    value={openingHours[day]?.open || '09:00'}
                                                    onChange={(e) => {
                                                        setOpeningHours(prev => ({
                                                            ...prev,
                                                            [day]: { ...prev[day]!, open: e.target.value }
                                                        }));
                                                    }}
                                                    className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                                                />
                                                <span className="text-sm">to</span>
                                                <input
                                                    type="time"
                                                    value={openingHours[day]?.close || '18:00'}
                                                    onChange={(e) => {
                                                        setOpeningHours(prev => ({
                                                            ...prev,
                                                            [day]: { ...prev[day]!, close: e.target.value }
                                                        }));
                                                    }}
                                                    className="h-9 rounded-md border border-gray-300 bg-white px-2 text-sm dark:bg-gray-800 dark:border-gray-700"
                                                />
                                            </>
                                        )}
                                        {!openingHours[day] && (
                                            <span className="text-sm text-gray-500">Closed</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Time Slots */}
                        <div>
                            <label htmlFor="timeSlots" className="block text-sm font-medium mb-2">
                                Appointment Time Slots
                            </label>
                            <input
                                id="timeSlots"
                                type="text"
                                value={timeSlotsInput}
                                onChange={(e) => setTimeSlotsInput(e.target.value)}
                                placeholder="09:00, 10:00, 11:00, 14:00, 15:00, 16:00, 17:00"
                                className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent dark:bg-gray-800 dark:border-gray-700"
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                Comma-separated list of available appointment times (e.g., 09:00, 10:00, 14:00)
                            </p>
                        </div>

                        {/* Closed Days */}
                        <div>
                            <label className="block text-sm font-medium mb-2">Closed Days</label>
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { value: 0, label: 'Sun' },
                                    { value: 1, label: 'Mon' },
                                    { value: 2, label: 'Tue' },
                                    { value: 3, label: 'Wed' },
                                    { value: 4, label: 'Thu' },
                                    { value: 5, label: 'Fri' },
                                    { value: 6, label: 'Sat' },
                                ].map(({ value, label }) => (
                                    <label key={value} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={closedDays.includes(value)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setClosedDays(prev => [...prev, value].sort());
                                                } else {
                                                    setClosedDays(prev => prev.filter(d => d !== value));
                                                }
                                            }}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <span className="text-sm">{label}</span>
                                    </label>
                                ))}
                            </div>
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                Days when appointments cannot be booked
                            </p>
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
