/**
 * @core-only
 * 
 * Skin Contract - The formal interface between Core and Skins
 * 
 * RULE: Skins may ONLY depend on types from core/skin/*.
 * Skins must NEVER import: useTenant, useFeatures, useCartStore, useUIConfig, etc.
 * 
 * All data flows Core → VM → Skin via props.
 */

import type { ReactNode, ComponentType, Dispatch, SetStateAction, FormEvent } from 'react';

// =============================================================================
// COMMON TYPES
// =============================================================================

export interface NavItem {
    href: string;
    label: string;
}

export interface MarqueeItem {
    icon: 'location' | 'star' | 'wrench' | 'clock' | 'shield' | 'package';
    text: string;
}

export interface ContactInfo {
    address?: {
        line1?: string;
        postalCode?: string;
        city?: string;
    } | null;
    phone?: string | null;
    email?: string | null;
}

export interface FooterLink {
    href: string;
    label: string;
}

// =============================================================================
// NAVBAR VM - All data the Navbar needs to render
// =============================================================================

export interface NavbarVM {
    // Branding
    shopName: string;
    logoUrl?: string;

    // Navigation
    navItems: NavItem[];
    isActive: (path: string) => boolean;

    // Marquee
    marqueeItems: MarqueeItem[];

    // Feature flags (digested to booleans)
    showCart: boolean;
    showSearch: boolean;

    // Cart
    cartCount: number;
    onCartClick: () => void;
    isCartOpen: boolean;
    onCartClose: () => void;

    // Search
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    showSearchInput: boolean;
    setShowSearchInput: (show: boolean) => void;
    onSearch: (e: FormEvent) => void;

    // Auth
    isLoggedIn: boolean;
    onLogout: () => void;

    // Mobile
    isMenuOpen: boolean;
    setIsMenuOpen: (open: boolean) => void;

    // Mounted (hydration)
    mounted: boolean;

    // Labels (digested from UIConfig)
    labels: {
        myAccount: string;
        login: string;
        logout: string;
        register: string;
        searchPlaceholder: string;
    };
}

// =============================================================================
// FOOTER VM - All data the Footer needs to render
// =============================================================================

export interface FooterVM {
    // Branding
    shopName: string;

    // Contact
    contactInfo: ContactInfo;

    // Navigation links (already computed based on features)
    shopLinks: FooterLink[];
    serviceLinks: FooterLink[];

    // Newsletter
    newsletterTitle: string;
    newsletterSubtitle: string;
    email: string;
    setEmail: Dispatch<SetStateAction<string>>;
    onSubscribe: (e: FormEvent) => void;
    isSubmitting: boolean;
    submitResult: { success: boolean; message: string } | null;

    // Config (digested)
    tagline: string;
    vatNumber?: string;
    taxLabel: string;
    taxIncluded: boolean;
    googleReviewUrl?: string;
    googleReviewRating?: string;

    // Labels
    labels: {
        services: string;
        legal: string;
        privacy: string;
        terms: string;
        returns: string;
        emailPlaceholder: string;
        subscribeButton: string;
    };
}

// =============================================================================
// PUBLIC LAYOUT VM - Composes Navbar + Footer VMs
// =============================================================================

export interface PublicLayoutVM {
    navbar: NavbarVM;
    footer: FooterVM;
}

// =============================================================================
// PAGE VMs (already defined in core/hooks/pages, re-export types here)
// =============================================================================

// These are imported from their respective files
// Just documenting the pattern here

// =============================================================================
// SKIN DEFINITION - The formal contract a skin must implement
// =============================================================================

export interface SkinDefinition {
    layouts: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        PublicLayout: ComponentType<{ vm: PublicLayoutVM; children: ReactNode }>;
    };
    pages: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: ComponentType<{ vm: any }>;
    };
}
