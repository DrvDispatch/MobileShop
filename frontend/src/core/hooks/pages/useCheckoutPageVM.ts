/**
 * @core-only
 * 
 * Checkout Page View Model
 * 
 * Wraps useCheckout and useUIConfig to provide all data for the Checkout skin page.
 */

'use client';

import { useState, useEffect } from 'react';
import { useCheckout } from '@/lib/checkout';
import { useUIConfig } from '@/lib/useUIConfig';

export interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
}

export interface AppliedDiscount {
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    discountAmount: number;
}

export interface FormData {
    email: string;
    name: string;
    phone: string;
    country: string;
    line1: string;
    line2: string;
    postalCode: string;
    city: string;
    state: string;
}

export interface CheckoutLabels {
    couponCode: string;
    couponPlaceholder: string;
    apply: string;
    discount: string;
    confirmationNote: string;
}

export interface CheckoutPageVM {
    // State
    mounted: boolean;
    items: CartItem[];
    isEmpty: boolean;
    formData: FormData;
    phonePrefix: string;
    isLoggedIn: boolean;
    couponCode: string;
    appliedDiscount: AppliedDiscount | null;
    couponError: string | null;
    couponLoading: boolean;
    subtotal: number;
    shipping: number;
    discount: number;
    total: number;
    isLoading: boolean;
    error: string | null;
    countryCodes: { code: string; prefix: string }[];
    labels: CheckoutLabels;

    // Actions
    setFormData: (data: FormData) => void;
    setPhonePrefix: (prefix: string) => void;
    setCouponCode: (code: string) => void;
    validateCouponCode: () => void;
    removeCoupon: () => void;
    submit: () => Promise<void>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export function useCheckoutPageVM(): CheckoutPageVM {
    const [mounted, setMounted] = useState(false);
    const { uiConfig } = useUIConfig();
    const checkout = useCheckout();

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await checkout.submit();
    };

    return {
        mounted,
        items: checkout.items,
        isEmpty: checkout.isEmpty,
        formData: checkout.formData,
        phonePrefix: checkout.phonePrefix,
        isLoggedIn: checkout.isLoggedIn,
        couponCode: checkout.couponCode,
        appliedDiscount: checkout.appliedDiscount as AppliedDiscount | null,
        couponError: checkout.couponError,
        couponLoading: checkout.couponLoading,
        subtotal: checkout.subtotal,
        shipping: checkout.shipping,
        discount: checkout.discount,
        total: checkout.total,
        isLoading: checkout.isLoading,
        error: checkout.error,
        countryCodes: [...checkout.countryCodes],
        labels: uiConfig.labels.checkout,
        setFormData: checkout.setFormData,
        setPhonePrefix: checkout.setPhonePrefix,
        setCouponCode: checkout.setCouponCode,
        validateCouponCode: checkout.validateCouponCode,
        removeCoupon: checkout.removeCoupon,
        submit: checkout.submit,
        handleSubmit,
    };
}
