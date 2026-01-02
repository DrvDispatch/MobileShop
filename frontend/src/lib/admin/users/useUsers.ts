/**
 * Users Admin Hook (Enhanced)
 * 
 * Business logic for admin users page.
 * Handles user listing, filtering, details, password reset, notes, and VIP management.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface AdminUser {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    isActive: boolean;
    isOnline: boolean;
    isVip: boolean;
    totalSpent: number | string;
    lastActiveAt: string | null;
    createdAt: string;
    orderCount: number;
}

export interface UserDetail extends AdminUser {
    adminNotes: string | null;
    orders: { id: string; orderNumber: string; total: number; status: string; createdAt: string }[];
    appointments: { id: string; deviceBrand: string; deviceModel: string; repairType: string; appointmentDate: string; timeSlot: string; status: string }[];
    tickets: { id: string; subject: string; status: string; createdAt: string; _count?: { messages: number } }[];
}

// Status configs
export const USER_ROLE_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    ADMIN: { label: 'Admin', color: 'text-red-700', bg: 'bg-red-100 border-red-200' },
    STAFF: { label: 'Medewerker', color: 'text-blue-700', bg: 'bg-blue-100 border-blue-200' },
    CUSTOMER: { label: 'Klant', color: 'text-zinc-700', bg: 'bg-zinc-100 border-zinc-200' },
};

export const ORDER_STATUS_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    PENDING: { label: 'In afwachting', color: 'text-amber-700', bg: 'bg-amber-100' },
    PAID: { label: 'Betaald', color: 'text-blue-700', bg: 'bg-blue-100' },
    PROCESSING: { label: 'In behandeling', color: 'text-purple-700', bg: 'bg-purple-100' },
    SHIPPED: { label: 'Verzonden', color: 'text-indigo-700', bg: 'bg-indigo-100' },
    DELIVERED: { label: 'Geleverd', color: 'text-green-700', bg: 'bg-green-100' },
    CANCELLED: { label: 'Geannuleerd', color: 'text-red-700', bg: 'bg-red-100' },
    REFUNDED: { label: 'Terugbetaald', color: 'text-zinc-700', bg: 'bg-zinc-100' },
};

export const APPOINTMENT_STATUS_CONFIGS: Record<string, { label: string; color: string; bg: string }> = {
    CONFIRMED: { label: 'Bevestigd', color: 'text-blue-700', bg: 'bg-blue-100' },
    COMPLETED: { label: 'Voltooid', color: 'text-green-700', bg: 'bg-green-100' },
    CANCELLED: { label: 'Geannuleerd', color: 'text-red-700', bg: 'bg-red-100' },
    NO_SHOW: { label: 'Niet Verschenen', color: 'text-amber-700', bg: 'bg-amber-100' },
};

export interface UseUsersReturn {
    // List data
    users: AdminUser[];
    totalUsers: number;
    page: number;
    totalPages: number;

    // Loading states
    isLoading: boolean;
    isRefreshing: boolean;
    isLoadingUser: boolean;

    // Search
    search: string;
    setSearch: (s: string) => void;

    // Pagination
    setPage: (p: number) => void;

    // Stats
    stats: { adminCount: number; staffCount: number; onlineCount: number };

    // User detail modal
    selectedUser: UserDetail | null;
    showUserModal: boolean;
    fetchUserDetail: (userId: string) => Promise<void>;
    closeUserModal: () => void;

    // Password reset
    showResetModal: boolean;
    resetUserId: string | null;
    newPassword: string;
    isResetting: boolean;
    setNewPassword: (p: string) => void;
    openResetModal: (userId: string) => void;
    closeResetModal: () => void;
    resetPassword: () => Promise<boolean>;

    // User actions
    updateUserRole: (userId: string, role: string) => Promise<void>;
    toggleVip: (userId: string, isVip: boolean) => Promise<void>;
    toggleActive: (userId: string, isActive: boolean) => Promise<void>;
    updateNotes: (userId: string, notes: string) => Promise<void>;
    setSelectedUserNotes: (notes: string) => void;

    // Refresh
    refresh: () => Promise<void>;
}

export function useUsers(): UseUsersReturn {
    // List state
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [totalUsers, setTotalUsers] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [search, setSearch] = useState('');

    // User detail modal
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [showUserModal, setShowUserModal] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    // Password reset modal
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUserId, setResetUserId] = useState<string | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    // Fetch users
    const fetchUsers = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await adminFetch<{ data: AdminUser[]; meta: { total: number; totalPages: number } }>(
                `/api/users?search=${search}&page=${page}&limit=20`
            );
            setUsers(data.data || []);
            setTotalPages(data.meta?.totalPages || 1);
            setTotalUsers(data.meta?.total || 0);
        } catch (err) {
            console.error('Failed to fetch users:', err);
        } finally {
            setIsLoading(false);
        }
    }, [search, page]);

    // Refresh
    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchUsers();
        setIsRefreshing(false);
    }, [fetchUsers]);

    // Fetch user detail
    const fetchUserDetail = useCallback(async (userId: string) => {
        setIsLoadingUser(true);
        try {
            const data = await adminFetch<UserDetail>(`/api/users/${userId}`);
            setSelectedUser(data);
            setShowUserModal(true);
        } catch (err) {
            console.error('Failed to fetch user:', err);
        } finally {
            setIsLoadingUser(false);
        }
    }, []);

    // Close user modal
    const closeUserModal = useCallback(() => {
        setShowUserModal(false);
    }, []);

    // Update user role
    const updateUserRole = useCallback(async (userId: string, role: string) => {
        try {
            await adminFetch(`/api/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ role }),
            });
            await fetchUsers();
            if (selectedUser?.id === userId) {
                await fetchUserDetail(userId);
            }
        } catch (err) {
            console.error('Failed to update role:', err);
        }
    }, [fetchUsers, selectedUser, fetchUserDetail]);

    // Toggle VIP
    const toggleVip = useCallback(async (userId: string, isVip: boolean) => {
        try {
            await adminFetch(`/api/users/${userId}/vip`, {
                method: 'PATCH',
                body: JSON.stringify({ isVip }),
            });
            await fetchUsers();
            if (selectedUser?.id === userId) {
                setSelectedUser(prev => prev ? { ...prev, isVip } : null);
            }
        } catch (err) {
            console.error('Failed to toggle VIP:', err);
        }
    }, [fetchUsers, selectedUser]);

    // Toggle Active status (enable/disable user)
    const toggleActive = useCallback(async (userId: string, isActive: boolean) => {
        try {
            await adminFetch(`/api/users/${userId}`, {
                method: 'PATCH',
                body: JSON.stringify({ isActive }),
            });
            await fetchUsers();
            if (selectedUser?.id === userId) {
                setSelectedUser(prev => prev ? { ...prev, isActive } : null);
            }
        } catch (err) {
            console.error('Failed to toggle active status:', err);
        }
    }, [fetchUsers, selectedUser]);

    // Update notes
    const updateNotes = useCallback(async (userId: string, adminNotes: string) => {
        try {
            await adminFetch(`/api/users/${userId}/notes`, {
                method: 'PATCH',
                body: JSON.stringify({ adminNotes: adminNotes || null }),
            });
        } catch (err) {
            console.error('Failed to update notes:', err);
        }
    }, []);

    // Set selected user notes (for local state update)
    const setSelectedUserNotes = useCallback((notes: string) => {
        setSelectedUser(prev => prev ? { ...prev, adminNotes: notes } : null);
    }, []);

    // Password reset
    const openResetModal = useCallback((userId: string) => {
        setResetUserId(userId);
        setShowResetModal(true);
    }, []);

    const closeResetModal = useCallback(() => {
        setShowResetModal(false);
        setNewPassword('');
        setResetUserId(null);
    }, []);

    const resetPassword = useCallback(async (): Promise<boolean> => {
        if (!resetUserId || !newPassword) return false;
        setIsResetting(true);
        try {
            await adminFetch(`/api/users/${resetUserId}/reset-password`, {
                method: 'POST',
                body: JSON.stringify({ newPassword }),
            });
            closeResetModal();
            alert('Wachtwoord succesvol gereset!');
            return true;
        } catch (err) {
            console.error('Failed to reset password:', err);
            alert('Wachtwoord resetten mislukt');
            return false;
        } finally {
            setIsResetting(false);
        }
    }, [resetUserId, newPassword, closeResetModal]);

    // Effects
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

    // Stats
    const stats = useMemo(() => ({
        adminCount: users.filter(u => u.role === 'ADMIN').length,
        staffCount: users.filter(u => u.role === 'STAFF').length,
        onlineCount: users.filter(u => u.isOnline).length,
    }), [users]);

    return {
        users,
        totalUsers,
        page,
        totalPages,
        isLoading,
        isRefreshing,
        isLoadingUser,
        search,
        setSearch,
        setPage,
        stats,
        selectedUser,
        showUserModal,
        fetchUserDetail,
        closeUserModal,
        showResetModal,
        resetUserId,
        newPassword,
        isResetting,
        setNewPassword,
        openResetModal,
        closeResetModal,
        resetPassword,
        updateUserRole,
        toggleVip,
        toggleActive,
        updateNotes,
        setSelectedUserNotes,
        refresh,
    };
}
