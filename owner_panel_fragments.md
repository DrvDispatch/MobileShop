# OWNER PANEL DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Platform Owner Panel (OWNER role only)  
> **Source**: Direct code analysis  
> **Constraints**: Platform-contract level, zero assumptions, mark unknowns

---

## OWNER PANEL — Authorization Guard

### Scope
- Covers: `owner.guard.ts`
- Does NOT cover: JWT strategy, token generation

### Responsibilities
1. Enforce OWNER-only access to all Owner Panel endpoints

### Guard Implementation

```typescript
canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
        throw new ForbiddenException('Authentication required');
    }

    // Must be OWNER role with null tenantId
    if (user.role !== 'OWNER') {
        throw new ForbiddenException('Owner access required');
    }

    if (user.tenantId !== null && user.tenantId !== undefined) {
        throw new ForbiddenException('Platform-level access required');
    }

    return true;
}
```

### Authorization Requirements

| Condition | Required Value | Error Message |
|-----------|---------------|---------------|
| `user` exists | truthy | "Authentication required" |
| `user.role` | `'OWNER'` | "Owner access required" |
| `user.tenantId` | `null` or `undefined` | "Platform-level access required" |

### Safety Boundaries
- OWNER users MUST have `tenantId = null` (platform-level access)
- Users with any `tenantId` value are rejected even if role is OWNER
- This prevents a tenant-scoped admin from escalating to owner access

### Invariants
1. All owner endpoints MUST use `OwnerGuard`
2. OWNER role alone is insufficient — `tenantId` MUST be null
3. This is the ONLY guard allowing platform-wide data access

---

## OWNER PANEL — Controller Overview

### Scope
- Covers: `owner.controller.ts`
- Does NOT cover: OwnerService implementation details, database schema

### Responsibilities
1. Tenant lifecycle management
2. Domain management with Cloudflare automation
3. Tenant configuration updates
4. Feature flag control
5. User impersonation
6. User management across tenants
7. Seed data operations
8. Platform stats and audit logs

### Controller Guards

```typescript
@Controller('owner')
@UseGuards(JwtAuthGuard, OwnerGuard)
```

**All endpoints require**: JWT + OWNER role + tenantId=null

### Routes by Category

#### Tenant Lifecycle (7 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| GET | `/owner/tenants` | List all tenants | No |
| POST | `/owner/tenants` | Create tenant | Yes |
| GET | `/owner/tenants/:id` | Get tenant | No |
| PATCH | `/owner/tenants/:id` | Update tenant | Yes |
| POST | `/owner/tenants/:id/activate` | Activate tenant | Yes |
| POST | `/owner/tenants/:id/suspend` | Suspend tenant | Yes |
| POST | `/owner/tenants/:id/archive` | Archive (soft delete) | Yes |

#### Domain Management (4 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| POST | `/owner/tenants/:id/domains` | Add domain | Yes |
| POST | `/owner/tenants/:id/domains/:domainId/verify` | Verify domain | Yes |
| POST | `/owner/tenants/:id/domains/:domainId/set-primary` | Set primary | Yes |
| DELETE | `/owner/tenants/:id/domains/:domainId` | Remove domain | Yes |

#### Cloudflare Automation (4 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| POST | `.../:domainId/cloudflare/setup` | Create CF zone | Yes |
| POST | `.../:domainId/cloudflare/configure` | Configure DNS when active | Conditional |
| GET | `.../:domainId/cloudflare/status` | Get CF status | No |
| GET | `/owner/cloudflare/verify` | Verify API connection | No |

#### Configuration (1 endpoint)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| PATCH | `/owner/tenants/:id/config` | Update tenant config | Yes |

#### Feature Control (4 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| GET | `/owner/tenants/:id/features` | Get features | No |
| GET | `/owner/tenants/:id/features/summary` | Get grouped summary | No |
| PATCH | `/owner/tenants/:id/features` | Update features | Yes |
| POST | `/owner/tenants/:id/features/apply-plan` | Apply plan template | Yes |

