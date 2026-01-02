"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, Plus, Edit, Trash2, Globe, X, Check, RefreshCw, Loader2 } from "lucide-react";
import { useShipping, COUNTRY_OPTIONS, CARRIERS } from "@/lib/admin/shipping";

export default function AdminShippingPage() {
    const {
        zones, isLoading, isSaving,
        showModal, editingZone, formData, setFormData,
        openCreateModal, openEditModal, closeModal,
        handleSave, handleDelete, toggleCountry,
        refresh, getCountryName,
    } = useShipping();

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-[400px]"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 flex items-center gap-2"><Truck className="w-6 h-6" />Verzending</h1>
                    <p className="text-zinc-500">Beheer verzendzones en tarieven</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={refresh}><RefreshCw className="w-4 h-4 mr-2" />Vernieuwen</Button>
                    <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />Nieuwe Zone</Button>
                </div>
            </div>

            {/* Zones Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {zones.map((zone) => (
                    <div key={zone.id} className={`bg-white rounded-xl border p-5 ${zone.isActive ? "border-zinc-200" : "border-zinc-100 opacity-60"}`}>
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="font-semibold text-zinc-900">{zone.name}</h3>
                                {zone.carrier && <p className="text-sm text-zinc-500">{zone.carrier}</p>}
                            </div>
                            <div className="flex gap-1">
                                <button onClick={() => openEditModal(zone)} className="p-1.5 hover:bg-zinc-100 rounded-lg"><Edit className="w-4 h-4 text-zinc-400" /></button>
                                <button onClick={() => handleDelete(zone.id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4 text-red-400" /></button>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex flex-wrap gap-1">
                                {zone.countries.slice(0, 4).map((c) => (
                                    <span key={c} className="px-2 py-1 bg-zinc-100 rounded text-xs font-medium">{getCountryName(c)}</span>
                                ))}
                                {zone.countries.length > 4 && <span className="px-2 py-1 bg-zinc-100 rounded text-xs">+{zone.countries.length - 4}</span>}
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-zinc-500">{zone.minDays}-{zone.maxDays} werkdagen</span>
                                <span className="font-semibold text-emerald-600">€{parseFloat(zone.rate).toFixed(2)}</span>
                            </div>
                            {zone.freeAbove && (
                                <p className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">Gratis vanaf €{parseFloat(zone.freeAbove).toFixed(2)}</p>
                            )}
                        </div>
                    </div>
                ))}
                {zones.length === 0 && (
                    <div className="col-span-full bg-zinc-50 rounded-xl p-8 text-center">
                        <Globe className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                        <p className="text-zinc-500">Geen verzendzones gevonden</p>
                        <Button onClick={openCreateModal} className="mt-4"><Plus className="w-4 h-4 mr-2" />Zone Toevoegen</Button>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">{editingZone ? "Zone Bewerken" : "Nieuwe Zone"}</h2>
                            <button onClick={closeModal} className="p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-zinc-700">Naam</label>
                                <Input value={formData.name} onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="bijv. België" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700">Landen</label>
                                <div className="flex flex-wrap gap-2 mt-2 p-3 border rounded-lg bg-zinc-50 max-h-40 overflow-y-auto">
                                    {COUNTRY_OPTIONS.map((c) => (
                                        <button key={c.code} onClick={() => toggleCountry(c.code)} type="button"
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${formData.countries.includes(c.code) ? "bg-emerald-100 text-emerald-700 border border-emerald-200" : "bg-white border border-zinc-200 hover:bg-zinc-100"}`}>
                                            {formData.countries.includes(c.code) && <Check className="w-3 h-3 inline mr-1" />}
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium text-zinc-700">Tarief (€)</label><Input type="number" step="0.01" value={formData.rate} onChange={(e) => setFormData(p => ({ ...p, rate: e.target.value }))} /></div>
                                <div><label className="text-sm font-medium text-zinc-700">Gratis Vanaf (€)</label><Input type="number" step="0.01" value={formData.freeAbove} onChange={(e) => setFormData(p => ({ ...p, freeAbove: e.target.value }))} placeholder="Optioneel" /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="text-sm font-medium text-zinc-700">Min Dagen</label><Input type="number" value={formData.minDays} onChange={(e) => setFormData(p => ({ ...p, minDays: e.target.value }))} /></div>
                                <div><label className="text-sm font-medium text-zinc-700">Max Dagen</label><Input type="number" value={formData.maxDays} onChange={(e) => setFormData(p => ({ ...p, maxDays: e.target.value }))} /></div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-zinc-700">Vervoerder</label>
                                <select value={formData.carrier} onChange={(e) => setFormData(p => ({ ...p, carrier: e.target.value }))} className="w-full mt-1 h-10 px-3 border rounded-lg">
                                    <option value="">Geen specifieke</option>
                                    {CARRIERS.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(p => ({ ...p, isActive: e.target.checked }))} className="w-4 h-4 rounded" />
                                <span className="text-sm">Actief</span>
                            </label>
                        </div>
                        <div className="p-6 border-t border-zinc-200 flex justify-end gap-3">
                            <Button variant="outline" onClick={closeModal}>Annuleren</Button>
                            <Button onClick={handleSave} disabled={isSaving || !formData.name || formData.countries.length === 0}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                                {editingZone ? "Opslaan" : "Aanmaken"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
