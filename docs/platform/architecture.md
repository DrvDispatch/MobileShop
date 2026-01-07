# ServicePulse Architecture

## Overview

ServicePulse is a **multi-tenant SaaS platform** for device repair shops and service businesses. It provides:

- **E-commerce** — Product catalog, cart, Stripe checkout
- **Repair Booking** — Multi-step appointment scheduler
- **Support Tickets** — Real-time chat with Socket.io
- **Invoicing** — PDF generation and email delivery
- **Admin Panel** — Business management
- **Owner Panel** — Platform-level tenant management

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        PLATFORM OWNER                            │
│                    servicespulse.com                             │
│                      Owner Panel (:3000)                         │
└─────────────────────────┬───────────────────────────────────────┘
                          │ Creates & Manages
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Tenant A │    │ Tenant B │    │ Tenant C │
    │ shop.com │    │ fix.nl   │    │ repair.be│
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │Frontend │     │Frontend │     │Frontend │
    │ (:3002) │     │ (:3002) │     │ (:3002) │
    └────┬────┘     └────┬────┘     └────┬────┘
         └───────────────┼───────────────┘
                         ▼
                 ┌───────────────┐
                 │  Backend API  │
                 │   (:3001)     │
                 └───────────────┘
                         │
                 ┌───────▼───────┐
                 │  PostgreSQL   │
                 │   + MinIO     │
                 └───────────────┘
```

---

## Applications

| App | Port | Tech | Purpose |
|-----|------|------|---------|
| Backend | 3001 | NestJS | REST API, Socket.io |
| Frontend | 3002 | Next.js 14 | Public site + Admin panel |
| Owner Panel | 3000 | Next.js 14 | Platform management |

---

## Request Flow

```
1. User visits: https://bikerepair.site/repair/book
                    │
2. TenantMiddleware extracts Host: "bikerepair.site"
                    │
3. Query: TenantDomain WHERE domain = "bikerepair.site"
                    │
4. Load: Tenant + TenantConfig + TenantFeatures
                    │
5. Attach: req.tenantId, req.tenant, req.features
                    │
6. Controller uses @TenantId() → scoped queries
                    │
7. Response includes tenant-specific branding
```

---

## User Roles

| Role | Access | Application |
|------|--------|-------------|
| `OWNER` | Platform-wide management | Owner Panel |
| `ADMIN` | Full tenant admin | Admin Panel |
| `STAFF` | Limited admin | Admin Panel |
| `CUSTOMER` | Public site, orders | Frontend |

---

## Key Patterns

### 1. Tenant Isolation
Every query includes `tenantId`. See [Tenant Model](./tenant-model.md).

### 2. Feature Flags
Capabilities enabled per-tenant. See [Feature Flags](./feature-flags.md).

### 3. Skin System
UI components receive data via ViewModels. See [Skin Contract](../skins/skin-contract.md).

### 4. View Model Pattern
All data fetching in `core/hooks`, UI is purely presentational. See [Data Flow](./data-flow.md).

---

## Directory Structure

```
mobile-shop/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── modules/      # Feature modules
│   │   ├── common/       # Guards, decorators
│   │   └── main.ts
│   └── prisma/           # Schema + migrations
├── frontend/             # Next.js 14
│   ├── src/
│   │   ├── app/          # App Router routes
│   │   ├── core/         # Hooks, skin system
│   │   ├── skins/        # UI skins
│   │   ├── components/   # Shared components
│   │   └── lib/          # Utilities
│   └── docs/             # (this folder)
├── owner-app/            # Next.js Owner Panel
└── docs/                 # Platform docs
```

---

## Related Docs

- [Tenant Model](./tenant-model.md)
- [Feature Flags](./feature-flags.md)
- [UI Config](./ui-config.md)
- [Data Flow](./data-flow.md)
