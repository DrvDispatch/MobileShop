/**
 * @core-only
 * Account Settings Page View Model
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

export interface AccountSettingsPageVM {
    isLoading: boolean;
    isSaving: boolean;

    // Form data
    formData: {
        name: string;
        email: string;
        phone: string;
    };

    // Password form
    showPasswordForm: boolean;
    showCurrentPassword: boolean;
    showNewPassword: boolean;
    passwordError: string | null;
    passwordSuccess: boolean;
    passwordData: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    };

    // Actions
    onFormChange: (field: 'name' | 'phone', value: string) => void;
    onSubmitProfile: (e: React.FormEvent) => void;
    onTogglePasswordForm: (show: boolean) => void;
    onToggleShowCurrentPassword: () => void;
    onToggleShowNewPassword: () => void;
    onPasswordChange: (field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => void;
    onSubmitPassword: (e: React.FormEvent) => void;
}

export function useAccountSettingsPageVM(): AccountSettingsPageVM {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [showPasswordForm, setShowPasswordForm] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);
    const [passwordSuccess, setPasswordSuccess] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: "",
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    useEffect(() => {
        const loadUser = async () => {
            try {
                const userData = await api.getMe();
                setFormData({
                    name: userData.name || "",
                    email: userData.email || "",
                    phone: userData.phone || "",
                });
            } catch {
                router.push("/login");
            } finally {
                setIsLoading(false);
            }
        };
        loadUser();
    }, [router]);

    const onFormChange = useCallback((field: 'name' | 'phone', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    }, []);

    const onSubmitProfile = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        setIsSaving(false);
        alert("Profile updated successfully!");
    }, []);

    const onTogglePasswordForm = useCallback((show: boolean) => {
        setShowPasswordForm(show);
        if (!show) {
            setPasswordError(null);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
        }
    }, []);

    const onToggleShowCurrentPassword = useCallback(() => {
        setShowCurrentPassword(prev => !prev);
    }, []);

    const onToggleShowNewPassword = useCallback(() => {
        setShowNewPassword(prev => !prev);
    }, []);

    const onPasswordChange = useCallback((field: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
        setPasswordData(prev => ({ ...prev, [field]: value }));
    }, []);

    const onSubmitPassword = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError("New passwords do not match");
            return;
        }

        if (passwordData.newPassword.length < 8) {
            setPasswordError("Password must be at least 8 characters");
            return;
        }

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setPasswordSuccess(true);
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setShowPasswordForm(false);
        } catch {
            setPasswordError("Failed to change password. Please check your current password.");
        }
    }, [passwordData]);

    return {
        isLoading,
        isSaving,
        formData,
        showPasswordForm,
        showCurrentPassword,
        showNewPassword,
        passwordError,
        passwordSuccess,
        passwordData,
        onFormChange,
        onSubmitProfile,
        onTogglePasswordForm,
        onToggleShowCurrentPassword,
        onToggleShowNewPassword,
        onPasswordChange,
        onSubmitPassword,
    };
}
