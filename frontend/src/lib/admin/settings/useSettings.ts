/**
 * Settings Admin Hook
 * 
 * Business logic for admin settings page.
 * Handles store settings, payment settings, and notifications.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import { useState, useEffect, useCallback } from 'react';
import { adminFetch } from '@/lib/admin';

// Types
export interface StoreSettings {
    storeName: string;
    storeDescription: string;
    storeEmail: string;
    storePhone: string;
    storeAddress: string;
    currency: string;
    language: string;
    timezone: string;
    logoUrl?: string;
    faviconUrl?: string;
}

export interface PaymentSettings {
    stripeEnabled: boolean;
    stripePublishableKey?: string;
    paypalEnabled: boolean;
    cashOnDelivery: boolean;
    bankTransfer: boolean;
    bankDetails?: string;
}

export interface NotificationSettings {
    orderConfirmation: boolean;
    orderStatusUpdate: boolean;
    appointmentReminder: boolean;
    marketingEmails: boolean;
}

export interface UseSettingsReturn {
    // Store settings
    storeSettings: StoreSettings | null;
    isLoadingStore: boolean;
    isSavingStore: boolean;
    loadStoreSettings: () => Promise<void>;
    saveStoreSettings: (settings: StoreSettings) => Promise<boolean>;

    // Payment settings
    paymentSettings: PaymentSettings | null;
    isLoadingPayment: boolean;
    isSavingPayment: boolean;
    loadPaymentSettings: () => Promise<void>;
    savePaymentSettings: (settings: PaymentSettings) => Promise<boolean>;

    // Notification settings
    notificationSettings: NotificationSettings | null;
    isLoadingNotifications: boolean;
    isSavingNotifications: boolean;
    loadNotificationSettings: () => Promise<void>;
    saveNotificationSettings: (settings: NotificationSettings) => Promise<boolean>;
}

export function useSettings(): UseSettingsReturn {
    // Store settings
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [isLoadingStore, setIsLoadingStore] = useState(true);
    const [isSavingStore, setIsSavingStore] = useState(false);

    // Payment settings
    const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
    const [isLoadingPayment, setIsLoadingPayment] = useState(true);
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    // Notification settings
    const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
    const [isSavingNotifications, setIsSavingNotifications] = useState(false);

    // Load store settings
    const loadStoreSettings = useCallback(async () => {
        setIsLoadingStore(true);
        try {
            const data = await adminFetch<StoreSettings>('/api/settings/store');
            setStoreSettings(data);
        } catch (err) {
            console.error('Failed to load store settings:', err);
        } finally {
            setIsLoadingStore(false);
        }
    }, []);

    // Save store settings
    const saveStoreSettings = useCallback(async (settings: StoreSettings): Promise<boolean> => {
        setIsSavingStore(true);
        try {
            await adminFetch('/api/settings/store', {
                method: 'POST',
                body: JSON.stringify(settings),
            });
            setStoreSettings(settings);
            return true;
        } catch (err) {
            console.error('Failed to save store settings:', err);
            return false;
        } finally {
            setIsSavingStore(false);
        }
    }, []);

    // Load payment settings
    const loadPaymentSettings = useCallback(async () => {
        setIsLoadingPayment(true);
        try {
            const data = await adminFetch<PaymentSettings>('/api/settings/payment');
            setPaymentSettings(data);
        } catch (err) {
            console.error('Failed to load payment settings:', err);
        } finally {
            setIsLoadingPayment(false);
        }
    }, []);

    // Save payment settings
    const savePaymentSettings = useCallback(async (settings: PaymentSettings): Promise<boolean> => {
        setIsSavingPayment(true);
        try {
            await adminFetch('/api/settings/payment', {
                method: 'POST',
                body: JSON.stringify(settings),
            });
            setPaymentSettings(settings);
            return true;
        } catch (err) {
            console.error('Failed to save payment settings:', err);
            return false;
        } finally {
            setIsSavingPayment(false);
        }
    }, []);

    // Load notification settings
    const loadNotificationSettings = useCallback(async () => {
        setIsLoadingNotifications(true);
        try {
            const data = await adminFetch<NotificationSettings>('/api/settings/notifications');
            setNotificationSettings(data);
        } catch (err) {
            console.error('Failed to load notification settings:', err);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, []);

    // Save notification settings
    const saveNotificationSettings = useCallback(async (settings: NotificationSettings): Promise<boolean> => {
        setIsSavingNotifications(true);
        try {
            await adminFetch('/api/settings/notifications', {
                method: 'POST',
                body: JSON.stringify(settings),
            });
            setNotificationSettings(settings);
            return true;
        } catch (err) {
            console.error('Failed to save notification settings:', err);
            return false;
        } finally {
            setIsSavingNotifications(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadStoreSettings();
        loadPaymentSettings();
        loadNotificationSettings();
    }, [loadStoreSettings, loadPaymentSettings, loadNotificationSettings]);

    return {
        storeSettings,
        isLoadingStore,
        isSavingStore,
        loadStoreSettings,
        saveStoreSettings,
        paymentSettings,
        isLoadingPayment,
        isSavingPayment,
        loadPaymentSettings,
        savePaymentSettings,
        notificationSettings,
        isLoadingNotifications,
        isSavingNotifications,
        loadNotificationSettings,
        saveNotificationSettings,
    };
}
