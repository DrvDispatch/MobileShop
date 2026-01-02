"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Percent, DollarSign, Calendar, Users, CheckCircle, XCircle, Edit, Trash2, Loader2, Copy, X } from "lucide-react";
import { useDiscounts, DiscountCode } from "@/lib/admin/discounts";

export default function AdminDiscountsPage() {
    const {
        discounts, isLoading, isSaving, showModal, editingId, formData,
        openCreateModal, openEditModal, closeModal, updateFormField,
        handleSubmit, handleDelete, handleToggleActive, copyCode,
        isExpired, formatDiscount,
    } = useDiscounts();

    // Helper: check if discount is scheduled for future
    const isComingSoon = (d: DiscountCode) => !!(d.startsAt && new Date(d.startsAt) > new Date());

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Kortingscodes</h1>
                    <p className="text-zinc-500">Beheer kortingscodes en promoties</p>
                </div>
                <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />Nieuwe Code</Button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : discounts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                    <Percent className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500 mb-4">Nog geen kortingscodes</p>
                    <Button onClick={openCreateModal}><Plus className="w-4 h-4 mr-2" />Eerste code aanmaken</Button>
                </div>
            ) : (
                <div className="grid gap-4">
                    {discounts.map((discount) => (
                        <DiscountCard key={discount.id} discount={discount} isExpired={isExpired(discount)} isComingSoon={isComingSoon(discount)} formatDiscount={formatDiscount}
                            onCopy={() => copyCode(discount.code)} onToggle={() => handleToggleActive(discount)} onEdit={() => openEditModal(discount)} onDelete={() => handleDelete(discount.id)} />
                    ))}
                </div>
            )}

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="flex items-center justify-between p-6 border-b border-zinc-200">
                            <div>
                                <h2 className="text-lg font-semibold text-zinc-900">{editingId ? "Kortingscode Bewerken" : "Nieuwe Kortingscode"}</h2>
                                <p className="text-sm text-zinc-500">{editingId ? "Wijzig de instellingen van deze korting" : "Maak een nieuwe kortingscode aan"}</p>
                            </div>
                            <button onClick={closeModal} className="text-zinc-400 hover:text-zinc-600 p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
                        </div>
                        {/* Live Preview */}
                        {formData.code && (
                            <div className="mx-6 mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <code className="text-lg font-bold text-purple-600 bg-white px-3 py-1 rounded">{formData.code || "CODE"}</code>
                                        <span className="text-purple-700 font-semibold">{formData.type === "PERCENTAGE" ? `${formData.value}% korting` : `€${formData.value.toFixed(2)} korting`}</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Kortingscode *</Label>
                                    <Input value={formData.code} onChange={(e) => updateFormField("code", e.target.value.toUpperCase())} placeholder="ZOMER2024" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <select value={formData.type} onChange={(e) => updateFormField("type", e.target.value as "PERCENTAGE" | "FIXED")} className="w-full h-10 border border-zinc-200 rounded-lg px-3">
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Vast bedrag (€)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Beschrijving</Label>
                                <Input value={formData.description} onChange={(e) => updateFormField("description", e.target.value)} placeholder="Zomer actie 2024" />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label>Waarde *</Label>
                                    <Input type="number" value={formData.value} onChange={(e) => updateFormField("value", parseFloat(e.target.value) || 0)} min="0" step={formData.type === "PERCENTAGE" ? "1" : "0.01"} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Minimum bestelbedrag</Label>
                                    <Input value={formData.minOrderAmount} onChange={(e) => updateFormField("minOrderAmount", e.target.value)} placeholder="€50.00" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max korting (bij %)</Label>
                                    <Input value={formData.maxDiscount} onChange={(e) => updateFormField("maxDiscount", e.target.value)} placeholder="€100.00" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Totaal gebruik limiet</Label>
                                    <Input value={formData.usageLimit} onChange={(e) => updateFormField("usageLimit", e.target.value)} placeholder="100" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Per klant limiet</Label>
                                    <Input value={formData.perUserLimit} onChange={(e) => updateFormField("perUserLimit", e.target.value)} placeholder="1" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                <span className="text-sm text-zinc-700">Code is actief</span>
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

function DiscountCard({ discount, isExpired, isComingSoon, formatDiscount, onCopy, onToggle, onEdit, onDelete }: {
    discount: DiscountCode; isExpired: boolean; isComingSoon: boolean; formatDiscount: (d: DiscountCode) => string;
    onCopy: () => void; onToggle: () => void; onEdit: () => void; onDelete: () => void;
}) {
    return (
        <div className={`bg-white rounded-xl border p-6 ${!discount.isActive || isExpired ? "border-zinc-200 opacity-60" : "border-purple-200"}`}>
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <code className="text-lg font-bold text-purple-600 bg-purple-50 px-3 py-1 rounded">{discount.code}</code>
                        <button onClick={onCopy} className="text-zinc-400 hover:text-zinc-600" title="Kopieer code"><Copy className="w-4 h-4" /></button>
                        {discount.isActive && !isExpired ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" />Actief</span>
                        ) : isExpired ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">Verlopen</span>
                        ) : (
                            <span className="px-2 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full flex items-center gap-1"><XCircle className="w-3 h-3" />Inactief</span>
                        )}
                        {isComingSoon && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Gepland</span>}
                    </div>
                    {discount.description && <p className="text-zinc-600 mt-2">{discount.description}</p>}
                    <div className="flex flex-wrap gap-4 mt-4 text-sm">
                        <div className="flex items-center gap-1 text-zinc-600">
                            {discount.type === "PERCENTAGE" ? <Percent className="w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
                            {formatDiscount(discount)}
                        </div>
                        <div className="flex items-center gap-1 text-zinc-600">
                            <Users className="w-4 h-4" />
                            {discount.usageCount}{discount.usageLimit ? `/${discount.usageLimit}` : ""} gebruikt
                        </div>
                        {discount.minOrderAmount && <div className="text-zinc-500">Min. €{Number(discount.minOrderAmount).toFixed(2)}</div>}
                        {discount.expiresAt && <div className="flex items-center gap-1 text-zinc-500"><Calendar className="w-4 h-4" />Verloopt: {new Date(discount.expiresAt).toLocaleDateString("nl-NL")}</div>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onToggle}>{discount.isActive ? "Deactiveren" : "Activeren"}</Button>
                    <Button variant="outline" size="icon" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
                </div>
            </div>
        </div>
    );
}
