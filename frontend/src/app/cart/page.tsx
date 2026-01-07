'use client';

/**
 * Cart Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 */

import { useActiveSkin } from '@core/skin';
import { useCartPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function CartRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useCartPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Cart vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
