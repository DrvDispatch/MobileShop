/**
 * Settings Tab Component
 * Invoice settings configuration
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Save,
    Loader2,
    Building2,
    MapPin,
    Phone,
    CreditCard,
    FileText,
} from "lucide-react";
import { useInvoiceSettings } from "@/lib/admin/invoice";

export function SettingsTab() {
    const { settings, updateField, updateAddressField, loading, saving, message, saveSettings } = useInvoiceSettings();

    if (loading) {
        return <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>;
    }

    return (
        <div className="space-y-6">
            {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                    {message.text}
                </div>
            )}

            <div className="flex justify-end">
                <Button onClick={saveSettings} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Opslaan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Info */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Bedrijfsgegevens</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Bedrijfsnaam</label>
                            <Input value={settings.companyName} onChange={(e) => updateField('companyName', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">BTW Nummer</label>
                            <Input value={settings.vatNumber} onChange={(e) => updateField('vatNumber', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Factuur Prefix</label>
                            <Input value={settings.invoicePrefix} onChange={(e) => updateField('invoicePrefix', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Address */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Adres</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Adresregel 1</label>
                            <Input value={settings.companyAddress.line1} onChange={(e) => updateAddressField('line1', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Postcode</label>
                                <Input value={settings.companyAddress.postalCode} onChange={(e) => updateAddressField('postalCode', e.target.value)} />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700 mb-1 block">Stad</label>
                                <Input value={settings.companyAddress.city} onChange={(e) => updateAddressField('city', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contact */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Phone className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Contactgegevens</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Telefoon</label>
                            <Input value={settings.phone} onChange={(e) => updateField('phone', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Email</label>
                            <Input value={settings.email} onChange={(e) => updateField('email', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Website</label>
                            <Input value={settings.website || ""} onChange={(e) => updateField('website', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Bank */}
                <div className="bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <CreditCard className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Bankgegevens</h2>
                    </div>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">IBAN</label>
                            <Input value={settings.bankAccount || ""} onChange={(e) => updateField('bankAccount', e.target.value)} />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-zinc-700 mb-1 block">Banknaam</label>
                            <Input value={settings.bankName || ""} onChange={(e) => updateField('bankName', e.target.value)} />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-zinc-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold">Factuur Voettekst</h2>
                    </div>
                    <textarea value={settings.invoiceFooter} onChange={(e) => updateField('invoiceFooter', e.target.value)} rows={3} className="w-full px-4 py-2 border border-zinc-200 rounded-lg" placeholder="Bedankt voor uw aankoop!..." />
                </div>
            </div>
        </div>
    );
}
