'use client';

/**
 * Account Orders Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useAccountOrdersPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function AccountOrdersRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useAccountOrdersPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.AccountOrders vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
