/**
 * Smart image URL utility that works with both production and localhost
 * 
 * In production: uses path-based routing (smartphoneservice.be/storage)
 * In development: falls back to localhost MinIO when production URL fails
 */

const PRODUCTION_STORAGE_PATH = '/storage';
const LOCAL_MINIO_URL = 'http://localhost:9002';
const PRODUCTION_MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || 'https://smartphoneservice.be/storage';

/**
 * Convert a production image URL to localhost MinIO URL
 */
export function getLocalImageUrl(productionUrl: string): string {
    if (!productionUrl) return '';

    try {
        const url = new URL(productionUrl);
        // Handle both old subdomain and new path-based routing
        if (url.hostname.includes('smartphoneservice')) {
            // Extract path - remove /storage prefix if present (path-based routing)
            let imagePath = url.pathname;
            if (imagePath.startsWith('/storage')) {
                imagePath = imagePath.replace('/storage', '');
            }
            return `${LOCAL_MINIO_URL}${imagePath}`;
        }
    } catch {
        // If URL parsing fails, return original
    }

    return productionUrl;
}

/**
 * Convert a localhost MinIO URL to production URL
 */
export function getProductionImageUrl(localUrl: string): string {
    if (!localUrl) return '';

    try {
        // If already a full production URL with /storage, return as-is
        if (localUrl.includes('smartphoneservice.be/storage')) {
            return localUrl;
        }

        // Handle both localhost:9002 (backend reported) and localhost:9000 (standard MinIO)
        if (localUrl.includes('localhost:9002') || localUrl.includes('localhost:9000')) {
            const url = new URL(localUrl);
            return `${PRODUCTION_MINIO_URL}${url.pathname}`;
        }
        // Handle old subdomain URLs - convert to new path-based
        if (localUrl.includes('images.smartphoneservice.be')) {
            const url = new URL(localUrl);
            return `https://smartphoneservice.be/storage${url.pathname}`;
        }
    } catch {
        // If URL parsing fails, return original
    }

    return localUrl;
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
    if (typeof window === 'undefined') return process.env.NODE_ENV === 'development';
    return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

/**
 * Get the best image URL based on environment
 * In development, prefer localhost MinIO
 * In production, use the original URL
 */
export function getImageUrl(url: string | null | undefined): string {
    if (!url) return '';

    // In development, convert to localhost URL
    if (isDevelopment()) {
        return getLocalImageUrl(url);
    }

    // In production/tunnel, ignore localhost URLs from DB and force production URL
    return getProductionImageUrl(url);
}

/**
 * Handle image error by trying localhost fallback
 * Returns the localhost URL to try, or null if already tried
 */
export function getImageFallbackUrl(currentSrc: string): string | null {
    // If already using localhost, no fallback available
    if (currentSrc.includes('localhost') || currentSrc.includes('127.0.0.1')) {
        return null;
    }

    // Try localhost version
    return getLocalImageUrl(currentSrc);
}
