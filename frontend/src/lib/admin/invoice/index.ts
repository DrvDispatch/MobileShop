/**
 * Invoice Admin Module - Public API
 * 
 * Re-exports all invoice hooks and types.
 * Now split into separate files for better maintainability.
 */

// Types and constants
export {
    INVOICE_STATUS_CONFIG,
    PAYMENT_METHODS,
    defaultInvoiceSettings,
} from './types';

export type {
    Invoice,
    InvoiceItem,
    InvoiceSettings,
    Customer,
    Product,
    RepairService,
    DeviceType,
    Brand,
    Device,
    RepairOption,
    PaymentMethod,
} from './types';

// Hooks
export { useInvoiceCreate } from './useInvoiceCreate';
export type { UseInvoiceCreateReturn } from './useInvoiceCreate';

export { useInvoiceList } from './useInvoiceList';
export type { UseInvoiceListReturn } from './useInvoiceList';

export { useInvoiceSettings } from './useInvoiceSettings';
export type { UseInvoiceSettingsReturn } from './useInvoiceSettings';

export { useRepairPicker } from './useRepairPicker';
export type { UseRepairPickerReturn } from './useRepairPicker';
