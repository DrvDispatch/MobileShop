'use client';

/**
 * Base Skin - Home Page
 * 
 * Purely presentational. Receives data via props.
 * NOTE: Layout (Navbar/Footer) is provided by PublicLayout wrapper.
 */

import { Hero, PromotionalBanner } from '../components/landing';
import { FeaturedProducts } from '../components/storefront';

export interface HomePageVM {
    // Currently no props needed - components are self-contained
}

export function HomePage(_props: { vm?: HomePageVM }) {
    return (
        <>
            <PromotionalBanner />
            <Hero />
            <FeaturedProducts />
        </>
    );
}
