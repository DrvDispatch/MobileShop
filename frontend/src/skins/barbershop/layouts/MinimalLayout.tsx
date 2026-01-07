'use client';

/**
 * Barbershop Skin - Minimal Layout
 * 
 * Ultra-minimal layout focused on appointments.
 * - Just logo + book button in header
 * - No traditional navbar
 * - Minimal footer (just copyright)
 * 
 * PROPS-ONLY: Receives PublicLayoutVM but uses only what's needed.
 */

import Link from 'next/link';
import type { PublicLayoutVM } from '@core/skin';
import { Scissors, Calendar, Phone } from 'lucide-react';

export interface MinimalLayoutProps {
    vm: PublicLayoutVM;
    children: React.ReactNode;
}

export function MinimalLayout({ vm, children }: MinimalLayoutProps) {
    const { shopName } = vm.navbar;
    const { contactInfo } = vm.footer;

    return (
        <main className="min-h-screen bg-stone-50">
            {/* Minimal Header - Just logo and book button */}
            <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-stone-900/95 border-b border-stone-800">
                <nav className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 text-white">
                        <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                            <Scissors className="w-5 h-5 text-stone-900" />
                        </div>
                        <span className="font-bold text-lg tracking-tight">{shopName}</span>
                    </Link>

                    <div className="flex items-center gap-4">
                        {contactInfo.phone && (
                            <a
                                href={`tel:${contactInfo.phone}`}
                                className="hidden sm:flex items-center gap-2 text-stone-300 hover:text-white transition-colors"
                            >
                                <Phone className="w-4 h-4" />
                                <span className="text-sm">{contactInfo.phone}</span>
                            </a>
                        )}
                        <Link
                            href="/repair/book"
                            className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-900 font-semibold rounded-full transition-colors"
                        >
                            <Calendar className="w-4 h-4" />
                            <span>Book Now</span>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Spacer for fixed header */}
            <div className="h-16" />

            {/* Page Content */}
            {children}

            {/* Minimal Footer */}
            <footer className="bg-stone-900 text-stone-400 py-8 mt-auto">
                <div className="max-w-5xl mx-auto px-6 text-center text-sm">
                    <p>© {new Date().getFullYear()} {shopName}. All rights reserved.</p>
                    <div className="flex items-center justify-center gap-6 mt-4">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
                    </div>
                </div>
            </footer>
        </main>
    );
}
