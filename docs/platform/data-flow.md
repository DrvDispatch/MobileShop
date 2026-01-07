# Data Flow

## Overview

ServicePulse uses a **View Model (VM) pattern** to separate data fetching from UI rendering. This enables:
- Purely presentational skin components
- Centralized state management
- Testable business logic

---

## The Pattern

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Route     │────▶│   useXxxVM  │────▶│  Skin Page  │
│  (app/..)   │     │  (hook)     │     │  (props)    │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                   │
      │                    │                   │
      │              ┌─────▼─────┐             │
      │              │  Stores   │             │
      │              │  APIs     │             │
      │              │  Context  │             │
      │              └───────────┘             │
      │                                        │
      └───── Skin components CANNOT access ────┘
```

---

## Flow Layers

### 1. Route (Thin Delegate)

```typescript
// app/cart/page.tsx
'use client';

import { useActiveSkin } from '@core/skin';
import { useCartPageVM } from '@core/hooks/pages';

export default function CartRoute() {
  const skin = useActiveSkin();
  const vm = useCartPageVM();
  
  return <skin.pages.Cart vm={vm} />;
}
```

The route:
- Gets the active skin
- Calls the VM hook
- Passes VM to skin component
- Does NOT contain UI logic

### 2. View Model Hook

```typescript
// core/hooks/pages/useCartPageVM.ts

export interface CartPageVM {
  items: CartItem[];
  subtotal: number;
  isEmpty: boolean;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
}

export function useCartPageVM(): CartPageVM {
  const store = useCartStore();
  
  return {
    items: store.items,
    subtotal: store.getTotal(),
    isEmpty: store.items.length === 0,
    updateQuantity: store.updateQuantity,
    removeItem: store.removeItem,
  };
}
```

The VM hook:
- Imports from stores, contexts, APIs
- Transforms raw data into page-ready format
- Exposes callbacks for user actions
- Hides implementation details

### 3. Skin Page Component

```typescript
// skins/base/pages/Cart.tsx

export function CartPage({ vm }: { vm: CartPageVM }) {
  const { items, subtotal, isEmpty, updateQuantity, removeItem } = vm;
  
  if (isEmpty) {
    return <EmptyState />;
  }
  
  return (
    <div>
      {items.map(item => (
        <CartItem 
          key={item.id}
          item={item}
          onUpdate={(qty) => updateQuantity(item.id, qty)}
          onRemove={() => removeItem(item.id)}
        />
      ))}
      <p>Total: €{subtotal.toFixed(2)}</p>
    </div>
  );
}
```

The skin page:
- Receives ALL data via props
- Never imports hooks or stores
- Never calls APIs
- Only renders UI

---

## Layout VM Pattern

Layouts also use VMs for Navbar and Footer:

```
┌─────────────────────────────────────────────────────────┐
│                    PublicLayout                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Navbar (receives vm.navbar)                        ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  {children} (skin page content)                     ││
│  └─────────────────────────────────────────────────────┘│
│                                                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │  Footer (receives vm.footer)                        ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

```typescript
// core/hooks/layouts/usePublicLayoutVM.ts

export function usePublicLayoutVM(): PublicLayoutVM {
  const tenant = useTenant();
  const features = useFeatures();
  const cart = useCartStore();
  const uiConfig = useUIConfig();
  
  return {
    navbar: {
      shopName: tenant.branding.shopName,
      logoUrl: tenant.branding.logoUrl,
      navItems: buildNavItems(features),
      cartCount: cart.getItemCount(),
      // ...
    },
    footer: {
      shopName: tenant.branding.shopName,
      email: tenant.contact.email,
      // ...
    },
  };
}
```

---

## Why This Pattern?

| Benefit | Explanation |
|---------|-------------|
| **Skin isolation** | Skins never access global state |
| **Testability** | VMs can be unit tested |
| **Flexibility** | Swap skins without changing logic |
| **Type safety** | VM interface enforces contract |
| **Debugging** | Data issues are in VMs, not scattered |

---

## Data Sources

VMs can access:

| Source | Example |
|--------|---------|
| Zustand stores | `useCartStore()` |
| React Context | `useTenant()`, `useFeatures()` |
| SWR hooks | `useUIConfig()` |
| API calls | `fetch('/api/products')` |
| URL params | `useSearchParams()` |
| Local state | `useState()` |

---

## Skin Boundaries

Skins CANNOT access:

| ❌ Forbidden | Why |
|--------------|-----|
| `useTenant()` | VM provides tenant data |
| `useFeatures()` | VM provides booleans |
| `useCartStore()` | VM provides cart data |
| `fetch()` | VM handles API calls |
| `localStorage` | VM manages state |

---

## Related Docs

- [Skin Contract](../skins/skin-contract.md)
- [Layout VMs](../frontend/layout-vms.md)
