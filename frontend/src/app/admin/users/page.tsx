"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
    Search,
    Users,
    Key,
    Shield,
    ShoppingCart,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Loader2,
    X,
    MessageSquare,
    RefreshCw,
    Mail,
    Phone,
    User,
    Star,
    FileText,
    DollarSign,
} from "lucide-react";

interface User {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: "CUSTOMER" | "STAFF" | "ADMIN";
    isActive: boolean;
    isOnline: boolean;
    isVip: boolean;
    totalSpent: number | string;
    lastActiveAt: string | null;
    createdAt: string;
    orderCount: number;
}

interface UserDetail extends User {
    adminNotes: string | null;
    orders: { id: string; orderNumber: string; total: number; status: string; createdAt: string }[];
    appointments: { id: string; deviceBrand: string; deviceModel: string; repairType: string; appointmentDate: string; timeSlot: string; status: string }[];
    tickets: { id: string; subject: string; status: string; createdAt: string; _count?: { messages: number } }[];
}

// All API calls use relative paths to go through Next.js proxy for tenant resolution

const ROLE_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    ADMIN: { color: "text-red-700", bg: "bg-red-100 border-red-200", label: "Admin" },
    STAFF: { color: "text-blue-700", bg: "bg-blue-100 border-blue-200", label: "Medewerker" },
    CUSTOMER: { color: "text-zinc-700", bg: "bg-zinc-100 border-zinc-200", label: "Klant" },
};

const ORDER_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    PENDING: { color: "text-amber-700", bg: "bg-amber-100", label: "In afwachting" },
    PAID: { color: "text-blue-700", bg: "bg-blue-100", label: "Betaald" },
    PROCESSING: { color: "text-purple-700", bg: "bg-purple-100", label: "In behandeling" },
    SHIPPED: { color: "text-indigo-700", bg: "bg-indigo-100", label: "Verzonden" },
    DELIVERED: { color: "text-green-700", bg: "bg-green-100", label: "Geleverd" },
    CANCELLED: { color: "text-red-700", bg: "bg-red-100", label: "Geannuleerd" },
    REFUNDED: { color: "text-zinc-700", bg: "bg-zinc-100", label: "Terugbetaald" },
};

const APPOINTMENT_STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
    CONFIRMED: { color: "text-blue-700", bg: "bg-blue-100", label: "Bevestigd" },
    COMPLETED: { color: "text-green-700", bg: "bg-green-100", label: "Voltooid" },
    CANCELLED: { color: "text-red-700", bg: "bg-red-100", label: "Geannuleerd" },
    NO_SHOW: { color: "text-amber-700", bg: "bg-amber-100", label: "Niet Verschenen" },
};

