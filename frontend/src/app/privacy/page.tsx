'use client';

/**
 * Privacy Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { usePrivacyPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function PrivacyRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = usePrivacyPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Privacy vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
