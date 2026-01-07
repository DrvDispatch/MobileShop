'use client';

/**
 * Classic Skin - Book Services Page
 * 
 * Clean professional booking flow with:
 * - Step indicator
 * - Service selection
 * - Date/time picker  
 * - Contact form
 * - Confirmation
 */

import Link from 'next/link';
import { Calendar, Clock, User, CheckCircle, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import type { BookServicesPageVM } from '@core/hooks/pages';

// Re-export the VM type
export type { BookServicesPageVM };

interface BookServicesPageProps {
    vm: BookServicesPageVM;
}

export function BookServicesPage({ vm }: BookServicesPageProps) {
    const {
        currentStep,
        currentStepIndex,
        steps,
        currentServices,
        selections,
        customerData,
        setCustomerData,
        availableSlots,
        availableDates,
        selectService,
        selectDate,
        selectTimeSlot,
        goBack,
        goNext,
        canGoNext,
        canGoBack,
        isLoading,
        isSubmitting,
        isSuccess,
        error,
        submit,
        reset,
    } = vm;

    // Step labels
    const stepLabels: Record<string, string> = {
        'select_service': 'Select Service',
        'select_time': 'Choose Time',
        'contact': 'Your Details',
        'confirm': 'Confirm',
    };

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500">Loading services...</p>
                </div>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center py-20">
                <div className="max-w-md mx-auto text-center px-6">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h1 className="font-serif text-3xl font-bold text-slate-800 mb-4">Booking Confirmed!</h1>
                    <p className="text-slate-600 mb-8">
                        Thank you, {customerData.name}! We have sent a confirmation to {customerData.email}.
                    </p>
                    <div className="bg-slate-50 rounded-lg p-6 mb-8 text-left border border-slate-200">
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-slate-500">Service</span>
                                <span className="font-medium text-slate-800">{selections.service?.name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Date</span>
                                <span className="font-medium text-slate-800">
                                    {selections.date?.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-500">Time</span>
                                <span className="font-medium text-slate-800">{selections.timeSlot}</span>
                            </div>
                            {selections.service?.price && (
                                <div className="flex justify-between pt-3 border-t border-slate-200">
                                    <span className="text-slate-500">Price</span>
                                    <span className="font-bold text-green-600">€{selections.service.price}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={reset}
                            className="px-6 py-3 border-2 border-slate-300 text-slate-700 font-semibold rounded hover:border-slate-400 transition-colors"
                        >
                            Book Another
                        </button>
                        <Link
                            href="/"
                            className="px-6 py-3 bg-slate-800 text-white font-semibold rounded hover:bg-slate-700 transition-colors"
                        >
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-[70vh] py-12">
            <div className="max-w-3xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="font-serif text-3xl font-bold text-slate-800 mb-2">Book an Appointment</h1>
                    <p className="text-slate-600">Select your service and preferred time slot</p>
                </div>

                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-10">
                    {steps.map((step, index) => (
                        <div key={step} className="flex items-center">
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold
                                ${index <= currentStepIndex
                                    ? 'bg-slate-800 text-white'
                                    : 'bg-white border-2 border-slate-300 text-slate-400'}
                            `}>
                                {index + 1}
                            </div>
                            <span className={`ml-2 text-sm hidden sm:block ${index <= currentStepIndex ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>
                                {stepLabels[step] || step}
                            </span>
                            {index < steps.length - 1 && (
                                <div className={`w-8 sm:w-12 h-0.5 mx-2 ${index < currentStepIndex ? 'bg-slate-800' : 'bg-slate-300'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="bg-white rounded-lg border-2 border-slate-200 p-6 sm:p-8">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
                            {error}
                        </div>
                    )}

                    {/* Service Selection Step */}
                    {currentStep === 'select_service' && (
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Choose a Service</h2>
                            {currentServices.length === 0 ? (
                                <div className="text-center py-12 text-slate-500">
                                    <p>No services available at the moment.</p>
                                    <p className="text-sm mt-2">Please check back later or contact us.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {currentServices.map((service) => (
                                        <button
                                            key={service.id}
                                            onClick={() => selectService(service)}
                                            className={`w-full text-left p-4 rounded-lg border-2 transition-all ${selections.service?.id === service.id
                                                    ? 'border-slate-800 bg-slate-50'
                                                    : 'border-slate-200 hover:border-slate-400'
                                                }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-slate-800">{service.name}</h3>
                                                    {service.duration && (
                                                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {service.duration} min
                                                        </p>
                                                    )}
                                                </div>
                                                {service.price && (
                                                    <span className="text-lg font-bold text-slate-800">€{service.price}</span>
                                                )}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Date/Time Selection Step */}
                    {currentStep === 'select_time' && (
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Choose Date & Time</h2>

                            {/* Date Selection */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-slate-700 mb-3">Select a Date</label>
                                <div className="flex flex-wrap gap-2">
                                    {availableDates.slice(0, 7).map((date) => {
                                        const isSelected = selections.date?.toDateString() === date.toDateString();
                                        return (
                                            <button
                                                key={date.toISOString()}
                                                onClick={() => selectDate(date)}
                                                className={`px-4 py-3 rounded-lg border-2 transition-all min-w-[80px] ${isSelected
                                                        ? 'border-slate-800 bg-slate-800 text-white'
                                                        : 'border-slate-200 hover:border-slate-400'
                                                    }`}
                                            >
                                                <div className="text-xs uppercase">{date.toLocaleDateString('nl-NL', { weekday: 'short' })}</div>
                                                <div className="text-lg font-bold">{date.getDate()}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Time Selection */}
                            {selections.date && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-3">Select a Time</label>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                                        {availableSlots.map((slot) => {
                                            const isSelected = selections.timeSlot === slot;
                                            return (
                                                <button
                                                    key={slot}
                                                    onClick={() => selectTimeSlot(slot)}
                                                    className={`py-3 px-4 rounded-lg border-2 transition-all ${isSelected
                                                            ? 'border-slate-800 bg-slate-800 text-white'
                                                            : 'border-slate-200 hover:border-slate-400'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Contact Step */}
                    {currentStep === 'contact' && (
                        <div>
                            <h2 className="text-xl font-semibold text-slate-800 mb-6">Your Details</h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name *</label>
                                    <input
                                        type="text"
                                        value={customerData.name}
                                        onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none transition-colors"
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Email Address *</label>
                                    <input
                                        type="email"
                                        value={customerData.email}
                                        onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none transition-colors"
                                        placeholder="john@example.com"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={customerData.phone}
                                        onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none transition-colors"
                                        placeholder="+31 6 12345678"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Notes (optional)</label>
                                    <textarea
                                        value={customerData.notes}
                                        onChange={(e) => setCustomerData(prev => ({ ...prev, notes: e.target.value }))}
                                        className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-slate-800 focus:outline-none transition-colors"
                                        placeholder="Any special requests..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                        <button
                            onClick={goBack}
                            disabled={!canGoBack}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${canGoBack
                                    ? 'text-slate-700 hover:bg-slate-100'
                                    : 'text-slate-300 cursor-not-allowed'
                                }`}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>

                        {currentStep === 'contact' ? (
                            <button
                                onClick={submit}
                                disabled={!canGoNext || isSubmitting}
                                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${canGoNext && !isSubmitting
                                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        Booking...
                                    </>
                                ) : (
                                    <>
                                        Confirm Booking
                                        <CheckCircle className="w-5 h-5" />
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                onClick={goNext}
                                disabled={!canGoNext}
                                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-colors ${canGoNext
                                        ? 'bg-slate-800 text-white hover:bg-slate-700'
                                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                Continue
                                <ArrowRight className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
