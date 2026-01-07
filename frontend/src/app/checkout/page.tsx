'use client';

/**
 * Checkout Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 */

import { useActiveSkin } from '@core/skin';
import { useCheckoutPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function CheckoutRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useCheckoutPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Checkout vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
