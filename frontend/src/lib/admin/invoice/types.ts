/**
 * Invoice Types and Constants
 * 
 * Shared types for invoice module.
 */

export interface InvoiceSettings {
    companyName: string;
    companyAddress: {
        line1: string;
        line2?: string;
        city: string;
        postalCode: string;
        country: string;
    };
    vatNumber: string;
    phone: string;
    email: string;
    website?: string;
    bankAccount?: string;
    bankName?: string;
    invoicePrefix: string;
    invoiceFooter: string;
    logoUrl?: string;
}

export interface InvoiceItem {
    id?: string;
    type: 'PRODUCT' | 'REPAIR' | 'CUSTOM';
    productId?: string;
    repairId?: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    type: string;
    status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
    subtotal: number;
    taxAmount: number;
    discountAmount: number;
    total: number;
    paymentMethod: string;
    paidAt?: string;
    createdAt: string;
    items: InvoiceItem[];
}

export interface Customer {
    id: string;
    name: string;
    email: string;
    phone?: string;
}

export interface Product {
    id: string;
    name: string;
    sku: string;
    price: number;
    stockQty: number;
}

export interface RepairService {
    id: string;
    name: string;
    price: number;
    deviceId?: string;
    serviceId?: string;
}

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

export interface RepairOption {
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

export type PaymentMethod = 'CASH' | 'CARD' | 'TRANSFER' | 'PENDING';

export const INVOICE_STATUS_CONFIG: Record<string, { label: string; style: string }> = {
    DRAFT: { label: 'Concept', style: 'bg-zinc-100 text-zinc-700' },
    SENT: { label: 'Verzonden', style: 'bg-blue-100 text-blue-700' },
    PAID: { label: 'Betaald', style: 'bg-green-100 text-green-700' },
    CANCELLED: { label: 'Geannuleerd', style: 'bg-red-100 text-red-700' },
};

export const PAYMENT_METHODS = [
    { value: 'CASH' as const, label: 'Contant' },
    { value: 'CARD' as const, label: 'Kaart' },
    { value: 'TRANSFER' as const, label: 'Overschr.' },
    { value: 'PENDING' as const, label: 'Later' },
];

export const defaultInvoiceSettings: InvoiceSettings = {
    companyName: '',
    companyAddress: { line1: '', city: '', postalCode: '', country: 'BE' },
    vatNumber: '',
    phone: '',
    email: '',
    website: '',
    bankAccount: '',
    bankName: '',
    invoicePrefix: 'INV',
    invoiceFooter: '',
};
