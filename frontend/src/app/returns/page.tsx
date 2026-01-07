'use client';

/**
 * Returns Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useReturnsPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function ReturnsRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useReturnsPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Returns vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
