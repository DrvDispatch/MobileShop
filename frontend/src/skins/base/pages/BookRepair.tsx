'use client';

/**
 * Base Skin - Book Repair Page
 * 
 * Purely presentational. Receives data via props from BookingPageVM.
 */

import Link from 'next/link';
// Navbar/Footer now provided by PublicLayout
import { Button } from '../components/ui/button';
import { getImageUrl } from '@/lib/image-utils';
import { BookingStep, interpolate } from '@core/hooks/pages';
import {
    ChevronLeft, Smartphone, Tablet, Calendar, Clock, Phone, User, Mail,
    CheckCircle, Loader2, AlertCircle, Search, Wrench,
} from 'lucide-react';

export interface BookingPageVM {
    booking: {
        step: BookingStep;
        selections: {
            deviceType: { id: string; name: string; slug: string; icon?: string } | null;
            brand: { id: string; name: string; logo?: string } | null;
            device: { id: string; name: string; image?: string } | null;
            repair: { id: string; service?: { name: string; icon?: string }; priceText?: string; duration?: string } | null;
            date: Date | null;
            timeSlot: string;
        };
        customerData: { name: string; phone: string; email: string; notes: string };
        setCustomerData: React.Dispatch<React.SetStateAction<{ name: string; phone: string; email: string; notes: string }>>;
        deviceTypes: { id: string; name: string; slug: string; icon?: string }[];
        brands: { id: string; name: string; logo?: string }[];
        filteredDevices: { id: string; name: string; image?: string }[];
        repairs: { id: string; service?: { name: string; icon?: string }; priceText?: string; duration?: string }[];
        availableDates: Date[];
        availableSlots: string[];
        searchQuery: string;
        setSearchQuery: (query: string) => void;
        selectDeviceType: (dt: { id: string; name: string; slug: string; icon?: string }) => void;
        selectBrand: (b: { id: string; name: string; logo?: string }) => void;
        selectDevice: (d: { id: string; name: string; image?: string }) => void;
        selectRepair: (r: { id: string; service?: { name: string; icon?: string }; priceText?: string; duration?: string }) => void;
        selectDate: (date: Date) => void;
        selectTimeSlot: (slot: string) => void;
        navigateToStep: (step: BookingStep) => void;
        setStep: (step: BookingStep) => void;
        goBack: () => void;
        submit: () => Promise<void>;
        isLoading: boolean;
        isSubmitting: boolean;
        isSuccess: boolean;
        error: string | null;
    };
    uiConfig: {
        labels: {
            booking: {
                stepTitles: { deviceType: string; brand: string; device: string; repair: string; datetime: string; contact: string };
                navigation: { previous: string; next: string; confirm: string };
                success: { title: string; thanks: string; confirmationText: string; deviceLabel: string; repairLabel: string; priceLabel: string; dateLabel: string; timeLabel: string; priceOnRequest: string; backToHome: string };
                emptyStates: { noBrands: string; noDevices: string; noDevicesSearch: string; noRepairs: string };
                search: { placeholder: string };
                repairSection: { repairTitle: string; selectDamage: string; onRequest: string };
                datetime: { selectDate: string; selectTime: string };
                form: { nameLabel: string; namePlaceholder: string; phoneLabel: string; phonePlaceholder: string; emailLabel: string; emailPlaceholder: string; notesLabel: string; notesPlaceholder: string };
            };
        };
        formatting: { dateLocale: string };
    };
}

