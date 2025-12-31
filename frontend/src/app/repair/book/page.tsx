"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { getImageUrl } from "@/lib/image-utils";
import {
    ChevronLeft,
    Smartphone,
    Tablet,
    Calendar,
    Clock,
    Phone,
    User,
    Mail,
    CheckCircle,
    Loader2,
    AlertCircle,
    ArrowRight,
    Search,
    Wrench,
} from "lucide-react";

// Types
interface DeviceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}

interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
}

interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
}

interface RepairService {
    id: string;
    deviceId: string;
    serviceId: string;
    price?: number;
    priceText?: string;
    duration?: string;
    service: {
        id: string;
        name: string;
        slug: string;
        icon?: string;
    };
}

const TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

export default function BookRepairPage() {
    // Step state
    const [step, setStep] = useState(0);

    // Selection state
    const [selectedDeviceType, setSelectedDeviceType] = useState<DeviceType | null>(null);
    const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
    const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
    const [selectedRepair, setSelectedRepair] = useState<RepairService | null>(null);

    // Data state
    const [deviceTypes, setDeviceTypes] = useState<DeviceType[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [repairs, setRepairs] = useState<RepairService[]>([]);

    // Booking state
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [selectedSlot, setSelectedSlot] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [customerPhone, setCustomerPhone] = useState("");
    const [problemDescription, setProblemDescription] = useState("");

    // UI state
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const [availableSlots, setAvailableSlots] = useState<string[]>(TIME_SLOTS);
    const [searchQuery, setSearchQuery] = useState("");

    // Fetch device types on mount
    useEffect(() => {
        fetchDeviceTypes();
    }, []);

    // Fetch brands when device type changes
    useEffect(() => {
        if (selectedDeviceType) {
            fetchBrands(selectedDeviceType.slug);
        }
    }, [selectedDeviceType]);

    // Fetch devices when brand changes
    useEffect(() => {
        if (selectedBrand) {
            fetchDevices(selectedBrand.slug);
        }
    }, [selectedBrand]);

    // Fetch repairs when device changes
    useEffect(() => {
        if (selectedDevice) {
            fetchRepairs(selectedDevice.slug);
        }
    }, [selectedDevice]);

    // Fetch available slots when date changes
    useEffect(() => {
        if (selectedDate) {
            fetchAvailableSlots(selectedDate);
        }
    }, [selectedDate]);

    const fetchDeviceTypes = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/repairs/device-types');
            const data = await response.json();
            setDeviceTypes(data || []);
        } catch (err) {
            console.error("Failed to fetch device types:", err);
            // Fallback
            setDeviceTypes([
                { id: "1", name: "Smartphone", slug: "smartphone" },
                { id: "2", name: "Tablet", slug: "tablet" },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchBrands = async (deviceTypeSlug: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/repairs/brands?deviceType=${deviceTypeSlug}`);
            const data = await response.json();
            setBrands(data || []);
        } catch (err) {
            console.error("Failed to fetch brands:", err);
            setBrands([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDevices = async (brandSlug: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/repairs/devices?brand=${brandSlug}`);
            const data = await response.json();
            setDevices(data || []);
        } catch (err) {
            console.error("Failed to fetch devices:", err);
            setDevices([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchRepairs = async (deviceSlug: string) => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/repairs/services/${deviceSlug}`);
            const data = await response.json();
            setRepairs(data || []);
        } catch (err) {
            console.error("Failed to fetch repairs:", err);
            setRepairs([]);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchAvailableSlots = async (date: Date) => {
        try {
            const dateStr = date.toISOString().split("T")[0];
            const response = await fetch(`/api/appointments/available-slots?date=${dateStr}`);
            const data = await response.json();
            setAvailableSlots(data.slots || TIME_SLOTS);
        } catch {
            setAvailableSlots(TIME_SLOTS);
        }
    };

    const getStepTitle = () => {
        switch (step) {
            case 0: return "Wat wilt u laten repareren?";
            case 1: return "Selecteer uw merk";
            case 2: return "Selecteer uw toestel";
            case 3: return "Selecteer reparatie";
            case 4: return "Kies datum & tijd";
            case 5: return "Uw gegevens";
            default: return "";
        }
    };

    const getAvailableDates = () => {
        const dates: Date[] = [];
        const today = new Date();
        for (let i = 1; i <= 14; i++) {
            const date = new Date(today);
            date.setDate(today.getDate() + i);
            if (date.getDay() !== 0) dates.push(date); // Skip Sundays
        }
        return dates;
    };

    const handleSelectDeviceType = (dt: DeviceType) => {
        setSelectedDeviceType(dt);
        setSelectedBrand(null);
        setSelectedDevice(null);
        setSelectedRepair(null);
        setBrands([]);
        setDevices([]);
        setRepairs([]);
        setStep(1);
        // Directly fetch brands to ensure data loads even if useEffect doesn't trigger
        fetchBrands(dt.slug);
    };

    const handleSelectBrand = (brand: Brand) => {
        setSelectedBrand(brand);
        setSelectedDevice(null);
        setSelectedRepair(null);
        setDevices([]);
        setRepairs([]);
        setStep(2);
        // Directly fetch devices to ensure data loads even if useEffect doesn't trigger
        fetchDevices(brand.slug);
    };

    const handleSelectDevice = (device: Device) => {
        setSelectedDevice(device);
        setSelectedRepair(null);
        setRepairs([]);
        setStep(3);
        // Directly fetch repairs to ensure data loads even if useEffect doesn't trigger
        fetchRepairs(device.slug);
    };

    const handleSelectRepair = (repair: RepairService) => {
        setSelectedRepair(repair);
        setStep(4);
    };

    // Breadcrumb navigation handlers - properly refetch data when navigating back
    const navigateToDeviceType = () => {
        setStep(0);
        setSearchQuery("");
        // Reset selections so useEffect triggers correctly on re-selection
        setSelectedDeviceType(null);
        setSelectedBrand(null);
        setSelectedDevice(null);
        setSelectedRepair(null);
        setBrands([]);
        setDevices([]);
        setRepairs([]);
    };

    const navigateToBrand = () => {
        if (selectedDeviceType) {
            setSelectedDevice(null);
            setSelectedRepair(null);
            setDevices([]);
            setRepairs([]);
            setSearchQuery("");
            fetchBrands(selectedDeviceType.slug);
            setStep(1);
        }
    };

    const navigateToDevice = () => {
        if (selectedBrand) {
            setSelectedRepair(null);
            setRepairs([]);
            setSearchQuery("");
            fetchDevices(selectedBrand.slug);
            setStep(2);
        }
    };

    const navigateToRepair = () => {
        if (selectedDevice) {
            fetchRepairs(selectedDevice.slug);
            setStep(3);
        }
    };

    // Filter devices by search query
    const filteredDevices = devices.filter(device =>
        device.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!customerName || !customerEmail || !customerPhone || !selectedDevice || !selectedRepair || !selectedDate || !selectedSlot) {
            setError("Vul alle verplichte velden in");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch('/api/appointments', {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName,
                    customerEmail,
                    customerPhone,
                    deviceBrand: selectedBrand?.name || "",
                    deviceModel: selectedDevice?.name || "",
                    repairType: "OTHER",
                    problemDescription: `${selectedRepair?.service?.name}: ${problemDescription}`,
                    appointmentDate: selectedDate.toISOString().split("T")[0],
                    timeSlot: selectedSlot,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || "Kon afspraak niet maken");
            }

            setIsSuccess(true);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Er is iets misgegaan";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success screen
    if (isSuccess) {
        return (
            <main className="min-h-screen bg-white">
                <Navbar />
                <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-zinc-900 mb-4">Afspraak Bevestigd!</h1>
                    <p className="text-lg text-zinc-600 mb-2">Bedankt {customerName}!</p>
                    <p className="text-zinc-600 mb-8">U ontvangt een bevestiging per email op <strong>{customerEmail}</strong></p>
                    <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
                        <h3 className="font-semibold text-zinc-900 mb-3">Details:</h3>
                        <div className="space-y-2 text-sm text-zinc-600">
                            <p><strong>Toestel:</strong> {selectedBrand?.name} {selectedDevice?.name}</p>
                            <p><strong>Reparatie:</strong> {selectedRepair?.service?.name}</p>
                            <p><strong>Prijs:</strong> {selectedRepair?.priceText || "Op aanvraag"}</p>
                            <p><strong>Datum:</strong> {selectedDate?.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" })}</p>
                            <p><strong>Tijd:</strong> {selectedSlot}</p>
                        </div>
                    </div>
                    <Link href="/"><Button>Terug naar Home</Button></Link>
                </div>
                <Footer />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-50">
            <Navbar />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header with breadcrumb */}
                <div className="mb-8">
                    <Link href="/repair" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Terug
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900">{getStepTitle()}</h1>

                    {/* Breadcrumb */}
                    {step > 0 && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500 flex-wrap">
                            {selectedDeviceType && (
                                <button onClick={navigateToDeviceType} className="hover:text-zinc-900 hover:underline">{selectedDeviceType.name}</button>
                            )}
                            {selectedBrand && (
                                <><span>/</span><button onClick={navigateToBrand} className="hover:text-zinc-900 hover:underline">{selectedBrand.name}</button></>
                            )}
                            {selectedDevice && (
                                <><span>/</span><button onClick={navigateToDevice} className="hover:text-zinc-900 hover:underline">{selectedDevice.name}</button></>
                            )}
                            {selectedRepair && step > 3 && (
                                <><span>/</span><button onClick={navigateToRepair} className="hover:text-zinc-900 hover:underline">{selectedRepair.service?.name}</button></>
                            )}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                    </div>
                )}

                {/* Step 0: Device Type */}
                {step === 0 && !isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {deviceTypes.map((dt) => (
                            <button
                                key={dt.id}
                                onClick={() => handleSelectDeviceType(dt)}
                                className="bg-white rounded-xl border-2 border-zinc-200 p-6 text-center hover:border-zinc-400 hover:shadow-md transition-all"
                            >
                                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    {dt.slug === "smartphone" ? (
                                        <Smartphone className="w-12 h-12 text-zinc-600" />
                                    ) : dt.slug === "tablet" ? (
                                        <Tablet className="w-12 h-12 text-zinc-600" />
                                    ) : dt.icon ? (
                                        <img src={getImageUrl(dt.icon)} alt={dt.name} className="w-12 h-12 object-contain" />
                                    ) : (
                                        <Smartphone className="w-12 h-12 text-zinc-600" />
                                    )}
                                </div>
                                <p className="font-semibold text-zinc-900">{dt.name}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 1: Brand Selection */}
                {step === 1 && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {brands.length === 0 ? (
                            <p className="col-span-full text-center text-zinc-500 py-8">Geen merken gevonden. Probeer opnieuw.</p>
                        ) : (
                            brands.map((brand) => (
                                <button
                                    key={brand.id}
                                    onClick={() => handleSelectBrand(brand)}
                                    className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-zinc-400 hover:shadow-md transition-all"
                                >
                                    <div className="aspect-[3/2] flex items-center justify-center mb-2">
                                        {brand.logo ? (
                                            <img src={getImageUrl(brand.logo)} alt={brand.name} className="max-h-12 object-contain" />
                                        ) : (
                                            <span className="text-xl font-bold text-zinc-600">{brand.name}</span>
                                        )}
                                    </div>
                                    <p className="text-sm font-medium text-zinc-700 text-center">{brand.name}</p>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Step 2: Device Selection */}
                {step === 2 && !isLoading && (
                    <div className="space-y-4">
                        {/* Search Input */}
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input
                                type="text"
                                placeholder="Zoek uw toestel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 transition-colors"
                            />
                        </div>

                        {/* Device Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {devices.length === 0 ? (
                                <p className="col-span-full text-center text-zinc-500 py-8">Geen toestellen gevonden.</p>
                            ) : filteredDevices.length === 0 ? (
                                <p className="col-span-full text-center text-zinc-500 py-8">Geen toestellen gevonden voor "{searchQuery}"</p>
                            ) : (
                                filteredDevices.map((device) => (
                                    <button
                                        key={device.id}
                                        onClick={() => handleSelectDevice(device)}
                                        className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-zinc-400 hover:shadow-md transition-all text-center"
                                    >
                                        <div className="aspect-square flex items-center justify-center mb-2 bg-zinc-50 rounded-lg">
                                            {device.image ? (
                                                <img src={getImageUrl(device.image)} alt={device.name} className="max-h-24 object-contain" />
                                            ) : (
                                                <Smartphone className="w-12 h-12 text-zinc-300" />
                                            )}
                                        </div>
                                        <p className="text-sm font-medium text-zinc-900">{device.name}</p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 3: Repair Selection - Grid Layout */}
                {step === 3 && !isLoading && (
                    <div className="space-y-6">
                        {/* Device Header with Image */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <div className="flex items-center gap-6">
                                {/* Device Image */}
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {selectedDevice?.image ? (
                                        <img
                                            src={getImageUrl(selectedDevice.image)}
                                            alt={selectedDevice.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <Smartphone className="w-12 h-12 text-zinc-300" />
                                    )}
                                </div>
                                {/* Device Info */}
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">
                                        {selectedBrand?.name} {selectedDevice?.name} reparatie
                                    </h2>
                                    <p className="text-zinc-500 mt-2">
                                        Klik op jouw type schade en <strong className="text-zinc-700">plan je afspraak</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Repair Options Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {repairs.length === 0 ? (
                                <p className="col-span-full text-center text-zinc-500 py-8">Geen reparaties gevonden voor dit toestel.</p>
                            ) : (
                                repairs.map((repair) => (
                                    <button
                                        key={repair.id}
                                        onClick={() => handleSelectRepair(repair)}
                                        className="bg-white rounded-xl border-2 border-zinc-200 p-5 hover:border-zinc-400 hover:shadow-md transition-all text-center group"
                                    >
                                        {/* Icon */}
                                        <div className="w-14 h-14 mx-auto mb-3 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                                            {repair.service?.icon ? (
                                                <img src={getImageUrl(repair.service.icon)} alt="" className="w-8 h-8 object-contain" />
                                            ) : (
                                                <Smartphone className="w-7 h-7 text-zinc-600" />
                                            )}
                                        </div>
                                        {/* Service Name */}
                                        <p className="font-semibold text-zinc-900 mb-1">{repair.service?.name}</p>
                                        {/* Duration */}
                                        {repair.duration && (
                                            <p className="text-xs text-zinc-500 mb-2">{repair.duration}</p>
                                        )}
                                        {/* Price */}
                                        <p className="font-bold text-green-600">
                                            {repair.priceText || "op aanvraag"}
                                        </p>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 4: Date & Time */}
                {step === 4 && (
                    <div className="space-y-6">
                        {/* Device & Repair Header */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <div className="flex items-center gap-6">
                                {/* Device Image */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {selectedDevice?.image ? (
                                        <img
                                            src={getImageUrl(selectedDevice.image)}
                                            alt={selectedDevice.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <Smartphone className="w-10 h-10 text-zinc-300" />
                                    )}
                                </div>
                                {/* Device & Repair Info */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                                        {selectedBrand?.name} {selectedDevice?.name}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            {selectedRepair?.service?.icon ? (
                                                <img src={getImageUrl(selectedRepair.service.icon)} alt="" className="w-4 h-4" />
                                            ) : (
                                                <Wrench className="w-3.5 h-3.5" />
                                            )}
                                            {selectedRepair?.service?.name}
                                        </span>
                                        {selectedRepair?.priceText && (
                                            <span className="text-sm font-semibold text-green-600">
                                                {selectedRepair.priceText}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Date & Time Selection */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-3">
                                    <Calendar className="inline w-4 h-4 mr-1" /> Kies een datum
                                </label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {getAvailableDates().map((date) => (
                                        <button
                                            key={date.toISOString()}
                                            onClick={() => setSelectedDate(date)}
                                            className={`p-3 rounded-lg border-2 text-center transition-colors ${selectedDate?.toDateString() === date.toDateString()
                                                ? "border-zinc-900 bg-zinc-900 text-white"
                                                : "border-zinc-200 hover:border-zinc-400"
                                                }`}
                                        >
                                            <p className="text-xs uppercase">{date.toLocaleDateString("nl-BE", { weekday: "short" })}</p>
                                            <p className="text-lg font-bold">{date.getDate()}</p>
                                            <p className="text-xs">{date.toLocaleDateString("nl-BE", { month: "short" })}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-3">
                                        <Clock className="inline w-4 h-4 mr-1" /> Kies een tijdstip
                                    </label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableSlots.map((slot) => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`p-3 rounded-lg border-2 font-medium transition-colors ${selectedSlot === slot
                                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                                    : "border-zinc-200 hover:border-zinc-400"
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(3)} className="flex-1">Terug</Button>
                                <Button onClick={() => setStep(5)} disabled={!selectedDate || !selectedSlot} className="flex-1">
                                    Volgende
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Contact Info */}
                {step === 5 && (
                    <div className="space-y-6">
                        {/* Device & Repair Header */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <div className="flex items-center gap-6">
                                {/* Device Image */}
                                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {selectedDevice?.image ? (
                                        <img
                                            src={getImageUrl(selectedDevice.image)}
                                            alt={selectedDevice.name}
                                            className="max-w-full max-h-full object-contain"
                                        />
                                    ) : (
                                        <Smartphone className="w-10 h-10 text-zinc-300" />
                                    )}
                                </div>
                                {/* Device & Repair Info */}
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg sm:text-xl font-bold text-zinc-900">
                                        {selectedBrand?.name} {selectedDevice?.name}
                                    </h2>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                                            {selectedRepair?.service?.icon ? (
                                                <img src={getImageUrl(selectedRepair.service.icon)} alt="" className="w-4 h-4" />
                                            ) : (
                                                <Wrench className="w-3.5 h-3.5" />
                                            )}
                                            {selectedRepair?.service?.name}
                                        </span>
                                        {selectedRepair?.priceText && (
                                            <span className="text-sm font-semibold text-green-600">
                                                {selectedRepair.priceText}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500 mt-1">
                                        {selectedDate?.toLocaleDateString("nl-BE", { weekday: "long", day: "numeric", month: "long" })} om {selectedSlot}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        <User className="inline w-4 h-4 mr-1" /> Volledige naam *
                                    </label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Jan Janssen"
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                                        <Phone className="inline w-4 h-4 mr-1" /> Telefoonnummer *
                                    </label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="+32 4XX XX XX XX"
                                        className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    <Mail className="inline w-4 h-4 mr-1" /> E-mailadres *
                                </label>
                                <input
                                    type="email"
                                    value={customerEmail}
                                    onChange={(e) => setCustomerEmail(e.target.value)}
                                    placeholder="jan@voorbeeld.be"
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">Opmerkingen (optioneel)</label>
                                <textarea
                                    value={problemDescription}
                                    onChange={(e) => setProblemDescription(e.target.value)}
                                    rows={3}
                                    placeholder="Extra informatie over het probleem..."
                                    className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500"
                                />
                            </div>

                            <div className="flex gap-4">
                                <Button variant="outline" onClick={() => setStep(4)} className="flex-1">Terug</Button>
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || !customerName || !customerEmail || !customerPhone}
                                    className="flex-1"
                                >
                                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Bevestigen...</> : "Afspraak Bevestigen"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
