/**
 * @core-only
 * 
 * Account Page View Model
 * 
 * Wraps the existing useAccountData hook and adds UI state management.
 * Centralizes all logic for the account dashboard page.
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    useAccountData,
    ORDER_STATUS_CONFIG,
    getStatusConfig,
    downloadInvoice,
    Order,
} from '@/lib/account';
import { getImageUrl } from '@/lib/image-utils';

export interface AccountOrderVM {
    id: string;
    orderNumber: string;
    createdAt: string;
    total: number;
    status: string;
    statusConfig: { label: string; bg: string; text: string };
    items: {
        productName: string;
        productImage: string | null;
        quantity: number;
    }[];
    itemCount: number;
    itemSummary: string;
}

export interface AccountUserVM {
    name: string;
    email: string;
    emailVerified: boolean;
    initials: string;
    firstName: string;
}

export interface AccountPageVM {
    // Auth states
    isLoading: boolean;
    needsLogin: boolean;

    // User data
    user: AccountUserVM | null;

    // Orders
    orders: AccountOrderVM[];
    displayedOrders: AccountOrderVM[];
    totalOrders: number;
    hasOrders: boolean;
    showAllOrders: boolean;

    // Actions
    onToggleShowAll: () => void;
    onLogout: () => void;
    onDownloadInvoice: (e: React.MouseEvent, orderId: string, orderNumber: string) => void;
}

export function useAccountPageVM(): AccountPageVM {
    const router = useRouter();

    // Use the existing account data hook
    const { user, orders, isLoading, needsLogin, logout } = useAccountData();

    // UI State
    const [showAllOrders, setShowAllOrders] = useState(false);

    // Process user for display
    const processedUser: AccountUserVM | null = user ? {
        name: user.name || 'User',
        email: user.email,
        emailVerified: user.emailVerified || false,
        initials: (user.name || 'U').charAt(0).toUpperCase(),
        firstName: (user.name || 'User').split(' ')[0],
    } : null;

    // Process orders for display
    const processedOrders: AccountOrderVM[] = (orders || []).map(order => ({
        id: order.id,
        orderNumber: order.orderNumber,
        createdAt: order.createdAt,
        total: Number(order.total),
        status: order.status,
        statusConfig: getStatusConfig(order.status, ORDER_STATUS_CONFIG),
        items: order.items.map(item => ({
            productName: item.productName,
            productImage: item.productImage ? getImageUrl(item.productImage) : null,
            quantity: item.quantity,
        })),
        itemCount: order.items.length,
        itemSummary: order.items.map(item => `${item.quantity}× ${item.productName}`).join(', '),
    }));

    // Displayed orders (max 3 unless showing all)
    const displayedOrders = showAllOrders ? processedOrders : processedOrders.slice(0, 3);

    // Handlers
    const onToggleShowAll = useCallback(() => {
        setShowAllOrders(prev => !prev);
    }, []);

    const onLogout = useCallback(() => {
        logout();
        router.push('/');
    }, [logout, router]);

    const onDownloadInvoice = useCallback(async (e: React.MouseEvent, orderId: string, orderNumber: string) => {
        e.preventDefault();
        e.stopPropagation();
        await downloadInvoice(orderId, orderNumber);
    }, []);

    return {
        isLoading,
        needsLogin,
        user: processedUser,
        orders: processedOrders,
        displayedOrders,
        totalOrders: processedOrders.length,
        hasOrders: processedOrders.length > 0,
        showAllOrders,
        onToggleShowAll,
        onLogout,
        onDownloadInvoice,
    };
}
