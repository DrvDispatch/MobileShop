'use client';

/**
 * Track Order Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useTrackOrderPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function TrackRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useTrackOrderPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.TrackOrder vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
