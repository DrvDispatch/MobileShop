'use client';

/**
 * Search Route - Thin Delegate
 * 
 * Pattern:
 * 1. Get active skin
 * 2. Build layout VM
 * 3. Build page VM
 * 4. Wrap: Skin.layouts.PublicLayout(layoutVM) > Skin.pages.Search(pageVM)
 */

import { Suspense } from 'react';
import { useActiveSkin } from '@core/skin';
import { useSearchPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

function SearchContent() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useSearchPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Search vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}

export default function SearchRoute() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400" />
            </div>
        }>
            <SearchContent />
        </Suspense>
    );
}
