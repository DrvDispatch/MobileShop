"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Smartphone,
    Tablet,
    Building2,
    Wrench,
    Upload,
    ChevronLeft,
    Loader2,
    CheckCircle,
    AlertCircle,
    Trash2,
    Plus,
    RefreshCw,
} from "lucide-react";

// All API calls use relative paths to go through Next.js proxy for tenant resolution

// Auth helper matching the devices page pattern
const getAuthHeaders = () => {
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem("adminAccessToken") : null;
    const adminAuth = typeof window !== 'undefined' ? localStorage.getItem("adminAuth") : null;

    let token = null;

    if (accessToken) {
        token = accessToken;
    } else if (adminAuth) {
        try {
            const parsed = JSON.parse(adminAuth);
            token = parsed.accessToken || parsed.token;
        } catch {
            token = adminAuth;
        }
    }

    return {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : "",
    };
};

interface DeviceType {
    id: string;
    name: string;
    slug: string;
    isActive: boolean;
    _count?: { brands: number };
}

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
    isActive: boolean;
    _count?: { devices: number };
}

interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
    isActive: boolean;
    _count?: { services: number };
}

interface ServiceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
    isActive: boolean;
}

export default function AdminRepairsPage() {
    const [activeTab, setActiveTab] = useState<"overview" | "import">("overview");
    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [importResult, setImportResult] = useState<{
        success: boolean;
        message: string;
        stats?: Record<string, number>;
    } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        setIsLoading(true);
        try {
            const [dtRes, brandsRes, devicesRes, stRes] = await Promise.all([
                fetch(`/api/repairs/device-types`),
                fetch(`/api/repairs/brands`),
                fetch(`/api/repairs/devices`),
                fetch(`/api/repairs/service-types`),
            ]);

            const dtData = dtRes.ok ? await dtRes.json().catch(() => []) : [];
            const brandsData = brandsRes.ok ? await brandsRes.json().catch(() => []) : [];
            const devicesData = devicesRes.ok ? await devicesRes.json().catch(() => []) : [];
            const stData = stRes.ok ? await stRes.json().catch(() => []) : [];

            setDeviceTypes(Array.isArray(dtData) ? dtData : []);
            setBrands(Array.isArray(brandsData) ? brandsData : []);
            setDevices(Array.isArray(devicesData) ? devicesData : []);
            setServiceTypes(Array.isArray(stData) ? stData : []);
        } catch (err) {
            console.error("Failed to fetch data:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setImportResult(null);

        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const response = await fetch(`/api/repairs/admin/import`, {
                method: "POST",
                headers: getAuthHeaders(),
                credentials: 'include',
                body: JSON.stringify({ data: jsonData }),
            });

            if (!response.ok) {
                throw new Error(`Import failed: ${response.status}`);
            }

            const result = await response.json();
            setImportResult({
                success: true,
                message: "Import succesvol!",
                stats: result,
            });

            // Refresh data
            await fetchAllData();
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Import mislukt";
            setImportResult({
                success: false,
                message,
            });
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    return (
        <div className="p-6">
            {/* Header */}
            <div className="mb-8">
                <Link href="/admin" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900">Reparatie Catalogus</h1>
                <p className="text-zinc-600 mt-1">Beheer apparaattypes, merken, toestellen en reparaties</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab("overview")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "overview"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                >
                    Overzicht
                </button>
                <button
                    onClick={() => setActiveTab("import")}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "import"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                >
                    <Upload className="w-4 h-4 inline mr-2" />
                    Import
                </button>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                </div>
            ) : activeTab === "overview" ? (
                <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-zinc-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Smartphone className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-900">{deviceTypes.length}</p>
                                    <p className="text-sm text-zinc-500">Apparaattypes</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Building2 className="w-5 h-5 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-900">{brands.length}</p>
                                    <p className="text-sm text-zinc-500">Merken</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                                    <Tablet className="w-5 h-5 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-900">{devices.length}</p>
                                    <p className="text-sm text-zinc-500">Toestellen</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white border border-zinc-200 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                    <Wrench className="w-5 h-5 text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-zinc-900">{serviceTypes.length}</p>
                                    <p className="text-sm text-zinc-500">Reparatietypes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Device Types */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-zinc-900">Apparaattypes</h2>
                            <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-1" /> Toevoegen
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {deviceTypes.map((dt) => (
                                <div
                                    key={dt.id}
                                    className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                                >
                                    <div className="flex items-center gap-3">
                                        {dt.slug === "smartphone" ? (
                                            <Smartphone className="w-5 h-5 text-zinc-400" />
                                        ) : (
                                            <Tablet className="w-5 h-5 text-zinc-400" />
                                        )}
                                        <span className="font-medium">{dt.name}</span>
                                        <span className="text-xs text-zinc-500">({dt.slug})</span>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded ${dt.isActive ? "bg-green-100 text-green-700" : "bg-zinc-100 text-zinc-500"}`}>
                                        {dt.isActive ? "Actief" : "Inactief"}
                                    </span>
                                </div>
                            ))}
                            {deviceTypes.length === 0 && (
                                <p className="text-zinc-500 text-center py-4">Geen apparaattypes gevonden</p>
                            )}
                        </div>
                    </div>

                    {/* Brands */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-zinc-900">Merken</h2>
                            <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-1" /> Toevoegen
                            </Button>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {brands.slice(0, 8).map((brand) => (
                                <div
                                    key={brand.id}
                                    className="p-3 bg-zinc-50 rounded-lg text-center"
                                >
                                    <p className="font-medium text-sm">{brand.name}</p>
                                    <p className="text-xs text-zinc-500">{brand.slug}</p>
                                </div>
                            ))}
                            {brands.length === 0 && (
                                <p className="col-span-full text-zinc-500 text-center py-4">Geen merken gevonden</p>
                            )}
                        </div>
                        {brands.length > 8 && (
                            <p className="text-sm text-zinc-500 text-center mt-3">
                                + {brands.length - 8} meer merken
                            </p>
                        )}
                    </div>

                    {/* Service Types */}
                    <div className="bg-white border border-zinc-200 rounded-xl p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-semibold text-zinc-900">Reparatietypes</h2>
                            <Button size="sm" variant="outline">
                                <Plus className="w-4 h-4 mr-1" /> Toevoegen
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {serviceTypes.map((st) => (
                                <span
                                    key={st.id}
                                    className="px-3 py-1 bg-zinc-100 rounded-full text-sm font-medium text-zinc-700"
                                >
                                    {st.name}
                                </span>
                            ))}
                            {serviceTypes.length === 0 && (
                                <p className="text-zinc-500 w-full text-center py-4">Geen reparatietypes gevonden</p>
                            )}
                        </div>
                    </div>

                    {/* Refresh Button */}
                    <div className="flex justify-center">
                        <Button variant="outline" onClick={fetchAllData}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Gegevens Vernieuwen
                        </Button>
                    </div>
                </div>
            ) : (
                /* Import Tab */
                <div className="max-w-2xl">
                    <div className="bg-white border border-zinc-200 rounded-xl p-6">
                        <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                            Importeer Apparaten & Reparaties
                        </h2>
                        <p className="text-zinc-600 mb-6">
                            Upload het <code className="bg-zinc-100 px-1 rounded">devices.json</code> bestand om apparaten en reparaties te importeren.
                        </p>

                        <div className="space-y-4">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                onChange={handleFileImport}
                                className="hidden"
                                id="json-upload"
                            />

                            <label
                                htmlFor="json-upload"
                                className={`flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${isImporting
                                    ? "border-zinc-300 bg-zinc-50"
                                    : "border-zinc-300 hover:border-zinc-400 hover:bg-zinc-50"
                                    }`}
                            >
                                {isImporting ? (
                                    <>
                                        <Loader2 className="w-10 h-10 text-zinc-400 animate-spin mb-3" />
                                        <p className="text-zinc-600">Importeren...</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-10 h-10 text-zinc-400 mb-3" />
                                        <p className="text-zinc-600 font-medium">Klik om JSON te uploaden</p>
                                        <p className="text-sm text-zinc-500">devices.json</p>
                                    </>
                                )}
                            </label>

                            {importResult && (
                                <div
                                    className={`p-4 rounded-lg flex items-start gap-3 ${importResult.success
                                        ? "bg-green-50 border border-green-200 text-green-800"
                                        : "bg-red-50 border border-red-200 text-red-800"
                                        }`}
                                >
                                    {importResult.success ? (
                                        <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    )}
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
                        <p className="text-sm text-amber-700">
                            Het devices.json bestand moet de structuur hebben met merken als toplevel keys
                            (bijv. "Apple", "Samsung") en categorieën "smartphones" en "tablets" als arrays.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
