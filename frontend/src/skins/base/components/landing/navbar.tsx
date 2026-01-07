'use client';

/**
 * Base Skin - Navbar (Props-Only)
 * 
 * This component is PURELY PRESENTATIONAL.
 * All logic has been moved to usePublicLayoutVM.
 * 
 * RULES:
 * - NO hooks (useState, useEffect, etc.)
 * - NO tenant/features/store access
 * - ONLY receive data via props
 */

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CartDrawer } from '@/components/storefront';
import type { NavbarVM, MarqueeItem } from '@core/skin';
import {
    Menu, X, ShoppingCart, User, Search, Smartphone,
    MapPin, Star, Wrench, Clock, Shield, Package
} from 'lucide-react';

// Icon mapping for marquee items
const MarqueeIconComponent = ({ icon }: { icon: MarqueeItem['icon'] }) => {
    const iconProps = { className: 'w-3.5 h-3.5' };
    switch (icon) {
        case 'location': return <MapPin {...iconProps} />;
        case 'star': return <Star {...iconProps} />;
        case 'wrench': return <Wrench {...iconProps} />;
        case 'clock': return <Clock {...iconProps} />;
        case 'shield': return <Shield {...iconProps} />;
        case 'package': return <Package {...iconProps} />;
        default: return null;
    }
};

const MarqueeContent = ({ items }: { items: MarqueeItem[] }) => (
    <>
        {items.map((item, index) => (
            <span key={index} className="mx-8 text-sm font-medium flex items-center gap-2">
                <MarqueeIconComponent icon={item.icon} />
                {item.text}
            </span>
        ))}
    </>
);

interface NavbarProps {
    vm: NavbarVM;
}

export function Navbar({ vm }: NavbarProps) {
    const {
        shopName,
        navItems,
        isActive,
        marqueeItems,
        showCart,
        cartCount,
        onCartClick,
        isCartOpen,
        onCartClose,
        searchQuery,
        setSearchQuery,
        showSearchInput,
        setShowSearchInput,
        onSearch,
        isLoggedIn,
        onLogout,
        isMenuOpen,
        setIsMenuOpen,
        mounted,
        labels,
    } = vm;

    return (
        <>
            <header className="sticky top-0 z-50 bg-white border-b border-zinc-100">
                {/* Scrolling Ticker Bar */}
                <div className="bg-zinc-900 text-white overflow-hidden py-2">
                    <div className="animate-marquee whitespace-nowrap flex">
                        <MarqueeContent items={marqueeItems} />
                        <MarqueeContent items={marqueeItems} />
                    </div>
                </div>

                <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Logo */}
                        <Link href="/" className="flex items-center gap-2">
                            <Smartphone className="w-6 h-6 text-zinc-900" />
                            <span className="font-semibold text-lg text-zinc-900 tracking-tight">{shopName.toUpperCase()}</span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(item.href) ? 'text-blue-600 bg-blue-50' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50'
                                        }`}
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </div>

                        {/* Desktop Actions */}
                        <div className="hidden md:flex items-center gap-4">
                            {/* Search */}
                            {showSearchInput ? (
                                <form onSubmit={onSearch} className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={labels.searchPlaceholder}
                                        className="w-56 px-4 py-2.5 text-base border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                        autoFocus
                                    />
                                    <button type="button" onClick={() => setShowSearchInput(false)} className="p-3 text-zinc-400 hover:text-zinc-600">
                                        <X className="w-5 h-5" />
                                    </button>
                                </form>
                            ) : (
                                <button onClick={() => setShowSearchInput(true)} className="p-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors">
                                    <Search className="w-6 h-6" />
                                </button>
                            )}

                            {/* Cart with Badge */}
                            {showCart && (
                                <button onClick={onCartClick} className="p-3 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-colors relative">
                                    <ShoppingCart className="w-6 h-6" />
                                    {mounted && cartCount > 0 && (
                                        <span className="absolute top-0 right-0 w-6 h-6 bg-zinc-900 text-white text-sm font-bold rounded-full flex items-center justify-center">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                    )}
                                </button>
                            )}

                            {mounted && isLoggedIn ? (
                                <div className="flex items-center gap-2">
                                    <Link href="/account">
                                        <Button variant="ghost" size="sm" className="gap-2">
                                            <div className="w-8 h-8 bg-zinc-900 text-white rounded-full flex items-center justify-center text-sm font-semibold">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <span className="hidden lg:inline">{labels.myAccount}</span>
                                        </Button>
                                    </Link>
                                    <Button variant="ghost" size="sm" onClick={onLogout} className="text-zinc-500 hover:text-zinc-700">
                                        {labels.logout}
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link href="/login">
                                        <Button variant="ghost" size="sm" className="text-zinc-700 hover:text-zinc-900">{labels.login}</Button>
                                    </Link>
                                    <Link href="/register">
                                        <Button size="sm" className="bg-zinc-900 text-white hover:bg-zinc-800">{labels.register}</Button>
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* Mobile Actions */}
                        <div className="flex md:hidden items-center gap-2">
                            {showCart && (
                                <button onClick={onCartClick} className="p-2 text-zinc-600 relative">
                                    <ShoppingCart className="w-5 h-5" />
                                    {mounted && cartCount > 0 && (
                                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-zinc-900 text-white text-xs rounded-full flex items-center justify-center">
                                            {cartCount > 9 ? '9+' : cartCount}
                                        </span>
                                    )}
                                </button>
                            )}
                            <button className="p-2 text-zinc-600" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {/* Mobile Navigation */}
                    {isMenuOpen && (
                        <div className="md:hidden py-4 border-t border-zinc-100">
                            <div className="flex flex-col gap-1">
                                {/* Mobile Search */}
                                <form onSubmit={onSearch} className="relative mb-4">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder={labels.searchPlaceholder}
                                        className="w-full px-4 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-500"
                                    />
                                    <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                                </form>

                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive(item.href) ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'
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
                                                    <User className="w-4 h-4" />{labels.myAccount}
                                                </Button>
                                            </Link>
                                            <Button variant="ghost" className="flex-1" size="sm" onClick={onLogout}>{labels.logout}</Button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/login" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                                <Button variant="outline" className="w-full" size="sm">{labels.login}</Button>
                                            </Link>
                                            <Link href="/register" className="flex-1" onClick={() => setIsMenuOpen(false)}>
                                                <Button className="w-full bg-zinc-900 text-white" size="sm">{labels.register}</Button>
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
            <CartDrawer isOpen={isCartOpen} onClose={onCartClose} />
        </>
    );
}
