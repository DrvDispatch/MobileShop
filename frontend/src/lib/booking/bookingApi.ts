/**
 * Booking API - All API calls for the booking flow
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * This module handles all data fetching for the booking flow.
 * It can be used by any theme/vertical that implements booking.
 * 
 * Contains both:
 * - Generic service API (vertical-agnostic, uses new /services/* endpoints)
 * - Legacy repair API (mobile-specific, uses /repairs/* endpoints) - DEPRECATED
 */

// ============================================
// GENERIC SERVICE TYPES (vertical-agnostic)
// ============================================

export interface ServiceCategory {
    id: string;
    tenantId: string;
    parentId: string | null;
    name: string;
    slug: string;
    icon?: string | null;
    image?: string | null;
    description?: string | null;
    depth: number;
    sortOrder: number;
    isActive: boolean;
    children?: ServiceCategory[];
    services?: Service[];
}

export interface Service {
    id: string;
    tenantId: string;
    categoryId: string | null;
    name: string;
    slug: string;
    description?: string | null;
    icon?: string | null;
    price?: number | null;
    priceDisplay?: string | null;
    duration?: number | null;
    durationText?: string | null;
    sortOrder: number;
    isActive: boolean;
    category?: ServiceCategory | null;
}

export interface ServiceCatalog {
    categories: ServiceCategory[];
    services: Service[]; // Uncategorized services
}

export interface BookingFlowConfig {
    steps: string[];
    terminology: Record<string, string> | null;
}

// ============================================
// GENERIC SERVICE API (vertical-agnostic)
// ============================================

/**
 * Fetch the complete service catalog for the current tenant
 * Returns category tree with services attached
 */
export async function fetchServiceCatalog(): Promise<ServiceCatalog> {
    try {
        const response = await fetch('/api/services/catalog');
        if (!response.ok) throw new Error('Failed to fetch service catalog');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch service catalog:", error);
        return { categories: [], services: [] };
    }
}

/**
 * Fetch services for a specific category
 */
export async function fetchServicesByCategory(categorySlug: string): Promise<ServiceCategory | null> {
    try {
        const response = await fetch(`/api/services/categories/${categorySlug}`);
        if (!response.ok) throw new Error('Failed to fetch category');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch category:", error);
        return null;
    }
}

/**
 * Fetch a single service by slug
 */
export async function fetchServiceBySlug(serviceSlug: string): Promise<Service | null> {
    try {
        const response = await fetch(`/api/services/by-slug/${serviceSlug}`);
        if (!response.ok) throw new Error('Failed to fetch service');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch service:", error);
        return null;
    }
}

/**
 * Fetch booking flow configuration for the current tenant
 * Returns steps array and terminology overrides
 */
export async function fetchBookingFlowConfig(): Promise<BookingFlowConfig> {
    try {
        const response = await fetch('/api/services/booking-flow');
        if (!response.ok) throw new Error('Failed to fetch booking flow config');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch booking flow config:", error);
        // Return default 3-step flow
        return {
            steps: ['select_service', 'select_time', 'contact'],
            terminology: null,
        };
    }
}

// ============================================
// LEGACY REPAIR TYPES (mobile-specific)
// @deprecated - Use generic Service types instead
// ============================================

/** @deprecated Use ServiceCategory instead */
export interface DeviceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}

/** @deprecated Use ServiceCategory instead */
export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
}

/** @deprecated Use ServiceCategory instead */
export interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
}

/** @deprecated Use Service instead */
export interface RepairService {
    id: string;
    deviceId: string;
    serviceId: string;
    price?: number;
    priceText?: string;
    duration?: string;
    service: {
        id: string;
        name: string;
        slug: string;
        icon?: string;
    };
}

export interface AppointmentData {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription: string;
    appointmentDate: string;
    timeSlot: string;
}

export interface AvailableSlotsResponse {
    slots: string[];
}

// Default time slots (fallback)
export const DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

// ============================================
// LEGACY REPAIR API (mobile-specific)
// @deprecated - Use generic service API instead
// ============================================

