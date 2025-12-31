"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Truck,
    Plus,
    Edit,
    Trash2,
    Globe,
    X,
    Check,
    RefreshCw,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

interface ShippingZone {
    id: string;
    name: string;
    countries: string[];
    rate: string;
    freeAbove: string | null;
    minDays: number;
    maxDays: number;
    carrier: string | null;
    isActive: boolean;
    sortOrder: number;
}

const COUNTRY_OPTIONS = [
    { code: "BE", name: "België" },
    { code: "NL", name: "Nederland" },
    { code: "DE", name: "Duitsland" },
    { code: "FR", name: "Frankrijk" },
    { code: "LU", name: "Luxemburg" },
    { code: "GB", name: "Verenigd Koninkrijk" },
    { code: "ES", name: "Spanje" },
    { code: "IT", name: "Italië" },
    { code: "PT", name: "Portugal" },
    { code: "AT", name: "Oostenrijk" },
    { code: "CH", name: "Zwitserland" },
    { code: "PL", name: "Polen" },
    { code: "SE", name: "Zweden" },
    { code: "DK", name: "Denemarken" },
    { code: "NO", name: "Noorwegen" },
    { code: "FI", name: "Finland" },
    { code: "IE", name: "Ierland" },
];

const CARRIERS = [
    { id: "bpost", name: "bpost" },
    { id: "postnl", name: "PostNL" },
    { id: "dhl", name: "DHL" },
    { id: "dpd", name: "DPD" },
    { id: "ups", name: "UPS" },
    { id: "fedex", name: "FedEx" },
];

