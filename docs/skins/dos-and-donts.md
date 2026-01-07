# Skin Do's and Don'ts

## The Golden Rule

> **Skins receive answers, not systems.**

Skins are purely presentational. All business logic lives in View Models.

---

## ✅ DO

### Accept Data via Props

```typescript
// ✅ All data comes from VM
function CartPage({ vm }: { vm: CartPageVM }) {
  const { items, subtotal } = vm;
  return <div>{items.length} items, €{subtotal}</div>;
}
```

### Use Callback Props for Actions

```typescript
// ✅ Actions are functions from VM
function CartItem({ item, onRemove }: Props) {
  return (
    <div>
      {item.name}
      <button onClick={onRemove}>Remove</button>
    </div>
  );
}
```

### Import Own Components

```typescript
// ✅ Import from within the same skin
import { ProductCard } from '../components/storefront';
```

### Import Types from Core

```typescript
// ✅ Types are allowed
import type { CartPageVM } from '@core/hooks/pages';
import type { PublicLayoutVM } from '@core/skin';
```

### Use External UI Libraries

```typescript
// ✅ Icons, animations, etc.
import { ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
```

### Use CSS/Tailwind

```typescript
// ✅ Styling is fine
<div className="flex items-center gap-4 bg-white rounded-lg p-4">
```

---

## ❌ DON'T

### Import Hooks from Core

```typescript
// ❌ FORBIDDEN
import { useTenant } from '@/lib/TenantProvider';
import { useFeatures } from '@/contexts/FeatureContext';
import { useCartStore } from '@/store/cart';
import { useUIConfig } from '@/lib/useUIConfig';
```

### Call APIs Directly

```typescript
// ❌ FORBIDDEN
useEffect(() => {
  fetch('/api/products').then(setProducts);
}, []);
```

### Access localStorage

```typescript
// ❌ FORBIDDEN
const token = localStorage.getItem('accessToken');
```

### Use React Context Directly

```typescript
// ❌ FORBIDDEN
const tenant = useContext(TenantContext);
```

### Hardcode Business Data

```typescript
// ❌ FORBIDDEN
const shopName = "Mobile Repair Shop";
const phone = "+32 123 456 789";

// ✅ Use props from VM
const { shopName, phone } = vm;
```

### Manage Global State

```typescript
// ❌ FORBIDDEN
const [cart, setCart] = useState([]);
addToCart(item);

// ✅ Use VM callbacks
vm.addToCart(item);
```

---

## Verification Commands

Run these to check skin purity:

```bash
# No hooks in skins
grep -R "use[A-Z]" src/skins/base/layouts/
grep -R "use[A-Z]" src/skins/base/pages/

# No fetch in skins
grep -R "fetch(" src/skins/base/

# No tenant/features access
grep -R "useTenant" src/skins/
grep -R "useFeatures" src/skins/
grep -R "useCartStore" src/skins/

# Expected: 0 matches for all commands
```

---

## Why These Rules?

| Rule | Reason |
|------|--------|
| No hooks | Skins must be swappable without breaking logic |
| No fetch | Data fetching is a core concern |
| No localStorage | State management is centralized |
| No tenant access | Tenant data comes via VM |
| Props only | Enables testing, SSR, and skin customization |

---

## Exceptions

### Local UI State (Allowed)

```typescript
// ✅ Local component state is fine
const [isOpen, setIsOpen] = useState(false);
```

### Client Directive (Required)

```typescript
// ✅ 'use client' is required for interactivity
'use client';
```

---

## Related Docs

- [Skin Contract](./skin-contract.md)
- [Example Base Skin](./example-base-skin.md)
