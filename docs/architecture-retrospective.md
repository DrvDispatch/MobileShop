# ServicePulse Platform: Architecture Retrospective & Future Vision

> **Version**: 1.0  
> **Date**: January 2026  
> **Audience**: Engineers, Architects, Future Contributors  
> **Purpose**: Technical design retrospective and architecture guide for the next project

---

## Table of Contents

1. [Project Architecture Overview](#1-project-architecture-overview)
2. [Key Design Decisions & Rationale](#2-key-design-decisions--rationale)
3. [Process Deep Dive: Adding a New UI Skin](#3-process-deep-dive-adding-a-new-ui-skin)
4. [Challenges & Constraints Encountered](#4-challenges--constraints-encountered)
5. [Current State Assessment](#5-current-state-assessment)
6. [Lessons Learned](#6-lessons-learned)
7. [Architecture Vision for the Next Project](#7-architecture-vision-for-the-next-project)

---

# 1. Project Architecture Overview

## System Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PLATFORM OWNER LAYER                          │
│                     (servicespulse.com @ :3000)                      │
│    Creates tenants, manages domains, configures features             │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    ▼                            ▼                            ▼
┌─────────────┐           ┌─────────────┐           ┌─────────────┐
│  Tenant A   │           │  Tenant B   │           │  Tenant C   │
│ repair.com  │           │ barber.nl   │           │ carwash.be  │
│ (REPAIR)    │           │ (BARBER)    │           │ (CAR_WASH)  │
└──────┬──────┘           └──────┬──────┘           └──────┬──────┘
       │                         │                         │
       └─────────────────────────┼─────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   SHARED BACKEND        │
                    │   NestJS @ :3001        │
                    │   33 Modules            │
                    │   160+ API Routes       │
                    └────────────┬────────────┘
                                 │
          ┌──────────────────────┼──────────────────────┐
          ▼                      ▼                      ▼
    ┌───────────┐         ┌───────────┐         ┌───────────┐
    │ Frontend  │         │   Admin   │         │  Owner    │
    │ @ :3002   │         │   Panel   │         │  Panel    │
    │ (Skins)   │         │ (/admin)  │         │  @ :3000  │
    └───────────┘         └───────────┘         └───────────┘
```

## Separation of Concerns

### Backend (NestJS)
- **Responsibility**: All business logic, data access, multi-tenancy, authentication
- **Structure**: 33 NestJS modules, each with controller + service + DTOs
- **Tenant Isolation**: Every entity has `tenantId`, all queries filtered via `@TenantId()` decorator
- **Database**: PostgreSQL via Prisma ORM, 1798-line schema

### Frontend (Next.js)
- **Responsibility**: Customer-facing UI, admin panel
- **Structure**: 
  - `/core` - Business logic layer (104+ hooks, ViewModels)
  - `/skins` - Presentation layer (base, barbershop, classic)
  - `/components` - Shared UI components
  - `/lib` - Utilities, API clients

### Owner Panel (Next.js)
- **Responsibility**: Platform-level tenant management
- **Access**: Platform owner only (OWNER role)
- **Capabilities**: Create/suspend tenants, manage domains, configure features

## Core vs Replaceable vs Presentation

| Layer | Contents | Replaceability |
|-------|----------|----------------|
| **Core** | Backend modules, Prisma schema, Auth system | Not replaceable - foundational |
| **Replaceable** | Individual tenants, domains, feature flags | Per-tenant customization |
| **Presentation** | Skins, UI components, CSS | Fully swappable |

---

# 2. Key Design Decisions & Rationale

## 2.1 Multi-Tenant Architecture

### Problem Solved
Support multiple independent businesses (tenants) from a single codebase and deployment.

### Decision
Row-level tenant isolation with `tenantId` on every database table.

### Alternatives Considered
1. **Database-per-tenant**: Better isolation but higher infrastructure cost
2. **Schema-per-tenant**: Complex migration management
3. **Row-level (chosen)**: Good balance of isolation and simplicity

### Trade-offs Accepted
- Every query must be tenant-scoped (enforced by `@TenantId()` decorator)
- Accidental cross-tenant data leaks possible if decorator forgotten
- All tenants share same database - no per-tenant database scaling

### Code Pattern
```typescript
@Controller('orders')
export class OrdersController {
    @Get()
    findAll(@TenantId() tenantId: string) {
        // tenantId extracted from request, enforced by middleware
        return this.service.findAll(tenantId);
    }
}
```

---

## 2.2 Skin System with ViewModels

### Problem Solved
Allow different visual presentations (barbershop, repair shop, carwash) while sharing business logic.

### Decision
Create a ViewModel (VM) layer that sits between business logic and UI:

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Hooks     │────▶│  ViewModel  │────▶│    Skin     │
│ (API calls) │     │  (pure data)│     │ (pure UI)   │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Alternatives Considered
1. **Separate frontend projects per vertical**: More flexibility but code duplication
2. **Theme-only customization**: Too limited (can't change layout structure)
3. **VM layer (chosen)**: Clean separation, testable, type-safe

### Trade-offs Accepted
- Every UI feature requires VM definition first (adds development overhead)
- Skins cannot access hooks/state directly (intentional constraint)
- New pages require updates to both VM and all skins

### The Contract
```typescript
// Skins receive ONLY this:
interface SkinDefinition {
    layouts: { PublicLayout: ComponentType<{ vm: PublicLayoutVM }> };
    pages: { [key: string]: ComponentType<{ vm: any }> };
}

// Skins may NOT import:
// ❌ useTenant(), useFeatures(), useCartStore()
// ❌ fetch(), localStorage
// ❌ Any context providers
```

---

## 2.3 Dual Data Model (Generic + Vertical-Specific)

### Problem Solved
Support both general service bookings AND specific repair workflows.

### Decision
Maintain two parallel data models in Prisma:

**Generic (Vertical-Agnostic)**:
- `Service`, `ServiceCategory`, `Booking`, `BookingFlowConfig`
- Works for any service business

**Vertical-Specific (Legacy)**:
- `RepairDeviceType`, `RepairBrand`, `RepairDevice`, `RepairService`
- `Appointment` (repair-focused fields like `deviceBrand`, `repairType`)

### Why Both Exist
The project started as a repair shop solution, then evolved to support multiple verticals. Generic tables were added without removing specific ones.

### Trade-offs Accepted
- Schema complexity (1798 lines)
- Two ways to do similar things (bookings vs appointments)
- Migration path unclear

---

## 2.4 Feature Flags per Tenant

### Problem Solved
Allow/disable entire modules per tenant (e.g., tenant A has e-commerce, tenant B doesn't).

### Decision
`TenantFeature` table with boolean flags:

```prisma
model TenantFeature {
    ecommerceEnabled   Boolean @default(true)
    repairsEnabled     Boolean @default(true)
    ticketsEnabled     Boolean @default(true)
    invoicingEnabled   Boolean @default(true)
    // ... 15+ flags
}
```

### Trade-offs Accepted
- Binary on/off only (no percentage rollouts)
- Schema change required for new flags
- Frontend must check flags before rendering features

---

## 2.5 TenantUIConfig for Copy/Labels

### Problem Solved
Allow tenants to customize UI copy without code changes.

### Decision
Store UI labels as JSON in `TenantUIConfig`:

```prisma
model TenantUIConfig {
    vertical   TenantVertical  // REPAIR_SHOP, BARBER, etc.
    navLabels      Json?
    checkoutLabels Json?
    bookingLabels  Json?
    // ...
}
```

### Trade-offs Accepted
- JSON blobs are not type-safe at database level
- Defaults must be computed at runtime (via UIConfigService)
- Labels scattered across config tables vs hardcoded in code

---

# 3. Process Deep Dive: Adding a New UI Skin

This section describes the current process for adding a UI variant.

## Step 1: Create Folder Structure

```
frontend/src/skins/
├── base/           # Existing default
├── barbershop/     # Existing example
└── carwash/        # NEW SKIN
    ├── index.ts
    ├── skin.config.ts
    ├── layouts/
    │   └── PublicLayout.tsx
    ├── pages/
    │   ├── Home.tsx
    │   ├── BookRepair.tsx  (or reuse from base)
    │   └── ... (18+ required pages)
    └── components/
```

## Step 2: Define Skin Config (Straightforward)

```typescript
// skin.config.ts - 5 minutes
export const CarwashSkinConfig = {
    name: 'carwash',
    displayName: 'Car Wash',
    version: '1.0.0',
    features: { primaryFocus: 'appointments' },
};
```

## Step 3: Create Layout (Straightforward)

```typescript
// layouts/PublicLayout.tsx
export function PublicLayout({ vm, children }: { vm: PublicLayoutVM }) {
    return (
        <div>
            <header>{vm.navbar.shopName}</header>
            <main>{children}</main>
            <footer>{vm.footer.shopName}</footer>
        </div>
    );
}
```

## Step 4: Create 18+ Pages (Pain Point ⚠️)

This is where complexity accumulates. A skin must provide all pages, or inherit from base:

```typescript
// index.ts
import { HomePage } from './pages/Home';
import { CartPage } from '@skins/base/pages/Cart';  // Reuse
import { CheckoutPage } from '@skins/base/pages/Checkout';  // Reuse
// ... import 18+ pages

export const CarwashSkin: Skin = {
    pages: {
        Home: HomePage,        // Custom
        Cart: CartPage,        // Inherited
        Checkout: CheckoutPage,// Inherited
        // ... ALL 18+ pages must be listed
    },
    layouts: { PublicLayout },
};
```

**Pages Required**:
- Home, Cart, Checkout, CheckoutSuccess
- Phones, ProductDetail, Search, Accessories
- BookRepair, BookServices, Afspraken
- Account, AccountOrders, OrderDetail, AccountSettings
- Support, Contact, Wishlist, TrackOrder
- About, Terms, Privacy, Returns

## Step 5: Register in SkinRegistry

```typescript
// core/skin/SkinRegistry.ts
import { CarwashSkin } from '@skins/carwash';

export type SkinName = 'base' | 'barbershop' | 'classic' | 'carwash';

export const SkinRegistry: Record<SkinName, Skin> = {
    base: BaseSkin,
    barbershop: BarbershopSkin,
    classic: ClassicSkin,
    carwash: CarwashSkin,  // Add
};
```

## Step 6: Update Skin Selection (Manual)

Currently no database field for skin selection. Must manually wire up.

## Summary of Pain Points

| Step | Effort | Pain Level |
|------|--------|------------|
| Create folder | 2 min | 🟢 Low |
| skin.config.ts | 5 min | 🟢 Low |
| PublicLayout | 30 min | 🟢 Low |
| Create/inherit 18+ pages | 2-8 hours | 🔴 High |
| Register in SkinRegistry | 2 min | 🟢 Low |
| Connect to tenant config | Not automated | 🔴 High |

**Total time for minimal skin (reusing base pages)**: 1-2 hours  
**Total time for fully custom skin**: 2-4 days

---

# 4. Challenges & Constraints Encountered

## 4.1 ViewModel Layer Overhead

**What happened**: Every UI feature requires defining a VM first. This adds a layer of indirection that slows development.

**Why it happened**: We prioritized skin swappability over development speed. The VM layer enforces clean separation but requires more upfront work.

**Impact**:
- Simple feature additions take longer
- Developers must update VM interface + implementation + skin usage
- Type changes ripple through multiple files

## 4.2 Schema Duplication (Generic vs Specific)

**What happened**: The Prisma schema contains both generic tables (`Service`, `Booking`) and vertical-specific tables (`RepairBrand`, `RepairDevice`, `Appointment`).

**Why it happened**: The project evolved from repair-specific to multi-vertical. Generic tables were added without migrating away from specific ones.

**Impact**:
- 1798-line schema with redundancy
- Two ways to model similar concepts
- Confusion about which tables to use for new features
- Migration path unclear

## 4.3 Mandatory Page Implementation

**What happened**: New skins must provide entries for all ~18 pages, even if just re-exporting from base.

**Why it happened**: TypeScript requires the full Skin interface to be satisfied. No fallback mechanism.

**Impact**:
- Boilerplate for every skin
- Can't easily add new page types without updating all skins
- Discourages creating new skins

## 4.4 Skin Selection Not Tenant-Configurable

**What happened**: There's no `skinName` field in `TenantConfig`. Skin selection is not dynamic per tenant.

**Why it happened**: The skin system was designed for vertical-specific deployments, not tenant-selectable UI variants.

**Impact**:
- Can't let tenant owners choose their skin
- Frontend skin selection is hardcoded or derived from vertical

## 4.5 Hardcoded Dutch Content

**What happened**: Some UI copy and CMS defaults are in Dutch (e.g., homepage hero text).

**Why it happened**: Initial development was for a Belgian client. Internationalization was deferred.

**Impact**:
- Not immediately usable for non-Dutch clients
- CMS defaults expose business-specific text

---

# 5. Current State Assessment

## What's Stable and Well-Structured

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend multi-tenancy** | ✅ Solid | `@TenantId()` pattern works well |
| **Auth system** | ✅ Solid | JWT, OAuth, impersonation all work |
| **Invoice PDF generation** | ✅ Solid | PDFKit with tenant branding |
| **E-commerce flow** | ✅ Solid | Stripe checkout, webhooks, order management |
| **Admin panel hooks** | ✅ Solid | 36 admin hooks, CRUD patterns consistent |
| **Generic Service/Booking tables** | ✅ Solid | Vertical-agnostic, well-designed |

## What Feels Fragile or Heavy

| Component | Status | Notes |
|-----------|--------|-------|
| **Skin system** | ⚠️ Heavy | Too much ceremony to add new skins |
| **VM layer** | ⚠️ Heavy | Adds indirection without proportional benefit |
| **Dual data model** | ⚠️ Fragile | Generic + specific tables cause confusion |
| **UIConfig defaults** | ⚠️ Fragile | Scattered logic between DB and code |

## What's Hard to Change

- Adding new page types (requires updating all skins)
- Changing VM interfaces (ripples through core + all skins)
- Migrating from Repair* tables to generic Service tables

## What's Easy to Extend

- Adding new backend modules (well-established patterns)
- Adding new admin hooks (follow existing examples)
- Adding new TenantConfig fields (schema + DTO + Owner Panel)
- Creating new tenant feature flags

## Technical Debt

| Debt | Intentional? | Notes |
|------|--------------|-------|
| Dual data model | Partially | Evolution artifact, migration deferred |
| No skin fallback | No | Should auto-inherit from base |
| Hardcoded Dutch | No | I18n not prioritized early |
| No ESLint skin enforcement | Pending | Planned as Milestone 5.3 |

---

# 6. Lessons Learned

## 6.1 Start Generic, Add Specifics Later

**Lesson**: Build vertical-agnostic data models from day one. Adding specificity is easier than removing it.

**What we should have done**: Start with `Service`, `ServiceCategory`, `Booking`. Add repair-specific fields only as JSON metadata, not separate tables.

**Applicable to future projects**: Define the most generic data model that covers 80% of use cases. Use JSON fields or metadata tables for vertical-specific extensions.

---

## 6.2 Skin Abstraction Should Have Fallbacks

**Lesson**: If you build an abstraction that requires implementing N items, provide a fallback mechanism.

**What we should have done**: Default to base skin pages if skin doesn't provide one:

```typescript
function getPage(skin, pageName) {
    return skin.pages[pageName] ?? BaseSkin.pages[pageName];
}
```

**Applicable to future projects**: Any plugin/extension system should gracefully fall back to defaults.

---

## 6.3 ViewModels Are Overkill for This Use Case

**Lesson**: The VM layer adds value for testing and skin isolation, but the overhead isn't justified when skins are few and similar.

**What we should have done**: Allow skins to use hooks directly, with clear documentation on what's allowed. Rely on code review rather than architectural enforcement.

**Applicable to future projects**: Don't add abstraction layers unless you have a concrete, immediate need. The "future flexibility" often doesn't pan out.

---

## 6.4 Tenants Are Just Configuration, Not Architecture

**Lesson**: Multi-tenancy is a data concern (row filtering) not an architectural concern (different code paths).

**What we should have done**: Keep tenant awareness entirely in the backend middleware. Frontend shouldn't need to know about tenants beyond receiving config.

**Applicable to future projects**: Tenant isolation belongs in the data layer, not scattered through the application.

---

## 6.5 Separate Frontends Are Simpler Than Skin Systems

**Lesson**: For a small number of verticals (< 10), separate frontend projects are simpler than an abstraction layer.

**The tradeoff**: Duplicated code vs. simpler per-project customization. When projects diverge significantly, duplication is preferable to overly complex abstractions.

**Applicable to future projects**: Start with separate frontends. Extract shared components only when you have 3+ similar implementations.

---

# 7. Architecture Vision for the Next Project

## 7.1 Project Structure

```
/backend                     # Shared, generic, vertical-agnostic
  /src/modules/
    /services               # Generic service catalog
    /bookings               # Generic booking system
    /orders                 # E-commerce
    /auth                   # JWT, OAuth
    /tenants                # Multi-tenancy
    /...

/frontends/
  /smartphoneservice        # Independent Next.js app
  /barbershop               # Independent Next.js app
  /carwash                  # Independent Next.js app
```

## 7.2 Backend Design Principles

### 1. Truly Generic Data Model

```prisma
// ✅ Single generic hierarchy, NOT vertical-specific tables
model ServiceCategory {
    id          String @id
    tenantId    String
    parentId    String?            // Self-referential for any depth
    name        String
    slug        String
    metadata    Json?              // Vertical-specific extensions
    // No RepairBrand, RepairDevice, etc.
}

model Service {
    id          String @id
    tenantId    String
    categoryId  String?
    name        String
    price       Decimal?
    duration    Int?
    metadata    Json?              // Vertical-specific fields
}

model Booking {
    id          String @id
    tenantId    String
    serviceId   String
    date        DateTime
    timeSlot    String
    customerName String
    customerEmail String
    status      BookingStatus
    answers     Json?              // Dynamic form answers
}
```

### 2. No Vertical-Specific Tables

❌ Don't create: `RepairBrand`, `RepairDevice`, `AppointmentType`  
✅ Do use: `ServiceCategory` with metadata, `FieldDefinition` for dynamic fields

### 3. Backend Knows Verticals Only Through Config

The backend is vertical-agnostic. Tenant config specifies the vertical:

```typescript
// TenantConfig
{
    vertical: "REPAIR_SHOP" | "BARBER" | "CAR_WASH",
    bookingFlow: ["select_category", "select_service", "select_time", "contact"],
    terminology: { "service": "Reparatie", "booking": "Afspraak" },
}
```

## 7.3 Frontend Design Principles

### 1. No Skin System, No VMs

Each vertical gets its own frontend project. Frontends call backend APIs directly.

```typescript
// ✅ Direct API calls in components
const { data: services } = useSWR('/api/services');

// ❌ No VM indirection
// const vm = useServicesVM();
```

### 2. Shared UI Components via NPM Package (Optional)

If you find yourself duplicating Button, Card, Modal across frontends, extract to a shared package:

```
/packages/
  /ui-components             # @yourcompany/ui
  /api-client                # @yourcompany/api (typed API client)
```

But start WITHOUT shared packages. Extract only when you have proven duplication.

### 3. Each Frontend Is Independently Deployable

```bash
# Build and deploy just the barbershop frontend
cd frontends/barbershop
npm run build
npm run deploy
```

No shared deployment, no skin registry, no coordination required.

## 7.4 What to Keep from Current Architecture

| Keep | Reason |
|------|--------|
| `@TenantId()` decorator pattern | Clean, enforced tenant scoping |
| NestJS module structure | Well-organized, testable |
| Prisma ORM | Type-safe, good DX |
| JWT + roles pattern | Simple, effective auth |
| Feature flags per tenant | Allows plan-based feature gating |
| TenantConfig for branding | Works well for styling |

## 7.5 What to Redesign from Scratch

| Change | From | To |
|--------|------|-----|
| Data model | Repair* + generic | Generic only |
| Frontend architecture | Skin system + VMs | Separate projects |
| UI customization | Skin abstraction | Different frontend projects |
| Page ownership | Skin contract | Per-project freedom |

## 7.6 Summary: "Done Right" for V1

1. **Backend**: Single generic schema, vertical-agnostic, multi-tenant
2. **Frontend(s)**: One Next.js app per client/vertical
3. **Shared code**: Only if proven duplication (not preemptive)
4. **No VM layer**: Components call APIs directly
5. **No skin registry**: Each frontend is self-contained
6. **Extensibility**: Via backend config (booking flow, terminology, fields), not frontend abstraction

---

## Appendix: File References

- [Prisma Schema](../backend/prisma/schema.prisma) - 1798 lines
- [SkinContract.ts](../frontend/src/core/skin/SkinContract.ts) - VM interfaces
- [SkinRegistry.ts](../frontend/src/core/skin/SkinRegistry.ts) - Skin registration
- [Documentation.md](../documentation.md) - Existing API docs (1040 lines)
- [Skin System Docs](../docs/skins/) - How to add skins

---

*Document generated as part of ServicePulse Architecture Retrospective, January 2026*
