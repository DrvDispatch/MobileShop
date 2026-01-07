'use client';

/**
 * Contact Route - Thin Delegate
 * 
 * Wraps page in PublicLayout with proper VM.
 */

import { useActiveSkin } from '@core/skin';
import { useContactPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function ContactRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useContactPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Contact vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
