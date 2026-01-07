# Feature Flags

## Overview

Feature flags control which capabilities are available per-tenant. They enable:
- Tiered pricing (starter, professional, enterprise)
- Gradual feature rollout
- Per-tenant customization

---

## Flag Hierarchy

Flags have parent-child relationships. If a parent is disabled, all children are effectively disabled.

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

---

## Complete Flag List

| Flag | Type | Default | Parent | Purpose |
|------|------|---------|--------|---------|
| **E-Commerce** |||||
| ecommerceEnabled | bool | true | — | Enable product sales |
| refurbishedGrading | bool | true | ecommerce | A/B/C grade display |
| wishlistEnabled | bool | true | ecommerce | User wishlists |
| stockNotifications | bool | true | ecommerce | "Back in stock" emails |
| couponsEnabled | bool | true | ecommerce | Discount codes |
| **Repairs** |||||
| repairsEnabled | bool | true | — | Enable repair booking |
| quoteOnRequest | bool | false | repairs | "Request quote" option |
| mailInRepairs | bool | false | repairs | Mail-in service |
| walkInQueue | bool | false | repairs | Walk-in queue system |
| **Tickets** |||||
| ticketsEnabled | bool | true | — | Enable support system |
| liveChatWidget | bool | true | tickets | Floating chat widget |
| **Invoicing** |||||
| invoicingEnabled | bool | true | — | Enable invoicing |
| vatCalculation | bool | true | invoicing | Auto VAT calculation |
| pdfGeneration | bool | true | invoicing | PDF invoice generation |
| **Inventory** |||||
| inventoryEnabled | bool | true | — | Enable inventory |
| advancedInventory | bool | false | inventory | Multi-location stock |
| **Team** |||||
| employeeManagement | bool | false | — | Employee accounts |
| maxAdminUsers | number | 1 | — | Max admin seats |
| **Analytics** |||||
| analyticsEnabled | bool | true | — | Dashboard analytics |

---

## Plan Templates

Owner can apply pre-configured templates:

| Plan | Key Settings |
|------|-------------|
| **starter** | ecommerce=false, repairs=true, tickets=false, maxAdminUsers=1 |
| **professional** | All main features=true, maxAdminUsers=3 |
| **enterprise** | All features=true, advancedInventory=true, employeeManagement=true, maxAdminUsers=10 |

---

## Frontend Usage

### Access All Flags

```typescript
import { useFeatures } from '@/contexts/FeatureContext';

function MyComponent() {
  const features = useFeatures();
  
  if (!features.ecommerceEnabled) {
    return null;
  }
  
  return <ProductCatalog />;
}
```

### Hierarchy-Aware Check

```typescript
import { useFeatures, isFeatureEnabled } from '@/contexts/FeatureContext';

function WishlistButton() {
  const features = useFeatures();
  
  // Returns false if ecommerceEnabled is false,
  // even if wishlistEnabled is true
  if (!isFeatureEnabled(features, 'wishlistEnabled')) {
    return null;
  }
  
  return <button>Add to Wishlist</button>;
}
```

### Conditional Navigation

Features are checked in `admin-layout.tsx` to show/hide nav items:

```typescript
const sections = getNavigationSections(features);
// Only shows relevant items based on enabled flags
```

---

## Backend Usage

```typescript
@Injectable()
export class SomeService {
  constructor(private featuresService: TenantFeaturesService) {}
  
  async doSomething(tenantId: string) {
    const features = await this.featuresService.getFeatures(tenantId);
    
    if (!features.ticketsEnabled) {
      throw new ForbiddenException('Tickets are not enabled');
    }
    
    // proceed...
  }
}
```

---

## Owner Panel Management

Owner can:
1. Toggle individual flags via `/owner/tenants/:id/features`
2. Apply plan templates via `/owner/tenants/:id/features/apply-plan`
3. View grouped summary via `/owner/tenants/:id/features/summary`

---

## Auto-Seeding Behavior

When `repairsEnabled` is set to `true` for the first time:
1. System checks if repair catalog exists
2. If empty, automatically seeds with default device types, brands, services
3. Seeding runs in background (non-blocking)

---

## Related Docs

- [Tenant Model](./tenant-model.md)
- [UI Config](./ui-config.md)
