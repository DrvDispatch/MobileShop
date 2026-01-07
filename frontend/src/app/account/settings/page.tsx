'use client';

/**
 * Account Settings Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useAccountSettingsPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function AccountSettingsRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useAccountSettingsPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.AccountSettings vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
