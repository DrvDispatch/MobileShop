/**
 * Booking Module - Public API
 * 
 * Exports all booking-related business logic for use by UI components.
 */

// API functions
export {
    fetchDeviceTypes,
    fetchBrands,
    fetchDevices,
    fetchRepairServices,
    fetchAvailableSlots,
    createAppointment,
    getAvailableDates,
    DEFAULT_TIME_SLOTS,
} from './bookingApi';

// Types
export type {
    DeviceType,
    Brand,
    Device,
    RepairService,
    AppointmentData,
    AvailableSlotsResponse,
} from './bookingApi';

// Hook
export {
    useBookingFlow,
    BookingStep,
} from './useBookingFlow';

export type {
    BookingSelections,
    CustomerData,
    UseBookingFlowReturn,
} from './useBookingFlow';
