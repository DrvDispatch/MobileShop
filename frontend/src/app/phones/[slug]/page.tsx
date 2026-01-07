'use client';

/**
 * Phone Detail Route - Thin Delegate
 * 
 * This route uses the same ProductDetail page VM since phones are products.
 * Pattern:
 * 1. Get active skin
 * 2. Build layout VM
 * 3. Build page VM (reuses ProductDetailPageVM)
 * 4. Wrap: Skin.layouts.PublicLayout(layoutVM) > Skin.pages.ProductDetail(pageVM)
 */

import { Suspense } from 'react';
import { useActiveSkin } from '@core/skin';
import { useProductDetailPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

function PhoneDetailContent() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useProductDetailPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.ProductDetail vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}

export default function PhoneDetailRoute() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400" />
            </div>
        }>
            <PhoneDetailContent />
        </Suspense>
    );
}
