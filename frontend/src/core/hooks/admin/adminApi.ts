/**
 * Admin API Client
 * 
 * Centralized API client for admin panel with automatic authentication.
 * All admin page data fetching should use this client.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

// Token management
export function getAdminToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('adminAccessToken');
}

export function setAdminToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('adminAccessToken', token);
}

export function removeAdminToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminAuth');
}

// Get auth headers for admin requests
export function getAdminAuthHeaders(): Record<string, string> {
    const token = getAdminToken();
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
}

// Error type for admin API calls
export interface AdminApiError {
    message: string;
    statusCode: number;
}

// Generic response type
export interface AdminApiResponse<T> {
    data: T;
    meta?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Make an authenticated admin API request
 */
export async function adminFetch<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<T> {
    const headers = {
        ...getAdminAuthHeaders(),
        ...options.headers,
    };

    const response = await fetch(endpoint, {
        ...options,
        headers,
        credentials: 'include',
    });

    if (!response.ok) {
        let message = 'An error occurred';
        try {
            const errorData = await response.json();
            message = errorData.message || message;
        } catch {
            // Response may not be JSON
        }

        const error: AdminApiError = {
            message,
            statusCode: response.status,
        };
        throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
        return undefined as T;
    }

    return response.json() as Promise<T>;
}

/**
 * Admin API methods - centralized endpoints
 */
export const adminApi = {
    // Generic CRUD operations
    async getAll<T>(endpoint: string): Promise<T[]> {
        return adminFetch<T[]>(endpoint);
    },

    async getOne<T>(endpoint: string, id: string): Promise<T> {
        return adminFetch<T>(`${endpoint}/${id}`);
    },

    async create<T, R = T>(endpoint: string, data: T): Promise<R> {
        return adminFetch<R>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    async update<T, R = T>(endpoint: string, id: string, data: Partial<T>): Promise<R> {
        return adminFetch<R>(`${endpoint}/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    },

    async delete(endpoint: string, id: string): Promise<void> {
        return adminFetch<void>(`${endpoint}/${id}`, {
            method: 'DELETE',
        });
    },

    // Orders
    orders: {
        getAll: () => adminFetch<AdminOrder[]>('/api/orders/admin/all'),
        getOne: (id: string) => adminFetch<AdminOrder>(`/api/orders/admin/${id}`),
        updateStatus: (id: string, status: string) =>
            adminFetch<AdminOrder>(`/api/orders/admin/${id}/status`, {
                method: 'PATCH',
                body: JSON.stringify({ status }),
            }),
        bulkUpdateStatus: (ids: string[], status: string) =>
            adminFetch<{ updated: number }>('/api/orders/admin/bulk-status', {
                method: 'PATCH',
                body: JSON.stringify({ orderIds: ids, status }),
            }),
    },

    // Users
    users: {
        getAll: () => adminFetch<AdminUser[]>('/api/users/admin'),
        getOne: (id: string) => adminFetch<AdminUser>(`/api/users/admin/${id}`),
        updateRole: (id: string, role: string) =>
            adminFetch<AdminUser>(`/api/users/admin/${id}/role`, {
                method: 'PATCH',
                body: JSON.stringify({ role }),
            }),
        toggleVip: (id: string, isVip: boolean) =>
            adminFetch<AdminUser>(`/api/users/admin/${id}/vip`, {
                method: 'PATCH',
                body: JSON.stringify({ isVip }),
            }),
        updateNotes: (id: string, adminNotes: string) =>
            adminFetch<AdminUser>(`/api/users/admin/${id}/notes`, {
                method: 'PATCH',
                body: JSON.stringify({ adminNotes }),
            }),
        resetPassword: (email: string) =>
            adminFetch<{ message: string }>('/api/auth/admin-reset-password', {
                method: 'POST',
                body: JSON.stringify({ email }),
            }),
    },

    // Appointments
    appointments: {
        getAll: () => adminFetch<AdminAppointment[]>('/api/appointments/admin'),
        getOne: (id: string) => adminFetch<AdminAppointment>(`/api/appointments/admin/${id}`),
        update: (id: string, data: Partial<AdminAppointment>) =>
            adminFetch<AdminAppointment>(`/api/appointments/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            adminFetch<void>(`/api/appointments/${id}`, { method: 'DELETE' }),
    },

    // Discounts
    discounts: {
        getAll: () => adminFetch<AdminDiscount[]>('/api/discounts'),
        create: (data: Partial<AdminDiscount>) =>
            adminFetch<AdminDiscount>('/api/discounts', {
                method: 'POST',
                body: JSON.stringify(data),
            }),
        update: (id: string, data: Partial<AdminDiscount>) =>
            adminFetch<AdminDiscount>(`/api/discounts/${id}`, {
                method: 'PATCH',
                body: JSON.stringify(data),
            }),
        delete: (id: string) =>
            adminFetch<void>(`/api/discounts/${id}`, { method: 'DELETE' }),
    },

    // Refunds
    refunds: {
        getAll: () => adminFetch<AdminRefund[]>('/api/refunds/admin'),
        process: (id: string) =>
            adminFetch<AdminRefund>(`/api/refunds/admin/${id}/process`, { method: 'POST' }),
        reject: (id: string, reason: string) =>
            adminFetch<AdminRefund>(`/api/refunds/admin/${id}/reject`, {
                method: 'POST',
                body: JSON.stringify({ reason }),
            }),
    },

    // Audit Logs
    auditLogs: {
        getAll: () => adminFetch<AdminAuditLog[]>('/api/audit-logs'),
    },
};

// Type definitions for admin entities
export interface AdminOrder {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    fulfillmentType?: string;
    paidAt?: string;
    items: { productName: string; quantity: number; unitPrice: number }[];
}

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
    adminNotes?: string | null;
}

export interface AdminAppointment {
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
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    priority: 'NORMAL' | 'URGENT' | 'VIP';
    adminNotes?: string;
    repairDuration?: number;
    createdAt: string;
}

export interface AdminDiscount {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderValue?: number;
    maxUses?: number;
    usedCount: number;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
}

export interface AdminRefund {
    id: string;
    orderId: string;
    amount: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
    createdAt: string;
    order?: AdminOrder;
}

export interface AdminAuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    details?: Record<string, unknown>;
    createdAt: string;
    user?: { name: string; email: string };
}
