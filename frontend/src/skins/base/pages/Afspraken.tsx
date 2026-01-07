'use client';

/**
 * Base Skin - Afspraken (Appointments) Page
 * PURE PRESENTATION ONLY
 */

import Link from 'next/link';
import type { AfsprakenPageVM, AppointmentVM } from '@core/hooks/pages/useAfsprakenPageVM';
import { Calendar, Clock, ChevronLeft, Loader2, AlertCircle, Wrench } from 'lucide-react';

export interface AfsprakenPageProps {
    vm: AfsprakenPageVM;
}

function AppointmentCard({ appointment }: { appointment: AppointmentVM }) {
    return (
        <div className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-zinc-900">
                        {appointment.deviceBrand} {appointment.deviceModel}
                    </h3>
                    <p className="text-sm text-zinc-500">{appointment.problemDescription}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${appointment.statusBadge.bg} ${appointment.statusBadge.text}`}>
                    {appointment.statusBadge.label}
                </span>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-zinc-400" />
                    <span>{appointment.formattedDate}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span>{appointment.timeSlot}</span>
                </div>
            </div>
        </div>
    );
}

export function AfsprakenPage({ vm }: AfsprakenPageProps) {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <Link href="/account" className="inline-flex items-center text-sm text-zinc-500 hover:text-zinc-900 mb-4">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Terug naar account
                </Link>
                <h1 className="text-3xl font-bold text-zinc-900">Mijn Afspraken</h1>
                <p className="text-zinc-600 mt-1">Bekijk en beheer uw reparatie-afspraken</p>
            </div>

            {vm.isLoading ? (
                <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                </div>
            ) : vm.error ? (
                <div className="text-center py-16">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <p className="text-zinc-600">{vm.error}</p>
                </div>
            ) : !vm.hasAppointments ? (
                <div className="text-center py-16">
                    <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Calendar className="w-8 h-8 text-zinc-400" />
                    </div>
                    <h2 className="text-xl font-semibold text-zinc-900 mb-2">Geen afspraken gevonden</h2>
                    <p className="text-zinc-600 mb-6">U heeft nog geen reparatie-afspraken gemaakt.</p>
                    <Link
                        href="/repair/book"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                        <Wrench className="w-4 h-4" />
                        Maak Afspraak
                    </Link>
                </div>
            ) : (
                <div className="space-y-4">
                    {vm.appointments.map((appointment) => (
                        <AppointmentCard key={appointment.id} appointment={appointment} />
                    ))}
                </div>
            )}
        </div>
    );
}
