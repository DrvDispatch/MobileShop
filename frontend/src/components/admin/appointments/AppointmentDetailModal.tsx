/**
 * Appointment Detail Modal Component
 * Full appointment details with editing controls
 */

import { Button } from "@/components/ui/button";
import {
    Calendar, Phone, Mail, User, CheckCircle, XCircle, AlertCircle,
    Loader2, Trash2, Wrench, MessageSquare,
} from "lucide-react";
import {
    PRIORITY_CONFIG,
    REPAIR_TYPE_LABELS,
    type Appointment,
} from "@/lib/admin/appointments";

function formatPhone(phone: string): string { return phone.replace(/\s/g, ''); }

export interface AppointmentDetailModalProps {
    appointment: Appointment;
    onClose: () => void;
    editingNotes: string;
    setEditingNotes: (n: string) => void;
    editingDuration: number | '';
    setEditingDuration: (d: number | '') => void;
    editingPriority: 'NORMAL' | 'URGENT' | 'VIP';
    setEditingPriority: (p: 'NORMAL' | 'URGENT' | 'VIP') => void;
    isRescheduling: boolean;
    setIsRescheduling: (r: boolean) => void;
    rescheduleDate: string;
    setRescheduleDate: (d: string) => void;
    rescheduleTime: string;
    setRescheduleTime: (t: string) => void;
    availableSlots: string[];
    isSaving: boolean;
    onSaveDetails: () => void;
    onReschedule: () => void;
    onUpdateStatus: (status: Appointment['status']) => void;
    onDelete: () => void;
}

