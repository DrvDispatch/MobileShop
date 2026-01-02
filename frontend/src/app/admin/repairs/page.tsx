"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Smartphone, Tablet, Building2, Wrench, Upload, ChevronLeft, Loader2, CheckCircle, AlertCircle, Plus, RefreshCw } from "lucide-react";
import { useRepairsCatalog, type DeviceType } from "@/lib/admin/repairs/useRepairsCatalog";

export default function AdminRepairsPage() {
    const {
        deviceTypes, brands, devices, serviceTypes,
        isLoading, isImporting, importResult,
        handleFileImport, fileInputRef,
        activeTab, setActiveTab, refresh,
    } = useRepairsCatalog();

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileImport(file);
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900">Reparatie Catalogus</h1>
                <p className="text-zinc-600 mt-1">Beheer apparaattypes, merken, toestellen en reparaties</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button onClick={() => setActiveTab("overview")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "overview" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                    Overzicht
                </button>
                <button onClick={() => setActiveTab("import")} className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "import" ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>
                    <Upload className="w-4 h-4 inline mr-2" />Import
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 text-zinc-400 animate-spin" /></div>
            ) : activeTab === "overview" ? (
                <OverviewTab deviceTypes={deviceTypes} brands={brands} devices={devices} serviceTypes={serviceTypes} onRefresh={refresh} />
            ) : (
                <ImportTab fileInputRef={fileInputRef} onFileChange={onFileChange} isImporting={isImporting} importResult={importResult} />
            )}
        </div>
    );
}

function OverviewTab({ deviceTypes, brands, devices, serviceTypes, onRefresh }: {
    deviceTypes: DeviceType[]; brands: { id: string; name: string; slug: string }[];
    devices: { id: string; name: string }[]; serviceTypes: { id: string; name: string }[];
    onRefresh: () => void;
}) {
    return (
        <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={<Smartphone className="w-5 h-5 text-blue-600" />} value={deviceTypes.length} label="Apparaattypes" color="blue" />
                <StatCard icon={<Building2 className="w-5 h-5 text-purple-600" />} value={brands.length} label="Merken" color="purple" />
                <StatCard icon={<Tablet className="w-5 h-5 text-green-600" />} value={devices.length} label="Toestellen" color="green" />
                <StatCard icon={<Wrench className="w-5 h-5 text-orange-600" />} value={serviceTypes.length} label="Reparatietypes" color="orange" />
            </div>

            {/* Device Types */}
            <CatalogSection title="Apparaattypes">
                <div className="space-y-2">
                    {deviceTypes.map((dt) => (
                        <div key={dt.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                            <div className="flex items-center gap-3">
                                {dt.slug === "smartphone" ? <Smartphone className="w-5 h-5 text-zinc-400" /> : <Tablet className="w-5 h-5 text-zinc-400" />}
                                <span className="font-medium">{dt.name}</span>
                                <span className="text-xs text-zinc-500">({dt.slug})</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded ${dt.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                                {dt.isActive ? "Actief" : "Inactief"}
                            </span>
                        </div>
                    ))}
                    {deviceTypes.length === 0 && <p className="text-zinc-500 text-center py-4">Geen apparaattypes gevonden</p>}
                </div>
            </CatalogSection>

            {/* Brands */}
            <CatalogSection title="Merken">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {brands.slice(0, 8).map((brand) => (
                        <div key={brand.id} className="p-3 bg-zinc-50 rounded-lg text-center">
                            <p className="font-medium text-sm">{brand.name}</p>
                            <p className="text-xs text-zinc-500">{brand.slug}</p>
                        </div>
                    ))}
                    {brands.length === 0 && <p className="col-span-full text-zinc-500 text-center py-4">Geen merken gevonden</p>}
                </div>
                {brands.length > 8 && <p className="text-sm text-zinc-500 text-center mt-3">+ {brands.length - 8} meer merken</p>}
            </CatalogSection>

            {/* Service Types */}
            <CatalogSection title="Reparatietypes">
                <div className="flex flex-wrap gap-2">
                    {serviceTypes.map((st) => (
                        <span key={st.id} className="px-3 py-1 bg-zinc-100 rounded-full text-sm font-medium text-zinc-700">{st.name}</span>
                    ))}
                    {serviceTypes.length === 0 && <p className="text-zinc-500 w-full text-center py-4">Geen reparatietypes gevonden</p>}
                </div>
            </CatalogSection>

            {/* Refresh Button */}
            <div className="flex justify-center">
                <Button variant="outline" onClick={onRefresh}><RefreshCw className="w-4 h-4 mr-2" />Gegevens Vernieuwen</Button>
            </div>
        </div>
    );
}

function ImportTab({ fileInputRef, onFileChange, isImporting, importResult }: {
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isImporting: boolean;
    importResult: { success: boolean; message: string; stats?: Record<string, number> } | null;
}) {
    return (
        <div className="max-w-2xl">
            <div className="bg-white border border-zinc-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-zinc-900 mb-4">Importeer Apparaten & Reparaties</h2>
                <p className="text-zinc-600 mb-6">Upload het <code className="bg-zinc-100 px-1 rounded">devices.json</code> bestand om apparaten en reparaties te importeren.</p>

                <div className="space-y-4">
                    <input ref={fileInputRef} type="file" accept=".json" onChange={onFileChange} className="hidden" id="json-upload" />
                    <label htmlFor="json-upload" className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isImporting ? "border-zinc-300 bg-zinc-50" : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"}`}>
                        {isImporting ? (
                            <><Loader2 className="w-10 h-10 text-zinc-400 animate-spin mb-3" /><p className="text-zinc-600">Importeren...</p></>
                        ) : (
                            <><Upload className="w-10 h-10 text-zinc-400 mb-3" /><p className="text-zinc-600 font-medium">Klik om JSON te uploaden</p><p className="text-sm text-zinc-500">devices.json</p></>
                        )}
                    </label>

                    {importResult && (
                        <div className={`p-4 rounded-lg flex items-start gap-3 ${importResult.success ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}>
                            {importResult.success ? <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /> : <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
                            <div>
                                <p className="font-medium">{importResult.message}</p>
                                {importResult.stats && (
                                    <div className="mt-2 text-sm">
                                        <p>Apparaattypes: {importResult.stats.deviceTypes}</p>
                                        <p>Merken: {importResult.stats.brands}</p>
                                        <p>Toestellen: {importResult.stats.devices}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <h3 className="font-medium text-amber-800 mb-2">💡 Tip</h3>
                <p className="text-sm text-amber-700">{`Het devices.json bestand moet de structuur hebben met merken als toplevel keys (bijv. "Apple", "Samsung") en categorieën "smartphones" en "tablets" als arrays.`}</p>
            </div>
        </div>
    );
}

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: number; label: string; color: string }) {
    const colors: Record<string, string> = { blue: "bg-blue-100", purple: "bg-purple-100", green: "bg-green-100", orange: "bg-orange-100" };
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-4">
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${colors[color]} rounded-lg flex items-center justify-center`}>{icon}</div>
                <div>
                    <p className="text-2xl font-bold text-zinc-900">{value}</p>
                    <p className="text-sm text-zinc-500">{label}</p>
                </div>
            </div>
        </div>
    );
}

function CatalogSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-zinc-900">{title}</h2>
                <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Toevoegen</Button>
            </div>
            {children}
        </div>
    );
}
