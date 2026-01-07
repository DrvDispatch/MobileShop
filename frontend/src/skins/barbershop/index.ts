/**
 * Barbershop Skin - Main Export
 * 
 * Minimal appointment-focused skin for barbershops, salons, etc.
 * Uses the same VMs as base skin but with radically different UI.
 */

import { HomePage } from './pages/Home';
import { BookRepairPage } from './pages/BookRepair';
import { BookServicesPage } from './pages/BookServices';
import { ContactPage } from './pages/Contact';
import { MinimalLayout } from './layouts/MinimalLayout';
import type { Skin } from '@core/skin/SkinRegistry';

// Re-export pages from base skin that we don't customize
// They'll still work because they receive the same VM types
import { CartPage } from '@skins/base/pages/Cart';
import { CheckoutPage } from '@skins/base/pages/Checkout';
import { CheckoutSuccessPage } from '@skins/base/pages/CheckoutSuccess';
import { SupportPage } from '@skins/base/pages/Support';
import { PhonesPage } from '@skins/base/pages/Phones';
import { ProductDetailPage } from '@skins/base/pages/ProductDetail';
import { SearchPage } from '@skins/base/pages/Search';
import { AccountPage } from '@skins/base/pages/Account';
import { AccountOrdersPage } from '@skins/base/pages/AccountOrders';
import { OrderDetailPage } from '@skins/base/pages/OrderDetail';
import { AccountSettingsPage } from '@skins/base/pages/AccountSettings';
import { AfsprakenPage } from '@skins/base/pages/Afspraken';
import { WishlistPage } from '@skins/base/pages/Wishlist';
import { AccessoriesPage } from '@skins/base/pages/Accessories';
import { TrackOrderPage } from '@skins/base/pages/TrackOrder';
import { AboutPage } from '@skins/base/pages/About';
import { TermsPage } from '@skins/base/pages/Terms';
import { PrivacyPage } from '@skins/base/pages/Privacy';
import { ReturnsPage } from '@skins/base/pages/Returns';

export const BarbershopSkin: Skin = {
    pages: {
        // Custom pages (barbershop-specific UI)
        Home: HomePage,
        BookRepair: BookRepairPage,
        BookServices: BookServicesPage,
        Contact: ContactPage,

        // Inherited from base skin (same VM, same UI)
        Cart: CartPage,
        Checkout: CheckoutPage,
        CheckoutSuccess: CheckoutSuccessPage,
        Support: SupportPage,
        Phones: PhonesPage,
        ProductDetail: ProductDetailPage,
        Search: SearchPage,
        Account: AccountPage,
        AccountOrders: AccountOrdersPage,
        OrderDetail: OrderDetailPage,
        AccountSettings: AccountSettingsPage,
        Afspraken: AfsprakenPage,
        Wishlist: WishlistPage,
        Accessories: AccessoriesPage,
        TrackOrder: TrackOrderPage,
        About: AboutPage,
        Terms: TermsPage,
        Privacy: PrivacyPage,
        Returns: ReturnsPage,
    },
    layouts: {
        PublicLayout: MinimalLayout,
    },
};

export { BarbershopSkinConfig } from './skin.config';
