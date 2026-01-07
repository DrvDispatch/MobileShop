/**
 * @core-only
 * Afspraken (Appointments) Page View Model
 */

'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';

export interface AppointmentVM {
    id: string;
    customerName: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription: string;
    appointmentDate: string;
    formattedDate: string;
    timeSlot: string;
    status: string;
    statusBadge: { bg: string; text: string; label: string };
}

export interface AfsprakenPageVM {
    isLoading: boolean;
    error: string | null;
    appointments: AppointmentVM[];
    hasAppointments: boolean;
}

const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
        case "confirmed":
            return { bg: "bg-green-100", text: "text-green-700", label: "Bevestigd" };
        case "pending":
            return { bg: "bg-yellow-100", text: "text-yellow-700", label: "In behandeling" };
        case "completed":
            return { bg: "bg-blue-100", text: "text-blue-700", label: "Afgerond" };
        case "cancelled":
            return { bg: "bg-red-100", text: "text-red-700", label: "Geannuleerd" };
        default:
            return { bg: "bg-zinc-100", text: "text-zinc-700", label: status };
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

export function useAfsprakenPageVM(): AfsprakenPageVM {
    const [appointments, setAppointments] = useState<AppointmentVM[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const data = await api.getMyAppointments();
                const processed = (data || []).map((apt: {
                    id: string;
                    customerName: string;
                    deviceBrand: string;
                    deviceModel: string;
                    repairType: string;
                    problemDescription: string;
                    appointmentDate: string;
                    timeSlot: string;
                    status: string;
                }) => ({
                    id: apt.id,
                    customerName: apt.customerName,
                    deviceBrand: apt.deviceBrand,
                    deviceModel: apt.deviceModel,
                    repairType: apt.repairType,
                    problemDescription: apt.problemDescription,
                    appointmentDate: apt.appointmentDate,
                    formattedDate: formatDate(apt.appointmentDate),
                    timeSlot: apt.timeSlot,
                    status: apt.status,
                    statusBadge: getStatusBadge(apt.status),
                }));
                setAppointments(processed);
            } catch (err) {
                console.error("Failed to fetch appointments:", err);
                setError("Kon afspraken niet laden. Probeer opnieuw.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    return {
        isLoading,
        error,
        appointments,
        hasAppointments: appointments.length > 0,
    };
}
