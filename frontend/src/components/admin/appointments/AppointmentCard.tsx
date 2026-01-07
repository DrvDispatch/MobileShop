/**
 * Appointment Card Component
 * Displays appointment summary in a compact card format
 */

import { ChevronRight, Wrench, Image as ImageIcon, Timer, Scissors } from "lucide-react";
import {
    APPOINTMENT_STATUS_CONFIG,
    PRIORITY_CONFIG,
    REPAIR_TYPE_LABELS,
    type Appointment,
} from "@/lib/admin/appointments";

export interface AppointmentCardProps {
    appointment: Appointment;
    onClick: () => void;
}

/**
 * Extract service name from problemDescription for generic bookings
 * Format: "ServiceName: notes"
 */
function getServiceDisplayInfo(appointment: Appointment): {
    primaryLabel: string;
    secondaryLabel: string;
    isGenericService: boolean;
} {
    // Check if this is a generic service booking (repairType=OTHER and service info in description)
    if (appointment.repairType === 'OTHER' && appointment.problemDescription) {
        const colonIndex = appointment.problemDescription.indexOf(':');
        if (colonIndex > 0) {
            const serviceName = appointment.problemDescription.substring(0, colonIndex).trim();
            return {
                primaryLabel: serviceName,
                secondaryLabel: 'Service',
                isGenericService: true,
            };
        }
    }

    // Legacy device-based booking
    return {
        primaryLabel: `${appointment.deviceBrand} ${appointment.deviceModel}`,
        secondaryLabel: REPAIR_TYPE_LABELS[appointment.repairType] || appointment.repairType,
        isGenericService: false,
    };
}

export function AppointmentCard({ appointment, onClick }: AppointmentCardProps) {
    const config = APPOINTMENT_STATUS_CONFIG[appointment.status];
    const priorityConfig = PRIORITY_CONFIG[appointment.priority || "NORMAL"];
    const PriorityIcon = priorityConfig.icon;
    const isToday = new Date(appointment.appointmentDate).toDateString() === new Date().toDateString();
    const displayInfo = getServiceDisplayInfo(appointment);

    return (
        <div onClick={onClick} className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer group relative ${isToday ? "border-blue-300 ring-2 ring-blue-100" : "border-zinc-200 hover:border-zinc-400"}`}>
            {appointment.priority && appointment.priority !== "NORMAL" && (
                <div className={`absolute -top-2 -right-2 px-2 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${priorityConfig.color}`}>
                    {PriorityIcon && <PriorityIcon className="w-3 h-3" />}{priorityConfig.label}
                </div>
            )}
            <div className="flex items-start gap-4">
                <div className={`text-center px-3 py-2 rounded-lg ${isToday ? "bg-blue-100" : "bg-zinc-100"}`}>
                    <p className={`text-xl font-bold ${isToday ? "text-blue-700" : "text-zinc-900"}`}>{appointment.timeSlot}</p>
                    <p className="text-xs text-zinc-500">{new Date(appointment.appointmentDate).toLocaleDateString("nl-NL", { day: "numeric", month: "short" })}</p>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 truncate">{appointment.customerName}</h3>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>{config.label}</span>
                    </div>
                    <p className="text-sm text-zinc-600 mb-2">{displayInfo.primaryLabel}</p>
                    <div className="flex items-center gap-3 text-sm">
                        <div className="flex items-center gap-1">
                            {displayInfo.isGenericService ? (
                                <Scissors className="w-3.5 h-3.5 text-zinc-400" />
                            ) : (
                                <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                            )}
                            <span className="text-zinc-500">{displayInfo.secondaryLabel}</span>
                        </div>
                        {appointment.damageImageUrl && <div className="flex items-center gap-1 text-blue-600"><ImageIcon className="w-3.5 h-3.5" /><span className="text-xs">Foto</span></div>}
                        {appointment.repairDuration && <div className="flex items-center gap-1 text-green-600"><Timer className="w-3.5 h-3.5" /><span className="text-xs">{appointment.repairDuration}min</span></div>}
                    </div>
                </div>
                {appointment.damageImageUrl && <img src={appointment.damageImageUrl} alt="Schade" className="w-14 h-14 rounded-lg object-cover border border-zinc-200" />}
                <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600 group-hover:translate-x-1 transition-all" />
            </div>
        </div>
    );
}

