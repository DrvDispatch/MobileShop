"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Megaphone,
    Eye,
    EyeOff,
    Edit,
    Trash2,
    Loader2,
    X,
    Link as LinkIcon,
    Calendar,
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Banner {
    id: string;
    title: string;
    message: string;
    linkUrl: string | null;
    linkText: string | null;
    bgColor: string;
    textColor: string;
    position: "TICKER" | "HEADER" | "POPUP" | "FOOTER";
    priority: number;
    startsAt: string | null;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
}

const POSITION_LABELS: Record<string, string> = {
    TICKER: "Ticker (bovenaan)",
    HEADER: "Header banner",
    POPUP: "Popup",
    FOOTER: "Footer banner",
};

const getAdminHeaders = () => {
    const token = localStorage.getItem("adminAccessToken");
    return {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
};

export default function AdminBannersPage() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        message: "",
        linkUrl: "",
        linkText: "",
        bgColor: "#7c3aed",
        textColor: "#ffffff",
        position: "TICKER" as Banner["position"],
        priority: 0,
        startsAt: "",
        expiresAt: "",
        isActive: true,
    });

    const fetchBanners = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/banners`, {
                headers: getAdminHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setBanners(data);
            }
        } catch (err) {
            console.error("Failed to fetch banners:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchBanners();
    }, []);

    const resetForm = () => {
        setFormData({
            title: "",
            message: "",
            linkUrl: "",
            linkText: "",
            bgColor: "#7c3aed",
            textColor: "#ffffff",
            position: "TICKER",
            priority: 0,
            startsAt: "",
            expiresAt: "",
            isActive: true,
        });
        setEditingId(null);
    };

    const openCreateModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (banner: Banner) => {
        setFormData({
            title: banner.title,
            message: banner.message,
            linkUrl: banner.linkUrl || "",
            linkText: banner.linkText || "",
            bgColor: banner.bgColor,
            textColor: banner.textColor,
            position: banner.position,
            priority: banner.priority,
            startsAt: banner.startsAt ? banner.startsAt.slice(0, 16) : "",
            expiresAt: banner.expiresAt ? banner.expiresAt.slice(0, 16) : "",
            isActive: banner.isActive,
        });
        setEditingId(banner.id);
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.title.trim() || !formData.message.trim()) {
            alert("Vul titel en bericht in");
            return;
        }

        setIsSaving(true);
        try {
            const body = {
                title: formData.title,
                message: formData.message,
                linkUrl: formData.linkUrl || null,
                linkText: formData.linkText || null,
                bgColor: formData.bgColor,
                textColor: formData.textColor,
                position: formData.position,
                priority: formData.priority,
                startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
                expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
                isActive: formData.isActive,
            };

            const url = editingId
                ? `${API_URL}/api/banners/${editingId}`
                : `${API_URL}/api/banners`;
            const method = editingId ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: getAdminHeaders(),
                body: JSON.stringify(body),
            });

            if (res.ok) {
                setShowModal(false);
                resetForm();
                fetchBanners();
            } else {
                const error = await res.json().catch(() => ({}));
                alert(error.message || "Opslaan mislukt");
            }
        } catch (err) {
            console.error("Failed to save banner:", err);
            alert("Opslaan mislukt");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Weet je zeker dat je deze banner wilt verwijderen?")) return;

        try {
            const res = await fetch(`${API_URL}/api/banners/${id}`, {
                method: "DELETE",
                headers: getAdminHeaders(),
            });

            if (res.ok) {
                fetchBanners();
            }
        } catch (err) {
            console.error("Failed to delete banner:", err);
        }
    };

    const handleToggleActive = async (banner: Banner) => {
        try {
            const res = await fetch(`${API_URL}/api/banners/${banner.id}`, {
                method: "PATCH",
                headers: getAdminHeaders(),
                body: JSON.stringify({ isActive: !banner.isActive }),
            });

            if (res.ok) {
                fetchBanners();
            }
        } catch (err) {
            console.error("Failed to toggle banner:", err);
        }
    };

    const isExpired = (banner: Banner) => {
        if (!banner.expiresAt) return false;
        return new Date(banner.expiresAt) < new Date();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Promotional Banners</h1>
                    <p className="text-zinc-500">Beheer promotionele banners en aankondigingen</p>
                </div>
                <Button onClick={openCreateModal}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuwe Banner
                </Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
                </div>
            ) : banners.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                    <Megaphone className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">Nog geen banners</p>
                    <Button onClick={openCreateModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Eerste banner aanmaken
                    </Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {banners.map((banner) => (
                        <div
                            key={banner.id}
                            className={`bg-white rounded-xl border overflow-hidden ${!banner.isActive || isExpired(banner)
                                    ? "border-zinc-200 opacity-60"
                                    : "border-zinc-200"
                                }`}
                        >
                            {/* Preview */}
                            <div
                                className="px-4 py-3 text-center"
                                style={{ backgroundColor: banner.bgColor, color: banner.textColor }}
                            >
                                <span className="font-medium">{banner.message}</span>
                                {banner.linkText && (
                                    <span className="ml-2 underline">{banner.linkText}</span>
                                )}
                            </div>

                            <div className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-3">
                                        <h3 className="font-semibold text-zinc-900">{banner.title}</h3>
                                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded">
                                            {POSITION_LABELS[banner.position]}
                                        </span>
                                        {banner.isActive && !isExpired(banner) ? (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1">
                                                <Eye className="w-3 h-3" /> Live
                                            </span>
                                        ) : isExpired(banner) ? (
                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                                                Verlopen
                                            </span>
                                        ) : (
                                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full flex items-center gap-1">
                                                <EyeOff className="w-3 h-3" /> Verborgen
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                                        {banner.linkUrl && (
                                            <div className="flex items-center gap-1">
                                                <LinkIcon className="w-3 h-3" />
                                                {banner.linkUrl.slice(0, 40)}...
                                            </div>
                                        )}
                                        {banner.expiresAt && (
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                Tot: {new Date(banner.expiresAt).toLocaleDateString("nl-NL")}
                                            </div>
                                        )}
                                        <div>Prioriteit: {banner.priority}</div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleToggleActive(banner)}
                                    >
                                        {banner.isActive ? "Verbergen" : "Tonen"}
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => openEditModal(banner)}
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleDelete(banner.id)}
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
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                            <h2 className="text-lg font-semibold text-zinc-900">
                                {editingId ? "Banner Bewerken" : "Nieuwe Banner"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-zinc-400 hover:text-zinc-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Live Preview */}
                        <div
                            className="px-4 py-3 text-center border-b"
                            style={{ backgroundColor: formData.bgColor, color: formData.textColor }}
                        >
                            <span className="font-medium">{formData.message || "Je bericht hier..."}</span>
                            {formData.linkText && (
                                <span className="ml-2 underline">{formData.linkText}</span>
                            )}
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Titel (intern) *</Label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="bijv. Kerst Actie"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Bericht *</Label>
                                <Input
                                    value={formData.message}
                                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                    placeholder="🎄 Kerst korting! 20% op alles!"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Link URL</Label>
                                    <Input
                                        value={formData.linkUrl}
                                        onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                                        placeholder="https://..."
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Link Tekst</Label>
                                    <Input
                                        value={formData.linkText}
                                        onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                                        placeholder="Shop nu →"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Achtergrond</Label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formData.bgColor}
                                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                                            className="w-10 h-10 rounded border cursor-pointer"
                                        />
                                        <Input
                                            value={formData.bgColor}
                                            onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Tekstkleur</Label>
                                    <div className="flex gap-2">
                                        <input
                                            type="color"
                                            value={formData.textColor}
                                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                                            className="w-10 h-10 rounded border cursor-pointer"
                                        />
                                        <Input
                                            value={formData.textColor}
                                            onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Positie</Label>
                                    <select
                                        value={formData.position}
                                        onChange={(e) => setFormData({ ...formData, position: e.target.value as any })}
                                        className="w-full h-10 px-3 rounded-lg border border-zinc-200"
                                    >
                                        <option value="TICKER">Ticker</option>
                                        <option value="HEADER">Header</option>
                                        <option value="POPUP">Popup</option>
                                        <option value="FOOTER">Footer</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Prioriteit</Label>
                                    <Input
                                        type="number"
                                        value={formData.priority}
                                        onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Start</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.startsAt}
                                        onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Einde</Label>
                                    <Input
                                        type="datetime-local"
                                        value={formData.expiresAt}
                                        onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="w-4 h-4 rounded border-zinc-300"
                                    />
                                    <span className="text-sm">Direct tonen</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-4 border-t border-zinc-200 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowModal(false)}>
                                Annuleren
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSaving}>
                                {isSaving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Opslaan...
                                    </>
                                ) : (
                                    "Opslaan"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
