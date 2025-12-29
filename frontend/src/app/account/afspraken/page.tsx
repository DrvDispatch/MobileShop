"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Navbar, Footer } from "@/components/landing";
import { Calendar, Clock, ChevronLeft, Loader2, AlertCircle, CheckCircle, Phone, Wrench } from "lucide-react";
import { api } from "@/lib/api";

interface Appointment {
    id: string;
    customerName: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription: string;
    appointmentDate: string;
    timeSlot: string;
    status: string;
    createdAt: string;
}

export default function AfsprakenPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const data = await api.getMyAppointments();
            setAppointments(data || []);
        } catch (err) {
            console.error("Failed to fetch appointments:", err);
            setError("Kon afspraken niet laden. Probeer opnieuw.");
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toLowerCase()) {
            case "confirmed":
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">Bevestigd</span>;
            case "pending":
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">In behandeling</span>;
            case "completed":
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-700">Afgerond</span>;
            case "cancelled":
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700">Geannuleerd</span>;
            default:
                return <span className="px-2 py-1 text-xs font-medium rounded-full bg-zinc-100 text-zinc-700">{status}</span>;
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString("nl-BE", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

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

                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-zinc-400 animate-spin" />
                    </div>
                ) : error ? (
                    <div className="text-center py-16">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <p className="text-zinc-600">{error}</p>
                    </div>
                ) : appointments.length === 0 ? (
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
                        {appointments.map((appointment) => (
                            <div
                                key={appointment.id}
                                className="bg-white border border-zinc-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="font-semibold text-zinc-900">
                                            {appointment.deviceBrand} {appointment.deviceModel}
                                        </h3>
                                        <p className="text-sm text-zinc-500">{appointment.problemDescription}</p>
                                    </div>
                                    {getStatusBadge(appointment.status)}
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm text-zinc-600">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-4 h-4 text-zinc-400" />
                                        <span>{formatDate(appointment.appointmentDate)}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-zinc-400" />
                                        <span>{appointment.timeSlot}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <Footer />
        </main>
    );
}
