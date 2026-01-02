/**
 * Checkout API - All API calls for the checkout flow
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { api } from '../api';
import { CartItem } from '../store/cart';

// Constants
export const COUNTRY_CODES = [
    { code: "BE", prefix: "+32", name: "Belgium" },
    { code: "NL", prefix: "+31", name: "Netherlands" },
    { code: "DE", prefix: "+49", name: "Germany" },
    { code: "FR", prefix: "+33", name: "France" },
    { code: "LU", prefix: "+352", name: "Luxembourg" },
    { code: "GB", prefix: "+44", name: "United Kingdom" },
    { code: "US", prefix: "+1", name: "United States" },
] as const;

export const SHIPPING_RATES = {
    BE: 5.95,
    DEFAULT: 9.95,
} as const;

// Types
export interface DiscountValidation {
    valid: boolean;
    discountId?: string;
    code?: string;
    type?: "PERCENTAGE" | "FIXED";
    discountAmount?: number;
    message?: string;
}

export interface ShippingAddress {
    line1: string;
    line2?: string;
    city: string;
    state?: string;
    postalCode: string;
    country: string;
}

export interface CheckoutFormData {
    email: string;
    name: string;
    phone: string;
    phonePrefix: string;
    address: ShippingAddress;
}

export interface CheckoutData {
    items: Array<{
        productId: string;
        name: string;
        price: number;
        quantity: number;
        image?: string;
    }>;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    fulfillmentType: "SHIPPING" | "PICKUP";
    shippingAddress?: ShippingAddress;
    discountCodeId?: string;
}

/**
 * Validate a coupon code
 */
export async function validateCoupon(
    code: string,
    subtotal: number,
    customerEmail?: string,
    productIds?: string[]
): Promise<DiscountValidation> {
    const response = await fetch('/api/discounts/validate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code: code.toUpperCase(),
            subtotal,
            customerEmail,
            productIds,
        }),
    });

    const result: DiscountValidation = await response.json();
    return result;
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(data: CheckoutData): Promise<{ checkoutUrl: string }> {
    return api.createCheckout(data);
}

/**
 * Calculate shipping cost based on country
 */
export function calculateShipping(country: string): number {
    return country === "BE" ? SHIPPING_RATES.BE : SHIPPING_RATES.DEFAULT;
}

/**
 * Calculate order totals
 */
export function calculateTotals(
    items: CartItem[],
    country: string,
    discountAmount = 0
): {
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
} {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = calculateShipping(country);
    const discount = discountAmount;
    const total = subtotal - discount + shipping;

    return { subtotal, shipping, discount, total };
}

/**
 * Format a full phone number
 */
export function formatPhoneNumber(prefix: string, phone: string): string | undefined {
    return phone ? `${prefix} ${phone}` : undefined;
}

/**
 * Build checkout data from form
 */
export function buildCheckoutData(
    items: CartItem[],
    formData: CheckoutFormData,
    discountId?: string
): CheckoutData {
    return {
        items: items.map((item) => ({
            productId: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            image: item.image,
        })),
        customerEmail: formData.email,
        customerName: formData.name,
        customerPhone: formatPhoneNumber(formData.phonePrefix, formData.phone),
        fulfillmentType: "SHIPPING",
        shippingAddress: {
            line1: formData.address.line1,
            line2: formData.address.line2 || undefined,
            city: formData.address.city,
            state: formData.address.state || undefined,
            postalCode: formData.address.postalCode,
            country: formData.address.country,
        },
        ...(discountId ? { discountCodeId: discountId } : {}),
    };
}