#### User Management (4 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| GET | `/owner/tenants/:id/users` | List tenant users | No |
| POST | `/owner/tenants/:id/users` | Create user | Yes |
| PATCH | `/owner/tenants/:id/users/:userId/password` | Reset password | Yes |
| POST | `/owner/impersonate` | Start impersonation | Implicit |

#### Seeding Operations (7 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| POST | `/owner/tenants/:id/seed` | Seed repair catalog | Yes |
| POST | `/owner/tenants/:id/reseed` | Clear + reseed repairs | Yes |
| GET | `/owner/tenants/:id/seed-stats` | Get seeding stats | No |
| POST | `/owner/tenants/:id/products/seed` | Seed demo products | Yes |
| DELETE | `/owner/tenants/:id/products` | Clear all products | Yes |
| GET | `/owner/products/available-count` | Get seed product count | No |

#### Platform Stats & Audit (2 endpoints)

| Method | Path | Purpose | Logged |
|--------|------|---------|--------|
| GET | `/owner/stats` | Get platform stats | No |
| GET | `/owner/audit-logs` | Get owner audit logs | No |

### Total Endpoints: 33

---

## OWNER PANEL — Audit Logging

### Scope
- Covers: `logOwnerAction()` calls in controller
- Does NOT cover: Audit log storage or query implementation

### Logged Actions

| Action | Target Type | When |
|--------|-------------|------|
| `CREATE_TENANT` | TENANT | Tenant created |
| `UPDATE_TENANT` | TENANT | Tenant updated |
| `ACTIVATE_TENANT` | TENANT | Tenant activated |
| `SUSPEND_TENANT` | TENANT | Tenant suspended |
| `ARCHIVE_TENANT` | TENANT | Tenant archived |
| `ADD_DOMAIN` | DOMAIN | Domain added |
| `VERIFY_DOMAIN` | DOMAIN | Domain verified |
| `SET_PRIMARY_DOMAIN` | DOMAIN | Primary domain set |
| `REMOVE_DOMAIN` | DOMAIN | Domain removed |
| `CLOUDFLARE_SETUP_DOMAIN` | DOMAIN | CF zone created |
| `CLOUDFLARE_DNS_CONFIGURED` | DOMAIN | DNS configured (conditional) |
| `UPDATE_CONFIG` | CONFIG | Tenant config updated |
| `UPDATE_FEATURES` | TENANT | Features updated |
| `APPLY_PLAN_TEMPLATE` | TENANT | Plan applied |
| `CREATE_USER` | USER | User created |
| `RESET_PASSWORD` | USER | Password reset |
| `SEED_TENANT` | TENANT | Repair catalog seeded |
| `RESEED_TENANT` | TENANT | Repair catalog reseeded |
| `SEED_PRODUCTS` | TENANT | Products seeded |
| `CLEAR_PRODUCTS` | TENANT | Products cleared |

### Log Data Captured

```typescript
await this.ownerService.logOwnerAction(
    ownerId,           // req.user.sub or req.user.id
    action,            // Action name
    targetType,        // TENANT, DOMAIN, CONFIG, USER
    targetId,          // Entity ID
    details,           // Action-specific data
    ipAddress,         // req.ip
    userAgent          // req.headers['user-agent']
);
```

---

## OWNER PANEL — Feature Flags Management

### Scope
- Covers: `tenant-features.service.ts`
- Does NOT cover: How features are enforced in tenant frontends

### Responsibilities
1. Get/create feature flags per tenant
2. Update individual feature flags
3. Apply plan templates
4. Auto-seed repair catalog on feature enable

### Feature Flags (19 total)

