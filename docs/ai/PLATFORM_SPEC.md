# ServicePulse Platform Specification

> **Version**: 1.0  
> **Updated**: 2026-01-03  
> **Purpose**: Canonical AI/developer reference for the ServicePulse multi-tenant SaaS platform

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Multi-Tenant Model](#3-multi-tenant-model)
4. [Feature Flags](#4-feature-flags)
5. [Skin System](#5-skin-system)
6. [View Model Pattern](#6-view-model-pattern)
7. [API Reference](#7-api-reference)
8. [Forbidden Patterns](#8-forbidden-patterns)
9. [Extension Guide](#9-extension-guide)

---

# 1. Tech Stack

## Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | API framework |
| Prisma | 5.x | ORM |
| PostgreSQL | 15+ | Database |
| Socket.io | 4.x | Real-time tickets |
| PDFKit | — | Invoice generation |
| Nodemailer | — | Email service |
| Stripe | — | Payments |

## Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | App Router |
| TypeScript | 5.x | Strict mode |
| TailwindCSS | 3.x | Styling |
| Zustand | 4.x | Cart state |
| SWR | 2.x | Data fetching |
| Socket.io-client | 4.x | Real-time chat |

## Infrastructure
| Component | Technology |
|-----------|------------|
| Storage | MinIO (S3-compatible) |
| DNS | Cloudflare |
| Deployment | Docker + nginx |

---

# 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLATFORM OWNER                            │
│                    (servicespulse.com)                          │
│                      Owner Panel (3000)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Creates & Manages Tenants
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Tenant A │    │ Tenant B │    │ Tenant C │
    │ shop.com │    │ fix.nl   │    │ repair.be│
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │Frontend │     │Frontend │     │Frontend │
    │  (3002) │     │  (3002) │     │  (3002) │
    └────┬────┘     └────┬────┘     └────┬────┘
         │               │               │
         └───────────────┼───────────────┘
                         ▼
                 ┌───────────────┐
                 │  Backend API  │
                 │    (3001)     │
                 └───────────────┘
```

## Applications

| App | Port | Purpose |
|-----|------|---------|
| Backend | 3001 | NestJS API (all tenants + owner) |
| Frontend | 3002 | Next.js public site + admin panel |
| Owner | 3000 | Platform management UI |

---

# 3. Multi-Tenant Model

## Tenant Resolution Flow

```
Request → Host Header → TenantMiddleware → TenantDomain lookup
                                         → Load TenantConfig
                                         → Attach to req.tenantId
```

## Database Isolation

**Every entity has `tenantId`**:
```prisma
model Order {
  id        String   @id @default(uuid())
  tenantId  String   // ← Always present
  // ...
}
```

**All queries MUST include tenantId**:
```typescript
// ✅ Correct
findAll(tenantId: string) {
  return this.prisma.order.findMany({
    where: { tenantId }
  });
}

// ❌ Wrong - cross-tenant leak
findAll() {
  return this.prisma.order.findMany();
}
```

## TenantConfig Schema

| Field | Type | Owner Panel | Frontend | Backend |
|-------|------|-------------|----------|---------|
| shopName | string | ✅ | Header | Invoice |
| logoUrl | string? | ✅ | Header | Invoice PDF |
| primaryColor | string | ✅ | CSS vars | — |
| email | string? | ✅ | Contact | Email from |
| phone | string? | ✅ | Contact | Invoice |
| whatsappNumber | string? | ✅ | ChatWidget | — |
| companyName | string? | ✅ | — | Invoice |
| vatNumber | string? | ✅ | — | Invoice |
| bankAccount | string? | ✅ | — | Invoice |
| invoicePrefix | string | ✅ | — | Invoice |
| openingHours | JSON? | ✅ | Contact | Appointments |
| timeSlots | string[]? | ✅ | Booking | Appointments |
| closedDays | number[] | ✅ | Booking | Appointments |

---

# 4. Feature Flags

## Flag Hierarchy

```
ecommerceEnabled (parent)
├── refurbishedGrading
├── wishlistEnabled
├── stockNotifications
└── couponsEnabled

repairsEnabled (parent)
├── quoteOnRequest
├── mailInRepairs
└── walkInQueue

ticketsEnabled (parent)
└── liveChatWidget

invoicingEnabled (parent)
├── vatCalculation
└── pdfGeneration

inventoryEnabled (parent)
└── advancedInventory
```

## Frontend Access

```typescript
const features = useFeatures();

// Direct check
if (features.ecommerceEnabled) { ... }

// With hierarchy respect
if (isFeatureEnabled(features, 'wishlistEnabled')) {
  // Returns false if ecommerceEnabled is false
}
```

## Backend Check

```typescript
const features = await this.featuresService.getFeatures(tenantId);
if (!features.ticketsEnabled) {
  throw new ForbiddenException('Tickets disabled');
}
```

---

# 5. Skin System

## Architecture

```
Route (app/)
  ↓ useActiveSkin()
  ↓ usePublicLayoutVM()
  ↓
Skin.layouts.PublicLayout
  ↓ vm.navbar → Navbar (props-only)
  ↓ vm.footer → Footer (props-only)
  ↓
  children → Skin.pages.X (props-only)
```

## Skin Contract

```typescript
// core/skin/SkinContract.ts

interface NavbarVM {
  shopName: string;
  logoUrl?: string;
  navItems: NavItem[];
  cartCount: number;
  isLoggedIn: boolean;
  // ... all data navbar needs
}

interface FooterVM {
  shopName: string;
  email?: string;
  phone?: string;
  address?: AddressVM;
  navLinks: FooterLink[];
  // ... all data footer needs
}

interface PublicLayoutVM {
  navbar: NavbarVM;
  footer: FooterVM;
}

interface SkinDefinition {
  name: string;
  layouts: {
    PublicLayout: ComponentType<{ vm: PublicLayoutVM; children: ReactNode }>;
  };
  pages: {
    Home: ComponentType<{ vm: HomePageVM }>;
    Cart: ComponentType<{ vm: CartPageVM }>;
    // ...
  };
}
```

## Skin Structure

```
skins/
├── base/
│   ├── index.ts           # SkinDefinition export
│   ├── skin.config.ts     # Metadata
│   ├── layouts/
│   │   └── PublicLayout.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Cart.tsx
│   │   └── ...
│   └── components/
│       ├── landing/
│       │   ├── navbar.tsx
│       │   └── footer.tsx
│       └── ...
└── minimal/               # Future skin
    └── ...
```

## What Skins CAN Do

- Render UI from props
- Import own components
- Use CSS/TailwindCSS
- Import external packages (icons, animations)
- Import types from `@core/skin`

## What Skins CANNOT Do

| Forbidden | Why |
|-----------|-----|
| `useTenant()` | Use VM props instead |
| `useFeatures()` | Core passes digested booleans |
| `useCartStore()` | VM provides cartCount |
| `fetch()` | Routes call VMs, pass data |
| `localStorage` | State managed by core |
| Direct API calls | VMs handle all data |

---

# 6. View Model Pattern

## Page VM Example

```typescript
// core/hooks/pages/useCartPageVM.ts

export interface CartPageVM {
  items: CartItem[];
  subtotal: number;
  isEmpty: boolean;
  updateQuantity: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export function useCartPageVM(): CartPageVM {
  const { items, updateQuantity, removeItem, clearCart, getTotal } = useCartStore();
  
  return {
    items,
    subtotal: getTotal(),
    isEmpty: items.length === 0,
    updateQuantity,
    removeItem,
    clearCart,
  };
}
```

## Route Delegate Example

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

## Skin Page Example

```typescript
// skins/base/pages/Cart.tsx

'use client';

import type { CartPageVM } from '@core/hooks/pages';

export function CartPage({ vm }: { vm: CartPageVM }) {
  const { items, subtotal, isEmpty, updateQuantity, removeItem } = vm;
  
  if (isEmpty) {
    return <EmptyCartMessage />;
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
      <p>Subtotal: €{subtotal.toFixed(2)}</p>
    </div>
  );
}
```

---

# 7. API Reference

## Authentication

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/auth/login` | POST | — | Customer login |
| `/auth/admin-login` | POST | — | Admin login |
| `/auth/owner-login` | POST | — | Owner login |
| `/auth/me` | GET | JWT | Get current user |

## Public Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/tenant/config` | GET | Get tenant config |
| `/tenant/features` | GET | Get feature flags |
| `/tenant/ui-config` | GET | Get UI labels |
| `/products` | GET | List products |
| `/products/:id` | GET | Get product |
| `/categories` | GET | List categories |
| `/repairs/device-types` | GET | Get repair catalog |
| `/appointments` | POST | Book appointment |
| `/orders/checkout` | POST | Create Stripe session |
| `/tickets` | POST | Create support ticket |

## Admin Endpoints (JWT + ADMIN/STAFF)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/orders/admin/all` | GET | List orders |
| `/orders/:id` | PATCH | Update order |
| `/products` | POST | Create product |
| `/products/:id` | PUT/DELETE | Update/delete product |
| `/appointments` | GET | List appointments |
| `/tickets` | GET | List tickets |
| `/users` | GET | List users |

## Owner Endpoints (JWT + OWNER + tenantId=null)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/owner/tenants` | GET/POST | List/create tenants |
| `/owner/tenants/:id/config` | PATCH | Update config |
| `/owner/tenants/:id/features` | PATCH | Update features |
| `/owner/impersonate` | POST | Impersonate user |

---

# 8. Forbidden Patterns

## TypeScript

```typescript
// ❌ NEVER use 'any'
const data: any = response;

// ✅ Use proper types
const data: ProductResponse = response;
```

```typescript
// ❌ NEVER use @ts-ignore
// @ts-ignore
const x = unsafeCall();

// ✅ Fix the type issue
const x: ExpectedType = safeCall();
```

## Tenant Isolation

```typescript
// ❌ Query without tenantId
findAll() {
  return this.prisma.order.findMany();
}

// ✅ Always include tenantId
findAll(tenantId: string) {
  return this.prisma.order.findMany({
    where: { tenantId }
  });
}
```

## Skins

```typescript
// ❌ Hooks in skin components
function CartPage() {
  const tenant = useTenant(); // FORBIDDEN
  const cart = useCartStore(); // FORBIDDEN
}

// ✅ Props-only skin components
function CartPage({ vm }: { vm: CartPageVM }) {
  const { items, subtotal } = vm; // All data from VM
}
```

```typescript
// ❌ Direct fetch in skins
function ProductList() {
  useEffect(() => {
    fetch('/api/products').then(...); // FORBIDDEN
  }, []);
}

// ✅ Data passed via VM
function ProductList({ vm }: { vm: ProductListVM }) {
  const { products, isLoading } = vm; // Route provides data
}
```

## Hardcoding

```typescript
// ❌ Hardcoded tenant data
const shopName = "Mobile Repair Shop";
const phone = "+32 123 456 789";

// ✅ From TenantConfig (via VM)
const { shopName, phone } = vm;
```

---

# 9. Extension Guide

## Adding a New Feature Flag

1. **Schema**: Add to `TenantFeature` model
2. **Migration**: `npx prisma migrate dev`
3. **Service**: Add to `TenantFeaturesService`
4. **Frontend Types**: Add to `FeatureFlags` interface
5. **Owner UI**: Add toggle in Owner Panel

## Adding a New TenantConfig Field

1. **Schema**: Add to `TenantConfig` model
2. **Migration**: `npx prisma migrate dev`
3. **DTO**: Add to `UpdateConfigDto`
4. **Owner UI**: Add form field
5. **Frontend Types**: Add to `PublicTenantConfig` if public
6. **Document**: Update this spec

## Adding a New Skin Page

1. **Page VM**: Create `useXxxPageVM.ts` in `core/hooks/pages/`
2. **Export VM**: Add to `core/hooks/pages/index.ts`
3. **Skin Page**: Create `Xxx.tsx` in `skins/base/pages/`
4. **Export Page**: Add to `skins/base/index.ts`
5. **Route**: Create thin delegate in `app/xxx/page.tsx`

## Adding a New Skin

1. **Folder**: Create `skins/your-skin/`
2. **Config**: Create `skin.config.ts`
3. **Components**: Copy/adapt from base skin
4. **Index**: Export `SkinDefinition`
5. **Registry**: Register in `SkinRegistry.ts`

---

# Quick Reference

```
PORTS:
  Backend:      localhost:3001
  Frontend:     localhost:3002
  Owner Panel:  localhost:3000

DEV CREDENTIALS:
  Owner:  owner@servicespulse.com / OwnerPass123!

KEY FILES:
  Tenant Types:   frontend/src/lib/tenant-types.ts
  Feature Flags:  frontend/src/contexts/FeatureContext.tsx
  Skin Contract:  frontend/src/core/skin/SkinContract.ts
  Layout VM:      frontend/src/core/hooks/layouts/usePublicLayoutVM.ts

VERIFICATION COMMANDS:
  TSC:    npx tsc --noEmit
  Build:  npm run build
  Lint:   npx eslint src/skins
```

---

*End of Platform Specification*
