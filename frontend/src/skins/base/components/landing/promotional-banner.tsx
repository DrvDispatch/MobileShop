"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X, Tag, Truck, Wrench, Shield, Sparkles } from "lucide-react";

interface Banner {
    id: string;
    title: string;
    message: string;
    linkUrl?: string;
    linkText?: string;
    bgColor: string;
    textColor: string;
    position: string;
}

export function PromotionalBanner() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(true);
    const [isPaused, setIsPaused] = useState(false);
    const [isAnimating, setIsAnimating] = useState(false);

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const res = await fetch('/api/banners/active?position=TICKER');
                if (res.ok) {
                    const data = await res.json();
                    setBanners(data);
                }
            } catch (err) {
                console.error("Failed to fetch banners:", err);
            }
        };

        fetchBanners();
        const interval = setInterval(fetchBanners, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, []);

    // Slower rotation - 8 seconds instead of 4
    useEffect(() => {
        if (banners.length <= 1 || isPaused) return;
        const interval = setInterval(() => {
            setIsAnimating(true);
            setTimeout(() => {
                setCurrentIndex((prev) => (prev + 1) % banners.length);
                setIsAnimating(false);
            }, 300);
        }, 8000);
        return () => clearInterval(interval);
    }, [banners.length, isPaused]);

    const goToPrevious = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
            setIsAnimating(false);
        }, 200);
    }, [banners.length]);

    const goToNext = useCallback(() => {
        setIsAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
            setIsAnimating(false);
        }, 200);
    }, [banners.length]);

    if (!isVisible || banners.length === 0) return null;

    const currentBanner = banners[currentIndex];
    if (!currentBanner) return null;

    // Icon based on banner content
    const getIcon = () => {
        const msg = (currentBanner.message || '').toLowerCase();
        const title = (currentBanner.title || '').toLowerCase();
        if (msg.includes('reparatie') || msg.includes('repair') || title.includes('reparatie'))
            return <Wrench className="w-4 h-4" />;
        if (msg.includes('gratis') || msg.includes('verzending') || msg.includes('shipping'))
            return <Truck className="w-4 h-4" />;
        if (msg.includes('garantie') || msg.includes('warranty'))
            return <Shield className="w-4 h-4" />;
        if (msg.includes('nieuw') || msg.includes('new'))
            return <Sparkles className="w-4 h-4" />;
        return <Tag className="w-4 h-4" />;
    };

    return (
        <div
            className="sticky top-0 z-50 overflow-hidden"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Clean, modern gradient background */}
            <div
                className="relative transition-all duration-500 ease-out"
                style={{
                    background: `linear-gradient(135deg, ${currentBanner.bgColor} 0%, ${adjustColor(currentBanner.bgColor, -20)} 100%)`,
                    color: currentBanner.textColor
                }}
            >
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
                        backgroundSize: '24px 24px'
                    }}
                />

                <div className="relative py-2.5 px-4">
                    <div className="container mx-auto flex items-center justify-center gap-3">
                        {/* Navigation - Left */}
                        {banners.length > 1 && (
                            <button
                                onClick={goToPrevious}
                                className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Vorige"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                        )}

                        {/* Banner content */}
                        <div
                            className={`flex items-center gap-2 transition-all duration-300 ${isAnimating ? 'opacity-0 translate-y-1' : 'opacity-100 translate-y-0'
                                }`}
                        >
                            <span className="flex-shrink-0 opacity-80">
                                {getIcon()}
                            </span>
                            <span className="text-sm md:text-base font-medium">
                                {currentBanner.message}
                            </span>
                            {currentBanner.linkUrl && currentBanner.linkText && (
                                <Link
                                    href={currentBanner.linkUrl}
                                    className="flex-shrink-0 ml-1 px-3 py-1 rounded-full text-xs font-semibold
                                             bg-white/20 hover:bg-white/30 transition-colors
                                             border border-white/20"
                                >
                                    {currentBanner.linkText}
                                </Link>
                            )}
                        </div>

                        {/* Navigation - Right */}
                        {banners.length > 1 && (
                            <button
                                onClick={goToNext}
                                className="p-1 rounded-full opacity-60 hover:opacity-100 transition-opacity"
                                aria-label="Volgende"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        )}

                        {/* Counter */}
                        {banners.length > 1 && (
                            <span className="hidden sm:inline-block text-xs opacity-50 ml-2">
                                {currentIndex + 1}/{banners.length}
                            </span>
                        )}
                    </div>
                </div>

                {/* Close button */}
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full 
                             opacity-40 hover:opacity-100 transition-opacity"
                    aria-label="Sluiten"
                >
                    <X className="w-3.5 h-3.5" />
                </button>

                {/* Progress bar */}
                {banners.length > 1 && !isPaused && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
                        <div
                            className="h-full bg-white/30 animate-progress"
                            style={{ animationDuration: '8s' }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper function to darken/lighten colors
function adjustColor(hex: string, amount: number): string {
    // Remove # if present
    hex = hex.replace('#', '');

    // Parse RGB
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);

    // Adjust
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));

    // Convert back to hex
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}
