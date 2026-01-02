/**
 * Authentication Module - Centralized auth state and utilities
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * 
 * This module provides:
 * - Centralized user state
 * - Auth utilities
 * - Login/logout functions
 * - User data fetching
 * 
 * Note: The API methods are already in lib/api.ts
 * This hook wraps them with React state management.
 */

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, saveToken, getToken, removeToken, ApiError } from '../api';

// Re-export from api.ts for convenience
export type { ApiError } from '../api';

// User type
export interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    emailVerified: boolean;
    avatar?: string;
    phone?: string;
}

// Auth state
export interface AuthState {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
}

// Login/Register result
export interface AuthResult {
    success: boolean;
    error?: string;
    requiresVerification?: boolean;
}

// Hook return type
export interface UseAuthReturn extends AuthState {
    // Actions
    login: (email: string, password: string) => Promise<AuthResult>;
    register: (email: string, password: string, name: string, phone?: string) => Promise<AuthResult>;
    logout: () => void;
    refreshUser: () => Promise<void>;

    // Password reset
    forgotPassword: (email: string) => Promise<AuthResult>;
    resetPassword: (token: string, password: string) => Promise<AuthResult>;

    // Email verification
    resendVerification: (email: string) => Promise<AuthResult>;
    verifyEmail: (token: string) => Promise<AuthResult>;

    // Google OAuth
    getGoogleAuthUrl: (returnUrl?: string) => string;
}

export function useAuth(): UseAuthReturn {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check auth status on mount
    useEffect(() => {
        const checkAuth = async () => {
            const token = getToken();
            if (!token) {
                setIsLoading(false);
                return;
            }

            try {
                const userData = await api.getMe();
                setUser(userData);
            } catch {
                // Token invalid, clear it
                removeToken();
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, []);

    // Login
    const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
        try {
            const response = await api.login(email, password);
            saveToken(response.accessToken);
            setUser(response.user);

            if (!response.user.emailVerified) {
                return { success: true, requiresVerification: true };
            }

            return { success: true };
        } catch (err) {
            const error = err as ApiError;
            return { success: false, error: error.message || "Failed to login" };
        }
    }, []);

    // Register
    const register = useCallback(async (
        email: string,
        password: string,
        name: string,
        phone?: string
    ): Promise<AuthResult> => {
        try {
            const response = await api.register(email, password, name, phone);
            saveToken(response.accessToken);
            setUser(response.user);

            return { success: true, requiresVerification: !response.user.emailVerified };
        } catch (err) {
            const error = err as ApiError;
            return { success: false, error: error.message || "Failed to register" };
        }
    }, []);

    // Logout
    const logout = useCallback(() => {
        removeToken();
        setUser(null);
        router.push('/login');
    }, [router]);

    // Refresh user data
    const refreshUser = useCallback(async () => {
        try {
            const userData = await api.getMe();
            setUser(userData);
        } catch {
            removeToken();
            setUser(null);
        }
    }, []);

    // Forgot password
    const forgotPassword = useCallback(async (email: string): Promise<AuthResult> => {
        try {
            await api.forgotPassword(email);
            return { success: true };
        } catch (err) {
            const error = err as ApiError;
            return { success: false, error: error.message || "Failed to send reset email" };
        }
    }, []);

    // Reset password
    const resetPassword = useCallback(async (token: string, password: string): Promise<AuthResult> => {
        try {
            await api.resetPassword(token, password);
            return { success: true };
        } catch (err) {
            const error = err as ApiError;
            return { success: false, error: error.message || "Failed to reset password" };
        }
    }, []);

    // Resend verification
    const resendVerification = useCallback(async (email: string): Promise<AuthResult> => {
        try {
            await api.resendVerification(email);
            return { success: true };
        } catch (err) {
            const error = err as ApiError;
            return { success: false, error: error.message || "Failed to resend verification" };
        }
    }, []);

    // Verify email
    const verifyEmail = useCallback(async (token: string): Promise<AuthResult> => {
        try {
            await api.verifyEmail(token);
            await refreshUser(); // Refresh user to get updated emailVerified status
            return { success: true };
        } catch (err) {
            const error = err as ApiError;
            return { success: false, error: error.message || "Failed to verify email" };
        }
    }, [refreshUser]);

    // Google OAuth URL
    const getGoogleAuthUrl = useCallback((returnUrl = '/') => {
        return api.getGoogleAuthUrl(returnUrl);
    }, []);

    return {
        // State
        user,
        isLoading,
        isAuthenticated: !!user,

        // Actions
        login,
        register,
        logout,
        refreshUser,
        forgotPassword,
        resetPassword,
        resendVerification,
        verifyEmail,
        getGoogleAuthUrl,
    };
}

// Re-export token utilities
export { saveToken, getToken, removeToken } from '../api';