export function AppointmentDetailModal(props: AppointmentDetailModalProps) {
    const { appointment, onClose, editingNotes, setEditingNotes, editingDuration, setEditingDuration, editingPriority, setEditingPriority, isRescheduling, setIsRescheduling, rescheduleDate, setRescheduleDate, rescheduleTime, setRescheduleTime, availableSlots, isSaving, onSaveDetails, onReschedule, onUpdateStatus, onDelete } = props;
    const priorityConfig = PRIORITY_CONFIG[appointment.priority || "NORMAL"];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[95vh] overflow-y-auto my-4">
                <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-xl font-bold text-zinc-900">Afspraak Details</h2>
                                {appointment.priority && appointment.priority !== "NORMAL" && (
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityConfig.color}`}>{priorityConfig.label}</span>
                                )}
                            </div>
                            <p className="text-sm text-zinc-500">
                                {new Date(appointment.appointmentDate).toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} om {appointment.timeSlot}
                            </p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg"><XCircle className="w-5 h-5 text-zinc-400" /></button>
                    </div>

                    <div className="space-y-4">
                        {/* Customer Info */}
                        <div className="bg-zinc-50 rounded-xl p-4">
                            <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2"><User className="w-4 h-4 text-zinc-400" />Klantgegevens</h3>
                            <div className="space-y-2">
                                <p className="font-medium text-zinc-900">{appointment.customerName}</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <a href={`tel:${formatPhone(appointment.customerPhone)}`} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-zinc-200 hover:border-blue-500">
                                        <Phone className="w-4 h-4 text-blue-600" /><span className="text-sm">{appointment.customerPhone}</span>
                                    </a>
                                    <a href={`https://wa.me/${formatPhone(appointment.customerPhone).replace('+', '')}`} target="_blank" className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg border border-green-200 hover:border-green-500">
                                        <span className="text-sm text-green-700">WhatsApp</span>
                                    </a>
                                </div>
                                <a href={`mailto:${appointment.customerEmail}`} className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border border-zinc-200 hover:border-blue-500">
                                    <Mail className="w-4 h-4 text-blue-600" /><span className="text-sm">{appointment.customerEmail}</span>
                                </a>
                            </div>
                        </div>

                        {/* Device Info */}
                        <div className="bg-zinc-50 rounded-xl p-4">
                            <h3 className="font-semibold text-zinc-900 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-zinc-400" />Reparatie</h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div><p className="text-zinc-500">Toestel</p><p className="font-medium">{appointment.deviceBrand} {appointment.deviceModel}</p></div>
                                <div><p className="text-zinc-500">Type</p><p className="font-medium">{REPAIR_TYPE_LABELS[appointment.repairType] || appointment.repairType}</p></div>
                            </div>
                            {appointment.problemDescription && (
                                <div className="mt-3 pt-3 border-t border-zinc-200"><p className="text-zinc-500 text-sm mb-1">Beschrijving</p><p className="text-sm">{appointment.problemDescription}</p></div>
                            )}
                        </div>

                        {/* Damage Image */}
                        {appointment.damageImageUrl && (
                            <div className="bg-zinc-50 rounded-xl p-4"><p className="text-zinc-500 text-sm mb-2">Foto van schade</p><img src={appointment.damageImageUrl} alt="Damage" className="rounded-lg max-h-64 object-contain" /></div>
                        )}

                        {/* Admin Fields */}
                        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 space-y-4">
                            <h3 className="font-semibold text-zinc-900 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-yellow-600" />Admin Gegevens</h3>

                            {/* Priority */}
                            <div>
                                <p className="text-sm text-zinc-600 mb-2">Prioriteit</p>
                                <div className="flex gap-2">
                                    {(["NORMAL", "URGENT", "VIP"] as const).map(p => {
                                        const cfg = PRIORITY_CONFIG[p];
                                        const Icon = cfg.icon;
                                        return (
                                            <button key={p} onClick={() => setEditingPriority(p)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-1 border transition-colors ${editingPriority === p ? cfg.color + " border-current" : "bg-white border-zinc-200"}`}>
                                                {Icon && <Icon className="w-4 h-4" />}{cfg.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Duration */}
                            <div>
                                <p className="text-sm text-zinc-600 mb-2">Reparatieduur (minuten)</p>
                                <input type="number" value={editingDuration} onChange={(e) => setEditingDuration(e.target.value ? parseInt(e.target.value) : "")}
                                    placeholder="bijv. 45" className="w-full px-3 py-2 border border-zinc-200 rounded-lg" />
                            </div>

                            {/* Notes */}
                            <div>
                                <p className="text-sm text-zinc-600 mb-2">Interne Notities</p>
                                <textarea value={editingNotes} onChange={(e) => setEditingNotes(e.target.value)} rows={3}
                                    placeholder="Notities voor intern gebruik..." className="w-full px-3 py-2 border border-zinc-200 rounded-lg resize-none" />
                            </div>

                            <Button onClick={onSaveDetails} disabled={isSaving} className="w-full">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}Opslaan
                            </Button>
                        </div>

                        {/* Reschedule */}
                        {!isRescheduling ? (
                            <Button onClick={() => setIsRescheduling(true)} variant="outline" className="w-full"><Calendar className="w-4 h-4 mr-2" />Verplaatsen</Button>
                        ) : (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                                <h3 className="font-semibold text-blue-900">Afspraak Verplaatsen</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <p className="text-sm text-blue-700 mb-1">Nieuwe Datum</p>
                                        <input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)}
                                            min={new Date().toISOString().split('T')[0]} className="w-full px-3 py-2 border border-blue-200 rounded-lg" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-blue-700 mb-1">Nieuw Tijdstip</p>
                                        <select value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} disabled={!rescheduleDate}
                                            className="w-full px-3 py-2 border border-blue-200 rounded-lg">
                                            <option value="">Kies tijdstip</option>
                                            {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={onReschedule} disabled={!rescheduleDate || !rescheduleTime || isSaving} className="flex-1">
                                        {isSaving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}Bevestigen
                                    </Button>
                                    <Button onClick={() => setIsRescheduling(false)} variant="outline">Annuleren</Button>
                                </div>
                            </div>
                        )}

                        {/* Status Actions */}
                        <div className="border-t border-zinc-200 pt-4">
                            <p className="text-sm text-zinc-500 mb-3">Status Wijzigen</p>
                            <div className="grid grid-cols-2 gap-2">
                                <Button onClick={() => onUpdateStatus("COMPLETED")} className="bg-green-600 hover:bg-green-700" disabled={appointment.status === "COMPLETED" || isSaving}>
                                    <CheckCircle className="w-4 h-4 mr-2" />Voltooid
                                </Button>
                                <Button onClick={() => onUpdateStatus("NO_SHOW")} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-50" disabled={appointment.status === "NO_SHOW" || isSaving}>
                                    <AlertCircle className="w-4 h-4 mr-2" />Niet Verschenen
                                </Button>
                                <Button onClick={() => onUpdateStatus("CANCELLED")} variant="outline" className="border-red-300 text-red-700 hover:bg-red-50" disabled={appointment.status === "CANCELLED" || isSaving}>
                                    <XCircle className="w-4 h-4 mr-2" />Annuleren
                                </Button>
                                <Button onClick={onDelete} variant="outline" className="border-zinc-300 text-zinc-700 hover:bg-zinc-50">
                                    <Trash2 className="w-4 h-4 mr-2" />Verwijderen
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
