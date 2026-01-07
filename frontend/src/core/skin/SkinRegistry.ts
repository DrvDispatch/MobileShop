/**
 * @core-only
 * 
 * Skin Registry - Maps skin names to skin implementations.
 * Updated for Milestone 4: layouts now receive VMs.
 */

import { BaseSkin } from '@skins/base';
import { BarbershopSkin } from '@skins/barbershop';
import { ClassicSkin } from '@skins/classic';
import type { ReactNode, ComponentType } from 'react';
import type { PublicLayoutVM } from './SkinContract';

export type SkinName = 'base' | 'barbershop' | 'classic';

// Layout type - receives VM and children
export interface LayoutComponent {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    PublicLayout: ComponentType<{ vm: PublicLayoutVM; children: ReactNode }>;
}

// Skin type definition
export interface Skin {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    pages: Record<string, ComponentType<any>>;
    layouts: LayoutComponent;
}

// Registry of available skins
export const SkinRegistry: Record<SkinName, Skin> = {
    base: BaseSkin as Skin,
    barbershop: BarbershopSkin as Skin,
    classic: ClassicSkin as Skin,
};

