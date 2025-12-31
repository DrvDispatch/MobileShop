/**
 * Booking API - All API calls for the repair booking flow
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 * This module handles all data fetching for the booking flow.
 * It can be used by any theme/vertical that implements booking.
 */

// Types
export interface DeviceType {
    id: string;
    name: string;
    slug: string;
    icon?: string;
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    logo?: string;
}

export interface Device {
    id: string;
    name: string;
    slug: string;
    image?: string;
}

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

/**
 * Fetch available device types (Smartphone, Tablet, etc.)
 */
export async function fetchDeviceTypes(): Promise<DeviceType[]> {
    try {
        const response = await fetch('/api/repairs/device-types');
        if (!response.ok) throw new Error('Failed to fetch device types');
        return await response.json();
    } catch (error) {
        console.error("Failed to fetch device types:", error);
        // Fallback for graceful degradation
        return [
            { id: "1", name: "Smartphone", slug: "smartphone" },
            { id: "2", name: "Tablet", slug: "tablet" },
        ];
    }
}

/**
 * Fetch brands for a specific device type
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
 */
export async function createAppointment(data: AppointmentData): Promise<void> {
    const response = await fetch('/api/appointments', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

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
