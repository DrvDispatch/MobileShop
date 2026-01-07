'use client';

/**
 * Barbershop Skin - Book Appointment Page
 * 
 * Simplified booking flow with barbershop aesthetics.
 * Same VM as base skin, different visual presentation.
 * 
 * PROPS-ONLY: No hooks, no fetch, no logic.
 */

import Link from 'next/link';
import { BookingStep, interpolate } from '@core/hooks/pages';
import { getImageUrl } from '@/lib/image-utils';
import {
    ChevronLeft, Calendar, Clock, User, Mail, Phone,
    CheckCircle, Loader2, AlertCircle, Search, Scissors
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
        step, selections, customerData, setCustomerData, repairs,
        availableDates, availableSlots, selectRepair,
        selectDate, selectTimeSlot, setStep,
        isLoading, isSubmitting, isSuccess, error, submit, goBack,
    } = booking;

    const { repair, date: selectedDate, timeSlot: selectedSlot } = selections;

    // Progress indicator
    const steps = ['Service', 'Date & Time', 'Your Details'];
    const currentStepIndex = step === BookingStep.REPAIR ? 0 : step === BookingStep.DATE_TIME ? 1 : 2;

    if (isSuccess) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-stone-50">
                <div className="max-w-md mx-auto px-6 text-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-4">{bookingLabels.success.title}</h1>
                    <p className="text-stone-600 mb-2">{interpolate(bookingLabels.success.thanks, { name: customerData.name })}</p>
                    <p className="text-stone-500 mb-8">{interpolate(bookingLabels.success.confirmationText, { email: customerData.email })}</p>

                    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 text-left">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-stone-500">{bookingLabels.success.repairLabel}</span>
                                <span className="font-medium text-stone-900">{repair?.service?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">{bookingLabels.success.dateLabel}</span>
                                <span className="font-medium text-stone-900">{selectedDate?.toLocaleDateString(formatting.dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">{bookingLabels.success.timeLabel}</span>
                                <span className="font-medium text-stone-900">{selectedSlot}</span>
                            </div>
                            <div className="flex justify-between border-t border-stone-100 pt-3 mt-3">
                                <span className="text-stone-500">{bookingLabels.success.priceLabel}</span>
                                <span className="font-bold text-amber-600">{repair?.priceText || bookingLabels.success.priceOnRequest}</span>
                            </div>
                        </div>
                    </div>

                    <Link href="/" className="inline-flex items-center justify-center px-6 py-3 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 transition-colors">
                        {bookingLabels.success.backToHome}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-stone-50 py-12">
            <div className="max-w-2xl mx-auto px-6">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-sm text-stone-500 hover:text-stone-900 mb-4">
                        <ChevronLeft className="w-4 h-4 mr-1" />
                        Back
                    </Link>
                    <h1 className="text-3xl font-bold text-stone-900">Book Your Appointment</h1>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-10">
                    {steps.map((s, i) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= currentStepIndex ? 'bg-amber-500 text-stone-900' : 'bg-stone-200 text-stone-500'}`}>
                                {i + 1}
                            </div>
                            <span className={`ml-2 text-sm ${i <= currentStepIndex ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>{s}</span>
                            {i < steps.length - 1 && <div className={`w-8 h-px mx-2 ${i < currentStepIndex ? 'bg-amber-500' : 'bg-stone-200'}`} />}
                        </div>
                    ))}
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />{error}
                    </div>
                )}

                {isLoading && (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
                    </div>
                )}

                {/* Step: Service Selection */}
                {step === BookingStep.REPAIR && !isLoading && (
                    <div className="space-y-4">
                        <p className="text-stone-600 mb-6">What service would you like?</p>
                        {repairs.length === 0 ? (
                            <p className="text-center text-stone-500 py-8">{bookingLabels.emptyStates.noRepairs}</p>
                        ) : (
                            repairs.map((r) => (
                                <button
                                    key={r.id}
                                    onClick={() => selectRepair(r)}
                                    className="w-full flex items-center justify-between p-5 bg-white rounded-xl border-2 border-stone-200 hover:border-amber-500 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                                            {r.service?.icon ? (
                                                <img src={getImageUrl(r.service.icon)} alt="" className="w-6 h-6 object-contain" />
                                            ) : (
                                                <Scissors className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-stone-900">{r.service?.name}</p>
                                            {r.duration && <p className="text-sm text-stone-500">{r.duration}</p>}
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-amber-600">{r.priceText || bookingLabels.repairSection.onRequest}</span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Step: Date & Time */}
                {step === BookingStep.DATE_TIME && (
                    <div className="space-y-8">
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-4">
                                <Calendar className="w-4 h-4" /> {bookingLabels.datetime.selectDate}
                            </label>
                            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                                {availableDates.map((date) => (
                                    <button
                                        key={date.toISOString()}
                                        onClick={() => selectDate(date)}
                                        className={`p-3 rounded-xl border-2 text-center transition-colors ${selectedDate?.toDateString() === date.toDateString() ? 'border-amber-500 bg-amber-500 text-stone-900' : 'border-stone-200 bg-white hover:border-amber-300'}`}
                                    >
                                        <p className="text-xs uppercase">{date.toLocaleDateString(formatting.dateLocale, { weekday: 'short' })}</p>
                                        <p className="text-lg font-bold">{date.getDate()}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {selectedDate && (
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-4">
                                    <Clock className="w-4 h-4" /> {bookingLabels.datetime.selectTime}
                                </label>
                                <div className="grid grid-cols-4 gap-2">
                                    {availableSlots.map((slot) => (
                                        <button
                                            key={slot}
                                            onClick={() => selectTimeSlot(slot)}
                                            className={`p-3 rounded-xl border-2 font-medium transition-colors ${selectedSlot === slot ? 'border-amber-500 bg-amber-500 text-stone-900' : 'border-stone-200 bg-white hover:border-amber-300'}`}
                                        >
                                            {slot}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-4 pt-4">
                            <button onClick={goBack} className="flex-1 py-3 px-6 border-2 border-stone-300 rounded-full font-medium text-stone-700 hover:border-stone-400 transition-colors">
                                {bookingLabels.navigation.previous}
                            </button>
                            <button
                                onClick={() => setStep(BookingStep.CONTACT)}
                                disabled={!selectedDate || !selectedSlot}
                                className="flex-1 py-3 px-6 bg-amber-500 rounded-full font-semibold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {bookingLabels.navigation.next}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Contact Details */}
                {step === BookingStep.CONTACT && (
                    <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6">
                        <div className="grid sm:grid-cols-2 gap-4">
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                                    <User className="w-4 h-4" /> {bookingLabels.form.nameLabel} *
                                </label>
                                <input
                                    type="text"
                                    value={customerData.name}
                                    onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder={bookingLabels.form.namePlaceholder}
                                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                                    <Phone className="w-4 h-4" /> {bookingLabels.form.phoneLabel} *
                                </label>
                                <input
                                    type="tel"
                                    value={customerData.phone}
                                    onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                    placeholder={bookingLabels.form.phonePlaceholder}
                                    className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-stone-700 mb-2">
                                <Mail className="w-4 h-4" /> {bookingLabels.form.emailLabel} *
                            </label>
                            <input
                                type="email"
                                value={customerData.email}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                placeholder={bookingLabels.form.emailPlaceholder}
                                className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-stone-700 mb-2 block">{bookingLabels.form.notesLabel}</label>
                            <textarea
                                value={customerData.notes}
                                onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                                rows={3}
                                placeholder={bookingLabels.form.notesPlaceholder}
                                className="w-full px-4 py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button onClick={goBack} className="flex-1 py-3 px-6 border-2 border-stone-300 rounded-full font-medium text-stone-700 hover:border-stone-400 transition-colors">
                                {bookingLabels.navigation.previous}
                            </button>
                            <button
                                onClick={submit}
                                disabled={isSubmitting || !customerData.name || !customerData.email || !customerData.phone}
                                className="flex-1 py-3 px-6 bg-amber-500 rounded-full font-semibold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader2 className="w-4 h-4 animate-spin" /> {bookingLabels.navigation.confirm}...</>
                                ) : (
                                    bookingLabels.navigation.confirm
                                )}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
