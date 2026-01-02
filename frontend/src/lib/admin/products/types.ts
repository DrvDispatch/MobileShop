/**
 * Product Types and Constants
 * 
 * Shared types for product admin module.
 */

// ============================================
// TYPES
// ============================================

export type Condition = 'NEW' | 'REFURBISHED' | 'USED';
export type DeviceGrade = 'A_PLUS' | 'A' | 'B' | 'C' | 'D';
export type ProductType = 'PHONE' | 'ACCESSORY';

export interface ImageAnalysis {
    detectedColor: string;
    conditionAssessment: string;
    detectedStorage?: string;
    detectedModel?: string;
    confidence: number;
    notes?: string;
}

export interface ProductContent {
    title: string;
    shortDescription: string;
    longDescription: string;
    seoKeywords: string[];
    suggestedImages: { url: string; alt: string }[];
}

export interface Asset {
    url: string;
    key: string;
    lastModified?: string;
    size?: number;
}

export interface ProductFormData {
    name: string;
    description: string;
    price: number;
    compareAtPrice: number;
    sku: string;
    stockQty: number;
    brand: string;
    condition: Condition;
    deviceGrade: DeviceGrade;
    storage?: string;
    color?: string;
    batteryHealth?: number;
    isActive: boolean;
    isFeatured: boolean;
    categoryId: string;
    images: string[];
}

// ============================================
// CONSTANTS
// ============================================

export const BRANDS = [
    'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Huawei', 'Sony', 'LG', 'Motorola', 'Other'
];

export const STORAGE_OPTIONS = ['64GB', '128GB', '256GB', '512GB', '1TB'];

export const CONDITION_OPTIONS = [
    { value: 'NEW' as const, label: 'Nieuw', description: 'Factory sealed' },
    { value: 'REFURBISHED' as const, label: 'Refurbished', description: 'Professionally restored' },
    { value: 'USED' as const, label: 'Gebruikt', description: 'Pre-owned condition' },
];

export const DEVICE_GRADES = [
    { value: 'A_PLUS' as const, label: 'A+', description: 'Zoals nieuw' },
    { value: 'A' as const, label: 'A', description: 'Uitstekend' },
    { value: 'B' as const, label: 'B', description: 'Goed' },
    { value: 'C' as const, label: 'C', description: 'Redelijk' },
    { value: 'D' as const, label: 'D', description: 'Acceptabel' },
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// Asset sorting for library
export function sortAssets(assets: Asset[]): Asset[] {
    const getBrandScore = (key: string): number => {
        if (key.includes('/Apple/')) return 1000;
        if (key.includes('/Samsung/')) return 500;
        return 0;
    };

    const getModelTierScore = (key: string): number => {
        if (key.includes('Pro Max') || key.includes('Ultra')) return 300;
        if (key.includes('Pro') && !key.includes('Pro Max')) return 250;
        if (key.includes('Plus')) return 200;
        if (key.includes('Z Fold') || key.includes('Z Flip')) return 180;
        return 100;
    };

    const getModelNumber = (key: string): number => {
        const match = key.match(/(?:iPhone|iPad|Galaxy\s*[A-Z]?)[\s]*(\d+)/i);
        return match ? parseInt(match[1]) : 0;
    };

    return [...assets].sort((a, b) => {
        const brandDiff = getBrandScore(b.key) - getBrandScore(a.key);
        if (brandDiff !== 0) return brandDiff;
        const tierDiff = getModelTierScore(b.key) - getModelTierScore(a.key);
        if (tierDiff !== 0) return tierDiff;
        return getModelNumber(b.key) - getModelNumber(a.key);
    });
}

export function extractAssetInfo(key: string): { brand: string; deviceName: string } {
    const parts = key.split('/');
    const brand = parts.length > 1 ? parts[1] : '';
    const deviceName = parts.length > 2 ? parts[2] : parts[parts.length - 1].replace(/\.[^.]+$/, '');
    return { brand, deviceName };
}
