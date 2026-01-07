/**
 * Classic Skin - Main Export
 * 
 * Professional traditional skin for service businesses.
 * Clean white backgrounds, subtle borders, classic typography.
 */

import { HomePage } from './pages/Home';
import { BookServicesPage } from './pages/BookServices';
import { ContactPage } from './pages/Contact';
import { ClassicLayout } from './layouts/ClassicLayout';
import type { Skin } from '@core/skin/SkinRegistry';

// Re-export pages from base skin that we don't customize
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

export const ClassicSkin: Skin = {
    pages: {
        // Custom pages (classic-specific UI)
        Home: HomePage,
        BookServices: BookServicesPage,
        Contact: ContactPage,

        // Inherited from base skin
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
        PublicLayout: ClassicLayout,
    },
};

export { ClassicSkinConfig } from './skin.config';
