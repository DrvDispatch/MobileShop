'use client';

/**
 * Barbershop Skin - Book Services Page
 * 
 * PROPS-ONLY: Uses BookServicesPageVM from core.
 * No hooks, no fetch, no logic - pure presentation.
 * 
 * Displays services from the tenant's service catalog (owner-managed).
 */

import Link from 'next/link';
import type { BookServicesPageVM } from '@core/hooks/pages';
import {
    ChevronLeft, Calendar, Clock, User, Mail, Phone,
    CheckCircle, Loader2, AlertCircle, Scissors
} from 'lucide-react';

export function BookServicesPage({ vm }: { vm: BookServicesPageVM }) {
    const {
        // Config
        steps,
        currentStep,
        currentStepIndex,

        // Data
        catalog,
        currentCategories,
        currentServices,
        selections,
        customerData,
        setCustomerData,
        availableSlots,
        availableDates,

        // Actions
        selectCategory,
        selectService,
        selectDate,
        selectTimeSlot,

        // Navigation
        goBack,
        goNext,
        canGoNext,
        canGoBack,

        // Status
        isLoading,
        isSubmitting,
        isSuccess,
        error,

        // Submit
        submit,
        reset,

        // UI Config
        uiConfig,
    } = vm;

    const { service, date: selectedDate, timeSlot: selectedSlot, categoryPath } = selections;
    const bookingLabels = uiConfig.labels.booking;

    // Get simplified step names for progress bar
    const stepLabels: Record<string, string> = {
        'select_category': 'Category',
        'select_service': 'Service',
        'select_time': 'Date & Time',
        'contact': 'Your Details',
        'confirm': 'Confirm',
    };

    // Success screen
    if (isSuccess) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center bg-stone-50">
                <div className="max-w-md mx-auto px-6 text-center">
                    <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-stone-900 mb-4">{bookingLabels.success.title}</h1>
                    <p className="text-stone-600 mb-2">Thank you, {customerData.name}!</p>
                    <p className="text-stone-500 mb-8">We&apos;ve sent a confirmation to {customerData.email}</p>

                    <div className="bg-white rounded-2xl border border-stone-200 p-6 mb-8 text-left">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-stone-500">Service</span>
                                <span className="font-medium text-stone-900">{service?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">Date</span>
                                <span className="font-medium text-stone-900">
                                    {selectedDate?.toLocaleDateString(uiConfig.formatting.dateLocale, { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-stone-500">Time</span>
                                <span className="font-medium text-stone-900">{selectedSlot}</span>
                            </div>
                            {service?.price && (
                                <div className="flex justify-between border-t border-stone-100 pt-3 mt-3">
                                    <span className="text-stone-500">Price</span>
                                    <span className="font-bold text-amber-600">€{service.price}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={reset}
                            className="flex-1 py-3 px-6 border-2 border-stone-300 rounded-full font-medium text-stone-700 hover:border-stone-400"
                        >
                            Book Another
                        </button>
                        <Link href="/" className="flex-1 py-3 px-6 bg-stone-900 text-white font-medium rounded-full hover:bg-stone-800 text-center">
                            {bookingLabels.success.backToHome}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // All services (flat list or from categories)
    const allServices = catalog?.services || [];
    const categoryServices = currentCategories.flatMap(cat => cat.services || []);
    const displayServices = currentServices.length > 0 ? currentServices : [...allServices, ...categoryServices];

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
                    {steps.map((stepId, i) => (
                        <div key={stepId} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${i <= currentStepIndex ? 'bg-amber-500 text-stone-900' : 'bg-stone-200 text-stone-500'}`}>
                                {i + 1}
                            </div>
                            <span className={`ml-2 text-sm hidden sm:inline ${i <= currentStepIndex ? 'text-stone-900 font-medium' : 'text-stone-400'}`}>
                                {stepLabels[stepId] || stepId}
                            </span>
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

                {/* Step: Category Selection */}
                {currentStep === 'select_category' && !isLoading && (
                    <div className="space-y-4">
                        <p className="text-stone-600 mb-6">Select a category:</p>
                        {categoryPath.length > 0 && (
                            <div className="flex items-center gap-2 text-sm text-stone-500 mb-4">
                                {categoryPath.map((cat, i) => (
                                    <span key={cat.id}>
                                        {i > 0 && ' → '}
                                        {cat.name}
                                    </span>
                                ))}
                            </div>
                        )}
                        {currentCategories.length === 0 ? (
                            <p className="text-center text-stone-500 py-8">No categories available.</p>
                        ) : (
                            currentCategories.map((category) => (
                                <button
                                    key={category.id}
                                    onClick={() => selectCategory(category)}
                                    className="w-full flex items-center justify-between p-5 bg-white rounded-xl border-2 border-stone-200 hover:border-amber-500 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center text-2xl group-hover:bg-amber-500 transition-colors">
                                            {category.icon || '📁'}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-stone-900">{category.name}</p>
                                            {category.description && <p className="text-sm text-stone-500">{category.description}</p>}
                                        </div>
                                    </div>
                                    <ChevronLeft className="w-5 h-5 text-stone-400 rotate-180" />
                                </button>
                            ))
                        )}
                        {canGoBack && (
                            <button onClick={goBack} className="w-full py-3 px-6 border-2 border-stone-300 rounded-full font-medium text-stone-700 hover:border-stone-400 transition-colors mt-4">
                                {bookingLabels.navigation.previous}
                            </button>
                        )}
                    </div>
                )}

                {/* Step: Service Selection */}
                {currentStep === 'select_service' && !isLoading && (
                    <div className="space-y-4">
                        <p className="text-stone-600 mb-6">What service would you like?</p>
                        {displayServices.length === 0 ? (
                            <p className="text-center text-stone-500 py-8">{bookingLabels.emptyStates.noRepairs}</p>
                        ) : (
                            displayServices.map((svc) => (
                                <button
                                    key={svc.id}
                                    onClick={() => selectService(svc)}
                                    className="w-full flex items-center justify-between p-5 bg-white rounded-xl border-2 border-stone-200 hover:border-amber-500 transition-colors text-left group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center group-hover:bg-amber-500 transition-colors">
                                            {svc.icon ? (
                                                <span className="text-2xl">{svc.icon}</span>
                                            ) : (
                                                <Scissors className="w-6 h-6 text-amber-600 group-hover:text-white transition-colors" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-stone-900">{svc.name}</p>
                                            {svc.duration && <p className="text-sm text-stone-500">{svc.duration} min</p>}
                                        </div>
                                    </div>
                                    <span className="text-lg font-bold text-amber-600">
                                        {svc.price ? `€${svc.price}` : 'Op aanvraag'}
                                    </span>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Step: Date & Time */}
                {currentStep === 'select_time' && (
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
                                        <p className="text-xs uppercase">{date.toLocaleDateString(uiConfig.formatting.dateLocale, { weekday: 'short' })}</p>
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
                                onClick={goNext}
                                disabled={!canGoNext}
                                className="flex-1 py-3 px-6 bg-amber-500 rounded-full font-semibold text-stone-900 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {bookingLabels.navigation.next}
                            </button>
                        </div>
                    </div>
                )}

                {/* Step: Contact Details */}
                {currentStep === 'contact' && (
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
