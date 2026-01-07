# Tenant Model

## Overview

ServicePulse uses **domain-based multi-tenancy**. Each tenant has:
- One or more **domains** (e.g., `shop.example.com`)
- One **TenantConfig** (branding, contact, business settings)
- One **TenantFeatures** (feature flags)
- Isolated **data** (orders, users, products)

---

## Tenant Resolution

```
Request arrives
      │
      ▼
TenantMiddleware
      │ Extracts Host header
      │ Normalizes: lowercase, strip port, strip www.
      ▼
TenantDomain lookup
      │ SELECT * FROM TenantDomain WHERE domain = ?
      ▼
Load Tenant + Config + Features
      │ Cached for 5 minutes
      ▼
Attach to request
      │ req.tenantId = tenant.id
      │ req.tenant = { id, name, config, ... }
      │ req.features = { ecommerceEnabled, ... }
      ▼
Controller receives tenantId via @TenantId() decorator
```

---

## Database Isolation

### Rule: Every entity has `tenantId`

```prisma
model Order {
  id        String   @id @default(uuid())
  tenantId  String   // ← Always present
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ...
}
```

### Rule: Every query includes `tenantId`

```typescript
// ✅ Correct
findAll(tenantId: string) {
  return this.prisma.order.findMany({
    where: { tenantId }
  });
}

// ❌ Wrong - exposes cross-tenant data
findAll() {
  return this.prisma.order.findMany();
}
```

---

## TenantConfig Fields

| Field | Type | Purpose | Used By |
|-------|------|---------|---------|
| **Branding** ||||
| shopName | string | Business name | Header, invoices |
| logoUrl | string? | Logo image URL | Header, invoices |
| primaryColor | string | Brand color | CSS variables |
| secondaryColor | string? | Secondary color | CSS variables |
| accentColor | string? | Accent color | CSS variables |
| borderRadius | string | UI roundness | CSS variables |
| darkMode | boolean | Dark theme | CSS class |
| **Contact** ||||
| email | string? | Contact email | Contact page |
| phone | string? | Contact phone | Contact page |
| whatsappNumber | string? | WhatsApp number | Chat widget |
| address | JSON? | Business address | Contact, invoices |
| **Locale** ||||
| locale | string | Language code | Date formatting |
| currency | string | Currency code | Prices |
| currencySymbol | string | Currency symbol | Prices |
| timezone | string | Timezone | Appointments |
| **Business** ||||
| openingHours | JSON? | Weekly schedule | Contact, booking |
| timeSlots | string[]? | Appointment slots | Booking |
| closedDays | number[] | Days closed | Booking |
| **Invoice** ||||
| companyName | string? | Legal name | Invoices |
| vatNumber | string? | VAT/Tax ID | Invoices |
| bankAccount | string? | Bank details | Invoices |
| bankName | string? | Bank name | Invoices |
| invoicePrefix | string | Invoice # prefix | Invoices |
| invoiceFooter | string? | Footer text | Invoices |
| website | string? | Website URL | Invoices |
| **Integrations** ||||
| googleAnalyticsId | string? | GA tracking ID | Analytics |
| cookiebotId | string? | Cookie consent ID | Compliance |
| **SEO** ||||
| seoTitle | string? | Default title | Meta tags |
| seoDescription | string? | Default desc | Meta tags |

---

## Tenant Statuses

| Status | Meaning |
|--------|---------|
| `ACTIVE` | Normal operation |
| `SUSPENDED` | Temporarily disabled (returns 403) |
| `ARCHIVED` | Soft deleted (returns 503) |

---

## Accessing Tenant Data

### Backend (Controller)

```typescript
@Controller('orders')
export class OrdersController {
  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.ordersService.findAll(tenantId);
  }
}
```

### Backend (Service)

```typescript
@Injectable()
export class OrdersService {
  findAll(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
```

### Frontend (Provider)

```typescript
function MyComponent() {
  const tenant = useTenant();
  
  return <h1>{tenant.branding.shopName}</h1>;
}
```

---

## Skipped Paths

These paths bypass tenant middleware:

- `/owner/*` — Owner panel routes
- `/api/owner/*` — Owner API
- `/auth/owner-login` — Owner auth
- `/orders/webhook` — Stripe webhooks
- `/orders/checkout-success` — Stripe redirects

---

## Related Docs

- [Feature Flags](./feature-flags.md)
- [UI Config](./ui-config.md)
