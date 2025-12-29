"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { removeToken } from "@/lib/api";
import { useCartStore } from "@/lib/store";
import { CartDrawer } from "@/components/storefront";
import {
    Menu,
    X,
    ShoppingCart,
    User,
    Search,
    Smartphone,
    MapPin,
    Star,
    Wrench,
    Clock,
    Shield,
    Package
} from "lucide-react";

// Marquee content component for the scrolling ticker
const MarqueeContent = () => (
    <>
        <span className="mx-8 text-sm font-medium flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5" />
            Lokale smartphone-experts in Antwerpen
        </span>
        <span className="mx-8 text-sm font-medium flex items-center gap-2">
            <Star className="w-3.5 h-3.5" />
            4.9 klantbeoordeling
        </span>
        <span className="mx-8 text-sm font-medium flex items-center gap-2">
            <Wrench className="w-3.5 h-3.5" />
            5 jaar ervaring in smartphone reparaties
        </span>
        <span className="mx-8 text-sm font-medium flex items-center gap-2">
            <Clock className="w-3.5 h-3.5" />
            Vandaag gebracht = vandaag klaar
        </span>
        <span className="mx-8 text-sm font-medium flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            Tot 1 jaar garantie op reparaties
        </span>
        <span className="mx-8 text-sm font-medium flex items-center gap-2">
            <Package className="w-3.5 h-3.5" />
            Gratis verzending vanaf €75
        </span>
    </>
);

export function Navbar() {
    const router = useRouter();
    const pathname = usePathname();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Get cart count from Zustand store
    const cartItemCount = useCartStore((state) => state.getItemCount());

    useEffect(() => {
        setMounted(true);
        if (typeof window !== "undefined") {
            setIsLoggedIn(!!localStorage.getItem("accessToken"));
        }
    }, []);

    const handleLogout = () => {
        removeToken();
        setIsLoggedIn(false);
        window.location.href = "/";
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
            setShowSearch(false);
            setSearchQuery("");
        }
    };

    // Check if current path matches nav item - strict matching
    const isActive = (path: string) => {
        if (pathname === path) return true;
        // Only match child routes for specific parent paths
        if (path !== "/" && pathname.startsWith(path + "/")) return true;
        return false;
    };

    const navItems = [
        { href: "/phones", label: "Toestellen" },
        { href: "/accessories", label: "Accessoires" },
        { href: "/repair/book", label: "Reparaties" },
        { href: "/track", label: "Track & Trace" },
        { href: "/contact", label: "Contact" },
    ];

    return (
        <>
            <header className="sticky top-0 z-50 bg-white border-b border-zinc-100">
                {/* Scrolling Ticker Bar */}
                <div className="bg-zinc-900 text-white overflow-hidden py-2">
                    <div className="animate-marquee whitespace-nowrap flex">
                        <MarqueeContent />
                        <MarqueeContent />
                    </div>
                </div>

                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Smartphone className="w-6 h-6 text-zinc-900" />
                            <span className="font-semibold text-lg text-zinc-900 tracking-tight">SMARTPHONE SERVICE</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.href)
                                        ? "text-blue-600 bg-blue-50"
                                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Desktop Actions - BIGGER */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Search */}
                            {showSearch ? (
                                <form onSubmit={handleSearch} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-56 px-4 py-2.5 text-base border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                        autoFocus
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowSearch(false)}
                                        className="p-3 text-zinc-400 hover:text-zinc-600"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </form>
                            ) : (
                                <button
                                    onClick={() => setShowSearch(true)}
                                    className="p-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors"
                                >
                                    <Search className="w-6 h-6" />
                                </button>
                            )}

                            {/* Cart with Badge - Opens Drawer */}
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="p-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors relative"
                            >
                                <ShoppingCart className="w-6 h-6" />
                                {mounted && cartItemCount > 0 && (
                                    <span className="absolute top-0 right-0 w-6 h-6 bg-zinc-900 text-white text-sm font-bold rounded-full flex items-center justify-center">
                                        {cartItemCount > 9 ? "9+" : cartItemCount}
                                    </span>
                                )}
                            </button>

                            {mounted && isLoggedIn ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/account">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="hidden lg:inline">Mijn Account</span>
                                        </Button>
                                    </Link>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleLogout}
                                        className="text-zinc-500 hover:text-zinc-700"
                                    >
                                        Uitloggen
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="text-zinc-700 hover:text-zinc-900">
                                            Inloggen
                                        </Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800">
                                            Registreren
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex md:hidden items-center gap-2">
                            <button
                                onClick={() => setIsCartOpen(true)}
                                className="p-2 text-zinc-600 relative"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                {mounted && cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 text-white text-xs rounded-full flex items-center justify-center">
                                        {cartItemCount > 9 ? "9+" : cartItemCount}
                                    </span>
                                )}
                            </button>
                            <button
                                className="p-2 text-zinc-600"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                            >
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t border-zinc-100">
                            <div className="flex flex-col gap-1">
                                {/* Mobile Search */}
                                <form onSubmit={handleSearch} className="relative mb-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search products..."
                                        className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                    />
                                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                </form>

                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive(item.href)
                                            ? "bg-zinc-900 text-white"
                                            : "text-zinc-600 hover:bg-zinc-100"
                                            }`}
                                    >
                                        {item.label}
                                    </Link>
                                ))}

                                <div className="flex gap-2 pt-4 mt-4 border-t border-zinc-100">
                                    {mounted && isLoggedIn ? (
                                        <>
                                            <Link href="/account" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                                <Button variant="outline" className="w-full gap-2" size="sm">
                                                    <User className="w-4 h-4" />
                                                    Mijn Account
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" className="flex-1" size="sm" onClick={handleLogout}>
                                                Uitloggen
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                                <Button variant="outline" className="w-full" size="sm">Inloggen</Button>
                                            </Link>
                                            <Link href="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                                <Button className="w-full bg-zinc-900 text-white" size="sm">Registreren</Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </nav>
            </header>

            {/* Cart Drawer */}
            <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
        </>
    );
}