| Category | Flag | Type | Default |
|----------|------|------|---------|
| E-Commerce | `ecommerceEnabled` | boolean | `true` |
| E-Commerce | `refurbishedGrading` | boolean | `true` |
| E-Commerce | `wishlistEnabled` | boolean | `true` |
| E-Commerce | `stockNotifications` | boolean | `true` |
| E-Commerce | `couponsEnabled` | boolean | `true` |
| Repairs | `repairsEnabled` | boolean | `true` |
| Repairs | `quoteOnRequest` | boolean | `false` |
| Repairs | `mailInRepairs` | boolean | `false` |
| Repairs | `walkInQueue` | boolean | `false` |
| Tickets | `ticketsEnabled` | boolean | `true` |
| Tickets | `liveChatWidget` | boolean | `true` |
| Invoicing | `invoicingEnabled` | boolean | `true` |
| Invoicing | `vatCalculation` | boolean | `true` |
| Invoicing | `pdfGeneration` | boolean | `true` |
| Inventory | `inventoryEnabled` | boolean | `true` |
| Inventory | `advancedInventory` | boolean | `false` |
| Team | `employeeManagement` | boolean | `false` |
| Team | `maxAdminUsers` | number | `1` |
| Analytics | `analyticsEnabled` | boolean | `true` |

### Plan Templates

| Plan | Key Flags |
|------|-----------|
| `starter` | ecommerce=false, repairs=true, tickets=false, maxAdminUsers=1 |
| `professional` | All main features=true, maxAdminUsers=3 |
| `enterprise` | All features=true, advancedInventory=true, employeeManagement=true, maxAdminUsers=10 |

### Auto-Seeding Behavior

When `repairsEnabled` is set to `true` for first time:
1. Checks if repair catalog already exists
2. If no devices exist, triggers background seeding
3. Seeding runs non-blocking (background)

---

## OWNER PANEL — Impersonation

### Scope
- Covers: Impersonation endpoint in controller
- Does NOT cover: Handoff exchange mechanism (documented in auth fragments)

### Responsibilities
1. Generate secure handoff code for tenant user impersonation
2. Provide redirect URL to tenant domain

### Impersonation Flow

```
1. Owner selects tenant + user in Owner Panel UI
2. POST /owner/impersonate { tenantId, userId }
3. Backend returns { handoffCode, redirectUrl, user }
4. Owner Panel redirects to tenant domain with code
5. Tenant frontend exchanges code for session (see auth fragments)
```

### Response Type

```typescript
interface ImpersonationResponse {
    handoffCode: string;
    redirectUrl: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
    };
}
```

### Data Captured
- `ownerId`: Who is impersonating
- `ipAddress`: Source IP
- `userAgent`: Browser/client info

### Safety Notes
- Handoff code is one-time use
- Code is validated against tenant on exchange
- Cross-tenant impersonation blocked by exchange endpoint

---

## OWNER PANEL — Configuration Updates

### Scope
- Covers: `UpdateConfigDto` in controller
- Does NOT cover: TenantConfig storage schema

### Updatable Fields

| Field | Type | Category |
|-------|------|----------|
| `shopName` | string | Branding |
| `logoUrl` | string | Branding |
| `primaryColor` | string | Branding |
| `secondaryColor` | string | Branding |
| `accentColor` | string | Branding |
| `borderRadius` | string | Branding |
| `darkMode` | boolean | Branding |
| `email` | string | Contact |
| `phone` | string | Contact |
| `whatsappNumber` | string | Contact |
| `locale` | string | Locale |
| `currency` | string | Locale |
| `timezone` | string | Locale |
| `features` | Record | Features (legacy?) |
| `companyName` | string | Invoice |
| `vatNumber` | string | Invoice |
| `address` | object | Invoice |
| `bankAccount` | string | Invoice |
| `bankName` | string | Invoice |
| `invoicePrefix` | string | Invoice |
| `invoiceFooter` | string | Invoice |
| `website` | string | Invoice |
| `openingHours` | Record | Business |
| `timeSlots` | string[] | Business |
| `closedDays` | number[] | Business |

### Address Structure

```typescript
{
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}
```

### Opening Hours Structure

```typescript
Record<string, { open: string; close: string } | null>
```

---

## OWNER PANEL — Frontend API Client

### Scope
- Covers: `owner-api.ts`
- Does NOT cover: apiClient implementation, token storage

### API Methods (35 total)

#### Authentication
- `login(email, password)`
- `logout()`

