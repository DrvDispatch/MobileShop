/**
 * Admin Module - Business Logic Layer
 * 
 * Centralized admin authentication and navigation utilities.
 * Already used by admin-layout.tsx, extracted for reuse.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { removeToken } from '../api';

// Types
export interface AdminUser {
    username: string;
    role: 'ADMIN' | 'STAFF';
}

export interface UseAdminAuthReturn {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: AdminUser | null;
    logout: () => void;
}

/**
 * Hook for admin authentication state
 * Handles JWT validation, role checking, and logout
 */
export function useAdminAuth(): UseAdminAuthReturn {
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [user, setUser] = useState<AdminUser | null>(null);

    const isLoginPage = pathname === '/admin/login';

    useEffect(() => {
        if (isLoginPage) {
            setIsLoading(false);
            return;
        }

        const checkAuth = () => {
            try {
                const accessToken = localStorage.getItem('adminAccessToken');

                if (!accessToken) {
                    router.push('/admin/login');
                    return;
                }

                // Decode JWT payload
                const payload = JSON.parse(atob(accessToken.split('.')[1]));

                // Check expiry
                if (payload.exp && payload.exp * 1000 < Date.now()) {
                    localStorage.removeItem('accessToken');
                    localStorage.removeItem('adminAuth');
                    router.push('/admin/login');
                    return;
                }

                // Verify role
                if (payload.role !== 'ADMIN' && payload.role !== 'STAFF') {
                    console.error('Access denied: User does not have admin privileges');
                    localStorage.removeItem('adminAuth');
                    router.push('/admin/login?error=unauthorized');
                    return;
                }

                // Load user info
                try {
                    const adminAuth = JSON.parse(localStorage.getItem('adminAuth') || '{}');
                    setUser({
                        username: adminAuth.username || 'Admin',
                        role: payload.role,
                    });
                } catch {
                    setUser({ username: 'Admin', role: payload.role });
                }

                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                router.push('/admin/login');
            } finally {
                setIsLoading(false);
            }
        };

        checkAuth();
    }, [router, isLoginPage, pathname]);

    const logout = useCallback(() => {
        removeToken();
        localStorage.removeItem('adminAuth');
        localStorage.removeItem('adminAccessToken');
        setIsAuthenticated(false);
        setUser(null);
        router.push('/admin/login');
    }, [router]);

    return {
        isAuthenticated,
        isLoading,
        user,
        logout,
    };
}

// Order notification types
export interface OrderNotification {
    id: string;
    orderNumber: string;
    customerName: string;
    total: number;
}

/**
 * Hook for admin order notifications polling
 * Watches for new orders and triggers notifications
 */
export function useOrderNotifications(enabled: boolean) {
    const [notification, setNotification] = useState<OrderNotification | null>(null);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const previousOrderIdsRef = useRef<Set<string>>(new Set());
    const isFirstLoadRef = useRef(true);

    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
            const playBeep = (frequency: number, startTime: number, duration: number) => {
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                oscillator.frequency.value = frequency;
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0, startTime);
                gainNode.gain.linearRampToValueAtTime(0.3, startTime + 0.01);
                gainNode.gain.linearRampToValueAtTime(0, startTime + duration);
                oscillator.start(startTime);
                oscillator.stop(startTime + duration);
            };
            const now = audioContext.currentTime;
            playBeep(880, now, 0.15);
            playBeep(1108.73, now + 0.15, 0.15);
            playBeep(1318.51, now + 0.3, 0.2);
        } catch (error) {
            console.log('Could not play notification sound:', error);
        }
    }, []);

    const dismiss = useCallback(() => {
        setNotification(null);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        const checkForNewOrders = async () => {
            try {
                const token = localStorage.getItem('adminAccessToken');
                if (!token) return;

                const response = await fetch('/api/orders/admin/all', {
                    headers: { Authorization: `Bearer ${token}` },
                });

                if (response.ok) {
                    const orders = await response.json();
                    const currentIds = new Set(orders.map((o: { id: string }) => o.id));

                    if (!isFirstLoadRef.current) {
                        const newOrders = orders.filter((o: { id: string }) =>
                            !previousOrderIdsRef.current.has(o.id)
                        );

                        if (newOrders.length > 0) {
                            const newest = newOrders[0];
                            setNotification({
                                id: newest.id,
                                orderNumber: newest.orderNumber,
                                customerName: newest.customerName,
                                total: Number(newest.total),
                            });

                            if (soundEnabled) {
                                playNotificationSound();
                            }
                        }
                    }

                    previousOrderIdsRef.current = currentIds as Set<string>;
                    isFirstLoadRef.current = false;
                }
            } catch (error) {
                console.error('Failed to check for new orders:', error);
            }
        };

        checkForNewOrders();
        const interval = setInterval(checkForNewOrders, 15000);
        return () => clearInterval(interval);
    }, [enabled, soundEnabled, playNotificationSound]);

    return {
        notification,
        dismiss,
        soundEnabled,
        setSoundEnabled,
    };
}
