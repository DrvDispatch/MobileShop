'use client';

/**
 * Home Route - Thin Delegate
 * 
 * Delegates to skin layout and page with VM data.
 * 
 * Pattern:
 * 1. Get active skin
 * 2. Build layout VM (navbar, footer data)
 * 3. Build page VM (page-specific data)
 * 4. Render: Skin.layouts.PublicLayout(layoutVM) > Skin.pages.Home(pageVM)
 */

import { useActiveSkin } from '@core/skin';
import { useHomePageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function HomeRoute() {
  const Skin = useActiveSkin();
  const layoutVM = usePublicLayoutVM();
  const pageVM = useHomePageVM();

  return (
    <Skin.layouts.PublicLayout vm={layoutVM}>
      <Skin.pages.Home vm={pageVM} />
    </Skin.layouts.PublicLayout>
  );
}
