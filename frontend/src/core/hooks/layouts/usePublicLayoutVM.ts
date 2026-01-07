/**
 * @core-only
 * 
 * Public Layout View Model
 * 
 * Digests ALL logic from tenant, features, stores, and UIConfig into
 * plain data that the Navbar and Footer skins can consume.
 * 
 * This is the ONLY place where hooks like useTenant, useFeatures,
 * useCartStore, useUIConfig are called for the public layout.
 */

'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTenant } from '@/lib/TenantProvider';
import { useFeatures } from '@/contexts/FeatureContext';
import { useCartStore, useSettingsStore } from '@/lib/store';
import { useUIConfig } from '@/lib/useUIConfig';
import { removeToken } from '@/lib/api';
import type { PublicLayoutVM, NavItem, MarqueeItem, FooterLink } from '@core/skin/SkinContract';

export type { PublicLayoutVM } from '@core/skin/SkinContract';

export function usePublicLayoutVM(): PublicLayoutVM {
    const router = useRouter();
    const pathname = usePathname();

    // Core hooks (ALL centralized here, nowhere else in skins)
    const tenant = useTenant();
    const { ecommerceEnabled, repairsEnabled } = useFeatures();
    const cartStore = useCartStore();
    const { settings, fetchSettings } = useSettingsStore();
    const { uiConfig } = useUIConfig();

    // Local state for Navbar
    const [mounted, setMounted] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearchInput, setShowSearchInput] = useState(false);

    // Local state for Footer newsletter
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);

    // Hydration
    useEffect(() => {
        setMounted(true);
        if (typeof window !== 'undefined') {
            setIsLoggedIn(!!localStorage.getItem('accessToken'));
        }
        fetchSettings();
    }, [fetchSettings]);

    // Navigation helper
    const isActive = useCallback((path: string) => {
        if (pathname === path) return true;
        if (path !== '/' && pathname.startsWith(path + '/')) return true;
        return false;
    }, [pathname]);

    // Build nav items based on features
    const navItems: NavItem[] = [
        ...(ecommerceEnabled ? [
            { href: '/phones', label: uiConfig.labels.nav.devices },
            { href: '/accessories', label: uiConfig.labels.nav.accessories },
        ] : []),
        ...(repairsEnabled ? [
            { href: '/repair/book', label: uiConfig.labels.nav.repairs },
            { href: '/track', label: 'Track & Trace' },
        ] : []),
        { href: '/contact', label: uiConfig.labels.nav.contact },
    ];

    // Marquee items
    const marqueeItems: MarqueeItem[] = uiConfig.marquee || [];

    // Handlers
    const onCartClick = useCallback(() => setIsCartOpen(true), []);
    const onCartClose = useCallback(() => setIsCartOpen(false), []);

    const onLogout = useCallback(() => {
        removeToken();
        setIsLoggedIn(false);
        window.location.href = '/';
    }, []);

    const onSearch = useCallback((e: FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowSearchInput(false);
            setSearchQuery('');
        }
    }, [searchQuery, router]);

    const onSubscribe = useCallback(async (e: FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubmitting(true);
        setSubmitResult(null);

        try {
            const res = await fetch('/api/marketing/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim() }),
            });
            const data = await res.json();
            setSubmitResult(data);
            if (data.success) setEmail('');
        } catch {
            setSubmitResult({ success: false, message: 'Er is iets misgegaan. Probeer later opnieuw.' });
        } finally {
            setIsSubmitting(false);
        }
    }, [email]);

    // Build footer links
    const shopLinks: FooterLink[] = ecommerceEnabled ? [
        { href: '/phones', label: uiConfig.labels.nav.devices },
        { href: '/accessories', label: uiConfig.labels.nav.accessories },
    ] : [];

    const serviceLinks: FooterLink[] = [
        ...(repairsEnabled ? [{ href: '/repair/book', label: uiConfig.labels.nav.repairs }] : []),
        { href: '/contact', label: uiConfig.labels.nav.contact },
        { href: '/over-ons', label: uiConfig.labels.nav.about },
    ];

    // Contact info from tenant
    const contactInfo = {
        address: tenant.contact.address as { line1?: string; postalCode?: string; city?: string } | null,
        phone: tenant.contact.phone || settings.store.phone,
        email: tenant.contact.email || settings.store.email,
    };

    return {
        navbar: {
            shopName: tenant.branding.shopName,
            logoUrl: tenant.branding.logoUrl ?? undefined,
            navItems,
            isActive,
            marqueeItems,
            showCart: ecommerceEnabled,
            showSearch: true,
            cartCount: cartStore.getItemCount(),
            onCartClick,
            isCartOpen,
            onCartClose,
            searchQuery,
            setSearchQuery,
            showSearchInput,
            setShowSearchInput,
            onSearch,
            isLoggedIn,
            onLogout,
            isMenuOpen,
            setIsMenuOpen,
            mounted,
            labels: {
                myAccount: uiConfig.labels.auth.myAccount,
                login: uiConfig.labels.auth.login,
                logout: uiConfig.labels.auth.logout,
                register: uiConfig.labels.auth.register,
                searchPlaceholder: 'Search products...',
            },
        },
        footer: {
            shopName: tenant.branding.shopName,
            contactInfo,
            shopLinks,
            serviceLinks,
            newsletterTitle: uiConfig.footer.newsletterTitle,
            newsletterSubtitle: uiConfig.footer.newsletterSubtitle,
            email,
            setEmail,
            onSubscribe,
            isSubmitting,
            submitResult,
            tagline: uiConfig.footer.tagline,
            vatNumber: settings.store.vatNumber,
            taxLabel: settings.checkout.taxLabel,
            taxIncluded: settings.checkout.taxIncluded,
            googleReviewUrl: uiConfig.footer.googleReviewUrl ?? undefined,
            googleReviewRating: uiConfig.footer.googleReviewRating ?? undefined,
            labels: {
                services: uiConfig.labels.footer.services,
                legal: uiConfig.labels.footer.legal,
                privacy: uiConfig.labels.footer.privacy,
                terms: uiConfig.labels.footer.terms,
                returns: uiConfig.labels.footer.returns,
                emailPlaceholder: uiConfig.labels.footer.emailPlaceholder,
                subscribeButton: uiConfig.labels.footer.subscribeButton,
            },
        },
    };
}
