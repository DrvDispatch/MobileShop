'use client';

/**
 * Account Route - Thin Delegate
 * 
 * Pattern:
 * 1. Get active skin
 * 2. Build layout VM
 * 3. Build page VM
 * 4. Wrap: Skin.layouts.PublicLayout(layoutVM) > Skin.pages.Account(pageVM)
 */

import { useActiveSkin } from '@core/skin';
import { useAccountPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function AccountRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useAccountPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Account vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
