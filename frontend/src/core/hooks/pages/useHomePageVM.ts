/**
 * @core-only
 * 
 * Home Page View Model
 * 
 * Currently minimal since components are self-contained.
 * Will evolve as component logic is lifted.
 */

'use client';

export interface HomePageVM {
    // Currently no data needed - components are self-contained
    // Future: featured products, banners, etc.
}

export function useHomePageVM(): HomePageVM {
    // Just return empty VM for now
    return {};
}
