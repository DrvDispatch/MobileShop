/**
 * Checkout Module - Public API
 * 
 * Exports all checkout-related business logic for use by UI components.
 */

// API functions
export {
    COUNTRY_CODES,
    SHIPPING_RATES,
    validateCoupon,
    createCheckoutSession,
    calculateShipping,
    calculateTotals,
    formatPhoneNumber,
    buildCheckoutData,
} from './checkoutApi';

// Types
export type {
    DiscountValidation,
    ShippingAddress,
    CheckoutFormData,
    CheckoutData,
} from './checkoutApi';

// Hook
export { useCheckout } from './useCheckout';

export type {
    CheckoutFormState,
    UseCheckoutReturn,
} from './useCheckout';
