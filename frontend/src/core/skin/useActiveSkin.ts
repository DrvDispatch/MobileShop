/**
 * @core-only
 * 
 * Hook to get the currently active skin.
 * 
 * Skin selection priority:
 * 1. NEXT_PUBLIC_SKIN environment variable
 * 2. Default: 'base'
 * 
 * To test barbershop skin: Add NEXT_PUBLIC_SKIN=barbershop to .env.local
 */

'use client';

import { SkinRegistry, Skin, SkinName } from './SkinRegistry';

export function useActiveSkin(): Skin {
    // Read from environment variable (set in .env.local)
    const skinName = (process.env.NEXT_PUBLIC_SKIN || 'base') as SkinName;

    // Validate skin exists, fallback to base
    if (skinName in SkinRegistry) {
        return SkinRegistry[skinName];
    }

    return SkinRegistry.base;
}
