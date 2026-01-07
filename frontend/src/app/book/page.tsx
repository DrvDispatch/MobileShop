'use client';

/**
 * Book Services Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 * Uses the generic service booking page.
 */

import { useActiveSkin } from '@core/skin';
import { useBookServicesPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function BookServicesRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useBookServicesPageVM();

    // If skin doesn't have BookServices, show fallback
    const BookServicesPage = Skin.pages.BookServices;

    if (!BookServicesPage) {
        return (
            <Skin.layouts.PublicLayout vm={layoutVM}>
                <div className="min-h-[50vh] flex items-center justify-center">
                    <p className="text-gray-500">This skin does not support generic booking.</p>
                </div>
            </Skin.layouts.PublicLayout>
        );
    }

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <BookServicesPage vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
