"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Clock,
    Phone,
    Mail,
    User,
    CheckCircle,
    XCircle,
    AlertCircle,
    Loader2,
    RefreshCw,
    Trash2,
    ChevronRight,
    Wrench,
    Search,
    Download,
    Image as ImageIcon,
    Star,
    Crown,
    Zap,
    Timer,
    MessageSquare,
    CalendarDays,
    List,
    TrendingUp,
    Bell,
    ChevronLeft,
    ChevronDown,
    Filter,
} from "lucide-react";

// Types
interface Appointment {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription?: string;
    damageImageUrl?: string;
    appointmentDate: string;
    timeSlot: string;
    status: "CONFIRMED" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
    priority: "NORMAL" | "URGENT" | "VIP";
    adminNotes?: string;
    repairDuration?: number;
    createdAt: string;
}

// Constants
const STATUS_CONFIG = {
    CONFIRMED: { label: "Bevestigd", color: "bg-blue-100 text-blue-700 border-blue-200", icon: CheckCircle },
    COMPLETED: { label: "Voltooid", color: "bg-green-100 text-green-700 border-green-200", icon: CheckCircle },
    CANCELLED: { label: "Geannuleerd", color: "bg-red-100 text-red-700 border-red-200", icon: XCircle },
    NO_SHOW: { label: "Niet Verschenen", color: "bg-amber-100 text-amber-700 border-amber-200", icon: AlertCircle },
};

const PRIORITY_CONFIG = {
    NORMAL: { label: "Normaal", color: "bg-zinc-100 text-zinc-600", icon: null },
    URGENT: { label: "Urgent", color: "bg-orange-100 text-orange-700", icon: Zap },
    VIP: { label: "VIP", color: "bg-purple-100 text-purple-700", icon: Crown },
};

const REPAIR_LABELS: Record<string, string> = {
    SCREEN: "Schermreparatie",
    BATTERY: "Batterij vervangen",
    BACKCOVER: "Achterkant",
    CHARGING_PORT: "Oplaadpoort",
    WATER_DAMAGE: "Waterschade",
    OTHER: "Anders",
};

const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];

// Helper functions
function formatPhone(phone: string): string {
    return phone.replace(/\s/g, '');
}

// Appointment Card Component
function AppointmentCard({ appointment, onClick }: { appointment: Appointment; onClick: () => void }) {
    const config = STATUS_CONFIG[appointment.status];
    const priorityConfig = PRIORITY_CONFIG[appointment.priority || "NORMAL"];
    const PriorityIcon = priorityConfig.icon;
    const isToday = new Date(appointment.appointmentDate).toDateString() === new Date().toDateString();

    return (
        <div
            onClick={onClick}
            className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group relative ${isToday ? "border-blue-300 ring-2 ring-blue-100" : "border-zinc-200 hover:border-zinc-400"
                }`}
        >
            {/* Priority Badge */}
            {appointment.priority && appointment.priority !== "NORMAL" && (
                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${priorityConfig.color}`}>
                    {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
                    {priorityConfig.label}
                </div>
            )}

            <div className="flex items-start gap-4">
                {/* Time Block */}
                <div className={`text-center px-3 py-2 rounded-lg ${isToday ? "bg-blue-100" : "bg-zinc-100"}`}>
                    <p className={`text-xl font-bold ${isToday ? "text-blue-700" : "text-zinc-900"}`}>
                        {appointment.timeSlot}
                    </p>
                    <p className="text-xs text-zinc-500">
                        {new Date(appointment.appointmentDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}
                    </p>
                </div>

                {/* Main Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 truncate">{appointment.customerName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
                            {config.label}
                        </span>
                    </div>
                    <p className="text-sm text-zinc-600 mb-2">
                        {appointment.deviceBrand} {appointment.deviceModel}
                    </p>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                            <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="text-zinc-500">{REPAIR_LABELS[appointment.repairType] || appointment.repairType}</span>
                        </div>
                        {appointment.damageImageUrl && (
                            <div className="flex items-center gap-1 text-blue-600">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span className="text-xs">Foto</span>
                            </div>
                        )}
                        {appointment.repairDuration && (
                            <div className="flex items-center gap-1 text-green-600">
                                <Timer className="w-3.5 h-3.5" />
                                <span className="text-xs">{appointment.repairDuration}min</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Damage Image Thumbnail */}
                {appointment.damageImageUrl && (
                    <img
                        src={appointment.damageImageUrl}
                        alt="Schade"
                        className="w-14 h-14 rounded-lg object-cover border border-zinc-200"
                    />
                )}

                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
}

