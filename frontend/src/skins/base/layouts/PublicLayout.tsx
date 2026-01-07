'use client';

/**
 * Base Skin - Public Layout
 * 
 * Shared layout for all public pages.
 * Composes Navbar and Footer around page content.
 * 
 * PROPS-ONLY: Receives PublicLayoutVM, passes sub-VMs to Navbar/Footer.
 */

import { Navbar } from '../components/landing/navbar';
import { Footer } from '../components/landing/footer';
import type { PublicLayoutVM } from '@core/skin';

export interface PublicLayoutProps {
    vm: PublicLayoutVM;
    children: React.ReactNode;
}

export function PublicLayout({ vm, children }: PublicLayoutProps) {
    return (
        <main className="min-h-screen bg-white">
            <Navbar vm={vm.navbar} />
            {children}
            <Footer vm={vm.footer} />
        </main>
    );
}
