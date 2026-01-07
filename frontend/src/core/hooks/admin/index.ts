/**
 * Admin Module - Public API
 * 
 * Exports all admin-related business logic hooks and utilities.
 * 
 * This module provides:
 * - Authentication hooks (useAdminAuth, useOrderNotifications)
 * - Data fetching (useAdminDataFetching, useAdminCRUD)
 * - UI state (useAdminPagination, useAdminSearch)
 * - API client (adminApi, adminFetch)
 * - Status configurations (ORDER_STATUS_CONFIG, etc.)
 */

// Authentication
export {
    useAdminAuth,
    useOrderNotifications,
    type AdminUser,
    type UseAdminAuthReturn,
    type OrderNotification,
} from './useAdmin';

// API Client
export {
    adminApi,
    adminFetch,
    getAdminToken,
    setAdminToken,
    removeAdminToken,
    getAdminAuthHeaders,
    type AdminApiError,
    type AdminApiResponse,
    type AdminOrder,
    type AdminAppointment,
    type AdminDiscount,
    type AdminRefund,
    type AdminAuditLog,
    type AdminUser as AdminApiUser,
} from './adminApi';

// Status Configurations
export {
    ORDER_STATUS_CONFIG,
    APPOINTMENT_STATUS_CONFIG,
    USER_ROLE_CONFIG,
    PRIORITY_CONFIG,
    CONDITION_CONFIG,
    REFUND_STATUS_CONFIG,
    TICKET_STATUS_CONFIG,
    getStatusConfig,
    REPAIR_TYPE_LABELS,
    TIME_SLOTS,
    type StatusConfig,
} from './statusConfigs';

// Data Fetching Hooks
export {
    useAdminDataFetching,
    type UseAdminDataFetchingOptions,
    type UseAdminDataFetchingReturn,
} from './useAdminDataFetching';

// Pagination Hook
export {
    useAdminPagination,
    type UseAdminPaginationOptions,
    type UseAdminPaginationReturn,
} from './useAdminPagination';

// Search Hook
export {
    useAdminSearch,
    type UseAdminSearchOptions,
    type UseAdminSearchReturn,
} from './useAdminSearch';

// CRUD Hook
export {
    useAdminCRUD,
    type UseAdminCRUDOptions,
    type UseAdminCRUDReturn,
} from './useAdminCRUD';

// Combined Table Hook
export {
    useAdminTable,
    type UseAdminTableOptions,
    type UseAdminTableReturn,
} from './useAdminTable';