/**
 * Fetch available device types (Smartphone, Tablet, etc.)
 * @deprecated Use fetchServiceCatalog() instead
 */
export async function fetchDeviceTypes(): Promise<DeviceType[]> {
    try {
        const response = await fetch('/api/repairs/device-types');
        if (!response.ok) throw new Error('Failed to fetch device types');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch device types:", error);
        // Return empty array - no more hardcoded fallbacks
        return [];
    }
}

/**
 * Fetch brands for a specific device type
 * @deprecated Use fetchServicesByCategory() instead
 */
export async function fetchBrands(deviceTypeSlug: string): Promise<Brand[]> {
    try {
        const response = await fetch(`/api/repairs/brands?deviceType=${deviceTypeSlug}`);
        if (!response.ok) throw new Error('Failed to fetch brands');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch brands:", error);
        return [];
    }
}

/**
 * Fetch devices for a specific brand
 * @deprecated Use fetchServicesByCategory() instead
 */
export async function fetchDevices(brandSlug: string): Promise<Device[]> {
    try {
        const response = await fetch(`/api/repairs/devices?brand=${brandSlug}`);
        if (!response.ok) throw new Error('Failed to fetch devices');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch devices:", error);
        return [];
    }
}

/**
 * Fetch available repair services for a specific device
 * @deprecated Use fetchServicesByCategory() instead
 */
export async function fetchRepairServices(deviceSlug: string): Promise<RepairService[]> {
    try {
        const response = await fetch(`/api/repairs/services/${deviceSlug}`);
        if (!response.ok) throw new Error('Failed to fetch repairs');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch repairs:", error);
        return [];
    }
}

// ============================================
// SHARED API (used by both flows)
// ============================================

/**
 * Fetch available appointment slots for a specific date
 */
export async function fetchAvailableSlots(date: Date): Promise<string[]> {
    try {
        const dateStr = date.toISOString().split("T")[0];
        const response = await fetch(`/api/appointments/available-slots?date=${dateStr}`);
        if (!response.ok) throw new Error('Failed to fetch slots');
        const data: AvailableSlotsResponse = await response.json();
        return data.slots || DEFAULT_TIME_SLOTS;
    } catch {
        return DEFAULT_TIME_SLOTS;
    }
}


/**
 * Create a new appointment
 * If the user is authenticated (via localStorage token OR httpOnly cookie),
 * uses the /authenticated endpoint which enables booker tracking
 */
export async function createAppointment(data: AppointmentData): Promise<void> {
    // Check if user is logged in via localStorage (traditional login)
    const authToken = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

    // For OAuth users, the token is in an httpOnly cookie (not accessible via JS)
    // We'll always try the authenticated endpoint first if not in localStorage
    // and include credentials to send cookies
    const hasLocalToken = !!authToken && authToken !== 'cookie-based';

    // Use authenticated endpoint - credentials: include will send cookies
    const endpoint = '/api/appointments/authenticated';

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (hasLocalToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
        credentials: 'include', // CRITICAL: Send cookies for OAuth cookie-based auth
    });

    // If authenticated endpoint fails with 401, try unauthenticated endpoint as fallback
    if (response.status === 401) {
        console.log('[Booking] Authenticated endpoint returned 401, trying unauthenticated...');
        const fallbackResponse = await fetch('/api/appointments', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (!fallbackResponse.ok) {
            const errorData = await fallbackResponse.json().catch(() => ({}));
            throw new Error(errorData.message || "Could not create appointment");
        }
        return;
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Could not create appointment");
    }
}

/**
 * Get available dates (next 14 days, excluding Sundays by default)
 * 
 * @param daysAhead - Number of days to show
 * @param closedDays - Days of week that are closed (0 = Sunday, 6 = Saturday)
 */
export function getAvailableDates(daysAhead = 14, closedDays = [0]): Date[] {
    const dates: Date[] = [];
    const today = new Date();

    for (let i = 1; i <= daysAhead; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() + i);

        // Skip closed days
        if (!closedDays.includes(date.getDay())) {
            dates.push(date);
        }
    }

    return dates;
}