export default function AdminShippingPage() {
    const [zones, setZones] = useState<ShippingZone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingZone, setEditingZone] = useState<ShippingZone | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        countries: [] as string[],
        rate: "",
        freeAbove: "",
        minDays: "2",
        maxDays: "5",
        carrier: "",
        isActive: true,
    });

    const fetchZones = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/shipping/zones`);
            if (res.ok) {
                setZones(await res.json());
            }
        } catch (error) {
            console.error("Failed to fetch shipping zones:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchZones();
    }, []);

    const openCreateModal = () => {
        setEditingZone(null);
        setFormData({
            name: "",
            countries: [],
            rate: "",
            freeAbove: "",
            minDays: "2",
            maxDays: "5",
            carrier: "",
            isActive: true,
        });
        setShowModal(true);
    };

    const openEditModal = (zone: ShippingZone) => {
        setEditingZone(zone);
        setFormData({
            name: zone.name,
            countries: zone.countries,
            rate: zone.rate,
            freeAbove: zone.freeAbove || "",
            minDays: String(zone.minDays),
            maxDays: String(zone.maxDays),
            carrier: zone.carrier || "",
            isActive: zone.isActive,
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        const token = localStorage.getItem("adminAccessToken");

        try {
            const payload = {
                name: formData.name,
                countries: formData.countries,
                rate: parseFloat(formData.rate),
                freeAbove: formData.freeAbove ? parseFloat(formData.freeAbove) : null,
                minDays: parseInt(formData.minDays),
                maxDays: parseInt(formData.maxDays),
                carrier: formData.carrier || null,
                isActive: formData.isActive,
            };

            const url = editingZone
                ? `/api/shipping/zones/${editingZone.id}`
                : `/api/shipping/zones`;

            const res = await fetch(url, {
                method: editingZone ? "PUT" : "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            if (res.ok) {
                setShowModal(false);
                fetchZones();
            }
        } catch (error) {
            console.error("Failed to save zone:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze verzendzone wilt verwijderen?")) return;

        const token = localStorage.getItem("adminAccessToken");
        try {
            const res = await fetch(`/api/shipping/zones/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                fetchZones();
            }
        } catch (error) {
            console.error("Failed to delete zone:", error);
        }
    };

    const toggleCountry = (code: string) => {
        setFormData((prev) => ({
            ...prev,
            countries: prev.countries.includes(code)
                ? prev.countries.filter((c) => c !== code)
                : [...prev.countries, code],
        }));
    };

    const getCountryName = (code: string) => {
        return COUNTRY_OPTIONS.find((c) => c.code === code)?.name || code;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Verzending</h1>
                    <p className="text-zinc-500">Beheer verzendzones en tarieven</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={fetchZones} variant="outline" size="sm">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Vernieuwen
                    </Button>
                    <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Nieuwe Zone
                    </Button>
                </div>
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    <div className="col-span-full text-center py-12 text-zinc-500">
                        Laden...
                    </div>
                ) : zones.length === 0 ? (
                    <div className="col-span-full text-center py-12">
                        <Globe className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                        <p className="text-zinc-500 mb-4">Geen verzendzones geconfigureerd</p>
                        <Button onClick={openCreateModal}>
                            <Plus className="w-4 h-4 mr-2" />
                            Eerste Zone Toevoegen
                        </Button>
                    </div>
                ) : (
                    zones.map((zone) => (
                        <div
                            key={zone.id}
                            className={`bg-white rounded-xl border p-5 ${zone.isActive ? "border-zinc-200" : "border-zinc-100 opacity-60"
                                }`}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${zone.isActive ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-400"
                                        }`}>
                                        <Truck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-zinc-900">{zone.name}</h3>
                                        <p className="text-sm text-zinc-500">{zone.carrier || "Geen vervoerder"}</p>
                                    </div>
                                </div>
                                <div className={`px-2 py-0.5 rounded text-xs font-medium ${zone.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"
                                    }`}>
                                    {zone.isActive ? "Actief" : "Inactief"}
                                </div>
                            </div>

                            <div className="space-y-3 mb-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">Verzendkosten</span>
                                    <span className="font-semibold text-zinc-900">
                                        €{Number(zone.rate).toFixed(2)}
                                    </span>
                                </div>
                                {zone.freeAbove && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-zinc-500">Gratis vanaf</span>
                                        <span className="font-semibold text-green-600">
                                            €{Number(zone.freeAbove).toFixed(2)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-500">Levertijd</span>
                                    <span className="text-zinc-700">
                                        {zone.minDays}-{zone.maxDays} dagen
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1 mb-4">
                                {zone.countries.map((code) => (
                                    <span
                                        key={code}
                                        className="px-2 py-0.5 bg-zinc-100 rounded text-xs text-zinc-600"
                                    >
                                        {getCountryName(code)}
                                    </span>
                                ))}
                            </div>

                            <div className="flex gap-2 pt-3 border-t border-zinc-100">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                    onClick={() => openEditModal(zone)}
                                >
                                    <Edit className="w-3 h-3 mr-1" />
                                    Bewerken
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:bg-red-50"
                                    onClick={() => handleDelete(zone.id)}
                                >
                                    <Trash2 className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="p-4 border-b border-zinc-100 flex items-center justify-between sticky top-0 bg-white">
                            <h3 className="font-semibold text-lg">
                                {editingZone ? "Zone Bewerken" : "Nieuwe Verzendzone"}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-zinc-100 rounded">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Zonenaam *
                                </label>
                                <Input
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="bijv. België, Benelux, EU Zone 1"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Landen *
                                </label>
                                <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-zinc-200 rounded-lg p-3">
                                    {COUNTRY_OPTIONS.map((country) => (
                                        <button
                                            key={country.code}
                                            type="button"
                                            onClick={() => toggleCountry(country.code)}
                                            className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${formData.countries.includes(country.code)
                                                ? "bg-blue-100 text-blue-700 border border-blue-300"
                                                : "bg-zinc-50 text-zinc-600 hover:bg-zinc-100"
                                                }`}
                                        >
                                            {formData.countries.includes(country.code) && (
                                                <Check className="w-3 h-3" />
                                            )}
                                            {country.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Verzendkosten (€) *
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.rate}
                                        onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                                        placeholder="4.95"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Gratis vanaf (€)
                                    </label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formData.freeAbove}
                                        onChange={(e) => setFormData({ ...formData, freeAbove: e.target.value })}
                                        placeholder="50.00"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Min. dagen
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.minDays}
                                        onChange={(e) => setFormData({ ...formData, minDays: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">
                                        Max. dagen
                                    </label>
                                    <Input
                                        type="number"
                                        min="1"
                                        value={formData.maxDays}
                                        onChange={(e) => setFormData({ ...formData, maxDays: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Vervoerder
                                </label>
                                <select
                                    value={formData.carrier}
                                    onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                                    className="w-full border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                                >
                                    <option value="">Selecteer vervoerder</option>
                                    {CARRIERS.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4 rounded border-zinc-300"
                                />
                                <label htmlFor="isActive" className="text-sm text-zinc-700">
                                    Zone actief
                                </label>
                            </div>
                        </div>
                        <div className="p-4 border-t border-zinc-100 flex justify-end gap-2 sticky bottom-0 bg-white">
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                Annuleren
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={!formData.name || formData.countries.length === 0 || !formData.rate || isSaving}
                            >
                                {isSaving ? "Opslaan..." : editingZone ? "Bijwerken" : "Aanmaken"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
