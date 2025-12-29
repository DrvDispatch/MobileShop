"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Trash2,
    Edit,
    Loader2,
    Download,
    Search,
    X,
    Check,
    Upload,
} from "lucide-react";

interface Device {
    id: string;
    brand: string;
    model: string;
    isActive: boolean;
    sortOrder: number;
}

export default function AdminDevicesPage() {
    const router = useRouter();
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState("");
    const [brandFilter, setBrandFilter] = useState("");

    // Add/Edit modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState<Device | null>(null);
    const [formBrand, setFormBrand] = useState("");
    const [formModel, setFormModel] = useState("");
    const [formIsActive, setFormIsActive] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Seed/Import state
    const [isSeeding, setIsSeeding] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    useEffect(() => {
        fetchDevices();
    }, []);

    const getAuthHeaders = () => {
        // Check accessToken first (where the JWT is stored), then fall back to adminAuth
        const accessToken = localStorage.getItem("adminAccessToken");
        const adminAuth = localStorage.getItem("adminAuth");

        let token = null;

        // First check the direct accessToken
        if (accessToken) {
            token = accessToken;
        } else if (adminAuth) {
            // Fall back to checking adminAuth object
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

    const fetchDevices = async () => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/devices/admin/all`,
                { headers: getAuthHeaders(), credentials: 'include' }
            );
            if (!response.ok) throw new Error("Failed to fetch devices");
            const data = await response.json();
            setDevices(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const seedDevices = async () => {
        setIsSeeding(true);
        setError(null);
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/devices/seed`,
                { method: "POST", headers: getAuthHeaders(), credentials: 'include' }
            );
            if (!response.ok) throw new Error("Failed to seed devices");
            const result = await response.json();
            setSuccess(`Devices seeded: ${result.created} created, ${result.skipped} skipped`);
            fetchDevices();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSeeding(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        setError(null);
        try {
            const text = await file.text();
            const jsonData = JSON.parse(text);

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/devices/import`,
                {
                    method: "POST",
                    headers: getAuthHeaders(),
                    credentials: 'include',
                    body: JSON.stringify(jsonData),
                }
            );
            if (!response.ok) throw new Error("Failed to import devices");
            const result = await response.json();

            const breakdown = result.breakdown?.map((b: any) =>
                `${b.brand}: ${b.smartphones} phones, ${b.tablets} tablets`
            ).join(' | ') || '';

            setSuccess(`Import complete: ${result.created} created, ${result.skipped} skipped. ${breakdown}`);
            fetchDevices();
        } catch (err: any) {
            setError(err.message || "Failed to parse JSON file");
        } finally {
            setIsImporting(false);
            e.target.value = ''; // Reset file input
        }
    };

    const openAddModal = () => {
        setEditingDevice(null);
        setFormBrand("");
        setFormModel("");
        setFormIsActive(true);
        setIsModalOpen(true);
    };

    const openEditModal = (device: Device) => {
        setEditingDevice(device);
        setFormBrand(device.brand);
        setFormModel(device.model);
        setFormIsActive(device.isActive);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingDevice(null);
    };

    const handleSave = async () => {
        if (!formBrand.trim() || !formModel.trim()) {
            setError("Brand and model are required");
            return;
        }

        setIsSaving(true);
        setError(null);
        try {
            if (editingDevice) {
                // Update
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/devices/${editingDevice.id}`,
                    {
                        method: "PATCH",
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({
                            brand: formBrand,
                            model: formModel,
                            isActive: formIsActive,
                        }),
                    }
                );
                if (!response.ok) throw new Error("Failed to update device");
                setSuccess("Device updated successfully");
            } else {
                // Create
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/devices`,
                    {
                        method: "POST",
                        headers: getAuthHeaders(),
                        credentials: 'include',
                        body: JSON.stringify({
                            brand: formBrand,
                            model: formModel,
                            isActive: formIsActive,
                        }),
                    }
                );
                if (!response.ok) {
                    const err = await response.json();
                    throw new Error(err.message || "Failed to create device");
                }
                setSuccess("Device created successfully");
            }
            closeModal();
            fetchDevices();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this device?")) return;

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/devices/${id}`,
                { method: "DELETE", headers: getAuthHeaders(), credentials: 'include' }
            );
            if (!response.ok) throw new Error("Failed to delete device");
            setSuccess("Device deleted successfully");
            fetchDevices();
        } catch (err: any) {
            setError(err.message);
        }
    };

    const toggleActive = async (device: Device) => {
        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/devices/${device.id}`,
                {
                    method: "PATCH",
                    headers: getAuthHeaders(),
                    credentials: 'include',
                    body: JSON.stringify({ isActive: !device.isActive }),
                }
            );
            if (!response.ok) throw new Error("Failed to update device");
            fetchDevices();
        } catch (err: any) {
            setError(err.message);
        }
    };

    // Get unique brands for filter
    const uniqueBrands = [...new Set(devices.map(d => d.brand))].sort();

    // Filter devices
    const filteredDevices = devices.filter(d => {
        const matchesSearch =
            d.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.model.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesBrand = !brandFilter || d.brand === brandFilter;
        return matchesSearch && matchesBrand;
    });

    // Group by brand
    const groupedDevices = filteredDevices.reduce((acc, device) => {
        if (!acc[device.brand]) acc[device.brand] = [];
        acc[device.brand].push(device);
        return acc;
    }, {} as Record<string, Device[]>);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Supported Devices</h1>
                    <p className="text-zinc-500">Manage devices available for repair booking</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={seedDevices}
                        disabled={isSeeding || isImporting}
                    >
                        {isSeeding ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="w-4 h-4 mr-2" />
                        )}
                        Seed Defaults
                    </Button>
                    <label className="cursor-pointer">
                        <input
                            type="file"
                            accept=".json"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={isImporting || isSeeding}
                        />
                        <Button
                            variant="outline"
                            disabled={isImporting || isSeeding}
                            asChild
                        >
                            <span>
                                {isImporting ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                Import JSON
                            </span>
                        </Button>
                    </label>
                    <Button onClick={openAddModal}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Device
                    </Button>
                </div>
            </div>

            {/* Alerts */}
            {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex justify-between items-center">
                    {error}
                    <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
                </div>
            )}
            {success && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex justify-between items-center">
                    {success}
                    <button onClick={() => setSuccess(null)}><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search devices..."
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg"
                    />
                </div>
                <select
                    value={brandFilter}
                    onChange={(e) => setBrandFilter(e.target.value)}
                    className="px-4 py-2 border border-zinc-200 rounded-lg"
                >
                    <option value="">All Brands</option>
                    {uniqueBrands.map(brand => (
                        <option key={brand} value={brand}>{brand}</option>
                    ))}
                </select>
                <span className="text-sm text-zinc-500">
                    {filteredDevices.length} devices
                </span>
            </div>

            {/* Device List by Brand */}
            <div className="space-y-6">
                {Object.entries(groupedDevices).sort().map(([brand, brandDevices]) => (
                    <div key={brand} className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                        <div className="px-4 py-3 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
                            <h3 className="font-semibold text-zinc-900">{brand}</h3>
                            <span className="text-sm text-zinc-500">{brandDevices.length} models</span>
                        </div>
                        <div className="divide-y divide-zinc-100">
                            {brandDevices.map(device => (
                                <div
                                    key={device.id}
                                    className={`px-4 py-3 flex items-center justify-between ${!device.isActive ? "opacity-50 bg-zinc-50" : ""
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <button
                                            onClick={() => toggleActive(device)}
                                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${device.isActive
                                                ? "bg-green-500 border-green-500 text-white"
                                                : "border-zinc-300"
                                                }`}
                                        >
                                            {device.isActive && <Check className="w-3 h-3" />}
                                        </button>
                                        <span className={device.isActive ? "" : "line-through"}>
                                            {device.model}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => openEditModal(device)}
                                            className="p-2 text-zinc-400 hover:text-zinc-600 transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(device.id)}
                                            className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {filteredDevices.length === 0 && (
                <div className="text-center py-12 text-zinc-500">
                    {devices.length === 0
                        ? "No devices yet. Click 'Seed All Devices' to add the default device list."
                        : "No devices match your search criteria."
                    }
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
                        <h2 className="text-xl font-semibold mb-4">
                            {editingDevice ? "Edit Device" : "Add Device"}
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Brand
                                </label>
                                <input
                                    type="text"
                                    value={formBrand}
                                    onChange={(e) => setFormBrand(e.target.value)}
                                    placeholder="e.g. Apple, Samsung"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">
                                    Model
                                </label>
                                <input
                                    type="text"
                                    value={formModel}
                                    onChange={(e) => setFormModel(e.target.value)}
                                    placeholder="e.g. iPhone 16 Pro Max"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formIsActive}
                                    onChange={(e) => setFormIsActive(e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm text-zinc-700">
                                    Active (visible in booking form)
                                </label>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <Button
                                variant="outline"
                                onClick={closeModal}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="flex-1"
                            >
                                {isSaving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    editingDevice ? "Save Changes" : "Add Device"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