// Calendar View Component
function CalendarView({ appointments, onSelectDate, selectedDate }: {
    appointments: Appointment[];
    onSelectDate: (date: Date) => void;
    selectedDate: Date;
}) {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay();

    const appointmentsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {};
        appointments.forEach(apt => {
            const dateKey = apt.appointmentDate.split('T')[0];
            if (!map[dateKey]) map[dateKey] = [];
            map[dateKey].push(apt);
        });
        return map;
    }, [appointments]);

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="h-24" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateKey = date.toISOString().split('T')[0];
        const dayAppointments = appointmentsByDate[dateKey] || [];
        const isToday = date.toDateString() === new Date().toDateString();
        const isSelected = date.toDateString() === selectedDate.toDateString();

        days.push(
            <div
                key={day}
                onClick={() => onSelectDate(date)}
                className={`h-24 p-1 border border-zinc-100 cursor-pointer hover:bg-zinc-50 transition-colors ${isToday ? "bg-blue-50 border-blue-200" : ""
                    } ${isSelected ? "ring-2 ring-blue-500" : ""}`}
            >
                <div className={`text-sm font-medium mb-1 ${isToday ? "text-blue-700" : "text-zinc-600"}`}>
                    {day}
                </div>
                <div className="space-y-0.5">
                    {dayAppointments.slice(0, 3).map((apt, i) => (
                        <div
                            key={apt.id}
                            className={`text-xs truncate px-1 py-0.5 rounded ${STATUS_CONFIG[apt.status].color}`}
                        >
                            {apt.timeSlot} {apt.customerName.split(' ')[0]}
                        </div>
                    ))}
                    {dayAppointments.length > 3 && (
                        <div className="text-xs text-zinc-400">+{dayAppointments.length - 3} meer</div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() - 1))} className="p-2 hover:bg-zinc-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-lg">
                    {currentMonth.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => setCurrentMonth(m => new Date(m.getFullYear(), m.getMonth() + 1))} className="p-2 hover:bg-zinc-100 rounded-lg">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 mb-2">
                {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map(d => (
                    <div key={d} className="text-center text-xs text-zinc-500 font-medium py-2">{d}</div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-0.5">
                {days}
            </div>
        </div>
    );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ appointments }: { appointments: Appointment[] }) {
    const completed = appointments.filter(a => a.status === "COMPLETED");
    const avgDuration = completed.filter(a => a.repairDuration).reduce((sum, a) => sum + (a.repairDuration || 0), 0) / (completed.filter(a => a.repairDuration).length || 1);

    const byDay = appointments.reduce((acc, apt) => {
        const day = new Date(apt.appointmentDate).toLocaleDateString('nl-NL', { weekday: 'short' });
        acc[day] = (acc[day] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const busiestDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0];
    const noShowRate = ((appointments.filter(a => a.status === "NO_SHOW").length / appointments.length) * 100) || 0;

    return (
        <div className="bg-white rounded-2xl p-6 border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-900">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Analytics
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <p className="text-zinc-500 text-xs mb-1">Gemiddelde Reparatieduur</p>
                    <p className="text-2xl font-bold text-zinc-900">{Math.round(avgDuration) || '--'} min</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                    <p className="text-zinc-500 text-xs mb-1">Drukste Dag</p>
                    <p className="text-2xl font-bold text-zinc-900">{busiestDay?.[0] || '--'}</p>
                    {busiestDay && <p className="text-xs text-zinc-500">{busiestDay[1]} afspraken</p>}
                </div>
                <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                    <p className="text-zinc-500 text-xs mb-1">Voltooiingspercentage</p>
                    <p className="text-2xl font-bold text-green-600">
                        {Math.round((completed.length / appointments.length) * 100) || 0}%
                    </p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                    <p className="text-zinc-500 text-xs mb-1">No-Show Rate</p>
                    <p className={`text-2xl font-bold ${noShowRate > 10 ? 'text-red-600' : 'text-green-600'}`}>
                        {noShowRate.toFixed(1)}%
                    </p>
                </div>
            </div>
        </div>
    );
}

// Main Component
export default function AdminAppointmentsPage() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

    // New state for features
    const [searchQuery, setSearchQuery] = useState("");
    const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
    const [dateRange, setDateRange] = useState<"all" | "today" | "week" | "month">("all");
    const [showAnalytics, setShowAnalytics] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Reschedule state
    const [isRescheduling, setIsRescheduling] = useState(false);
    const [rescheduleDate, setRescheduleDate] = useState("");
    const [rescheduleTime, setRescheduleTime] = useState("");
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);

    // Notes & Duration state
    const [editingNotes, setEditingNotes] = useState("");
    const [editingDuration, setEditingDuration] = useState<number | "">("");
    const [editingPriority, setEditingPriority] = useState<"NORMAL" | "URGENT" | "VIP">("NORMAL");
    const [isSaving, setIsSaving] = useState(false);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("adminAccessToken");
        return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
    };

    const fetchAppointments = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments`, {
                headers: getAuthHeaders(),
            });
            if (!res.ok) throw new Error("Failed to fetch appointments");
            const data = await res.json();
            setAppointments(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchAppointments();
        setIsRefreshing(false);
    };

    useEffect(() => {
        fetchAppointments();

        // Request browser notification permission
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    // When selecting an appointment, populate edit fields
    useEffect(() => {
        if (selectedAppointment) {
            setEditingNotes(selectedAppointment.adminNotes || "");
            setEditingDuration(selectedAppointment.repairDuration || "");
            setEditingPriority(selectedAppointment.priority || "NORMAL");
            setIsRescheduling(false);
            setRescheduleDate("");
            setRescheduleTime("");
        }
    }, [selectedAppointment]);

    // Fetch available slots when reschedule date changes
    useEffect(() => {
        if (rescheduleDate) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/slots?date=${rescheduleDate}`, {
                headers: getAuthHeaders(),
            })
                .then(res => res.json())
                .then(data => setAvailableSlots(data.slots || []))
                .catch(() => setAvailableSlots(TIME_SLOTS));
        }
    }, [rescheduleDate]);

    const updateAppointment = async (id: string, data: any) => {
        setIsSaving(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}`, {
                method: "PATCH",
                headers: getAuthHeaders(),
                body: JSON.stringify(data),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Update failed");
            }
            await fetchAppointments();
            if (data.status) setSelectedAppointment(null);
            return true;
        } catch (err: any) {
            alert(err.message);
            return false;
        } finally {
            setIsSaving(false);
        }
    };

    const handleReschedule = async () => {
        if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
        const success = await updateAppointment(selectedAppointment.id, {
            appointmentDate: rescheduleDate,
            timeSlot: rescheduleTime,
        });
        if (success) {
            setIsRescheduling(false);
            setSelectedAppointment(null);
        }
    };

    const handleSaveDetails = async () => {
        if (!selectedAppointment) return;
        await updateAppointment(selectedAppointment.id, {
            adminNotes: editingNotes || null,
            repairDuration: editingDuration || null,
            priority: editingPriority,
        });
    };

    const deleteAppointment = async (id: string) => {
        if (!confirm("Weet u zeker dat u deze afspraak wilt verwijderen?")) return;
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/appointments/${id}`, {
                method: "DELETE",
                headers: getAuthHeaders(),
            });
            setAppointments(prev => prev.filter(a => a.id !== id));
            setSelectedAppointment(null);
        } catch (err) {
            console.error(err);
        }
    };

    const exportToCSV = () => {
        const headers = ["Datum", "Tijd", "Klant", "Email", "Telefoon", "Toestel", "Reparatie", "Status", "Prioriteit", "Duur (min)", "Notities"];
        const rows = filteredAppointments.map(a => [
            new Date(a.appointmentDate).toLocaleDateString('nl-NL'),
            a.timeSlot,
            a.customerName,
            a.customerEmail,
            a.customerPhone,
            `${a.deviceBrand} ${a.deviceModel}`,
            REPAIR_LABELS[a.repairType] || a.repairType,
            STATUS_CONFIG[a.status].label,
            PRIORITY_CONFIG[a.priority || "NORMAL"].label,
            a.repairDuration || "",
            a.adminNotes || "",
        ]);

        const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `afspraken-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Filtering logic
    const filteredAppointments = useMemo(() => {
        let filtered = appointments;

        // Status filter
        if (filterStatus !== "all") {
            filtered = filtered.filter(a => a.status === filterStatus);
        }

        // Search filter
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(a =>
                a.customerName.toLowerCase().includes(q) ||
                a.customerEmail.toLowerCase().includes(q) ||
                a.customerPhone.includes(q) ||
                a.deviceModel.toLowerCase().includes(q)
            );
        }

        // Date range filter
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (dateRange === "today") {
            filtered = filtered.filter(a => new Date(a.appointmentDate).toDateString() === today.toDateString());
        } else if (dateRange === "week") {
            const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const weekAhead = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
            filtered = filtered.filter(a => {
                const d = new Date(a.appointmentDate);
                return d >= weekAgo && d <= weekAhead;
            });
        } else if (dateRange === "month") {
            filtered = filtered.filter(a => {
                const d = new Date(a.appointmentDate);
                return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            });
        }

        return filtered;
    }, [appointments, filterStatus, searchQuery, dateRange]);

    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysCount = appointments.filter(a => new Date(a.appointmentDate).toDateString() === today.toDateString() && a.status === "CONFIRMED").length;
    const upcomingCount = appointments.filter(a => new Date(a.appointmentDate) >= today && a.status === "CONFIRMED").length;
    const completedCount = appointments.filter(a => a.status === "COMPLETED").length;

    // Group by date for list view
    const groupedByDate = useMemo(() => {
        const sorted = [...filteredAppointments].sort((a, b) =>
            new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        return sorted.reduce((acc, apt) => {
            const dateObj = new Date(apt.appointmentDate);
            const isToday = dateObj.toDateString() === today.toDateString();
            const isTomorrow = dateObj.toDateString() === new Date(today.getTime() + 86400000).toDateString();
            let dateLabel = isToday ? "Vandaag" : isTomorrow ? "Morgen" :
                dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
            if (!acc[dateLabel]) acc[dateLabel] = [];
            acc[dateLabel].push(apt);
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [filteredAppointments, today]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Afspraken</h1>
                    <p className="text-zinc-500">{appointments.length} afspraken totaal</p>
                </div>
                <div className="flex gap-2">
                    <Button onClick={exportToCSV} variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                    </Button>
                    <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                        Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Analytics Dashboard */}
            {showAnalytics && appointments.length > 0 && (
                <AnalyticsDashboard appointments={appointments} />
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-4 border ${todaysCount > 0 ? "bg-blue-50 border-blue-200" : "bg-white border-zinc-200"}`}>
                    <p className={`text-sm mb-1 ${todaysCount > 0 ? "text-blue-700" : "text-zinc-500"}`}>Vandaag</p>
                    <p className={`text-2xl font-bold ${todaysCount > 0 ? "text-blue-700" : "text-zinc-900"}`}>{todaysCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Aankomend</p>
                    <p className="text-2xl font-bold text-zinc-900">{upcomingCount}</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700 mb-1">Voltooid</p>
                    <p className="text-2xl font-bold text-green-700">{completedCount}</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Totaal</p>
                    <p className="text-2xl font-bold text-zinc-900">{appointments.length}</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Zoek op naam, email of telefoon..."
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Date Range */}
                <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value as any)}
                    className="px-4 py-2 border border-zinc-200 rounded-lg"
                >
                    <option value="all">Alle datums</option>
                    <option value="today">Vandaag</option>
                    <option value="week">Deze week</option>
                    <option value="month">Deze maand</option>
                </select>

                {/* View Toggle */}
                <div className="flex border border-zinc-200 rounded-lg overflow-hidden">
                    <button
                        onClick={() => setViewMode("list")}
                        className={`px-3 py-2 ${viewMode === "list" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
                    >
                        <List className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`px-3 py-2 ${viewMode === "calendar" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
                    >
                        <CalendarDays className="w-4 h-4" />
                    </button>
                </div>

                {/* Analytics Toggle */}
                <button
                    onClick={() => setShowAnalytics(!showAnalytics)}
                    className={`px-3 py-2 rounded-lg border ${showAnalytics ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"}`}
                >
                    <TrendingUp className="w-4 h-4" />
                </button>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button
                    onClick={() => setFilterStatus("all")}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === "all" ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50"}`}
                >
                    Alle ({appointments.length})
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const count = appointments.filter(a => a.status === key).length;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilterStatus(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === key ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50"}`}
                        >
                            {config.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Loading */}
            {isLoading && (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
            )}

            {/* Main Content */}
            {!isLoading && !error && (
                <>
                    {viewMode === "calendar" ? (
                        <CalendarView
                            appointments={filteredAppointments}
                            onSelectDate={(date) => {
                                setSelectedDate(date);
                                setDateRange("all");
                            }}
                            selectedDate={selectedDate}
                        />
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedByDate).map(([date, apts]) => (
                                <div key={date}>
                                    <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-zinc-500" />
                                        {date}
                                        <span className="text-sm font-normal text-zinc-400">({apts.length})</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {apts.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)).map(apt => (
                                            <AppointmentCard
                                                key={apt.id}
                                                appointment={apt}
                                                onClick={() => setSelectedAppointment(apt)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {filteredAppointments.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-300" />
                                    <p className="text-zinc-500">Geen afspraken gevonden</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Appointment Detail Modal */}
            {selectedAppointment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-4">
                        <div className="p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-xl font-bold text-zinc-900">Afspraak Details</h2>
                                        {selectedAppointment.priority && selectedAppointment.priority !== "NORMAL" && (
                                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${PRIORITY_CONFIG[selectedAppointment.priority].color}`}>
                                                {PRIORITY_CONFIG[selectedAppointment.priority].label}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-zinc-500">
                                        {new Date(selectedAppointment.appointmentDate).toLocaleDateString('nl-NL', {
                                            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                                        })} om {selectedAppointment.timeSlot}
                                    </p>
                                </div>
                                <button onClick={() => setSelectedAppointment(null)} className="p-2 hover:bg-zinc-100 rounded-lg">
                                    <XCircle className="w-5 h-5 text-zinc-400" />
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Customer Info with Actions */}
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                        <User className="w-4 h-4 text-zinc-400" />
                                        Klantgegevens
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="font-medium text-zinc-900">{selectedAppointment.customerName}</p>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                            <a href={`tel:${formatPhone(selectedAppointment.customerPhone)}`}
                                                className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-zinc-200 hover:border-blue-500 transition-colors">
                                                <Phone className="w-4 h-4 text-blue-600" />
                                                <span className="text-sm">{selectedAppointment.customerPhone}</span>
                                            </a>
                                            <a href={`https://wa.me/${formatPhone(selectedAppointment.customerPhone).replace('+', '')}`}
                                                target="_blank"
                                                className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 hover:border-green-500 transition-colors">
                                                <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                <span className="text-sm text-green-700">WhatsApp</span>
                                            </a>
                                        </div>
                                        <a href={`mailto:${selectedAppointment.customerEmail}`}
                                            className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-zinc-200 hover:border-blue-500 transition-colors">
                                            <Mail className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm">{selectedAppointment.customerEmail}</span>
                                        </a>
                                    </div>
                                </div>

                                {/* Device Info */}
                                <div className="bg-zinc-50 rounded-xl p-4">
                                    <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                        <Wrench className="w-4 h-4 text-zinc-400" />
                                        Reparatie
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-zinc-500">Toestel</p>
                                            <p className="font-medium">{selectedAppointment.deviceBrand} {selectedAppointment.deviceModel}</p>
                                        </div>
                                        <div>
                                            <p className="text-zinc-500">Type</p>
                                            <p className="font-medium">{REPAIR_LABELS[selectedAppointment.repairType]}</p>
                                        </div>
                                    </div>
                                    {selectedAppointment.problemDescription && (
                                        <div className="mt-3 pt-3 border-t border-zinc-200">
                                            <p className="text-zinc-500 text-sm mb-1">Beschrijving</p>
                                            <p className="text-sm">{selectedAppointment.problemDescription}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Damage Image */}
                                {selectedAppointment.damageImageUrl && (
                                    <div className="bg-zinc-50 rounded-xl p-4">
                                        <p className="text-zinc-500 text-sm mb-2">Foto van schade</p>
                                        <img src={selectedAppointment.damageImageUrl} alt="Damage" className="rounded-lg max-h-64 object-contain" />
                                    </div>
                                )}

                                {/* Admin Fields */}
                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-4">
                                    <h3 className="font-semibold text-zinc-900 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4 text-yellow-600" />
                                        Admin Gegevens
                                    </h3>

                                    {/* Priority */}
                                    <div>
                                        <p className="text-sm text-zinc-600 mb-2">Prioriteit</p>
                                        <div className="flex gap-2">
                                            {(["NORMAL", "URGENT", "VIP"] as const).map(p => {
                                                const cfg = PRIORITY_CONFIG[p];
                                                const Icon = cfg.icon;
                                                return (
                                                    <button
                                                        key={p}
                                                        onClick={() => setEditingPriority(p)}
                                                        className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 border transition-colors ${editingPriority === p ? cfg.color + " border-current" : "bg-white border-zinc-200"}`}
                                                    >
                                                        {Icon && <Icon className="w-4 h-4" />}
                                                        {cfg.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Duration */}
                                    <div>
                                        <p className="text-sm text-zinc-600 mb-2">Reparatieduur (minuten)</p>
                                        <input
                                            type="number"
                                            value={editingDuration}
                                            onChange={(e) => setEditingDuration(e.target.value ? parseInt(e.target.value) : "")}
                                            placeholder="bijv. 45"
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg"
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <p className="text-sm text-zinc-600 mb-2">Interne Notities</p>
                                        <textarea
                                            value={editingNotes}
                                            onChange={(e) => setEditingNotes(e.target.value)}
                                            rows={3}
                                            placeholder="Notities voor intern gebruik..."
                                            className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none"
                                        />
                                    </div>

                                    <Button onClick={handleSaveDetails} disabled={isSaving} className="w-full">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                                        Opslaan
                                    </Button>
                                </div>

                                {/* Reschedule Section */}
                                {!isRescheduling ? (
                                    <Button onClick={() => setIsRescheduling(true)} variant="outline" className="w-full">
                                        <Calendar className="w-4 h-4 mr-2" />
                                        Verplaatsen
                                    </Button>
                                ) : (
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                                        <h3 className="font-semibold text-blue-900">Afspraak Verplaatsen</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div>
                                                <p className="text-sm text-blue-700 mb-1">Nieuwe Datum</p>
                                                <input
                                                    type="date"
                                                    value={rescheduleDate}
                                                    onChange={(e) => setRescheduleDate(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg"
                                                />
                                            </div>
                                            <div>
                                                <p className="text-sm text-blue-700 mb-1">Nieuw Tijdstip</p>
                                                <select
                                                    value={rescheduleTime}
                                                    onChange={(e) => setRescheduleTime(e.target.value)}
                                                    className="w-full px-3 py-2 border border-blue-200 rounded-lg"
                                                    disabled={!rescheduleDate}
                                                >
                                                    <option value="">Kies tijdstip</option>
                                                    {availableSlots.map(slot => (
                                                        <option key={slot} value={slot}>{slot}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={handleReschedule} disabled={!rescheduleDate || !rescheduleTime || isSaving} className="flex-1">
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                                                Bevestigen
                                            </Button>
                                            <Button onClick={() => setIsRescheduling(false)} variant="outline">
                                                Annuleren
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Status Actions */}
                                <div className="border-t border-zinc-200 pt-4">
                                    <p className="text-sm text-zinc-500 mb-3">Status Wijzigen</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button
                                            onClick={() => updateAppointment(selectedAppointment.id, { status: "COMPLETED" })}
                                            className="bg-green-600 hover:bg-green-700"
                                            disabled={selectedAppointment.status === "COMPLETED" || isSaving}
                                        >
                                            <CheckCircle className="w-4 h-4 mr-2" />
                                            Voltooid
                                        </Button>
                                        <Button
                                            onClick={() => updateAppointment(selectedAppointment.id, { status: "NO_SHOW" })}
                                            variant="outline"
                                            className="border-amber-300 text-amber-700 hover:bg-amber-50"
                                            disabled={selectedAppointment.status === "NO_SHOW" || isSaving}
                                        >
                                            <AlertCircle className="w-4 h-4 mr-2" />
                                            Niet Verschenen
                                        </Button>
                                        <Button
                                            onClick={() => updateAppointment(selectedAppointment.id, { status: "CANCELLED" })}
                                            variant="outline"
                                            className="border-red-300 text-red-700 hover:bg-red-50"
                                            disabled={selectedAppointment.status === "CANCELLED" || isSaving}
                                        >
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Annuleren
                                        </Button>
                                        <Button
                                            onClick={() => deleteAppointment(selectedAppointment.id)}
                                            variant="outline"
                                            className="border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                                        >
                                            <Trash2 className="w-4 h-4 mr-2" />
                                            Verwijderen
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
