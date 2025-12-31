'use client';

import { useEffect } from 'react';
import Script from 'next/script';
import { useTenantOptional } from '@/lib/TenantProvider';

// Declare gtag for TypeScript
declare global {
    interface Window {
        dataLayer: unknown[];
        gtag: (...args: unknown[]) => void;
    }
}

/**
 * TenantAnalytics - Dynamically loads analytics scripts based on tenant config
 * Must be used within TenantProvider
 */
export function TenantAnalytics() {
    const tenant = useTenantOptional();

    useEffect(() => {
        // Only initialize GA if ID is provided and gtag function exists
        if (tenant?.integrations.googleAnalyticsId && typeof window !== 'undefined') {
            // gtag will be configured after script loads
            window.dataLayer = window.dataLayer || [];
        }
    }, [tenant?.integrations.googleAnalyticsId]);

    if (!tenant) {
        return null;
    }

    const gaId = tenant.integrations.googleAnalyticsId;
    const cookiebotId = tenant.integrations.cookiebotId;

    return (
        <>
            {/* Cookiebot Consent Banner - must load first */}
            {cookiebotId && (
                <Script
                    id="Cookiebot"
                    src="https://consent.cookiebot.com/uc.js"
                    data-cbid={cookiebotId}
                    strategy="beforeInteractive"
                />
            )}

            {/* Google Analytics (gtag.js) */}
            {gaId && (
                <>
                    <Script
                        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', '${gaId}');
                        `}
                    </Script>
                </>
            )}
        </>
    );
}
