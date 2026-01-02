"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Plus, Megaphone, Eye, EyeOff, Edit, Trash2, Loader2, X,
    Link as LinkIcon, Calendar,
} from "lucide-react";
import { useBanners, POSITION_LABELS, Banner } from "@/lib/admin/banners";

export default function AdminBannersPage() {
    const {
        banners, isLoading, isSaving, showModal, editingId, formData,
        openCreateModal, openEditModal, closeModal, updateFormField,
        handleSubmit, handleDelete, handleToggleActive, isExpired,
    } = useBanners();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Promotional Banners</h1>
                    <p className="text-zinc-500">Beheer promotionele banners en aankondigingen</p>
                </div>
                <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />Nieuwe Banner</Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : banners.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                    <Megaphone className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">Nog geen banners</p>
                    <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />Eerste banner aanmaken</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {banners.map((banner) => (
                        <BannerCard key={banner.id} banner={banner} isExpired={isExpired(banner)}
                            onToggle={() => handleToggleActive(banner)} onEdit={() => openEditModal(banner)} onDelete={() => handleDelete(banner.id)} />
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                            <h2 className="text-lg font-semibold text-zinc-900">{editingId ? "Banner Bewerken" : "Nieuwe Banner"}</h2>
                            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
                        </div>
                        {/* Live Preview */}
                        <div className="px-4 py-3 text-center border-b" style={{ backgroundColor: formData.bgColor, color: formData.textColor }}>
                            <span className="font-medium">{formData.message || "Je bericht hier..."}</span>
                            {formData.linkText && <span className="ml-2 underline">{formData.linkText}</span>}
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-2">
                                <Label>Titel (intern) *</Label>
                                <Input value={formData.title} onChange={(e) => updateFormField("title", e.target.value)} placeholder="bijv. Kerst Actie" />
                            </div>
                            <div className="space-y-2">
                                <Label>Bericht *</Label>
                                <Input value={formData.message} onChange={(e) => updateFormField("message", e.target.value)} placeholder="🎄 Kerst korting! 20% op alles!" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Link URL</Label>
                                    <Input value={formData.linkUrl} onChange={(e) => updateFormField("linkUrl", e.target.value)} placeholder="https://..." />
                                </div>
                                <div className="space-y-2">
                                    <Label>Link Tekst</Label>
                                    <Input value={formData.linkText} onChange={(e) => updateFormField("linkText", e.target.value)} placeholder="Shop nu →" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Achtergrond</Label>
                                    <input type="color" value={formData.bgColor} onChange={(e) => updateFormField("bgColor", e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Tekst</Label>
                                    <input type="color" value={formData.textColor} onChange={(e) => updateFormField("textColor", e.target.value)} className="w-full h-10 rounded cursor-pointer" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Positie</Label>
                                    <select value={formData.position} onChange={(e) => updateFormField("position", e.target.value as Banner["position"])} className="w-full h-10 border border-zinc-200 rounded-lg px-3">
                                        {Object.entries(POSITION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Prioriteit</Label>
                                    <Input type="number" value={formData.priority} onChange={(e) => updateFormField("priority", parseInt(e.target.value) || 0)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Start datum</Label>
                                    <Input type="datetime-local" value={formData.startsAt} onChange={(e) => updateFormField("startsAt", e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Eind datum</Label>
                                    <Input type="datetime-local" value={formData.expiresAt} onChange={(e) => updateFormField("expiresAt", e.target.value)} />
                                </div>
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => updateFormField("isActive", e.target.checked)} className="w-4 h-4 rounded" />
                                <span className="text-sm text-zinc-700">Banner is actief</span>
                            </label>
                        </div>
                        <div className="flex gap-2 p-4 border-t border-zinc-200">
                            <Button variant="outline" onClick={closeModal} className="flex-1">Annuleren</Button>
                            <Button onClick={handleSubmit} disabled={isSaving} className="flex-1">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}{editingId ? "Opslaan" : "Aanmaken"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function BannerCard({ banner, isExpired, onToggle, onEdit, onDelete }: { banner: Banner; isExpired: boolean; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
    return (
        <div className={`bg-white rounded-xl border overflow-hidden ${!banner.isActive || isExpired ? "border-zinc-200 opacity-60" : "border-zinc-200"}`}>
            <div className="px-4 py-3 text-center" style={{ backgroundColor: banner.bgColor, color: banner.textColor }}>
                <span className="font-medium">{banner.message}</span>
                {banner.linkText && <span className="ml-2 underline">{banner.linkText}</span>}
            </div>
            <div className="p-4 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-zinc-900">{banner.title}</h3>
                        <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded">{POSITION_LABELS[banner.position]}</span>
                        {banner.isActive && !isExpired ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><Eye className="w-3 h-3" />Live</span>
                        ) : isExpired ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Verlopen</span>
                        ) : (
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full flex items-center gap-1"><EyeOff className="w-3 h-3" />Verborgen</span>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-zinc-500">
                        {banner.linkUrl && <div className="flex items-center gap-1"><LinkIcon className="w-3 h-3" />{banner.linkUrl.slice(0, 40)}...</div>}
                        {banner.expiresAt && <div className="flex items-center gap-1"><Calendar className="w-3 h-3" />Tot: {new Date(banner.expiresAt).toLocaleDateString("nl-NL")}</div>}
                        <div>Prioriteit: {banner.priority}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onToggle}>{banner.isActive ? "Verbergen" : "Tonen"}</Button>
                    <Button variant="outline" size="icon" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
                </div>
            </div>
        </div>
    );
}
