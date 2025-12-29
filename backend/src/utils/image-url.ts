/**
 * Image URL Utility
 * 
 * This utility constructs full image URLs based on the environment.
 * Images are stored as relative paths in the database and resolved
 * at runtime using MINIO_PUBLIC_URL.
 */

const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL || 'http://localhost:9002';

/**
 * Converts a relative image path to a full URL based on the current environment.
 * If the URL is already absolute (starts with http), it returns it as-is.
 */
export function resolveImageUrl(relativePath: string | null | undefined): string | null {
    if (!relativePath) return null;

    // Already an absolute URL - strip the base and make relative, then resolve
    if (relativePath.startsWith('http://') || relativePath.startsWith('https://')) {
        // Extract just the path portion
        const pathMatch = relativePath.match(/https?:\/\/[^\/]+(\/.*)/);
        if (pathMatch) {
            return `${MINIO_PUBLIC_URL}${pathMatch[1]}`;
        }
        return relativePath;
    }

    // Ensure path starts with /
    const path = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${MINIO_PUBLIC_URL}${path}`;
}

/**
 * Strips the base URL from an absolute image URL to get the relative path.
 * This is used when storing images in the database.
 */
export function getRelativeImagePath(absoluteUrl: string): string {
    if (!absoluteUrl) return absoluteUrl;

    // Remove any known base URLs to get relative path
    const knownBases = [
        'https://images.smartphoneservice.be',
        'http://localhost:9002',
        'http://localhost:9000',
        process.env.MINIO_PUBLIC_URL,
    ].filter(Boolean);

    for (const base of knownBases) {
        if (base && absoluteUrl.startsWith(base)) {
            return absoluteUrl.replace(base, '');
        }
    }

    return absoluteUrl;
}

/**
 * Transform an image object by resolving its URL
 */
export function transformImage<T extends { url: string }>(image: T): T {
    return {
        ...image,
        url: resolveImageUrl(image.url) || image.url,
    };
}

/**
 * Transform an array of image objects by resolving their URLs
 */
export function transformImages<T extends { url: string }>(images: T[]): T[] {
    return images.map(transformImage);
}

/**
 * Transform a product object by resolving all image URLs
 */
export function transformProductImages<T extends { images?: { url: string }[] }>(product: T): T {
    if (!product.images) return product;
    return {
        ...product,
        images: transformImages(product.images),
    };
}
