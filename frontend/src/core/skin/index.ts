/**
 * @core-only
 *
 * Core Skin System - Public API
 */

export { SkinRegistry, type Skin, type SkinName } from './SkinRegistry';
export { useActiveSkin } from './useActiveSkin';
export type {
    PublicLayoutVM,
    NavbarVM,
    FooterVM,
    NavItem,
    MarqueeItem,
    ContactInfo,
    FooterLink,
    SkinDefinition,
} from './SkinContract';
