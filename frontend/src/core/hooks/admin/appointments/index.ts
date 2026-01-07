/**
 * Appointments Admin Module - Public API
 */

export {
    useAppointmentsAdmin,
    APPOINTMENT_STATUS_CONFIG,
    PRIORITY_CONFIG,
    REPAIR_TYPE_LABELS,
    TIME_SLOTS,
} from './useAppointmentsAdmin';

export type {
    Appointment,
    DateRange,
    ViewMode,
    UseAppointmentsAdminOptions,
    UseAppointmentsAdminReturn,
} from './useAppointmentsAdmin';
