"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
    Calendar, Search, Download, RefreshCw, List, CalendarDays, TrendingUp, Loader2,
} from "lucide-react";
import {
    useAppointmentsAdmin,
    APPOINTMENT_STATUS_CONFIG,
    type Appointment,
} from "@/lib/admin/appointments";
import {
    AppointmentCard,
    CalendarView,
    AnalyticsDashboard,
    AppointmentDetailModal,
} from "@/components/admin/appointments";

export default function AdminAppointmentsPage() {
    const {
        appointments, filteredAppointments,
        isLoading, isRefreshing, isSaving, error,
        filterStatus, setFilterStatus,
        searchQuery, setSearchQuery,
        dateRange, setDateRange,
        viewMode, setViewMode,
        showAnalytics, setShowAnalytics,
        selectedDate, setSelectedDate,
        selectedAppointment, selectAppointment,
        editingNotes, setEditingNotes,
        editingDuration, setEditingDuration,
        editingPriority, setEditingPriority,
        isRescheduling, setIsRescheduling,
        rescheduleDate, setRescheduleDate,
        rescheduleTime, setRescheduleTime,
        availableSlots,
        refresh, updateAppointment, deleteAppointment,
        handleReschedule, handleSaveDetails, exportToCSV,
        analytics,
    } = useAppointmentsAdmin({ autoRefresh: false });

    // Group by date for list view
    const groupedByDate = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const sorted = [...filteredAppointments].sort((a, b) =>
            new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
        );
        return sorted.reduce((acc, apt) => {
            const dateObj = new Date(apt.appointmentDate);
            const isToday = dateObj.toDateString() === today.toDateString();
            const isTomorrow = dateObj.toDateString() === new Date(today.getTime() + 86400000).toDateString();
            const dateLabel = isToday ? "Vandaag" : isTomorrow ? "Morgen" :
                dateObj.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' });
            if (!acc[dateLabel]) acc[dateLabel] = [];
            acc[dateLabel].push(apt);
            return acc;
        }, {} as Record<string, Appointment[]>);
    }, [filteredAppointments]);

    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todaysCount = appointments.filter(a => new Date(a.appointmentDate).toDateString() === today.toDateString() && a.status === "CONFIRMED").length;
    const upcomingCount = appointments.filter(a => new Date(a.appointmentDate) >= today && a.status === "CONFIRMED").length;

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
                        <Download className="w-4 h-4 mr-2" />Export CSV
                    </Button>
                    <Button onClick={refresh} variant="outline" size="sm" disabled={isRefreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />Vernieuwen
                    </Button>
                </div>
            </div>

            {/* Analytics */}
            {showAnalytics && appointments.length > 0 && <AnalyticsDashboard analytics={analytics} />}

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
                    <p className="text-2xl font-bold text-green-700">{analytics.completed}</p>
                </div>
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Totaal</p>
                    <p className="text-2xl font-bold text-zinc-900">{appointments.length}</p>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Zoek op naam, email of telefoon..." className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg" />
                </div>
                <select value={dateRange} onChange={(e) => setDateRange(e.target.value as 'all' | 'today' | 'week' | 'month')} className="px-4 py-2 border border-zinc-200 rounded-lg">
                    <option value="all">Alle datums</option>
                    <option value="today">Vandaag</option>
                    <option value="week">Deze week</option>
                    <option value="month">Deze maand</option>
                </select>
                <div className="flex border border-zinc-200 rounded-lg overflow-hidden">
                    <button onClick={() => setViewMode("list")} className={`px-3 py-2 ${viewMode === "list" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}><List className="w-4 h-4" /></button>
                    <button onClick={() => setViewMode("calendar")} className={`px-3 py-2 ${viewMode === "calendar" ? "bg-zinc-900 text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}><CalendarDays className="w-4 h-4" /></button>
                </div>
                <button onClick={() => setShowAnalytics(!showAnalytics)} className={`px-3 py-2 rounded-lg border ${showAnalytics ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"}`}>
                    <TrendingUp className="w-4 h-4" />
                </button>
            </div>

            {/* Status Filters */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                <button onClick={() => setFilterStatus("all")} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === "all" ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50"}`}>
                    Alle ({appointments.length})
                </button>
                {Object.entries(APPOINTMENT_STATUS_CONFIG).map(([key, config]) => {
                    const count = appointments.filter(a => a.status === key).length;
                    return (
                        <button key={key} onClick={() => setFilterStatus(key)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${filterStatus === key ? "bg-zinc-900 text-white" : "bg-white border border-zinc-200 hover:bg-zinc-50"}`}>
                            {config.label} ({count})
                        </button>
                    );
                })}
            </div>

            {/* Loading/Error */}
            {isLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-zinc-500" /></div>}
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>}

            {/* Main Content */}
            {!isLoading && !error && (
                <>
                    {viewMode === "calendar" ? (
                        <CalendarView appointments={filteredAppointments} onSelectDate={(date) => { setSelectedDate(date); setDateRange("all"); }} selectedDate={selectedDate} />
                    ) : (
                        <div className="space-y-6">
                            {Object.entries(groupedByDate).map(([date, apts]) => (
                                <div key={date}>
                                    <h2 className="text-lg font-semibold text-zinc-900 mb-3 flex items-center gap-2">
                                        <Calendar className="w-5 h-5 text-zinc-500" />{date} <span className="text-sm font-normal text-zinc-400">({apts.length})</span>
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {apts.sort((a, b) => a.timeSlot.localeCompare(b.timeSlot)).map(apt => (
                                            <AppointmentCard key={apt.id} appointment={apt} onClick={() => selectAppointment(apt)} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {filteredAppointments.length === 0 && (
                                <div className="text-center py-12 bg-white rounded-xl border border-zinc-200">
                                    <Calendar className="w-12 h-12 mx-auto mb-4 text-zinc-300" /><p className="text-zinc-500">Geen afspraken gevonden</p>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* Detail Modal */}
            {selectedAppointment && (
                <AppointmentDetailModal
                    appointment={selectedAppointment}
                    onClose={() => selectAppointment(null)}
                    editingNotes={editingNotes} setEditingNotes={setEditingNotes}
                    editingDuration={editingDuration} setEditingDuration={setEditingDuration}
                    editingPriority={editingPriority} setEditingPriority={setEditingPriority}
                    isRescheduling={isRescheduling} setIsRescheduling={setIsRescheduling}
                    rescheduleDate={rescheduleDate} setRescheduleDate={setRescheduleDate}
                    rescheduleTime={rescheduleTime} setRescheduleTime={setRescheduleTime}
                    availableSlots={availableSlots}
                    isSaving={isSaving}
                    onSaveDetails={handleSaveDetails}
                    onReschedule={handleReschedule}
                    onUpdateStatus={(status) => updateAppointment(selectedAppointment.id, { status })}
                    onDelete={() => deleteAppointment(selectedAppointment.id)}
                />
            )}
        </div>
    );
}
