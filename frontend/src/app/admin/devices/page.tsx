"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Edit, Loader2, Download, Search, X, Check, Upload } from "lucide-react";
import { useDevices, Device } from "@/lib/admin/devices";

export default function AdminDevicesPage() {
    const {
        devices, filteredDevices, groupedDevices, uniqueBrands,
        isLoading, isSaving, isSeeding, isImporting,
        error, success, setError, setSuccess,
        searchQuery, setSearchQuery, brandFilter, setBrandFilter,
        isModalOpen, editingDevice, formData,
        openAddModal, openEditModal, closeModal, setFormData,
        handleSave, handleDelete, toggleActive, seedDevices, handleFileUpload,
    } = useDevices();

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            await handleFileUpload(file);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Apparaten Beheer</h1>
                    <p className="text-zinc-500">{devices.length} apparaten • {uniqueBrands.length} merken</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={seedDevices} disabled={isSeeding}>
                        {isSeeding ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}Seed
                    </Button>
                    <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isImporting}>
                        {isImporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}Import
                    </Button>
                    <Button onClick={openAddModal}><Plus className="w-4 h-4 mr-2" />Toevoegen</Button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 flex justify-between items-center">
                    {error}<button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 flex justify-between items-center">
                    {success}<button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Zoek apparaten..." className="pl-10" />
                </div>
                <select value={brandFilter} onChange={(e) => setBrandFilter(e.target.value)} className="px-3 py-2 border border-zinc-200 rounded-lg bg-white">
                    <option value="">Alle merken</option>
                    {uniqueBrands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-400" /></div>
            ) : filteredDevices.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                    <p className="text-zinc-500 mb-4">Geen apparaten gevonden</p>
                    <Button onClick={openAddModal}><Plus className="w-4 h-4 mr-2" />Voeg eerste apparaat toe</Button>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(groupedDevices).map(([brand, brandDevices]) => (
                        <div key={brand} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
                                <h3 className="font-semibold text-zinc-900">{brand}</h3>
                                <span className="text-sm text-zinc-500">{brandDevices.length} modellen</span>
                            </div>
                            <div className="divide-y divide-zinc-100">
                                {brandDevices.map((device) => (
                                    <DeviceRow key={device.id} device={device} onEdit={() => openEditModal(device)} onDelete={() => handleDelete(device.id)} onToggle={() => toggleActive(device)} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl w-full max-w-md m-4">
                        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
                            <h2 className="text-lg font-semibold">{editingDevice ? "Apparaat Bewerken" : "Nieuw Apparaat"}</h2>
                            <button onClick={closeModal}><X className="w-5 h-5 text-zinc-400" /></button>
                        </div>
                        <div className="p-4 space-y-4">
                            <div className="space-y-2">
                                <Label>Merk *</Label>
                                <Input value={formData.brand} onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))} placeholder="Apple" />
                            </div>
                            <div className="space-y-2">
                                <Label>Model *</Label>
                                <Input value={formData.model} onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))} placeholder="iPhone 15 Pro" />
                            </div>
                            <label className="flex items-center gap-2">
                                <input type="checkbox" checked={formData.isActive} onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))} className="rounded" />
                                <span className="text-sm text-zinc-700">Actief</span>
                            </label>
                        </div>
                        <div className="flex gap-2 p-4 border-t border-zinc-200">
                            <Button variant="outline" onClick={closeModal} className="flex-1">Annuleren</Button>
                            <Button onClick={handleSave} disabled={isSaving} className="flex-1">
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}Opslaan
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DeviceRow({ device, onEdit, onDelete, onToggle }: { device: Device; onEdit: () => void; onDelete: () => void; onToggle: () => void }) {
    return (
        <div className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50">
            <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${device.isActive ? "bg-green-500" : "bg-zinc-300"}`} />
                <span className="font-medium text-zinc-900">{device.model}</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onToggle}>{device.isActive ? "Deactiveren" : "Activeren"}</Button>
                <Button variant="outline" size="icon" onClick={onEdit}><Edit className="w-4 h-4" /></Button>
                <Button variant="outline" size="icon" className="text-red-600 hover:bg-red-50" onClick={onDelete}><Trash2 className="w-4 h-4" /></Button>
            </div>
        </div>
    );
}
