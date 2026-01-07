'use client';

/**
 * Afspraken (Appointments) Route - Thin Delegate
 */

import { useActiveSkin } from '@core/skin';
import { useAfsprakenPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function AfsprakenRoute() {
    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useAfsprakenPageVM();

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <Skin.pages.Afspraken vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}
