/**
 * Calendar View Component
 * Month view calendar showing appointments
 */

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
    APPOINTMENT_STATUS_CONFIG,
    type Appointment,
} from "@/lib/admin/appointments";

export interface CalendarViewProps {
    appointments: Appointment[];
    onSelectDate: (date: Date) => void;
    selectedDate: Date;
}

export function CalendarView({ appointments, onSelectDate, selectedDate }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const appointmentsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {};
        appointments.forEach(apt => {
            const dateKey = apt.appointmentDate.split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(apt);
        });
        return map;
    }, [appointments]);

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`empty-${i}`} className="h-24" />);
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateKey = date.toISOString().split('T')[0];
        const dayAppointments = appointmentsByDate[dateKey] || [];
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();
        days.push(
            <div key={day} onClick={() => onSelectDate(date)} className={`h-24 p-1 border border-zinc-100 cursor-pointer hover:bg-zinc-50 ${isToday ? "bg-blue-50 border-blue-200" : ""} ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-700" : "text-zinc-600"}`}>{day}</div>
                <div className="space-y-0.5">
                    {dayAppointments.slice(0, 3).map(apt => (
                        <div key={apt.id} className={`text-xs truncate px-1 py-0.5 rounded ${APPOINTMENT_STATUS_CONFIG[apt.status].color}`}>{apt.timeSlot} {apt.customerName.split(' ')[0]}</div>
                    ))}
                    {dayAppointments.length > 3 && <div className="text-xs text-zinc-400">+{dayAppointments.length - 3} meer</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))} className="p-2 hover:bg-zinc-100 rounded-lg"><ChevronLeft className="w-5 h-5" /></button>
                <h3 className="font-semibold text-lg">{currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}</h3>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))} className="p-2 hover:bg-zinc-100 rounded-lg"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-2">{['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(d => <div key={d} className="text-center text-xs text-zinc-500 font-medium py-2">{d}</div>)}</div>
            <div className="grid grid-cols-7 gap-0.5">{days}</div>
        </div>
    );
}
