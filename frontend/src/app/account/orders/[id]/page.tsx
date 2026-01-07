'use client';

/**
 * Order Detail Route - Thin Delegate
 */

import { Suspense } from 'react';
import { useActiveSkin } from '@core/skin';
import { useOrderDetailPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

function OrderDetailContent() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useOrderDetailPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.OrderDetail vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}

export default function OrderDetailRoute() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400" />
            </div>
        }>
            <OrderDetailContent />
        </Suspense>
    );
}
