'use client';

/**
 * Wishlist Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useWishlistPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function WishlistRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useWishlistPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Wishlist vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
