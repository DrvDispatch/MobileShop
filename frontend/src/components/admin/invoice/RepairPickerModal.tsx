/**
 * Repair Picker Modal Component
 * Multi-step modal for selecting repair services
 */

import { Loader2, ChevronLeft, X, Smartphone, Tablet, Wrench } from "lucide-react";
import { useRepairPicker, type RepairService } from "@/lib/admin/invoice";

export interface RepairPickerModalProps {
    onSelect: (repair: RepairService) => void;
    onClose: () => void;
}

export function RepairPickerModal({ onSelect, onClose }: RepairPickerModalProps) {
    const {
        step, loading,
        deviceTypes, brands, devices, repairs,
        selectedBrand, selectedDevice,
        handleSelectDeviceType, handleSelectBrand, handleSelectDevice, handleSelectRepair,
        goBack, getBreadcrumb, getStepTitle,
    } = useRepairPicker();

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        {step > 0 && (
                            <button onClick={goBack} className="p-2 hover:bg-zinc-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                        )}
                        <div>
                            <h2 className="text-lg font-semibold">{getStepTitle()}</h2>
                            {step > 0 && <p className="text-sm text-zinc-500">{getBreadcrumb()}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
                    ) : (
                        <>
                            {/* Step 0: Device Types */}
                            {step === 0 && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {deviceTypes.map((dt) => (
                                        <button key={dt.id} onClick={() => handleSelectDeviceType(dt)} className="bg-zinc-50 rounded-xl border-2 border-zinc-200 p-6 text-center hover:border-purple-400 hover:bg-purple-50 transition-all">
                                            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                                {dt.slug === "smartphone" ? <Smartphone className="w-12 h-12 text-zinc-600" /> : dt.slug === "tablet" ? <Tablet className="w-12 h-12 text-zinc-600" /> : <Smartphone className="w-12 h-12 text-zinc-600" />}
                                            </div>
                                            <p className="font-semibold text-zinc-900">{dt.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 1: Brands */}
                            {step === 1 && (
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                    {brands.map((brand) => (
                                        <button key={brand.id} onClick={() => handleSelectBrand(brand)} className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-purple-400 hover:shadow-md transition-all">
                                            <div className="aspect-[3/2] flex items-center justify-center mb-2">
                                                {brand.logo ? <img src={brand.logo} alt={brand.name} className="max-h-10 object-contain" /> : <span className="text-lg font-bold text-zinc-600">{brand.name}</span>}
                                            </div>
                                            <p className="text-sm font-medium text-zinc-700 text-center">{brand.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 2: Devices */}
                            {step === 2 && (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {devices.map((device) => (
                                        <button key={device.id} onClick={() => handleSelectDevice(device)} className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-purple-400 hover:shadow-md transition-all text-center">
                                            <div className="aspect-square flex items-center justify-center mb-2 bg-zinc-50 rounded-lg">
                                                {device.image ? <img src={device.image} alt={device.name} className="max-h-20 object-contain" /> : <Smartphone className="w-10 h-10 text-zinc-300" />}
                                            </div>
                                            <p className="text-sm font-medium text-zinc-900">{device.name}</p>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Step 3: Repairs */}
                            {step === 3 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 p-4 bg-zinc-50 rounded-xl">
                                        <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                                            {selectedDevice?.image ? <img src={selectedDevice.image} alt={selectedDevice.name} className="max-w-full max-h-full object-contain" /> : <Smartphone className="w-10 h-10 text-zinc-300" />}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{selectedBrand?.name} {selectedDevice?.name}</h3>
                                            <p className="text-sm text-zinc-500">Selecteer de gewenste reparatie</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                        {repairs.map((repair) => (
                                            <button key={repair.id} onClick={() => onSelect(handleSelectRepair(repair))} className="bg-white border-2 border-zinc-200 rounded-xl p-4 text-left hover:border-purple-400 hover:bg-purple-50 transition-all">
                                                <div className="flex items-center gap-2 mb-2">
                                                    {repair.service?.icon ? <img src={repair.service.icon} alt="" className="w-6 h-6" /> : <Wrench className="w-5 h-5 text-purple-600" />}
                                                    <span className="font-medium text-sm">{repair.service?.name}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-lg font-bold text-purple-600">{repair.priceText || (repair.price ? `€${Number(repair.price).toFixed(2)}` : "Op aanvraag")}</span>
                                                </div>
                                                {repair.duration && <p className="text-xs text-zinc-500 mt-1">{repair.duration}</p>}
                                            </button>
                                        ))}
                                    </div>

                                    {repairs.length === 0 && <p className="text-center text-zinc-500 py-8">Geen reparaties gevonden voor dit toestel.</p>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
