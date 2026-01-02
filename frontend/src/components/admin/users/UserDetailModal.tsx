/**
 * User Detail Modal Component
 * 
 * UI component for displaying user details in a modal.
 * All business logic is in useUsers hook - this is pure presentation.
 */

"use client";

import { useRouter } from "next/navigation";
import {
    Users,
    Key,
    Shield,
    ShoppingCart,
    Calendar,
    X,
    MessageSquare,
    Star,
    FileText,
    UserX,
    UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UserDetail } from "@/lib/admin/users";
import { ORDER_STATUS_CONFIGS, APPOINTMENT_STATUS_CONFIGS } from "@/lib/admin/users";

interface UserDetailModalProps {
    user: UserDetail;
    onClose: () => void;
    onResetPassword: (userId: string) => void;
    onUpdateRole: (userId: string, role: string) => void;
    onToggleVip: (userId: string, isVip: boolean) => void;
    onToggleActive: (userId: string, isActive: boolean) => void;
    onUpdateNotes: (userId: string, notes: string) => void;
    onNotesChange: (notes: string) => void;
}

export function UserDetailModal({
    user,
    onClose,
    onResetPassword,
    onUpdateRole,
    onToggleVip,
    onToggleActive,
    onUpdateNotes,
    onNotesChange,
}: UserDetailModalProps) {
    const router = useRouter();

    const avgOrderValue = user.orders?.length > 0
        ? Math.round(user.orders.reduce((sum, o) => sum + Number(o.total), 0) / user.orders.length)
        : 0;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                    <h2 className="text-xl font-bold">Gebruiker Details</h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-lg">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center">
                                <Users className="w-8 h-8 text-zinc-500" />
                            </div>
                            <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-zinc-300"}`} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">{user.name}</h3>
                            <p className="text-zinc-500">{user.email}</p>
                            {user.phone && !user.phone.includes("@") && (
                                <p className="text-sm text-zinc-400">{user.phone}</p>
                            )}
                        </div>
                    </div>

                    {/* Customer Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-emerald-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-emerald-700">
                                €{Number(user.totalSpent || 0).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </p>
                            <p className="text-xs text-emerald-600">Lifetime Value</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-blue-700">{user.orders?.length || 0}</p>
                            <p className="text-xs text-blue-600">Bestellingen</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3 text-center">
                            <p className="text-xl font-bold text-purple-700">€{avgOrderValue.toLocaleString('nl-NL')}</p>
                            <p className="text-xs text-purple-600">Gem. Bestelwaarde</p>
                        </div>
                    </div>

                    {/* VIP Toggle */}
                    <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="flex items-center gap-3">
                            <Star className={`w-5 h-5 ${user.isVip ? 'text-amber-500 fill-amber-500' : 'text-amber-300'}`} />
                            <div>
                                <p className="font-medium text-zinc-900">VIP Klant</p>
                                <p className="text-sm text-zinc-500">VIP-klanten krijgen prioriteit</p>
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleVip(user.id, !user.isVip)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${user.isVip ? 'bg-amber-500' : 'bg-zinc-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${user.isVip ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Enable/Disable Toggle */}
                    <div className={`flex items-center justify-between p-4 border rounded-lg ${user.isActive ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                        <div className="flex items-center gap-3">
                            {user.isActive ? (
                                <UserCheck className="w-5 h-5 text-green-600" />
                            ) : (
                                <UserX className="w-5 h-5 text-red-600" />
                            )}
                            <div>
                                <p className="font-medium text-zinc-900">{user.isActive ? 'Account Actief' : 'Account Uitgeschakeld'}</p>
                                <p className="text-sm text-zinc-500">
                                    {user.isActive
                                        ? 'Gebruiker kan inloggen en bestellingen plaatsen'
                                        : 'Gebruiker kan niet inloggen'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => onToggleActive(user.id, !user.isActive)}
                            className={`relative w-12 h-6 rounded-full transition-colors ${user.isActive ? 'bg-green-500' : 'bg-zinc-300'}`}
                        >
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${user.isActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                    </div>

                    {/* Admin Notes */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            <FileText className="inline w-4 h-4 mr-1" /> Interne Notities
                        </label>
                        <textarea
                            value={user.adminNotes || ''}
                            onChange={(e) => onNotesChange(e.target.value)}
                            onBlur={(e) => onUpdateNotes(user.id, e.target.value)}
                            placeholder="Voeg interne notities toe over deze klant..."
                            className="w-full px-4 py-3 border border-zinc-200 rounded-lg resize-none h-24 focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                        />
                        <p className="text-xs text-zinc-400 mt-1">Notities worden automatisch opgeslagen</p>
                    </div>

                    {/* Role Selector */}
                    <div>
                        <label className="block text-sm font-medium text-zinc-700 mb-2">
                            <Shield className="inline w-4 h-4 mr-1" /> Rol
                        </label>
                        <select
                            value={user.role}
                            onChange={(e) => onUpdateRole(user.id, e.target.value)}
                            className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                        >
                            <option value="CUSTOMER">Klant</option>
                            <option value="STAFF">Medewerker</option>
                            <option value="ADMIN">Admin</option>
                        </select>
                    </div>

                    {/* Password Reset */}
                    <div>
                        <Button variant="outline" onClick={() => onResetPassword(user.id)}>
                            <Key className="w-4 h-4 mr-2" />
                            Wachtwoord Resetten
                        </Button>
                    </div>

                    {/* Orders */}
                    <div>
                        <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                            <ShoppingCart className="w-4 h-4" /> Bestellingen ({user.orders?.length || 0})
                        </h4>
                        {user.orders?.length > 0 ? (
                            <div className="space-y-2">
                                {user.orders.map((order) => (
                                    <div
                                        key={order.id}
                                        onClick={() => router.push(`/admin/orders/${order.id}`)}
                                        className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 cursor-pointer transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium">{order.orderNumber}</p>
                                            <p className="text-sm text-zinc-500">{new Date(order.createdAt).toLocaleDateString("nl-NL")}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-zinc-900">€{Number(order.total).toFixed(2)}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_CONFIGS[order.status]?.bg || 'bg-zinc-200'} ${ORDER_STATUS_CONFIGS[order.status]?.color || 'text-zinc-700'}`}>
                                                {ORDER_STATUS_CONFIGS[order.status]?.label || order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm">Geen bestellingen</p>
                        )}
                    </div>

                    {/* Appointments */}
                    <div>
                        <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" /> Afspraken ({user.appointments?.length || 0})
                        </h4>
                        {user.appointments?.length > 0 ? (
                            <div className="space-y-2">
                                {user.appointments.map((apt) => (
                                    <div key={apt.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{apt.deviceBrand} {apt.deviceModel}</p>
                                            <p className="text-sm text-zinc-500">{apt.repairType}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm text-zinc-600">{new Date(apt.appointmentDate).toLocaleDateString("nl-NL")} {apt.timeSlot}</p>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPOINTMENT_STATUS_CONFIGS[apt.status]?.bg || 'bg-zinc-200'} ${APPOINTMENT_STATUS_CONFIGS[apt.status]?.color || 'text-zinc-700'}`}>
                                                {APPOINTMENT_STATUS_CONFIGS[apt.status]?.label || apt.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm">Geen afspraken</p>
                        )}
                    </div>

                    {/* Tickets */}
                    <div>
                        <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                            <MessageSquare className="w-4 h-4" /> Support Tickets ({user.tickets?.length || 0})
                        </h4>
                        {user.tickets?.length > 0 ? (
                            <div className="space-y-2">
                                {user.tickets.map((ticket) => (
                                    <div key={ticket.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg">
                                        <div>
                                            <p className="font-medium">{ticket.subject}</p>
                                            <p className="text-sm text-zinc-500">{ticket._count?.messages || 0} berichten • {new Date(ticket.createdAt).toLocaleDateString("nl-NL")}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' : ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-200 text-zinc-600'}`}>
                                            {ticket.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-zinc-500 text-sm">Geen support tickets</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
