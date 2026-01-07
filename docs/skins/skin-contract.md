# Skin Contract

## Overview

The Skin Contract defines the formal interface between the core system and UI skins. It ensures skins receive **answers, not systems**.

---

## Contract Location

```
frontend/src/core/skin/SkinContract.ts
```

---

## Core Interfaces

### NavbarVM

Everything the Navbar needs:

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
  
  // Mobile menu
  isMenuOpen: boolean;
  onMenuToggle: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon?: string;
}
```

### FooterVM

Everything the Footer needs:

```typescript
interface FooterVM {
  // Business info
  shopName: string;
  email?: string;
  phone?: string;
  address?: AddressVM;
  vatNumber?: string;
  
  // Links
  navLinks: FooterLink[];
  quickLinks: FooterLink[];
  
  // Google reviews
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

interface AddressVM {
  line1?: string;
  postalCode?: string;
  city?: string;
}
```

### PublicLayoutVM

Composes Navbar and Footer VMs:

```typescript
interface PublicLayoutVM {
  navbar: NavbarVM;
  footer: FooterVM;
}
```

---

## SkinDefinition

What a skin must export:

```typescript
interface SkinDefinition {
  name: string;
  
  layouts: {
    PublicLayout: ComponentType<{
      vm: PublicLayoutVM;
      children: ReactNode;
    }>;
  };
  
  pages: {
    Home: ComponentType<{ vm: HomePageVM }>;
    Cart: ComponentType<{ vm: CartPageVM }>;
    Checkout: ComponentType<{ vm: CheckoutPageVM }>;
    CheckoutSuccess: ComponentType<{ vm: CheckoutSuccessPageVM }>;
    Contact: ComponentType<{ vm: ContactPageVM }>;
    Support: ComponentType<{ vm: SupportPageVM }>;
    Phones: ComponentType<{ vm: PhonesPageVM }>;
    BookRepair: ComponentType<{ vm: BookingPageVM }>;
  };
}
```

---

## Page VM Interfaces

Each page has its own VM interface:

| Page | VM | Key Data |
|------|-----|----------|
| Home | `HomePageVM` | Featured products, hero content |
| Cart | `CartPageVM` | items, subtotal, actions |
| Checkout | `CheckoutPageVM` | form, totals, coupon, submit |
| CheckoutSuccess | `CheckoutSuccessPageVM` | order, items, status |
| Contact | `ContactPageVM` | address, hours, chat trigger |
| Support | `SupportPageVM` | FAQs, contact info |
| Phones | `PhonesPageVM` | products, filters, pagination |
| BookRepair | `BookingPageVM` | step, selections, actions |

---

## Contract Enforcement

### 1. TypeScript

```typescript
// Skin TypeScript catches missing props
const skin: SkinDefinition = {
  pages: {
    Cart: CartPage, // Error if CartPage doesn't accept CartPageVM
  },
};
```

### 2. ESLint (Milestone 5.3)

```javascript
// Custom rule blocks forbidden imports
// skins/** cannot import from @core/hooks
```

### 3. Grep Verification

```bash
# Should return 0 matches
grep -R "useTenant" src/skins/
grep -R "useFeatures" src/skins/
grep -R "useCartStore" src/skins/
```

---

## Adding to Contract

1. **Define interface** in `SkinContract.ts`
2. **Create VM hook** in `core/hooks/pages/`
3. **Export** from `core/hooks/pages/index.ts`
4. **Export type** from `core/skin/index.ts`
5. **Update** `SkinDefinition` if new page

---

## Related Docs

- [Do's and Don'ts](./dos-and-donts.md)
- [Example Base Skin](./example-base-skin.md)
- [How to Add a Skin](./how-to-add-a-skin.md)
