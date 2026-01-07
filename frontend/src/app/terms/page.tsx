'use client';

/**
 * Terms Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useTermsPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function TermsRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useTermsPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Terms vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
