/**
 * @core-only
 * 
 * useCheckout Hook - Core state management for checkout flow
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * 
 * This hook manages:
 * - Form state (contact, address)
 * - Coupon validation
 * - Checkout submission
 * - User prefill from auth
 * 
 * The hook is completely UI-agnostic. Any skin can use this hook
 * and render their own checkout UI on top of the state it provides.
 * 
 * Skins must NOT import this directly. Route adapters call this hook
 * and pass the view-model as props to the active skin's checkout page.
 */

import { useState, useEffect, useCallback } from 'react';
import { useCartStore, CartItem } from '../store/cart';
import { getToken, api } from '../api';
import {
    COUNTRY_CODES,
    DiscountValidation,
    validateCoupon,
    createCheckoutSession,
    calculateTotals,
    buildCheckoutData,
} from './checkoutApi';

// Types
export interface CheckoutFormState {
    email: string;
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
}

export interface UseCheckoutReturn {
    // Cart data
    items: CartItem[];
    isEmpty: boolean;

    // Form state
    formData: CheckoutFormState;
    setFormData: React.Dispatch<React.SetStateAction<CheckoutFormState>>;
    phonePrefix: string;
    setPhonePrefix: (prefix: string) => void;
    isLoggedIn: boolean;

    // Coupon state
    couponCode: string;
    setCouponCode: (code: string) => void;
    appliedDiscount: DiscountValidation | null;
    couponError: string | null;
    couponLoading: boolean;

    // Coupon actions
    validateCouponCode: () => Promise<void>;
    removeCoupon: () => void;

    // Totals
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;

    // Submission
    isLoading: boolean;
    error: string | null;
    submit: () => Promise<void>;

    // Constants
    countryCodes: typeof COUNTRY_CODES;
}

const initialFormState: CheckoutFormState = {
    email: "",
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "BE",
};

export function useCheckout(): UseCheckoutReturn {
    // Cart state
    const { items, getTotal } = useCartStore();

    // Form state
    const [formData, setFormData] = useState<CheckoutFormState>(initialFormState);
    const [phonePrefix, setPhonePrefix] = useState("+32");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Coupon state
    const [couponCode, setCouponCode] = useState("");
    const [couponLoading, setCouponLoading] = useState(false);
    const [appliedDiscount, setAppliedDiscount] = useState<DiscountValidation | null>(null);
    const [couponError, setCouponError] = useState<string | null>(null);

    // Submission state
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Prefill user data on mount
    useEffect(() => {
        const loadUser = async () => {
            const token = getToken();
            if (token) {
                try {
                    const user = await api.getMe();
                    setFormData((prev) => ({
                        ...prev,
                        email: user.email,
                        name: user.name,
                    }));
                    setIsLoggedIn(true);
                } catch {
                    setIsLoggedIn(false);
                }
            }
        };
        loadUser();
    }, []);

    // Calculate totals
    const totals = calculateTotals(
        items,
        formData.country,
        appliedDiscount?.discountAmount || 0
    );

    // Coupon validation
    const validateCouponCode = useCallback(async () => {
        if (!couponCode.trim()) return;

        setCouponLoading(true);
        setCouponError(null);

        try {
            const subtotal = getTotal();
            const result = await validateCoupon(
                couponCode,
                subtotal,
                formData.email || undefined,
                items.map(item => item.id)
            );

            if (result.valid) {
                setAppliedDiscount(result);
                setCouponError(null);
            } else {
                setCouponError(result.message || "Invalid discount code");
                setAppliedDiscount(null);
            }
        } catch {
            setCouponError("Could not validate discount code");
            setAppliedDiscount(null);
        } finally {
            setCouponLoading(false);
        }
    }, [couponCode, formData.email, items, getTotal]);

    const removeCoupon = useCallback(() => {
        setAppliedDiscount(null);
        setCouponCode("");
        setCouponError(null);
    }, []);

    // Checkout submission
    const submit = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const checkoutData = buildCheckoutData(
                items,
                {
                    email: formData.email,
                    name: formData.name,
                    phone: formData.phone,
                    phonePrefix,
                    address: {
                        line1: formData.line1,
                        line2: formData.line2,
                        city: formData.city,
                        state: formData.state,
                        postalCode: formData.postalCode,
                        country: formData.country,
                    },
                },
                appliedDiscount?.discountId
            );

            const response = await createCheckoutSession(checkoutData);

            // Redirect to Stripe Checkout
            if (response.checkoutUrl) {
                window.location.href = response.checkoutUrl;
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Checkout failed. Please try again.";
            setError(message);
            setIsLoading(false);
        }
    }, [items, formData, phonePrefix, appliedDiscount]);

    return {
        // Cart
        items,
        isEmpty: items.length === 0,

        // Form
        formData,
        setFormData,
        phonePrefix,
        setPhonePrefix,
        isLoggedIn,

        // Coupon
        couponCode,
        setCouponCode,
        appliedDiscount,
        couponError,
        couponLoading,
        validateCouponCode,
        removeCoupon,

        // Totals
        ...totals,

        // Submission
        isLoading,
        error,
        submit,

        // Constants
        countryCodes: COUNTRY_CODES,
    };
}
