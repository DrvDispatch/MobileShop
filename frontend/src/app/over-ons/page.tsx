'use client';

/**
 * About (Over Ons) Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useAboutPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function AboutRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useAboutPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.About vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
