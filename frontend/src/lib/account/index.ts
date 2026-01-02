/**
 * Account Module - Public API
 * 
 * Exports all account-related business logic for use by UI components.
 */

export {
    useAccountData,
    ORDER_STATUS_CONFIG,
    APPOINTMENT_STATUS_CONFIG,
    getStatusConfig,
    downloadInvoice,
} from './useAccountData';

export type {
    Order,
    OrderItem,
    Appointment,
    User,
    UseAccountDataReturn,
} from './useAccountData';
