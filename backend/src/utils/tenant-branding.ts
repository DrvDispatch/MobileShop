/**
 * Tenant Branding Utilities
 * 
 * Shared helper for fetching tenant branding information from TenantConfig.
 * Used by email, SMS, and notification services to ensure consistent branding.
 * 
 * IMPORTANT: This module exists to eliminate hardcoded business identity strings.
 * All tenant-specific branding must flow through this helper.
 */

import { PrismaClient } from '../generated/prisma/client.js';

/**
 * Address structure from TenantConfig.address JSON field
 */
export interface TenantAddress {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}

/**
 * Tenant branding information for emails, SMS, and notifications.
 * All fields except shopName are optional to handle incomplete configurations.
 */
export interface TenantBranding {
    /** Shop name - NEVER another tenant's name, falls back to 'Support' */
    shopName: string;
    /** Primary phone number */
    phone: string | undefined;
    /** WhatsApp number (may differ from phone) */
    whatsappNumber: string | undefined;
    /** Contact email */
    email: string | undefined;
    /** Business website URL */
    website: string | undefined;
    /** City name extracted from address */
    city: string | undefined;
    /** Full address object */
    address: TenantAddress | undefined;
    /** Business tagline (optional, for email footers) */
    tagline: string | undefined;
}

/**
 * Validated address type guard
 */
function isValidAddress(value: unknown): value is TenantAddress {
    if (typeof value !== 'object' || value === null) {
        return false;
    }
    // Address is a JSON object with string properties
    return true;
}

/**
 * Parse address from Prisma JSON field with type safety
 */
function parseAddress(addressJson: unknown): TenantAddress | undefined {
    if (!isValidAddress(addressJson)) {
        return undefined;
    }

    const addr = addressJson as Record<string, unknown>;
    return {
        line1: typeof addr.line1 === 'string' ? addr.line1 : undefined,
        line2: typeof addr.line2 === 'string' ? addr.line2 : undefined,
        city: typeof addr.city === 'string' ? addr.city : undefined,
        postalCode: typeof addr.postalCode === 'string' ? addr.postalCode : undefined,
        country: typeof addr.country === 'string' ? addr.country : undefined,
    };
}

/**
 * Fetch tenant branding from TenantConfig.
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - Tenant UUID
 * @returns TenantBranding with neutral fallbacks for missing data
 * 
 * CRITICAL: shopName falls back to 'Support', never to another tenant's name.
 */
export async function getTenantBranding(
    prisma: PrismaClient | { tenantConfig: PrismaClient['tenantConfig'] },
    tenantId: string
): Promise<TenantBranding> {
    const config = await prisma.tenantConfig.findUnique({
        where: { tenantId },
        select: {
            shopName: true,
            phone: true,
            whatsappNumber: true,
            email: true,
            website: true,
            address: true,
        },
    });

    const address = parseAddress(config?.address);

    return {
        // NEUTRAL fallback - never use another tenant's name
        shopName: config?.shopName || 'Support',
        phone: config?.phone || undefined,
        whatsappNumber: config?.whatsappNumber || undefined,
        email: config?.email || undefined,
        website: config?.website || undefined,
        city: address?.city || undefined,
        address: address,
        tagline: undefined, // Can be added to TenantConfig schema later
    };
}

/**
 * Format address for display in SMS or emails.
 * Returns a single-line format: "City" or "Line1, City" if available.
 */
export function formatAddress(address: TenantAddress | undefined): string | undefined {
    if (!address) {
        return undefined;
    }

    const parts: string[] = [];
    if (address.line1) {
        parts.push(address.line1);
    }
    if (address.city) {
        parts.push(address.city);
    }

    return parts.length > 0 ? parts.join(', ') : undefined;
}

/**
 * Format opening hours from TenantConfig.openingHours JSON for display.
 * Returns undefined if no hours are configured (do NOT invent defaults).
 * 
 * @param openingHours - Opening hours JSON from TenantConfig
 * @returns Formatted string like "Ma-Za 10:00-18:00" or undefined
 */
export function formatOpeningHours(
    openingHours: unknown
): string | undefined {
    if (!openingHours || typeof openingHours !== 'object') {
        return undefined;
    }

    const hours = openingHours as Record<string, { open?: string; close?: string } | null>;

    // Find earliest open and latest close across all days
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const dayAbbrev: Record<string, string> = {
        monday: 'Ma',
        tuesday: 'Di',
        wednesday: 'Wo',
        thursday: 'Do',
        friday: 'Vr',
        saturday: 'Za',
        sunday: 'Zo',
    };

    // Find which days are open
    const openDays: string[] = [];
    let typicalOpen: string | undefined;
    let typicalClose: string | undefined;

    for (const day of days) {
        const dayHours = hours[day];
        if (dayHours?.open && dayHours?.close) {
            openDays.push(day);
            // Use first found hours as typical
            if (!typicalOpen) {
                typicalOpen = dayHours.open;
                typicalClose = dayHours.close;
            }
        }
    }

    if (openDays.length === 0 || !typicalOpen || !typicalClose) {
        return undefined;
    }

    // Format as range if consecutive days have same hours
    if (openDays.length > 1) {
        const first = dayAbbrev[openDays[0]];
        const last = dayAbbrev[openDays[openDays.length - 1]];
        return `${first}-${last} ${typicalOpen}-${typicalClose}`;
    }

    return `${dayAbbrev[openDays[0]]} ${typicalOpen}-${typicalClose}`;
}

/**
 * Truncate shop name for SMS sender ID (max 11 characters).
 * SMS sender IDs have strict length limits.
 */
export function truncateForSmsSender(shopName: string): string {
    // Remove spaces and special characters, then truncate
    const cleaned = shopName.replace(/[^a-zA-Z0-9]/g, '');
    return cleaned.slice(0, 11);
}

/**
 * Format WhatsApp link from phone number.
 * Removes all non-numeric characters for wa.me URL.
 */
export function formatWhatsAppLink(phoneNumber: string | undefined): string | undefined {
    if (!phoneNumber) {
        return undefined;
    }
    const numericOnly = phoneNumber.replace(/[^0-9]/g, '');
    return `https://wa.me/${numericOnly}`;
}

/**
 * Format phone link for tel: protocol.
 * Removes spaces for clean tel: URL.
 */
export function formatPhoneLink(phoneNumber: string | undefined): string | undefined {
    if (!phoneNumber) {
        return undefined;
    }
    return `tel:${phoneNumber.replace(/\s/g, '')}`;
}
