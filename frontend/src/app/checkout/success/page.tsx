'use client';

/**
 * Checkout Success Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 * Uses Suspense for useSearchParams.
 */

import { Suspense } from 'react';
import { useActiveSkin } from '@core/skin';
import { useCheckoutSuccessPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

function SuccessContent() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useCheckoutSuccessPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.CheckoutSuccess vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}

export default function CheckoutSuccessRoute() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
