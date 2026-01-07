# How to Add a Skin

## Prerequisites

- Familiarity with [Skin Contract](./skin-contract.md)
- Understanding of [Do's and Don'ts](./dos-and-donts.md)
- Reference: [Example Base Skin](./example-base-skin.md)

---

## Step 1: Create Skin Folder

```
skins/
├── base/           # Existing default skin
└── minimal/        # Your new skin
    ├── index.ts
    ├── skin.config.ts
    ├── layouts/
    │   ├── index.ts
    │   └── PublicLayout.tsx
    ├── pages/
    │   ├── index.ts
    │   └── ... (all required pages)
    └── components/
        └── ... (skin-specific components)
```

---

## Step 2: Create skin.config.ts

```typescript
// skins/minimal/skin.config.ts

export const minimalSkinConfig = {
  name: 'minimal',
  displayName: 'Minimal Skin',
  version: '1.0.0',
  description: 'A clean, minimalist design',
};
```

---

## Step 3: Create Layout

Every skin must have a `PublicLayout` that accepts `PublicLayoutVM`.

```typescript
// skins/minimal/layouts/PublicLayout.tsx

'use client';

import type { PublicLayoutVM } from '@core/skin';

export function PublicLayout({ vm, children }: {
  vm: PublicLayoutVM;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      {/* Minimal header */}
      <header className="p-4 border-b">
        <span className="font-bold">{vm.navbar.shopName}</span>
      </header>
      
      {/* Content */}
      <main>{children}</main>
      
      {/* Minimal footer */}
      <footer className="p-4 border-t text-center text-sm text-gray-500">
        © {new Date().getFullYear()} {vm.footer.shopName}
      </footer>
    </div>
  );
}
```

---

## Step 4: Create Required Pages

All pages defined in `SkinDefinition` are required:

```typescript
// skins/minimal/pages/Home.tsx

'use client';

import type { HomePageVM } from '@core/hooks/pages';

export function HomePage({ vm }: { vm: HomePageVM }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Welcome</h1>
      {/* Minimal home content */}
    </div>
  );
}
```

Repeat for all required pages:
- `Cart.tsx`
- `Checkout.tsx`
- `CheckoutSuccess.tsx`
- `Contact.tsx`
- `Support.tsx`
- `Phones.tsx`
- `BookRepair.tsx`

---

## Step 5: Export Pages

```typescript
// skins/minimal/pages/index.ts

export { HomePage } from './Home';
export { CartPage } from './Cart';
export { CheckoutPage } from './Checkout';
export { CheckoutSuccessPage } from './CheckoutSuccess';
export { ContactPage } from './Contact';
export { SupportPage } from './Support';
export { PhonesPage } from './Phones';
export { BookRepairPage } from './BookRepair';
```

---

## Step 6: Create SkinDefinition

```typescript
// skins/minimal/index.ts

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
import type { SkinDefinition } from '@core/skin';

export const MinimalSkin: SkinDefinition = {
  name: 'minimal',
  
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

## Step 7: Register in SkinRegistry

```typescript
// core/skin/SkinRegistry.ts

import { BaseSkin } from '@/skins/base';
import { MinimalSkin } from '@/skins/minimal';  // Add import

export const SkinRegistry = {
  base: BaseSkin,
  minimal: MinimalSkin,  // Add registration
};

export type SkinName = keyof typeof SkinRegistry;
```

---

## Step 8: Update useActiveSkin (if needed)

If you want to select skin dynamically:

```typescript
// core/skin/useActiveSkin.ts

export function useActiveSkin() {
  // Could be from tenant config, URL param, etc.
  const skinName = 'base';  // or 'minimal'
  
  return SkinRegistry[skinName];
}
```

---

## Step 9: Verify

```bash
# Type check
npx tsc --noEmit

# Verify no forbidden imports
grep -R "useTenant" src/skins/minimal/
grep -R "useFeatures" src/skins/minimal/
grep -R "fetch(" src/skins/minimal/

# Expected: 0 matches
```

---

## Tips

### Reuse Base Components

You can import components from the base skin:

```typescript
// Not recommended but allowed for transition
import { ProductCard } from '@/skins/base/components/storefront';
```

### Share UI Components

For truly shared components, put them in `components/ui/`:

```typescript
import { Button } from '@/components/ui/button';
```

### Test Each Page

After creating each page, verify it renders:
1. Set skin as active
2. Navigate to the route
3. Check console for errors

---

## Checklist

- [ ] `skin.config.ts` created
- [ ] `PublicLayout.tsx` accepts `PublicLayoutVM`
- [ ] All 8 required pages created
- [ ] Each page accepts correct VM type
- [ ] `index.ts` exports `SkinDefinition`
- [ ] Registered in `SkinRegistry`
- [ ] No forbidden imports (hooks, fetch, localStorage)
- [ ] TypeScript passes
- [ ] Pages render correctly

---

## Related Docs

- [Skin Contract](./skin-contract.md)
- [Do's and Don'ts](./dos-and-donts.md)
- [Example Base Skin](./example-base-skin.md)
