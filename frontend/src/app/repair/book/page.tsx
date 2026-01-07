'use client';

/**
 * Book Repair Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 */

import { useActiveSkin } from '@core/skin';
import { useBookingPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function BookRepairRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useBookingPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.BookRepair vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