function UserCard({ user, onClick }: { user: User; onClick: () => void }) {
    const roleConfig = ROLE_CONFIG[user.role];
    const totalSpent = Number(user.totalSpent || 0);

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-400 hover:shadow-md transition-all cursor-pointer group"
        >
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${user.isVip ? 'bg-amber-100' : 'bg-zinc-200'}`}>
                        {user.isVip ? (
                            <Star className="w-6 h-6 text-amber-500 fill-amber-500" />
                        ) : (
                            <User className="w-6 h-6 text-zinc-500" />
                        )}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-zinc-300"
                        }`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 truncate">{user.name}</h3>
                        {user.isVip && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">
                                VIP
                            </span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${roleConfig.bg} ${roleConfig.color}`}>
                            {roleConfig.label}
                        </span>
                    </div>
                    <p className="text-sm text-zinc-500 truncate">{user.email}</p>
                    {user.phone && !user.phone.includes("@") && (
                        <p className="text-sm text-zinc-400">{user.phone}</p>
                    )}
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                    <p className="text-lg font-bold text-emerald-600">€{totalSpent.toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-zinc-500">{user.orderCount} bestellingen</p>
                </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-zinc-100">
                <span className={`text-sm ${user.isOnline ? "text-green-600" : "text-zinc-400"}`}>
                    {user.isOnline ? "● Online" : "○ Offline"}
                </span>
                <span className="text-sm text-zinc-400">
                    Lid sinds {new Date(user.createdAt).toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}
                </span>
            </div>
        </div>
    );
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    // Password reset modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUserId, setResetUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState("");
    const [isResetting, setIsResetting] = useState(false);

    const fetchUsers = async () => {
        try {
            setIsLoading(true);
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(
                `/api/users?search=${search}&page=${page}&limit=20`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const data = await res.json();
            setUsers(data.data || []);
            setTotalPages(data.meta?.totalPages || 1);
            setTotalUsers(data.meta?.total || 0);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchUsers();
        setIsRefreshing(false);
    };

    const fetchUserDetail = async (userId: string) => {
        try {
            setIsLoadingUser(true);
            const token = localStorage.getItem("adminAccessToken");
            const res = await fetch(`/api/users/${userId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            setSelectedUser(data);
            setShowUserModal(true);
        } catch (error) {
            console.error("Failed to fetch user:", error);
        } finally {
            setIsLoadingUser(false);
        }
    };

    const updateUserRole = async (userId: string, role: string) => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            await fetch(`/api/users/${userId}`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ role }),
            });
            fetchUsers();
            if (selectedUser?.id === userId) {
                fetchUserDetail(userId);
            }
        } catch (error) {
            console.error("Failed to update role:", error);
        }
    };

    const resetPassword = async () => {
        if (!resetUserId || !newPassword) return;
        try {
            setIsResetting(true);
            const token = localStorage.getItem("adminAccessToken");
            await fetch(`/api/users/${resetUserId}/reset-password`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ newPassword }),
            });
            setShowResetModal(false);
            setNewPassword("");
            setResetUserId(null);
            alert("Wachtwoord succesvol gereset!");
        } catch (error) {
            console.error("Failed to reset password:", error);
            alert("Wachtwoord resetten mislukt");
        } finally {
            setIsResetting(false);
        }
    };

    const toggleVip = async (userId: string, isVip: boolean) => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            await fetch(`/api/users/${userId}/vip`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isVip }),
            });
            fetchUsers();
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, isVip });
            }
        } catch (error) {
            console.error("Failed to toggle VIP:", error);
        }
    };

    const updateNotes = async (userId: string, adminNotes: string) => {
        try {
            const token = localStorage.getItem("adminAccessToken");
            await fetch(`/api/users/${userId}/notes`, {
                method: "PATCH",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ adminNotes: adminNotes || null }),
            });
            if (selectedUser?.id === userId) {
                setSelectedUser({ ...selectedUser, adminNotes });
            }
        } catch (error) {
            console.error("Failed to update notes:", error);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setPage(1);
            fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Calculate stats
    const adminCount = users.filter(u => u.role === "ADMIN").length;
    const staffCount = users.filter(u => u.role === "STAFF").length;
    const onlineCount = users.filter(u => u.isOnline).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Gebruikers</h1>
                    <p className="text-zinc-500">{totalUsers} gebruikers totaal</p>
                </div>
                <Button onClick={handleRefresh} variant="outline" size="sm" disabled={isRefreshing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                    Vernieuwen
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Totaal</p>
                    <p className="text-2xl font-bold text-zinc-900">{totalUsers}</p>
                    <p className="text-xs text-zinc-500">gebruikers</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700 mb-1">Online</p>
                    <p className="text-2xl font-bold text-green-700">{onlineCount}</p>
                    <p className="text-xs text-green-600">nu actief</p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <p className="text-sm text-red-700 mb-1">Admins</p>
                    <p className="text-2xl font-bold text-red-700">{adminCount}</p>
                    <p className="text-xs text-red-600">beheerders</p>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <p className="text-sm text-blue-700 mb-1">Medewerkers</p>
                    <p className="text-2xl font-bold text-blue-700">{staffCount}</p>
                    <p className="text-xs text-blue-600">teamleden</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white rounded-xl border border-zinc-200 p-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                    <input
                        type="text"
                        placeholder="Zoek op email of naam..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Users Grid */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl border border-zinc-200 p-5 animate-pulse">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-zinc-200 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-5 bg-zinc-200 rounded w-1/2" />
                                    <div className="h-4 bg-zinc-200 rounded w-3/4" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : users.length === 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
                    <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
                    <p className="text-zinc-500">Geen gebruikers gevonden</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {users.map((user) => (
                        <UserCard
                            key={user.id}
                            user={user}
                            onClick={() => fetchUserDetail(user.id)}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">
                        Pagina {page} van {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                        >
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {showUserModal && selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                        <div className="p-6 border-b border-zinc-200 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Gebruiker Details</h2>
                            <button
                                onClick={() => setShowUserModal(false)}
                                className="p-2 hover:bg-zinc-100 rounded-lg"
                            >
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
                                    <div
                                        className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white ${selectedUser.isOnline ? "bg-green-500" : "bg-zinc-300"
                                            }`}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">{selectedUser.name}</h3>
                                    <p className="text-zinc-500">{selectedUser.email}</p>
                                    {selectedUser.phone && !selectedUser.phone.includes("@") && (
                                        <p className="text-sm text-zinc-400">{selectedUser.phone}</p>
                                    )}
                                </div>
                            </div>

                            {/* Customer Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-emerald-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-emerald-700">
                                        €{Number(selectedUser.totalSpent || 0).toLocaleString('nl-NL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                    </p>
                                    <p className="text-xs text-emerald-600">Lifetime Value</p>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-blue-700">
                                        {selectedUser.orders?.length || 0}
                                    </p>
                                    <p className="text-xs text-blue-600">Bestellingen</p>
                                </div>
                                <div className="bg-purple-50 rounded-lg p-3 text-center">
                                    <p className="text-xl font-bold text-purple-700">
                                        €{selectedUser.orders?.length > 0
                                            ? Math.round(selectedUser.orders.reduce((sum, o) => sum + Number(o.total), 0) / selectedUser.orders.length).toLocaleString('nl-NL')
                                            : '0'}
                                    </p>
                                    <p className="text-xs text-purple-600">Gem. Bestelwaarde</p>
                                </div>
                            </div>

                            {/* VIP Toggle */}
                            <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <Star className={`w-5 h-5 ${selectedUser.isVip ? 'text-amber-500 fill-amber-500' : 'text-amber-300'}`} />
                                    <div>
                                        <p className="font-medium text-zinc-900">VIP Klant</p>
                                        <p className="text-sm text-zinc-500">VIP-klanten krijgen prioriteit</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleVip(selectedUser.id, !selectedUser.isVip)}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${selectedUser.isVip ? 'bg-amber-500' : 'bg-zinc-300'
                                        }`}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${selectedUser.isVip ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                </button>
                            </div>

                            {/* Admin Notes */}
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    <FileText className="inline w-4 h-4 mr-1" /> Interne Notities
                                </label>
                                <textarea
                                    value={selectedUser.adminNotes || ''}
                                    onChange={(e) => setSelectedUser({ ...selectedUser, adminNotes: e.target.value })}
                                    onBlur={(e) => updateNotes(selectedUser.id, e.target.value)}
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
                                    value={selectedUser.role}
                                    onChange={(e) => updateUserRole(selectedUser.id, e.target.value)}
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                                >
                                    <option value="CUSTOMER">Klant</option>
                                    <option value="STAFF">Medewerker</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>

                            {/* Password Reset */}
                            <div>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setResetUserId(selectedUser.id);
                                        setShowResetModal(true);
                                    }}
                                >
                                    <Key className="w-4 h-4 mr-2" />
                                    Wachtwoord Resetten
                                </Button>
                            </div>

                            {/* Orders */}
                            <div>
                                <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                                    <ShoppingCart className="w-4 h-4" /> Bestellingen ({selectedUser.orders?.length || 0})
                                </h4>
                                {selectedUser.orders?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedUser.orders.map((order) => (
                                            <div
                                                key={order.id}
                                                onClick={() => router.push(`/admin/orders/${order.id}`)}
                                                className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg hover:bg-zinc-100 cursor-pointer transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium">{order.orderNumber}</p>
                                                    <p className="text-sm text-zinc-500">
                                                        {new Date(order.createdAt).toLocaleDateString("nl-NL")}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-semibold text-zinc-900">€{Number(order.total).toFixed(2)}</p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ORDER_STATUS_CONFIG[order.status]?.bg || 'bg-zinc-200'} ${ORDER_STATUS_CONFIG[order.status]?.color || 'text-zinc-700'}`}>
                                                        {ORDER_STATUS_CONFIG[order.status]?.label || order.status}
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
                                    <Calendar className="w-4 h-4" /> Afspraken ({selectedUser.appointments?.length || 0})
                                </h4>
                                {selectedUser.appointments?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedUser.appointments.map((apt) => (
                                            <div
                                                key={apt.id}
                                                className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">
                                                        {apt.deviceBrand} {apt.deviceModel}
                                                    </p>
                                                    <p className="text-sm text-zinc-500">{apt.repairType}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm text-zinc-600">
                                                        {new Date(apt.appointmentDate).toLocaleDateString("nl-NL")} {apt.timeSlot}
                                                    </p>
                                                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${APPOINTMENT_STATUS_CONFIG[apt.status]?.bg || 'bg-zinc-200'} ${APPOINTMENT_STATUS_CONFIG[apt.status]?.color || 'text-zinc-700'}`}>
                                                        {APPOINTMENT_STATUS_CONFIG[apt.status]?.label || apt.status}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-zinc-500 text-sm">Geen afspraken</p>
                                )}
                            </div>

                            {/* Support Tickets */}
                            <div>
                                <h4 className="font-semibold text-zinc-900 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> Support Tickets ({selectedUser.tickets?.length || 0})
                                </h4>
                                {selectedUser.tickets?.length > 0 ? (
                                    <div className="space-y-2">
                                        {selectedUser.tickets.map((ticket) => (
                                            <div
                                                key={ticket.id}
                                                className="flex items-center justify-between p-3 bg-zinc-50 rounded-lg"
                                            >
                                                <div>
                                                    <p className="font-medium">{ticket.subject}</p>
                                                    <p className="text-sm text-zinc-500">
                                                        {ticket._count?.messages || 0} berichten • {new Date(ticket.createdAt).toLocaleDateString("nl-NL")}
                                                    </p>
                                                </div>
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                                                    ticket.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-zinc-200 text-zinc-600'
                                                    }`}>
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
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-white rounded-xl w-full max-w-md m-4 p-6">
                        <h2 className="text-xl font-bold mb-4">Wachtwoord Resetten</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-2">
                                    Nieuw Wachtwoord
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Voer nieuw wachtwoord in"
                                    className="w-full px-4 py-2 border border-zinc-200 rounded-lg"
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => {
                                        setShowResetModal(false);
                                        setNewPassword("");
                                    }}
                                >
                                    Annuleren
                                </Button>
                                <Button
                                    className="flex-1"
                                    onClick={resetPassword}
                                    disabled={!newPassword || isResetting}
                                >
                                    {isResetting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Resetten...
                                        </>
                                    ) : (
                                        "Wachtwoord Resetten"
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
