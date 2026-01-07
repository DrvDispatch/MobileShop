/**
 * Base Skin - Main Export
 */

import { HomePage } from './pages/Home';
import { CartPage } from './pages/Cart';
import { ContactPage } from './pages/Contact';
import { SupportPage } from './pages/Support';
import { CheckoutPage } from './pages/Checkout';
import { CheckoutSuccessPage } from './pages/CheckoutSuccess';
import { BookRepairPage } from './pages/BookRepair';
import { PhonesPage } from './pages/Phones';
import { ProductDetailPage } from './pages/ProductDetail';
import { SearchPage } from './pages/Search';
import { AccountPage } from './pages/Account';
import { AccountOrdersPage } from './pages/AccountOrders';
import { OrderDetailPage } from './pages/OrderDetail';
import { AccountSettingsPage } from './pages/AccountSettings';
import { AfsprakenPage } from './pages/Afspraken';
import { WishlistPage } from './pages/Wishlist';
import { AccessoriesPage } from './pages/Accessories';
import { TrackOrderPage } from './pages/TrackOrder';
import { AboutPage } from './pages/About';
import { TermsPage } from './pages/Terms';
import { PrivacyPage } from './pages/Privacy';
import { ReturnsPage } from './pages/Returns';
import { PublicLayout } from './layouts/PublicLayout';
import type { Skin } from '@core/skin/SkinRegistry';

export const BaseSkin: Skin = {
    pages: {
        Home: HomePage,
        Cart: CartPage,
        Contact: ContactPage,
        Support: SupportPage,
        Checkout: CheckoutPage,
        CheckoutSuccess: CheckoutSuccessPage,
        BookRepair: BookRepairPage,
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
        PublicLayout: PublicLayout,
    },
};

export { BaseSkinConfig } from './skin.config';
