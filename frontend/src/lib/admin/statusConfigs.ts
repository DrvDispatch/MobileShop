/**
 * Status Configurations
 * 
 * Shared status display configurations for admin panel.
 * Used across orders, appointments, users, and other entities.
 * 
 * BUSINESS LOGIC LAYER - UI Agnostic
 */

import {
    Clock,
    CheckCircle,
    XCircle,
    Truck,
    Package,
    RotateCcw,
    AlertCircle,
    type LucideIcon,
} from 'lucide-react';

// Status config type
export interface StatusConfig {
    label: string;
    color: string;
    bg: string;
    icon?: LucideIcon;
}

/**
 * Order Status Configuration
 */
export const ORDER_STATUS_CONFIG: Record<string, StatusConfig> = {
    PENDING: {
        label: 'In afwachting',
        color: 'text-yellow-600',
        bg: 'bg-yellow-50 border-yellow-200',
        icon: Clock,
    },
    PAID: {
        label: 'Betaald',
        color: 'text-blue-600',
        bg: 'bg-blue-50 border-blue-200',
        icon: CheckCircle,
    },
    PROCESSING: {
        label: 'In behandeling',
        color: 'text-purple-600',
        bg: 'bg-purple-50 border-purple-200',
        icon: Package,
    },
    SHIPPED: {
        label: 'Verzonden',
        color: 'text-indigo-600',
        bg: 'bg-indigo-50 border-indigo-200',
        icon: Truck,
    },
    DELIVERED: {
        label: 'Afgeleverd',
        color: 'text-green-600',
        bg: 'bg-green-50 border-green-200',
        icon: CheckCircle,
    },
    CANCELLED: {
        label: 'Geannuleerd',
        color: 'text-red-600',
        bg: 'bg-red-50 border-red-200',
        icon: XCircle,
    },
    REFUNDED: {
        label: 'Terugbetaald',
        color: 'text-orange-600',
        bg: 'bg-orange-50 border-orange-200',
        icon: RotateCcw,
    },
};

/**
 * Appointment Status Configuration
 */
export const APPOINTMENT_STATUS_CONFIG: Record<string, StatusConfig> = {
    CONFIRMED: {
        label: 'Bevestigd',
        color: 'text-blue-700',
        bg: 'bg-blue-100 border-blue-200',
        icon: CheckCircle,
    },
    COMPLETED: {
        label: 'Voltooid',
        color: 'text-green-700',
        bg: 'bg-green-100 border-green-200',
        icon: CheckCircle,
    },
    CANCELLED: {
        label: 'Geannuleerd',
        color: 'text-red-700',
        bg: 'bg-red-100 border-red-200',
        icon: XCircle,
    },
    NO_SHOW: {
        label: 'Niet Verschenen',
        color: 'text-amber-700',
        bg: 'bg-amber-100 border-amber-200',
        icon: AlertCircle,
    },
};

/**
 * User Role Configuration
 */
export const USER_ROLE_CONFIG: Record<string, StatusConfig> = {
    ADMIN: {
        label: 'Admin',
        color: 'text-red-700',
        bg: 'bg-red-100',
    },
    STAFF: {
        label: 'Medewerker',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
    },
    CUSTOMER: {
        label: 'Klant',
        color: 'text-zinc-700',
        bg: 'bg-zinc-100',
    },
};

/**
 * Priority Configuration
 */
export const PRIORITY_CONFIG: Record<string, StatusConfig> = {
    NORMAL: {
        label: 'Normaal',
        color: 'text-zinc-600',
        bg: 'bg-zinc-100',
    },
    URGENT: {
        label: 'Spoed',
        color: 'text-orange-600',
        bg: 'bg-orange-100',
    },
    VIP: {
        label: 'VIP',
        color: 'text-purple-600',
        bg: 'bg-purple-100',
    },
};

/**
 * Product Condition Configuration
 */
export const CONDITION_CONFIG: Record<string, StatusConfig> = {
    NEW: {
        label: 'Nieuw',
        color: 'text-green-700',
        bg: 'bg-green-100',
    },
    USED: {
        label: 'Gebruikt',
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
    },
    REFURBISHED: {
        label: 'Refurbished',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
    },
};

/**
 * Refund Status Configuration
 */
export const REFUND_STATUS_CONFIG: Record<string, StatusConfig> = {
    PENDING: {
        label: 'In afwachting',
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
    },
    APPROVED: {
        label: 'Goedgekeurd',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
    },
    REJECTED: {
        label: 'Afgewezen',
        color: 'text-red-700',
        bg: 'bg-red-100',
    },
    PROCESSED: {
        label: 'Verwerkt',
        color: 'text-green-700',
        bg: 'bg-green-100',
    },
};

/**
 * Ticket Status Configuration
 */
export const TICKET_STATUS_CONFIG: Record<string, StatusConfig> = {
    OPEN: {
        label: 'Open',
        color: 'text-yellow-700',
        bg: 'bg-yellow-100',
    },
    IN_PROGRESS: {
        label: 'In behandeling',
        color: 'text-blue-700',
        bg: 'bg-blue-100',
    },
    RESOLVED: {
        label: 'Opgelost',
        color: 'text-green-700',
        bg: 'bg-green-100',
    },
    CLOSED: {
        label: 'Gesloten',
        color: 'text-zinc-700',
        bg: 'bg-zinc-100',
    },
};

/**
 * Get status configuration with fallback
 */
export function getStatusConfig(
    status: string,
    configMap: Record<string, StatusConfig>
): StatusConfig {
    return configMap[status] || {
        label: status,
        color: 'text-zinc-700',
        bg: 'bg-zinc-100',
    };
}

/**
 * Repair type labels
 */
export const REPAIR_TYPE_LABELS: Record<string, string> = {
    SCREEN: 'Scherm vervanging',
    BATTERY: 'Batterij vervangen',
    BACKCOVER: 'Achterkant',
    CHARGING_PORT: 'Oplaadpoort',
    WATER_DAMAGE: 'Waterschade',
    OTHER: 'Anders',
};

/**
 * Time slots for appointments
 */
export const TIME_SLOTS = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00'];
