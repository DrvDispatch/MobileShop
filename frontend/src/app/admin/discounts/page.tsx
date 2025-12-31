"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Percent,
    DollarSign,
    Calendar,
    Users,
    CheckCircle,
    XCircle,
    Edit,
    Trash2,
    Loader2,
    Copy,
    X,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

interface DiscountCode {
    id: string;
    code: string;
    description: string | null;
    type: "PERCENTAGE" | "FIXED";
    value: number;
    minOrderAmount: number | null;
    maxDiscount: number | null;
    usageLimit: number | null;
    usageCount: number;
    perUserLimit: number | null;
    startsAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    appliesToAll: boolean;
    productIds: string[];
    categoryIds: string[];
    createdAt: string;
    _count?: { orders: number };
}

const getAdminHeaders = () => {
    const token = localStorage.getItem("adminAccessToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export default function AdminDiscountsPage() {
    const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        code: "",
        description: "",
        type: "PERCENTAGE" as "PERCENTAGE" | "FIXED",
        value: 10,
        minOrderAmount: "",
        maxDiscount: "",
        usageLimit: "",
        perUserLimit: "",
        startsAt: "",
        expiresAt: "",
        isActive: true,
        appliesToAll: true,
    });

    const fetchDiscounts = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/discounts`, {
                headers: getAdminHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setDiscounts(data);
            }
        } catch (err) {
            console.error("Failed to fetch discounts:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscounts();
    }, []);

    const resetForm = () => {
        setFormData({
            code: "",
            description: "",
            type: "PERCENTAGE",
            value: 10,
            minOrderAmount: "",
            maxDiscount: "",
            usageLimit: "",
            perUserLimit: "",
            startsAt: "",
            expiresAt: "",
            isActive: true,
            appliesToAll: true,
        });
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (discount: DiscountCode) => {
        setFormData({
            code: discount.code,
            description: discount.description || "",
            type: discount.type,
            value: Number(discount.value),
            minOrderAmount: discount.minOrderAmount ? String(discount.minOrderAmount) : "",
            maxDiscount: discount.maxDiscount ? String(discount.maxDiscount) : "",
            usageLimit: discount.usageLimit ? String(discount.usageLimit) : "",
            perUserLimit: discount.perUserLimit ? String(discount.perUserLimit) : "",
            startsAt: discount.startsAt ? discount.startsAt.slice(0, 16) : "",
            expiresAt: discount.expiresAt ? discount.expiresAt.slice(0, 16) : "",
            isActive: discount.isActive,
            appliesToAll: discount.appliesToAll,
        });
        setEditingId(discount.id);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.code.trim()) {
            alert("Voer een kortingscode in");
            return;
        }

        setIsSaving(true);
        try {
            const body = {
                code: formData.code.toUpperCase(),
                description: formData.description || null,
                type: formData.type,
                value: formData.value,
                minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : null,
                maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : null,
                usageLimit: formData.usageLimit ? parseInt(formData.usageLimit) : null,
                perUserLimit: formData.perUserLimit ? parseInt(formData.perUserLimit) : null,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
                isActive: formData.isActive,
                appliesToAll: formData.appliesToAll,
            };

            const url = editingId
                ? `/api/discounts/${editingId}`
                : `/api/discounts`;
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: getAdminHeaders(),
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchDiscounts();
            } else {
                const error = await res.json().catch(() => ({}));
                alert(error.message || "Opslaan mislukt");
            }
        } catch (err) {
            console.error("Failed to save discount:", err);
            alert("Opslaan mislukt");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze kortingscode wilt verwijderen?")) return;

        try {
            const res = await fetch(`/api/discounts/${id}`, {
                method: "DELETE",
                headers: getAdminHeaders(),
            });

            if (res.ok) {
                fetchDiscounts();
            }
        } catch (err) {
            console.error("Failed to delete discount:", err);
        }
    };

    const handleToggleActive = async (discount: DiscountCode) => {
        try {
            const res = await fetch(`/api/discounts/${discount.id}`, {
                method: "PATCH",
                headers: getAdminHeaders(),
                body: JSON.stringify({ isActive: !discount.isActive }),
            });

            if (res.ok) {
                fetchDiscounts();
            }
        } catch (err) {
            console.error("Failed to toggle discount:", err);
        }
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
    };

    const isExpired = (discount: DiscountCode) => {
        if (!discount.expiresAt) return false;
        return new Date(discount.expiresAt) < new Date();
    };

    const isComingSoon = (discount: DiscountCode) => {
        if (!discount.startsAt) return false;
        return new Date(discount.startsAt) > new Date();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Kortingscodes</h1>
                    <p className="text-zinc-500">Beheer kortingscodes en promoties</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Code
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
            ) : discounts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                    <Percent className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">Nog geen kortingscodes</p>
                    <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Eerste code aanmaken
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {discounts.map((discount) => (
                        <div
                            key={discount.id}
                            className={`bg-white rounded-xl border p-6 ${!discount.isActive || isExpired(discount)
                                ? "border-zinc-200 opacity-60"
                                : "border-purple-200"
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3">
                                        <code className="text-lg font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded">
                                            {discount.code}
                                        </code>
                                        <button
                                            onClick={() => copyCode(discount.code)}
                                            className="text-zinc-400 hover:text-zinc-600"
                                            title="Kopieer code"
                                        >
                                            <Copy className="w-4 h-4" />
                                        </button>
                                        {discount.isActive && !isExpired(discount) ? (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Actief
                                            </span>
                                        ) : isExpired(discount) ? (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                                Verlopen
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Inactief
                                            </span>
                                        )}
                                        {isComingSoon(discount) && (
                                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                                                Gepland
                                            </span>
                                        )}
                                    </div>

                                    {discount.description && (
                                        <p className="text-zinc-600 mt-2">{discount.description}</p>
                                    )}

                                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                                        <div className="flex items-center gap-1 text-zinc-600">
                                            {discount.type === "PERCENTAGE" ? (
                                                <Percent className="w-4 h-4" />
                                            ) : (
                                                <DollarSign className="w-4 h-4" />
                                            )}
                                            {discount.type === "PERCENTAGE"
                                                ? `${Number(discount.value)}% korting`
                                                : `€${Number(discount.value).toFixed(2)} korting`}
                                        </div>

                                        <div className="flex items-center gap-1 text-zinc-600">
                                            <Users className="w-4 h-4" />
                                            {discount.usageCount}
                                            {discount.usageLimit ? `/${discount.usageLimit}` : ""} gebruikt
                                        </div>

                                        {discount.minOrderAmount && (
                                            <div className="text-zinc-500">
                                                Min. €{Number(discount.minOrderAmount).toFixed(2)}
                                            </div>
                                        )}

                                        {discount.expiresAt && (
                                            <div className="flex items-center gap-1 text-zinc-500">
                                                <Calendar className="w-4 h-4" />
                                                Verloopt: {new Date(discount.expiresAt).toLocaleDateString("nl-NL")}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(discount)}
                                    >
                                        {discount.isActive ? "Deactiveren" : "Activeren"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => openEditModal(discount)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(discount.id)}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-900">
                                    {editingId ? "Kortingscode Bewerken" : "Nieuwe Kortingscode"}
                                </h2>
                                <p className="text-sm text-zinc-500">
                                    {editingId ? "Wijzig de instellingen van deze korting" : "Maak een nieuwe kortingscode aan"}
                                </p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600 p-2 hover:bg-zinc-100 rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Live Preview */}
                        {formData.code && (
                            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <code className="text-lg font-bold text-purple-600 bg-white px-3 py-1 rounded">
                                            {formData.code || "CODE"}
                                        </code>
                                        <span className="text-purple-700 font-semibold">
                                            {formData.type === "PERCENTAGE"
                                                ? `${formData.value}% korting`
                                                : `€${formData.value.toFixed(2)} korting`}
                                        </span>
                                    </div>
                                    {formData.isActive ? (
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">Actief</span>
                                    ) : (
                                        <span className="px-2 py-1 bg-zinc-100 text-zinc-600 text-xs rounded-full">Inactief</span>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="p-6 space-y-6">
                            {/* Basic Info Section */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                    <Percent className="w-4 h-4" />
                                    <span>Basisinformatie</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Kortingscode *</Label>
                                        <Input
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                            placeholder="bijv. ZOMER20"
                                            className="uppercase font-mono text-lg"
                                        />
                                        <p className="text-xs text-zinc-400">Klanten voeren deze code in bij afrekenen</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Beschrijving</Label>
                                        <Input
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            placeholder="bijv. Zomer sale actie"
                                        />
                                        <p className="text-xs text-zinc-400">Alleen zichtbaar voor admins</p>
                                    </div>
                                </div>
                            </div>

                            {/* Discount Value Section */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                    <DollarSign className="w-4 h-4" />
                                    <span>Kortingswaarde</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Type korting</Label>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: "PERCENTAGE" })}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${formData.type === "PERCENTAGE"
                                                    ? "border-purple-500 bg-purple-50 text-purple-700"
                                                    : "border-zinc-200 hover:border-zinc-300"
                                                    }`}
                                            >
                                                <Percent className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-sm font-medium">Percentage</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData({ ...formData, type: "FIXED" })}
                                                className={`p-3 rounded-lg border-2 text-center transition-all ${formData.type === "FIXED"
                                                    ? "border-purple-500 bg-purple-50 text-purple-700"
                                                    : "border-zinc-200 hover:border-zinc-300"
                                                    }`}
                                            >
                                                <DollarSign className="w-5 h-5 mx-auto mb-1" />
                                                <span className="text-sm font-medium">Vast bedrag</span>
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">
                                            {formData.type === "PERCENTAGE" ? "Percentage (%)" : "Bedrag (€)"}
                                        </Label>
                                        <div className="relative">
                                            <Input
                                                type="number"
                                                min="0"
                                                max={formData.type === "PERCENTAGE" ? 100 : undefined}
                                                step={formData.type === "PERCENTAGE" ? 1 : 0.01}
                                                value={formData.value}
                                                onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                                                className="text-lg font-semibold pr-10"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 font-medium">
                                                {formData.type === "PERCENTAGE" ? "%" : "€"}
                                            </span>
                                        </div>
                                        <p className="text-xs text-zinc-400">
                                            {formData.type === "PERCENTAGE"
                                                ? "0-100% van het orderbedrag"
                                                : "Vaste korting in euro's"}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Min. bestelbedrag</Label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">€</span>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.minOrderAmount}
                                                onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                                                placeholder="0.00"
                                                className="pl-7"
                                            />
                                        </div>
                                        <p className="text-xs text-zinc-400">Leeg = geen minimum</p>
                                    </div>
                                    {formData.type === "PERCENTAGE" && (
                                        <div className="space-y-2">
                                            <Label className="text-zinc-700">Max. korting</Label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">€</span>
                                                <Input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={formData.maxDiscount}
                                                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                                                    placeholder="0.00"
                                                    className="pl-7"
                                                />
                                            </div>
                                            <p className="text-xs text-zinc-400">Maximale korting bij %</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Usage Limits Section */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                    <Users className="w-4 h-4" />
                                    <span>Gebruikslimieten</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Totaal aantal keer</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.usageLimit}
                                            onChange={(e) => setFormData({ ...formData, usageLimit: e.target.value })}
                                            placeholder="Onbeperkt"
                                        />
                                        <p className="text-xs text-zinc-400">Hoe vaak in totaal te gebruiken</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Per klant</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={formData.perUserLimit}
                                            onChange={(e) => setFormData({ ...formData, perUserLimit: e.target.value })}
                                            placeholder="Onbeperkt"
                                        />
                                        <p className="text-xs text-zinc-400">Max. per klant e-mailadres</p>
                                    </div>
                                </div>
                            </div>

                            {/* Date Section with Presets */}
                            <div className="space-y-4 pt-4 border-t border-zinc-100">
                                <div className="flex items-center gap-2 text-zinc-700 font-medium">
                                    <Calendar className="w-4 h-4" />
                                    <span>Geldigheidsperiode</span>
                                </div>

                                {/* Quick Presets */}
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFormData({
                                                ...formData,
                                                startsAt: "",
                                                expiresAt: ""
                                            });
                                        }}
                                        className="px-3 py-1.5 text-sm rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
                                    >
                                        Altijd geldig
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            const end = new Date(now);
                                            end.setDate(end.getDate() + 1);
                                            end.setHours(23, 59, 0, 0);
                                            setFormData({
                                                ...formData,
                                                startsAt: now.toISOString().slice(0, 16),
                                                expiresAt: end.toISOString().slice(0, 16)
                                            });
                                        }}
                                        className="px-3 py-1.5 text-sm rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
                                    >
                                        Alleen vandaag
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            const end = new Date(now);
                                            end.setDate(end.getDate() + 7);
                                            end.setHours(23, 59, 0, 0);
                                            setFormData({
                                                ...formData,
                                                startsAt: now.toISOString().slice(0, 16),
                                                expiresAt: end.toISOString().slice(0, 16)
                                            });
                                        }}
                                        className="px-3 py-1.5 text-sm rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                    >
                                        7 dagen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            const end = new Date(now);
                                            end.setDate(end.getDate() + 30);
                                            end.setHours(23, 59, 0, 0);
                                            setFormData({
                                                ...formData,
                                                startsAt: now.toISOString().slice(0, 16),
                                                expiresAt: end.toISOString().slice(0, 16)
                                            });
                                        }}
                                        className="px-3 py-1.5 text-sm rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
                                    >
                                        30 dagen
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const now = new Date();
                                            const end = new Date(now.getFullYear(), 11, 31, 23, 59, 0);
                                            setFormData({
                                                ...formData,
                                                startsAt: now.toISOString().slice(0, 16),
                                                expiresAt: end.toISOString().slice(0, 16)
                                            });
                                        }}
                                        className="px-3 py-1.5 text-sm rounded-full border border-zinc-200 hover:bg-zinc-50 transition-colors"
                                    >
                                        Tot eind jaar
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Startdatum</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.startsAt}
                                            onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                            min={new Date().toISOString().slice(0, 16)}
                                        />
                                        <p className="text-xs text-zinc-400">Leeg = direct actief</p>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-700">Einddatum</Label>
                                        <Input
                                            type="datetime-local"
                                            value={formData.expiresAt}
                                            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                            min={formData.startsAt || new Date().toISOString().slice(0, 16)}
                                        />
                                        <p className="text-xs text-zinc-400">Leeg = nooit verlopen, moet na startdatum</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="pt-4 border-t border-zinc-100">
                            <label className="flex items-center gap-3 p-4 bg-zinc-50 rounded-lg cursor-pointer hover:bg-zinc-100 transition-colors">
                                <input
                                    type="checkbox"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-5 h-5 rounded border-zinc-300 text-purple-600 focus:ring-purple-500"
                                />
                                <div>
                                    <span className="font-medium text-zinc-900">Direct activeren</span>
                                    <p className="text-sm text-zinc-500">Code is direct bruikbaar door klanten</p>
                                </div>
                            </label>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-zinc-200 flex justify-end gap-3 bg-zinc-50">
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                Annuleren
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSaving} className="min-w-[120px]">
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Opslaan...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Opslaan
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
