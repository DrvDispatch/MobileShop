# Routing

## Overview

ServicePulse uses Next.js 14 App Router. Routes are organized as:
- **Public routes** — Customer-facing pages
- **Admin routes** — Tenant admin panel
- **Account routes** — Customer account pages

---

## Route Structure

```
app/
├── layout.tsx              # Root layout (TenantProvider)
├── page.tsx                # Home → delegates to skin
├── (public)/               # Public route group
│   ├── layout.tsx          # Public layout (Navbar/Footer)
│   └── ...
├── admin/                  # Admin panel
│   ├── layout.tsx          # Admin layout (sidebar)
│   ├── page.tsx            # Dashboard
│   └── ...
├── account/                # Customer account
│   └── ...
├── cart/
│   └── page.tsx            # Cart
├── checkout/
│   ├── page.tsx            # Checkout
│   └── success/
│       └── page.tsx        # Checkout success
├── contact/
│   └── page.tsx            # Contact
├── support/
│   └── page.tsx            # Support/FAQ
├── phones/
│   ├── page.tsx            # Product list
│   └── [slug]/
│       └── page.tsx        # Product detail
├── repair/
│   ├── page.tsx            # Repair landing
│   └── book/
│       └── page.tsx        # Booking wizard
└── [slug]/
    └── page.tsx            # CMS pages
```

---

## Route Delegate Pattern

Public pages use a **thin delegate** pattern:

```typescript
// app/cart/page.tsx

'use client';

import { useActiveSkin } from '@core/skin';
import { useCartPageVM } from '@core/hooks/pages';

export default function CartRoute() {
  const skin = useActiveSkin();
  const vm = useCartPageVM();
  
  const CartPage = skin.pages.Cart;
  return <CartPage vm={vm} />;
}
```

The route:
1. Gets active skin
2. Calls VM hook
3. Renders skin component with VM

---

## Public Layout

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

## Admin Layout

Admin uses a traditional layout with sidebar:

```typescript
// app/admin/layout.tsx

'use client';

import { AdminSidebar } from '@/components/admin/admin-sidebar';
import { useAdminAuth } from '@/lib/admin/useAdmin';

export default function AdminLayout({ children }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  
  if (isLoading) return <Spinner />;
  if (!isAuthenticated) return null; // Redirects to login
  
  return (
    <div className="flex">
      <AdminSidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## Dynamic Routes

### Product Detail

```typescript
// app/phones/[slug]/page.tsx

export default function ProductPage({ params }) {
  const { slug } = params;
  // Use slug to fetch product via VM
}
```

### CMS Pages

```typescript
// app/[slug]/page.tsx

export default function CmsPage({ params }) {
  const { slug } = params;
  // Fetch CMS page by slug
}
```

---

## Route Groups

### (public)

Routes that share the public layout (Navbar/Footer):
- Uses `PublicLayout` from active skin
- Wraps pages with `usePublicLayoutVM`

### admin

Protected routes requiring ADMIN or STAFF role:
- Uses `AdminLayout` with sidebar
- Protected by `useAdminAuth`

---

## API Routes

API routes proxy to backend:

```typescript
// next.config.ts

rewrites: [
  {
    source: '/api/:path*',
    destination: 'http://localhost:3001/api/:path*',
  },
]
```

---

## Related Docs

- [Data Flow](../platform/data-flow.md)
- [Layout VMs](./layout-vms.md)
