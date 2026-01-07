# Backend API Overview

## Module Structure

```
backend/src/modules/
├── appointments/    # Repair booking
├── auth/           # JWT, OAuth, impersonation
├── banners/        # Promotional banners
├── categories/     # Product categories
├── discounts/      # Coupon codes
├── email/          # Template-based email
├── inventory/      # Stock management
├── invoice/        # PDF generation
├── marketing/      # Email campaigns
├── orders/         # Stripe checkout
├── owner/          # Platform management
├── pages/          # CMS
├── products/       # Product catalog
├── refunds/        # Refund processing
├── repairs/        # Repair catalog
├── reviews/        # Product reviews
├── settings/       # Tenant settings
├── shipping/       # Shipping zones
├── sms/            # SMS service
├── tenant/         # Tenant config API
├── tickets/        # Support system
├── upload/         # File uploads
└── users/          # User management
```

---

## Endpoint Categories

### Public (No Auth)

| Module | Endpoints |
|--------|-----------|
| Products | GET list, GET by ID/slug, GET featured |
| Categories | GET list, GET by ID/slug |
| Repairs | GET device types, brands, devices, services |
| Appointments | POST book, GET available slots |
| Orders | POST checkout, GET by session |
| Tickets | POST create, GET by session, POST message |
| Tenant | GET config, GET features, GET ui-config |

### Admin (JWT + ADMIN/STAFF)

| Module | Endpoints |
|--------|-----------|
| Orders | GET all, GET by ID, PATCH status |
| Products | POST create, PUT update, DELETE |
| Appointments | GET all, PATCH, DELETE |
| Tickets | GET all, PATCH status, POST reply |
| Users | GET all, PATCH role/VIP/notes |
| Discounts | CRUD (ADMIN only) |
| Inventory | Stock adjustments |
| Invoice | Create, GET PDF, email |

### Owner (JWT + OWNER + tenantId=null)

| Module | Endpoints |
|--------|-----------|
| Tenants | CRUD, activate, suspend, archive |
| Domains | Add, verify, set primary, Cloudflare |
| Config | PATCH tenant config |
| Features | GET/PATCH, apply plan template |
| Users | List per tenant, create, reset password |
| Seeding | Seed repairs, products |

---

## Authentication Endpoints

| Endpoint | Method | Rate Limit |
|----------|--------|------------|
| `/auth/register` | POST | 10/hour |
| `/auth/login` | POST | 5/15min |
| `/auth/admin-login` | POST | 3/15min |
| `/auth/owner-login` | POST | 3/15min |
| `/auth/forgot-password` | POST | 3/hour |
| `/auth/reset-password` | POST | — |
| `/auth/verify-email` | POST | — |
| `/auth/google` | GET | — |
| `/auth/me` | GET | JWT |

---

## Guard Patterns

### Public

```typescript
// No guards
@Get()
findAll() { ... }
```

### JWT Only

```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@Request() req) { ... }
```

### JWT + Roles

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
@Get('admin/all')
getAllOrders() { ... }
```

### Owner Only

```typescript
@UseGuards(JwtAuthGuard, OwnerGuard)
@Get('tenants')
getTenants() { ... }
```

---

## Tenant Isolation

All tenant-scoped endpoints use `@TenantId()`:

```typescript
@Get()
findAll(@TenantId() tenantId: string) {
  return this.service.findAll(tenantId);
}
```

Service methods MUST include tenantId in queries:

```typescript
findAll(tenantId: string) {
  return this.prisma.order.findMany({
    where: { tenantId }
  });
}
```

---

## Related Docs

- [Tenant Model](../platform/tenant-model.md)
- [Extension Rules](./extension-rules.md)
