'use client';

/**
 * Classic Skin - Public Layout
 * 
 * Traditional professional layout with:
 * - Clean white/cream backgrounds
 * - Professional header with logo and navigation
 * - Subtle borders and shadows
 * - Classic footer with contact info
 */

import Link from 'next/link';
import type { PublicLayoutVM } from '@core/skin';
import { Phone, Mail, Calendar, ChevronDown } from 'lucide-react';

export interface ClassicLayoutProps {
    vm: PublicLayoutVM;
    children: React.ReactNode;
}

export function ClassicLayout({ vm, children }: ClassicLayoutProps) {
    const { shopName, logoUrl } = vm.navbar;
    const { contactInfo } = vm.footer;

    return (
        <div className="min-h-screen bg-white flex flex-col">
            {/* Top Contact Bar */}
            <div className="bg-slate-800 text-white py-2">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-6">
                        {contactInfo.phone && (
                            <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2 hover:text-amber-400 transition-colors">
                                <Phone className="w-4 h-4" />
                                <span>{contactInfo.phone}</span>
                            </a>
                        )}
                        {contactInfo.email && (
                            <a href={`mailto:${contactInfo.email}`} className="hidden md:flex items-center gap-2 hover:text-amber-400 transition-colors">
                                <Mail className="w-4 h-4" />
                                <span>{contactInfo.email}</span>
                            </a>
                        )}
                    </div>
                    <div className="text-slate-300">
                        Open: Mon - Sat, 9:00 - 18:00
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-50">
                <nav className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-3">
                        {logoUrl ? (
                            <img src={logoUrl} alt={shopName} className="h-12 w-auto" />
                        ) : (
                            <div className="w-12 h-12 bg-slate-800 rounded flex items-center justify-center">
                                <span className="text-white font-bold text-xl">{shopName?.charAt(0) || 'S'}</span>
                            </div>
                        )}
                        <span className="font-serif text-2xl font-semibold text-slate-800">{shopName}</span>
                    </Link>

                    {/* Navigation */}
                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                            Home
                        </Link>
                        <Link href="/book" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                            Services
                        </Link>
                        <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                            About
                        </Link>
                        <Link href="/contact" className="text-slate-600 hover:text-slate-900 font-medium transition-colors">
                            Contact
                        </Link>
                    </div>

                    {/* Book Button */}
                    <Link
                        href="/book"
                        className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded transition-all hover:shadow-lg"
                    >
                        <Calendar className="w-5 h-5" />
                        <span>Book Appointment</span>
                    </Link>
                </nav>
            </header>

            {/* Main Content */}
            <main className="flex-1">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-slate-800 text-white">
                <div className="max-w-6xl mx-auto px-6 py-12">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* About */}
                        <div>
                            <h3 className="text-lg font-serif font-semibold mb-4">{shopName}</h3>
                            <p className="text-slate-300 text-sm leading-relaxed">
                                Professional service with years of experience.
                                We are committed to providing you with the best experience possible.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h3 className="text-lg font-serif font-semibold mb-4">Quick Links</h3>
                            <ul className="space-y-2 text-sm">
                                <li><Link href="/book" className="text-slate-300 hover:text-white transition-colors">Book Appointment</Link></li>
                                <li><Link href="/about" className="text-slate-300 hover:text-white transition-colors">About Us</Link></li>
                                <li><Link href="/contact" className="text-slate-300 hover:text-white transition-colors">Contact</Link></li>
                                <li><Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">Privacy Policy</Link></li>
                            </ul>
                        </div>

                        {/* Contact Info */}
                        <div>
                            <h3 className="text-lg font-serif font-semibold mb-4">Contact Us</h3>
                            <ul className="space-y-3 text-sm text-slate-300">
                                {contactInfo.phone && (
                                    <li className="flex items-center gap-2">
                                        <Phone className="w-4 h-4" />
                                        <span>{contactInfo.phone}</span>
                                    </li>
                                )}
                                {contactInfo.email && (
                                    <li className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <span>{contactInfo.email}</span>
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-slate-700 mt-8 pt-8 text-center text-sm text-slate-400">
                        <p>© {new Date().getFullYear()} {shopName}. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}
