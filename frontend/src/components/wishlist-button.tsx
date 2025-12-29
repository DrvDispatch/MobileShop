"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface WishlistButtonProps {
    productId: string;
    className?: string;
    variant?: "icon" | "button";
}

export function WishlistButton({ productId, className = "", variant = "icon" }: WishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const checkWishlist = async () => {
            const token = localStorage.getItem("accessToken");
            if (!token) return;

            setIsLoggedIn(true);

            try {
                const response = await fetch(`${API_URL}/api/wishlist/check/${productId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setIsInWishlist(data.isInWishlist);
                }
            } catch (error) {
                console.error("Failed to check wishlist:", error);
            }
        };
        checkWishlist();
    }, [productId]);

    const toggleWishlist = async () => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            // Could show login modal here
            window.location.href = "/login?redirect=" + encodeURIComponent(window.location.pathname);
            return;
        }

        setIsLoading(true);
        try {
            if (isInWishlist) {
                await fetch(`${API_URL}/api/wishlist/${productId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsInWishlist(false);
            } else {
                await fetch(`${API_URL}/api/wishlist/${productId}`, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                });
                setIsInWishlist(true);
            }
        } catch (error) {
            console.error("Failed to toggle wishlist:", error);
        } finally {
            setIsLoading(false);
        }
    };

    if (variant === "button") {
        return (
            <Button
                variant="outline"
                onClick={toggleWishlist}
                disabled={isLoading}
                className={className}
            >
                <Heart
                    className={`w-4 h-4 mr-2 transition-colors ${isInWishlist ? "fill-red-500 text-red-500" : ""
                        }`}
                />
                {isInWishlist ? "In verlanglijstje" : "Toevoegen aan verlanglijstje"}
            </Button>
        );
    }

    return (
        <button
            onClick={toggleWishlist}
            disabled={isLoading}
            className={`p-2 rounded-full transition-all hover:scale-110 ${isInWishlist
                    ? "bg-red-100 text-red-500"
                    : "bg-white/80 text-zinc-400 hover:text-red-500 hover:bg-red-50"
                } ${className}`}
            title={isInWishlist ? "Verwijderen uit verlanglijstje" : "Toevoegen aan verlanglijstje"}
        >
            <Heart className={`w-5 h-5 ${isInWishlist ? "fill-current" : ""}`} />
        </button>
    );
}
