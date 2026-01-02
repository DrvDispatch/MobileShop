"use client";

/**
 * Admin Users Page - UI Layer
 * 
 * This page is a THIN UI LAYER that:
 * - Consumes the useUsers hook for all business logic
 * - Uses extracted modal components (UserDetailModal, ResetPasswordModal)
 * - Renders the users grid and controls
 * 
 * All state management, API calls, and modal logic are in the hook.
 * This component only handles presentation.
 */

import { Button } from "@/components/ui/button";
import {
    Search,
    Users,
    ChevronLeft,
    ChevronRight,
    RefreshCw,
    User,
    Star,
} from "lucide-react";
import {
    useUsers,
    USER_ROLE_CONFIGS,
    type AdminUser,
} from "@/lib/admin/users";
import { UserDetailModal, ResetPasswordModal } from "@/components/admin/users";

// ============================================
// UI-ONLY COMPONENTS
// ============================================

function UserCard({ user, onClick }: { user: AdminUser; onClick: () => void }) {
    const roleConfig = USER_ROLE_CONFIGS[user.role];
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
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white ${user.isOnline ? "bg-green-500" : "bg-zinc-300"}`} />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-zinc-900 truncate">{user.name}</h3>
                        {user.isVip && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700 border border-amber-200">VIP</span>
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

function LoadingSkeleton() {
    return (
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
    );
}

function EmptyState() {
    return (
        <div className="bg-white rounded-xl border border-zinc-200 p-12 text-center">
            <Users className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">Geen gebruikers gevonden</p>
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================

export default function AdminUsersPage() {
    const usersHook = useUsers();

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900">Gebruikers</h1>
                    <p className="text-zinc-500">{usersHook.totalUsers} gebruikers totaal</p>
                </div>
                <Button onClick={usersHook.refresh} variant="outline" size="sm" disabled={usersHook.isRefreshing}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${usersHook.isRefreshing ? "animate-spin" : ""}`} />
                    Vernieuwen
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500 mb-1">Totaal</p>
                    <p className="text-2xl font-bold text-zinc-900">{usersHook.totalUsers}</p>
                    <p className="text-xs text-zinc-500">gebruikers</p>
                </div>
                <div className="bg-green-50 rounded-xl border border-green-200 p-4">
                    <p className="text-sm text-green-700 mb-1">Online</p>
                    <p className="text-2xl font-bold text-green-700">{usersHook.stats.onlineCount}</p>
                    <p className="text-xs text-green-600">nu actief</p>
                </div>
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <p className="text-sm text-red-700 mb-1">Admins</p>
                    <p className="text-2xl font-bold text-red-700">{usersHook.stats.adminCount}</p>
                    <p className="text-xs text-red-600">beheerders</p>
                </div>
                <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
                    <p className="text-sm text-blue-700 mb-1">Medewerkers</p>
                    <p className="text-2xl font-bold text-blue-700">{usersHook.stats.staffCount}</p>
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
                        value={usersHook.search}
                        onChange={(e) => usersHook.setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-zinc-500 focus:outline-none"
                    />
                </div>
            </div>

            {/* Users Grid */}
            {usersHook.isLoading ? (
                <LoadingSkeleton />
            ) : usersHook.users.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {usersHook.users.map((user) => (
                        <UserCard key={user.id} user={user} onClick={() => usersHook.fetchUserDetail(user.id)} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {usersHook.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white rounded-xl border border-zinc-200 p-4">
                    <p className="text-sm text-zinc-500">Pagina {usersHook.page} van {usersHook.totalPages}</p>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => usersHook.setPage(Math.max(1, usersHook.page - 1))} disabled={usersHook.page === 1}>
                            <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => usersHook.setPage(Math.min(usersHook.totalPages, usersHook.page + 1))} disabled={usersHook.page === usersHook.totalPages}>
                            <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* User Detail Modal */}
            {usersHook.showUserModal && usersHook.selectedUser && (
                <UserDetailModal
                    user={usersHook.selectedUser}
                    onClose={usersHook.closeUserModal}
                    onResetPassword={usersHook.openResetModal}
                    onUpdateRole={usersHook.updateUserRole}
                    onToggleVip={usersHook.toggleVip}
                    onToggleActive={usersHook.toggleActive}
                    onUpdateNotes={usersHook.updateNotes}
                    onNotesChange={usersHook.setSelectedUserNotes}
                />
            )}

            {/* Reset Password Modal */}
            {usersHook.showResetModal && (
                <ResetPasswordModal
                    newPassword={usersHook.newPassword}
                    isResetting={usersHook.isResetting}
                    onPasswordChange={usersHook.setNewPassword}
                    onReset={usersHook.resetPassword}
                    onClose={usersHook.closeResetModal}
                />
            )}
        </div>
    );
}
