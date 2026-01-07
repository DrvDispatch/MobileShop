'use client';

/**
 * Dynamic CMS Page Route - Thin Delegate
 * 
 * Loads CMS pages by slug and wraps in PublicLayout.
 * Uses Suspense for useParams.
 */

import { Suspense } from 'react';
import { useParams, notFound } from 'next/navigation';
import { useActiveSkin } from '@core/skin';
import { useCmsPageVM } from '@core/hooks/pages';
import { usePublicLayoutVM } from '@core/hooks/layouts';
import { CmsPage } from '@skins/base/components/cms';

function CmsContent() {
    const params = useParams();
    const slug = params?.slug as string;

    const Skin = useActiveSkin();
    const layoutVM = usePublicLayoutVM();
    const pageVM = useCmsPageVM({
        slug,
        fallbackTitle: 'Page Not Found',
        fallbackContent: 'The requested page could not be found.',
    });

    // If there's an error and no page, show 404
    if (pageVM.hasError && !pageVM.page && !pageVM.isLoading) {
        notFound();
    }

    return (
        <Skin.layouts.PublicLayout vm={layoutVM}>
            <CmsPage vm={pageVM} />
        </Skin.layouts.PublicLayout>
    );
}

export default function DynamicCmsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-zinc-400" />
            </div>
        }>
            <CmsContent />
        </Suspense>
    );
}
