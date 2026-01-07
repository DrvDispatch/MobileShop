# Example: Base Skin

## Overview

The `base` skin is the default implementation. It provides a complete set of layouts, pages, and components.

---

## Structure

```
skins/base/
├── index.ts              # SkinDefinition export
├── skin.config.ts        # Skin metadata
├── layouts/
│   ├── index.ts
│   └── PublicLayout.tsx
├── pages/
│   ├── index.ts
│   ├── Home.tsx
│   ├── Cart.tsx
│   ├── Checkout.tsx
│   ├── CheckoutSuccess.tsx
│   ├── Contact.tsx
│   ├── Support.tsx
│   ├── Phones.tsx
│   └── BookRepair.tsx
└── components/
    ├── landing/
    │   ├── navbar.tsx
    │   ├── footer.tsx
    │   ├── hero.tsx
    │   └── ...
    ├── storefront/
    │   ├── product-card.tsx
    │   ├── product-grid.tsx
    │   └── ...
    └── ui/
        ├── button.tsx
        └── ...
```

---

## Key Files

### skin.config.ts

```typescript
export const baseSkinConfig = {
  name: 'base',
  displayName: 'Base Skin',
  version: '1.0.0',
};
```

### index.ts (SkinDefinition)

```typescript
import { PublicLayout } from './layouts';
import {
  HomePage,
  CartPage,
  CheckoutPage,
  CheckoutSuccessPage,
  ContactPage,
  SupportPage,
  PhonesPage,
  BookRepairPage,
} from './pages';

export const BaseSkin = {
  name: 'base',
  
  layouts: {
    PublicLayout,
  },
  
  pages: {
    Home: HomePage,
    Cart: CartPage,
    Checkout: CheckoutPage,
    CheckoutSuccess: CheckoutSuccessPage,
    Contact: ContactPage,
    Support: SupportPage,
    Phones: PhonesPage,
    BookRepair: BookRepairPage,
  },
};
```

---

## Layout Example

### PublicLayout.tsx

```typescript
'use client';

import { Navbar } from '../components/landing/navbar';
import { Footer } from '../components/landing/footer';
import type { PublicLayoutVM } from '@core/skin';

export function PublicLayout({ vm, children }: {
  vm: PublicLayoutVM;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-white">
      <Navbar vm={vm.navbar} />
      {children}
      <Footer vm={vm.footer} />
    </main>
  );
}
```

Key points:
- Receives `PublicLayoutVM` via props
- Passes `vm.navbar` to Navbar
- Passes `vm.footer` to Footer
- Renders children between Navbar and Footer

---

## Page Example

### Cart.tsx

```typescript
'use client';

import type { CartPageVM } from '@core/hooks/pages';
import { Button } from '../components/ui/button';
import Link from 'next/link';

export function CartPage({ vm }: { vm: CartPageVM }) {
  const { items, subtotal, isEmpty, updateQuantity, removeItem } = vm;
  
  if (isEmpty) {
    return (
      <div className="py-20 text-center">
        <h1>Your cart is empty</h1>
        <Link href="/phones">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
      
      {items.map(item => (
        <div key={item.id} className="flex items-center gap-4 py-4 border-b">
          <img src={item.image} alt={item.name} className="w-20 h-20" />
          <div className="flex-1">
            <h3>{item.name}</h3>
            <p>€{item.price}</p>
          </div>
          <input
            type="number"
            value={item.quantity}
            onChange={(e) => updateQuantity(item.id, Number(e.target.value))}
          />
          <button onClick={() => removeItem(item.id)}>Remove</button>
        </div>
      ))}
      
      <div className="mt-8 text-right">
        <p className="text-xl">Subtotal: €{subtotal.toFixed(2)}</p>
        <Link href="/checkout">
          <Button>Checkout</Button>
        </Link>
      </div>
    </div>
  );
}
```

Key points:
- Imports only types from `@core`
- All data from `vm` prop
- All actions (updateQuantity, removeItem) from `vm`
- No hooks, no fetch, no context

---

## Component Example

### navbar.tsx

```typescript
'use client';

import Link from 'next/link';
import type { NavbarVM } from '@core/skin';
import { ShoppingCart, Menu, X } from 'lucide-react';

export function Navbar({ vm }: { vm: NavbarVM }) {
  const {
    shopName,
    logoUrl,
    navItems,
    cartCount,
    isLoggedIn,
    onLogout,
    isMenuOpen,
    onMenuToggle,
  } = vm;
  
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/">
            {logoUrl ? (
              <img src={logoUrl} alt={shopName} className="h-8" />
            ) : (
              <span className="font-bold">{shopName}</span>
            )}
          </Link>
          
          {/* Nav Items */}
          <div className="hidden md:flex gap-6">
            {navItems.map(item => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
          
          {/* Cart */}
          <Link href="/cart" className="relative">
            <ShoppingCart />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          
          {/* Mobile menu toggle */}
          <button onClick={onMenuToggle} className="md:hidden">
            {isMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>
    </nav>
  );
}
```

---

## Related Docs

- [Skin Contract](./skin-contract.md)
- [How to Add a Skin](./how-to-add-a-skin.md)
