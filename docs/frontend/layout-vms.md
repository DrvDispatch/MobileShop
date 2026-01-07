# Layout VMs

## Overview

Layout VMs provide all data for layout components (Navbar, Footer). They centralize:
- Tenant branding
- Feature-derived navigation
- Cart state
- Auth state
- UI configuration

---

## usePublicLayoutVM

### Location

```
frontend/src/core/hooks/layouts/usePublicLayoutVM.ts
```

### Returns

```typescript
interface PublicLayoutVM {
  navbar: NavbarVM;
  footer: FooterVM;
}
```

### Data Sources

| Source | What It Provides |
|--------|-----------------|
| `useTenant()` | shopName, logoUrl, contact info |
| `useFeatures()` | ecommerceEnabled, repairsEnabled |
| `useCartStore()` | cartCount |
| `useUIConfig()` | labels, marquee items |
| `useSettingsStore()` | VAT number |
| `useRouter()` | navigation callbacks |
| `usePathname()` | current route |
| `useState()` | menu open, search query, newsletter |

### NavbarVM Contents

```typescript
interface NavbarVM {
  // Branding
  shopName: string;
  logoUrl?: string;
  
  // Navigation
  navItems: NavItem[];
  ecommerceEnabled: boolean;
  repairsEnabled: boolean;
  
  // Cart
  cartCount: number;
  
  // Auth
  isLoggedIn: boolean;
  onLogout: () => void;
  
  // Search
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSearchSubmit: () => void;
  
  // Mobile
  isMenuOpen: boolean;
  onMenuToggle: () => void;
  
  // Labels
  labels: NavLabels;
  
  // Marquee
  marqueeItems: MarqueeItem[];
}
```

### FooterVM Contents

```typescript
interface FooterVM {
  // Business
  shopName: string;
  email?: string;
  phone?: string;
  address?: AddressVM;
  vatNumber?: string;
  
  // Links
  navLinks: FooterLink[];
  quickLinks: FooterLink[];
  
  // Reviews
  googleReviewUrl?: string;
  googleReviewRating?: string;
  
  // Newsletter
  newsletterEmail: string;
  newsletterLoading: boolean;
  newsletterSuccess: boolean;
  onNewsletterChange: (email: string) => void;
  onNewsletterSubmit: () => void;
  
  // Labels
  labels: FooterLabels;
}
```

---

## Implementation Pattern

```typescript
export function usePublicLayoutVM(): PublicLayoutVM {
  // 1. Get data from core hooks
  const tenant = useTenant();
  const features = useFeatures();
  const cart = useCartStore();
  const { uiConfig } = useUIConfig();
  const router = useRouter();
  
  // 2. Manage local state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  
  // 3. Build navigation items from features
  const navItems = useMemo(() => {
    const items = [];
    if (features.ecommerceEnabled) {
      items.push({ label: uiConfig.labels.nav.phones, href: '/phones' });
    }
    if (features.repairsEnabled) {
      items.push({ label: uiConfig.labels.nav.repairs, href: '/repair' });
    }
    return items;
  }, [features, uiConfig]);
  
  // 4. Create callbacks
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      router.push(`/phones?search=${encodeURIComponent(searchQuery)}`);
    }
  }, [searchQuery, router]);
  
  // 5. Return VM object
  return {
    navbar: {
      shopName: tenant.branding.shopName,
      logoUrl: tenant.branding.logoUrl ?? undefined,
      navItems,
      cartCount: cart.getItemCount(),
      isLoggedIn: checkAuth(),
      onLogout: handleLogout,
      searchQuery,
      onSearchChange: setSearchQuery,
      onSearchSubmit: handleSearch,
      isMenuOpen,
      onMenuToggle: () => setIsMenuOpen(!isMenuOpen),
      // ...
    },
    footer: {
      shopName: tenant.branding.shopName,
      email: tenant.contact.email ?? undefined,
      // ...
    },
  };
}
```

---

## Usage in Route

Layout VMs are used in the public layout route:

```typescript
// app/(public)/layout.tsx

'use client';

import { useActiveSkin } from '@core/skin';
import { usePublicLayoutVM } from '@core/hooks/layouts';

export default function PublicLayout({ children }) {
  const skin = useActiveSkin();
  const vm = usePublicLayoutVM();
  
  const Layout = skin.layouts.PublicLayout;
  
  return (
    <Layout vm={vm}>
      {children}
    </Layout>
  );
}
```

---

## Adding New Data

To add data to the layout VM:

1. **Identify source** (tenant, features, store, API)
2. **Add to interface** in `SkinContract.ts`
3. **Extract in hook** using appropriate hook/API
4. **Transform if needed** (null → undefined, feature booleans, etc.)
5. **Add to return object**

Example: Adding WhatsApp link

```typescript
// In SkinContract.ts
interface FooterVM {
  whatsappUrl?: string;  // Add field
}

// In usePublicLayoutVM.ts
const whatsappNumber = tenant.contact.whatsappNumber;
const whatsappUrl = whatsappNumber 
  ? `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`
  : undefined;

return {
  footer: {
    whatsappUrl,
    // ...
  },
};
```

---

## Related Docs

- [Data Flow](../platform/data-flow.md)
- [Skin Contract](../skins/skin-contract.md)
