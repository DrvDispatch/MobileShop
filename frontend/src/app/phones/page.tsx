'use client';

/**
 * Phones Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 * Uses Suspense for useSearchParams.
 */

import { Suspense } from 'react';
import { useActiveSkin } from '@core/skin';
import { usePhonesPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

function PhonesContent() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = usePhonesPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Phones vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}

export default function PhonesRoute() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center">Loading...</div>}>
            <PhonesContent />
        </Suspense>
    );
}