export function BookRepairPage({ vm }: { vm: BookingPageVM }) {
    const { booking, uiConfig } = vm;
    const { labels, formatting } = uiConfig;
    const bookingLabels = labels.booking;

    const {
        step, selections, customerData, setCustomerData, deviceTypes, brands, filteredDevices, repairs,
        availableDates, availableSlots, selectDeviceType, selectBrand, selectDevice, selectRepair,
        selectDate, selectTimeSlot, navigateToStep, setStep, searchQuery, setSearchQuery,
        isLoading, isSubmitting, isSuccess, error, submit, goBack,
    } = booking;

    const { deviceType, brand, device, repair, date: selectedDate, timeSlot: selectedSlot } = selections;

    const getStepTitle = () => {
        switch (step) {
            case BookingStep.DEVICE_TYPE: return bookingLabels.stepTitles.deviceType;
            case BookingStep.BRAND: return bookingLabels.stepTitles.brand;
            case BookingStep.DEVICE: return bookingLabels.stepTitles.device;
            case BookingStep.REPAIR: return bookingLabels.stepTitles.repair;
            case BookingStep.DATE_TIME: return bookingLabels.stepTitles.datetime;
            case BookingStep.CONTACT: return bookingLabels.stepTitles.contact;
            default: return "";
        }
    };

    if (isSuccess) {
        return (
            <div className="max-w-2xl mx-auto px-4 py-20 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h1 className="text-3xl font-bold text-zinc-900 mb-4">{bookingLabels.success.title}</h1>
                <p className="text-lg text-zinc-600 mb-2">{interpolate(bookingLabels.success.thanks, { name: customerData.name })}</p>
                <p className="text-zinc-600 mb-8">{interpolate(bookingLabels.success.confirmationText, { email: customerData.email })}</p>
                <div className="bg-zinc-50 rounded-xl p-6 mb-8 text-left">
                    <h3 className="font-semibold text-zinc-900 mb-3">Details:</h3>
                    <div className="space-y-2 text-sm text-zinc-600">
                        <p><strong>{bookingLabels.success.deviceLabel}</strong> {brand?.name} {device?.name}</p>
                        <p><strong>{bookingLabels.success.repairLabel}</strong> {repair?.service?.name}</p>
                        <p><strong>{bookingLabels.success.priceLabel}</strong> {repair?.priceText || bookingLabels.success.priceOnRequest}</p>
                        <p><strong>{bookingLabels.success.dateLabel}</strong> {selectedDate?.toLocaleDateString(formatting.dateLocale, { weekday: "long", day: "numeric", month: "long" })}</p>
                        <p><strong>{bookingLabels.success.timeLabel}</strong> {selectedSlot}</p>
                    </div>
                </div>
                <Link href="/"><Button>{bookingLabels.success.backToHome}</Button></Link>
            </div>
        );
    }

    return (
        <div className="bg-zinc-50 py-8">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link href="/repair" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" />{bookingLabels.navigation.previous}
                    </Link>
                    <h1 className="text-3xl font-bold text-zinc-900">{getStepTitle()}</h1>
                    {step > 0 && (
                        <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500 flex-wrap">
                            {deviceType && <button onClick={() => navigateToStep(BookingStep.DEVICE_TYPE)} className="hover:text-zinc-900 hover:underline">{deviceType.name}</button>}
                            {brand && <><span>/</span><button onClick={() => navigateToStep(BookingStep.BRAND)} className="hover:text-zinc-900 hover:underline">{brand.name}</button></>}
                            {device && <><span>/</span><button onClick={() => navigateToStep(BookingStep.DEVICE)} className="hover:text-zinc-900 hover:underline">{device.name}</button></>}
                            {repair && step > BookingStep.REPAIR && <><span>/</span><button onClick={() => navigateToStep(BookingStep.REPAIR)} className="hover:text-zinc-900 hover:underline">{repair.service?.name}</button></>}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                    </div>
                )}

                {/* Step 0: Device Type */}
                {step === BookingStep.DEVICE_TYPE && !isLoading && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {deviceTypes.map((dt) => (
                            <button key={dt.id} onClick={() => selectDeviceType(dt)} className="bg-white rounded-xl border-2 border-zinc-200 p-6 text-center hover:border-zinc-400 hover:shadow-md transition-all">
                                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                    {dt.slug === "smartphone" ? <Smartphone className="w-12 h-12 text-zinc-600" /> :
                                        dt.slug === "tablet" ? <Tablet className="w-12 h-12 text-zinc-600" /> :
                                            dt.icon ? <img src={getImageUrl(dt.icon)} alt={dt.name} className="w-12 h-12 object-contain" /> :
                                                <Smartphone className="w-12 h-12 text-zinc-600" />}
                                </div>
                                <p className="font-semibold text-zinc-900">{dt.name}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 1: Brand */}
                {step === BookingStep.BRAND && !isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {brands.length === 0 ? (
                            <p className="col-span-full text-center text-zinc-500 py-8">{bookingLabels.emptyStates.noBrands}</p>
                        ) : brands.map((b) => (
                            <button key={b.id} onClick={() => selectBrand(b)} className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-zinc-400 hover:shadow-md transition-all">
                                <div className="aspect-[3/2] flex items-center justify-center mb-2">
                                    {b.logo ? <img src={getImageUrl(b.logo)} alt={b.name} className="max-h-12 object-contain" /> : <span className="text-xl font-bold text-zinc-600">{b.name}</span>}
                                </div>
                                <p className="text-sm font-medium text-zinc-700 text-center">{b.name}</p>
                            </button>
                        ))}
                    </div>
                )}

                {/* Step 2: Device */}
                {step === BookingStep.DEVICE && !isLoading && (
                    <div className="space-y-4">
                        <div className="relative max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                            <input type="text" placeholder={bookingLabels.search.placeholder} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-zinc-300 focus:border-zinc-500 focus:outline-none" />
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {filteredDevices.length === 0 ? (
                                <p className="col-span-full text-center text-zinc-500 py-8">{searchQuery ? interpolate(bookingLabels.emptyStates.noDevicesSearch, { query: searchQuery }) : bookingLabels.emptyStates.noDevices}</p>
                            ) : filteredDevices.map((d) => (
                                <button key={d.id} onClick={() => selectDevice(d)} className="bg-white rounded-xl border-2 border-zinc-200 p-4 hover:border-zinc-400 hover:shadow-md transition-all text-center">
                                    <div className="aspect-square flex items-center justify-center mb-2 bg-zinc-50 rounded-lg">
                                        {d.image ? <img src={getImageUrl(d.image)} alt={d.name} className="max-h-24 object-contain" /> : <Smartphone className="w-12 h-12 text-zinc-300" />}
                                    </div>
                                    <p className="text-sm font-medium text-zinc-900">{d.name}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Repair */}
                {step === BookingStep.REPAIR && !isLoading && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6">
                            <div className="flex items-center gap-6">
                                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-zinc-50 rounded-xl flex items-center justify-center flex-shrink-0">
                                    {device?.image ? <img src={getImageUrl(device.image)} alt={device.name} className="max-w-full max-h-full object-contain" /> : <Smartphone className="w-12 h-12 text-zinc-300" />}
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-zinc-900">{interpolate(bookingLabels.repairSection.repairTitle, { brand: brand?.name || '', device: device?.name || '' })}</h2>
                                    <p className="text-zinc-500 mt-2">{bookingLabels.repairSection.selectDamage}</p>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {repairs.length === 0 ? (
                                <p className="col-span-full text-center text-zinc-500 py-8">{bookingLabels.emptyStates.noRepairs}</p>
                            ) : repairs.map((r) => (
                                <button key={r.id} onClick={() => selectRepair(r)} className="bg-white rounded-xl border-2 border-zinc-200 p-5 hover:border-zinc-400 hover:shadow-md transition-all text-center group">
                                    <div className="w-14 h-14 mx-auto mb-3 bg-zinc-100 rounded-xl flex items-center justify-center group-hover:bg-zinc-200 transition-colors">
                                        {r.service?.icon ? <img src={getImageUrl(r.service.icon)} alt="" className="w-8 h-8 object-contain" /> : <Smartphone className="w-7 h-7 text-zinc-600" />}
                                    </div>
                                    <p className="font-semibold text-zinc-900 mb-1">{r.service?.name}</p>
                                    {r.duration && <p className="text-xs text-zinc-500 mb-2">{r.duration}</p>}
                                    <p className="font-bold text-green-600">{r.priceText || bookingLabels.repairSection.onRequest}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 4: Date & Time */}
                {step === BookingStep.DATE_TIME && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-3"><Calendar className="inline w-4 h-4 mr-1" /> {bookingLabels.datetime.selectDate}</label>
                                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                    {availableDates.map((date) => (
                                        <button key={date.toISOString()} onClick={() => selectDate(date)} className={`p-3 rounded-lg border-2 text-center transition-colors ${selectedDate?.toDateString() === date.toDateString() ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"}`}>
                                            <p className="text-xs uppercase">{date.toLocaleDateString(formatting.dateLocale, { weekday: "short" })}</p>
                                            <p className="text-lg font-bold">{date.getDate()}</p>
                                            <p className="text-xs">{date.toLocaleDateString(formatting.dateLocale, { month: "short" })}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            {selectedDate && (
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-3"><Clock className="inline w-4 h-4 mr-1" /> {bookingLabels.datetime.selectTime}</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {availableSlots.map((slot) => (
                                            <button key={slot} onClick={() => selectTimeSlot(slot)} className={`p-3 rounded-lg border-2 font-medium transition-colors ${selectedSlot === slot ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 hover:border-zinc-400"}`}>{slot}</button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={goBack} className="flex-1">{bookingLabels.navigation.previous}</Button>
                                <Button onClick={() => setStep(BookingStep.CONTACT)} disabled={!selectedDate || !selectedSlot} className="flex-1">{bookingLabels.navigation.next}</Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 5: Contact */}
                {step === BookingStep.CONTACT && (
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl border border-zinc-200 p-6 space-y-6">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2"><User className="inline w-4 h-4 mr-1" /> {bookingLabels.form.nameLabel} *</label>
                                    <input type="text" value={customerData.name} onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))} placeholder={bookingLabels.form.namePlaceholder} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-700 mb-2"><Phone className="inline w-4 h-4 mr-1" /> {bookingLabels.form.phoneLabel} *</label>
                                    <input type="tel" value={customerData.phone} onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))} placeholder={bookingLabels.form.phonePlaceholder} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2"><Mail className="inline w-4 h-4 mr-1" /> {bookingLabels.form.emailLabel} *</label>
                                <input type="email" value={customerData.email} onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))} placeholder={bookingLabels.form.emailPlaceholder} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">{bookingLabels.form.notesLabel}</label>
                                <textarea value={customerData.notes} onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))} rows={3} placeholder={bookingLabels.form.notesPlaceholder} className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-zinc-500" />
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" onClick={goBack} className="flex-1">{bookingLabels.navigation.previous}</Button>
                                <Button onClick={submit} disabled={isSubmitting || !customerData.name || !customerData.email || !customerData.phone} className="flex-1">
                                    {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {bookingLabels.navigation.confirm}...</> : bookingLabels.navigation.confirm}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
