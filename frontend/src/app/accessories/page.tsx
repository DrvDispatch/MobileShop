'use client';

/**
 * Accessories Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useAccessoriesPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function AccessoriesRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useAccessoriesPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Accessories vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
