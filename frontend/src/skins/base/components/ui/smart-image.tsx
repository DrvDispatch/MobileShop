"use client";

import { useState, useCallback } from 'react';
import { getImageUrl, getImageFallbackUrl } from '@/lib/image-utils';
import { Package } from 'lucide-react';

interface SmartImageProps {
    src: string | null | undefined;
    alt: string;
    className?: string;
    fallbackClassName?: string;
    fallbackIcon?: React.ReactNode;
}

/**
 * Smart image component that automatically handles:
 * 1. In development: converts production URLs to localhost MinIO
 * 2. On error: tries localhost fallback before showing placeholder
 * 3. Shows a package icon placeholder if all sources fail
 */
export function SmartImage({
    src,
    alt,
    className = "w-full h-full object-cover",
    fallbackClassName = "w-full h-full flex items-center justify-center bg-zinc-100",
    fallbackIcon = <Package className="w-6 h-6 text-zinc-300" />
}: SmartImageProps) {
    const [currentSrc, setCurrentSrc] = useState(getImageUrl(src));
    const [hasError, setHasError] = useState(false);
    const [triedFallback, setTriedFallback] = useState(false);

    const handleError = useCallback(() => {
        if (!triedFallback && src) {
            // Try localhost fallback
            const fallbackUrl = getImageFallbackUrl(currentSrc);
            if (fallbackUrl && fallbackUrl !== currentSrc) {
                setCurrentSrc(fallbackUrl);
                setTriedFallback(true);
                return;
            }
        }
        // All sources failed, show placeholder
        setHasError(true);
    }, [currentSrc, triedFallback, src]);

    if (!src || hasError) {
        return (
            <div className={fallbackClassName}>
                {fallbackIcon}
            </div>
        );
    }

    return (
        <img
            src={currentSrc}
            alt={alt}
            className={className}
            onError={handleError}
        />
    );
}