#### Tenants (7 methods)
- `getTenants()`, `getTenant(id)`, `createTenant(data)`
- `updateTenant(id, data)`, `activateTenant(id)`
- `suspendTenant(id)`, `archiveTenant(id)`

#### Domains (4 methods)
- `addDomain(tenantId, data)`, `verifyDomain(tenantId, domainId)`
- `setPrimaryDomain(tenantId, domainId)`, `removeDomain(tenantId, domainId)`

#### Cloudflare (4 methods)
- `setupDomainCloudflare(tenantId, domainId)`
- `checkAndConfigureDomain(tenantId, domainId)`
- `getDomainCloudflareStatus(tenantId, domainId)`
- `verifyCloudflareConnection()`

#### Config (1 method)
- `updateConfig(tenantId, data)`

#### Stats & Audit (2 methods)
- `getStats()`, `getAuditLogs(params?)`

#### Impersonation (2 methods)
- `getTenantUsers(tenantId)`, `impersonateUser(tenantId, userId)`

#### Features (3 methods)
- `getFeatures(tenantId)`, `updateFeatures(tenantId, features)`
- `applyPlanTemplate(tenantId, planName)`

#### User Management (2 methods)
- `createTenantUser(tenantId, data)`, `resetUserPassword(tenantId, userId, password?)`

#### CMS (8 methods)
- `getHomepage(tenantId)`, `updateHomepage(tenantId, data)`
- `listPages(tenantId)`, `getPage(tenantId, pageId)`
- `createPage(tenantId, data)`, `updatePage(tenantId, pageId, data)`
- `publishPage(...)`, `unpublishPage(...)`, `deletePage(...)`, `seedPages(...)`

#### Seeding (5 methods)
- `seedTenant(tenantId)`, `reseedTenant(tenantId)`, `getSeedStats(tenantId)`
- `getAvailableProductsCount()`, `seedProducts(tenantId, count)`
- `clearProducts(tenantId)`

---

## SUMMARY — Data Authority

| Area | Owner Can Read | Owner Can Write |
|------|----------------|-----------------|
| Tenant records | All tenants | Create, update, lifecycle |
| Tenant domains | All domains | Add, remove, verify, set primary |
| Tenant config | All configs | Update any field |
| Feature flags | All flags | Update any flag, apply plans |
| Tenant users | All users per tenant | Create, reset password |
| Repair catalog | Stats only | Seed, reseed, clear |
| Products | Count only | Seed, clear |
| Audit logs | All owner actions | — |
| Platform stats | Aggregate stats | — |

---

## SUMMARY — Tenant Isolation Guarantees

### What Owner Panel CAN Do
- Access ALL tenant data (read)
- Modify ANY tenant configuration
- Create users in ANY tenant
- Impersonate ANY tenant user
- Suspend/archive ANY tenant

### What Owner Panel CANNOT Do
- Nothing prevents these actions — Owner has full authority
- No per-tenant restrictions on Owner

### Isolation Enforcement
- `OwnerGuard` ensures only `role=OWNER` + `tenantId=null` can access
- Users with `tenantId` values CANNOT access owner endpoints
- Cross-contamination is prevented by requiring platform-level access

---

## SECURITY OBSERVATIONS

### Full Platform Authority
- Owner has unrestricted access to all tenant data
- No approval workflows for destructive actions
- Single point of control for entire platform

### Audit Trail
- Most mutations are logged with IP and user agent
- Read operations are NOT logged

### Impersonation Controls
- Handoff code pattern provides some security
- Code is scoped to specific tenant
- Cross-tenant impersonation blocked at exchange

---

## Unknown / External Dependencies

- `OwnerService` implementation — UNKNOWN
- `TenantSeederService` implementation — UNKNOWN
- `apiClient` implementation in frontend — UNKNOWN
- Cloudflare API integration — UNKNOWN
- How audit logs are stored — UNKNOWN
- Database schema for tenants/features — UNKNOWN

---

*End of Owner Panel Documentation Fragments*
