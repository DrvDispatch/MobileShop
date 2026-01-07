'use client';

/**
 * Support Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 */

import { useActiveSkin } from '@core/skin';
import { useSupportPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function SupportRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useSupportPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Support vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
