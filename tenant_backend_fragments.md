# TENANT BACKEND API DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Tenant-scoped backend API (public frontend + admin panel)  
> **Source**: Direct code analysis  
> **Constraints**: Contract-oriented, no inference, mark unknowns

---

## TENANT BACKEND — Tenant Configuration API

### Scope
- Covers: `tenant.controller.ts` (public endpoints only)
- Does NOT cover: OWNER-only endpoints (documented separately)

### Responsibilities
1. Provide public tenant configuration from Host header
2. Provide tenant feature flags
3. Provide tenant UI configuration

### Routes & Endpoints

| Method | Path | Auth | Public | Purpose |
|--------|------|------|--------|---------|
| GET | `/tenant/config` | None | Yes | Get current tenant configuration |
| GET | `/tenant/context` | None | Yes | Get full tenant context object |
| GET | `/tenant/features` | None | Yes | Get tenant feature flags |
| GET | `/tenant/ui-config` | None | Yes | Get UI configuration (labels, marquee) |

### Tenant Isolation Mechanism
- Tenant resolved from `req.tenantId` (set by middleware from Host header)
- If no tenant context, returns defaults or null

### Default Feature Flags (when no tenant)
```typescript
{
    ecommerceEnabled: true,
    repairsEnabled: true,
    ticketsEnabled: true,
    invoicingEnabled: true,
    inventoryEnabled: true,
    analyticsEnabled: true,
}
```

### Default UI Config (when no tenant)
- Returns `uiConfigService.getVerticalDefaults('REPAIR_SHOP')`

### Data Access
- `TenantService.getPublicConfig(tenantId)` — UNKNOWN query
- `TenantFeaturesService.getFeatures(tenantId)` — UNKNOWN query
- `UIConfigService.getPublicUIConfig(tenantId)` — UNKNOWN query

### Unknown / External Dependencies
- `TenantService` implementation — UNKNOWN
- `UIConfigService` implementation — UNKNOWN
- `TenantFeaturesService` — from `owner` module — UNKNOWN
- Tenant middleware that sets `req.tenantId` — UNKNOWN

---

## TENANT BACKEND — Repairs Catalog API

### Scope
- Covers: `repairs.controller.ts`
- Does NOT cover: RepairsService implementation, database schema

### Responsibilities
1. Serve repair catalog (device types, brands, devices, services)
2. CRUD for repair catalog entities (admin)
3. Import from JSON (admin)

### Routes & Endpoints

#### Public Endpoints (No Auth)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/repairs/device-types` | Get all active device types |
| GET | `/repairs/device-types/:slug` | Get device type with brands |
| GET | `/repairs/brands` | Get brands (optional: `?deviceType=`) |
| GET | `/repairs/brands/:slug` | Get brand with devices |
| GET | `/repairs/devices` | Get devices (optional: `?brand=`) |
| GET | `/repairs/devices/:slug` | Get device with services |
| GET | `/repairs/services/:deviceSlug` | Get services for device |
| GET | `/repairs/service-types` | Get all service types |

#### Admin Endpoints (JWT only, NO RolesGuard)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/repairs/admin/device-types` | JWT | Create device type |
| PUT | `/repairs/admin/device-types/:id` | JWT | Update device type |
| DELETE | `/repairs/admin/device-types/:id` | JWT | Delete device type |
| POST | `/repairs/admin/brands` | JWT | Create brand |
| PUT | `/repairs/admin/brands/:id` | JWT | Update brand |
| DELETE | `/repairs/admin/brands/:id` | JWT | Delete brand |
| POST | `/repairs/admin/devices` | JWT | Create device |
| PUT | `/repairs/admin/devices/:id` | JWT | Update device |
| DELETE | `/repairs/admin/devices/:id` | JWT | Delete device |
| POST | `/repairs/admin/service-types` | JWT | Create service type |
| PUT | `/repairs/admin/service-types/:id` | JWT | Update service type |
| DELETE | `/repairs/admin/service-types/:id` | JWT | Delete service type |
| POST | `/repairs/admin/device-services` | JWT | Create device-service pricing |
| PUT | `/repairs/admin/device-services/:id` | JWT | Update pricing |
| DELETE | `/repairs/admin/device-services/:id` | JWT | Delete pricing |
| POST | `/repairs/admin/import` | JWT | Import from JSON |

### Authorization & Guards

**⚠️ Security Observation**:
- Admin endpoints use only `@UseGuards(JwtAuthGuard)`
- No `RolesGuard` applied
- Any authenticated user (CUSTOMER, STAFF, ADMIN) can access admin endpoints

### Tenant Isolation Mechanism
- **NOT VISIBLE**: No `@TenantId()` decorator used
- Tenant scoping may be in service layer — UNKNOWN

### DTOs Referenced
- `CreateDeviceTypeDto` — UNKNOWN structure
- `CreateBrandDto` — UNKNOWN structure
- `CreateRepairDeviceDto` — UNKNOWN structure
- `CreateServiceTypeDto` — UNKNOWN structure
- `CreateDeviceServiceDto` — UNKNOWN structure

### Unknown / External Dependencies
- `RepairsService` implementation — UNKNOWN
- Data model relationships — UNKNOWN
- Whether repairs are tenant-scoped — UNKNOWN from controller

---

## TENANT BACKEND — Support Tickets API

### Scope
- Covers: `tickets.controller.ts`
- Does NOT cover: TicketsService, Socket.io, real-time updates

### Responsibilities
1. Public ticket creation and message submission
2. Session-based ticket retrieval
3. Admin ticket management

### Routes & Endpoints

#### Public Endpoints (No Auth)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/tickets` | Create support ticket |
| GET | `/tickets/session/:sessionId` | Get tickets by session ID |
| GET | `/tickets/case/:caseId` | Get ticket by case ID |
| POST | `/tickets/:id/messages` | Add message to ticket |

#### Admin Endpoints

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/tickets` | JWT | ADMIN, STAFF | List all tickets |
| GET | `/tickets/:id` | JWT | ADMIN, STAFF | Get ticket by ID |
| PATCH | `/tickets/:id` | JWT | ADMIN, STAFF | Update ticket status |
| DELETE | `/tickets/:id` | JWT | ADMIN | Delete closed ticket |

### Authorization & Guards

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)  // or ADMIN only for delete
```

**Role Distinctions**:
- ADMIN + STAFF: list, view, update
- ADMIN only: delete

### Tenant Isolation Mechanism
- All endpoints use `@TenantId() tenantId: string`
- Service calls include `tenantId` as first parameter

### Query Parameters

| Endpoint | Parameters |
|----------|------------|
| GET `/tickets` | `status` (enum: TicketStatus) |

### DTOs Referenced
- `CreateTicketDto` — UNKNOWN structure
- `AddMessageDto` — UNKNOWN structure
- `UpdateTicketDto` — UNKNOWN structure
- `TicketStatus` — enum, values UNKNOWN

### Invariants
1. Tickets identified by session ID OR case ID
2. Public message submission allowed (no auth)

### Unknown / External Dependencies
- `TicketsService` implementation — UNKNOWN
- `TicketStatus` enum values — UNKNOWN
- Socket.io integration — UNKNOWN

---

## TENANT BACKEND — Discounts API

### Scope
- Covers: `discounts.controller.ts`
- Does NOT cover: DiscountsService, checkout integration

### Responsibilities
1. Public discount code validation
2. Admin discount CRUD

### Routes & Endpoints

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| POST | `/discounts/validate` | None | — | Validate discount code |
| POST | `/discounts` | JWT | ADMIN | Create discount |
| GET | `/discounts` | JWT | ADMIN | List all discounts |
| GET | `/discounts/:id` | JWT | ADMIN | Get discount |
| PATCH | `/discounts/:id` | JWT | ADMIN | Update discount |
| DELETE | `/discounts/:id` | JWT | ADMIN | Delete discount |

### Authorization & Guards

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
```

**Role Distinctions**: ADMIN only (STAFF cannot manage discounts)

### Tenant Isolation Mechanism
- All endpoints use `@TenantId() tenantId: string`
- Service calls include `tenantId`

### DTOs Referenced
- `CreateDiscountDto` — UNKNOWN structure
- `UpdateDiscountDto` — UNKNOWN structure
- `ValidateDiscountDto` — UNKNOWN structure

### Unknown / External Dependencies
- `DiscountsService` implementation — UNKNOWN
- Discount types (percentage, fixed) — UNKNOWN
- Usage tracking logic — UNKNOWN

---

## TENANT BACKEND — Categories API

### Scope
- Covers: `categories.controller.ts`
- Does NOT cover: CategoriesService, product relationships

### Responsibilities
1. Public category listing
2. Admin category CRUD

### Routes & Endpoints

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/categories` | None | — | List all categories |
| GET | `/categories/:idOrSlug` | None | — | Get by ID or slug |
| POST | `/categories` | JWT | ADMIN | Create category |
| PUT | `/categories/:id` | JWT | ADMIN | Update category |
| DELETE | `/categories/:id` | JWT | ADMIN | Delete category |

### Authorization & Guards

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
```

**Role Distinctions**: ADMIN only

### Tenant Isolation Mechanism
- All endpoints use `@TenantId() tenantId: string`
- Service calls include `tenantId`

### Request Body (Create)
```typescript
{ 
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;  // Hierarchical categories
}
```

### Request Body (Update)
```typescript
{
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
}
```

### Lookup Logic
- UUID pattern detection for ID vs slug lookup
- Pattern: `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

### Unknown / External Dependencies
- `CategoriesService` implementation — UNKNOWN
- Product-category relationship — UNKNOWN

---

## TENANT BACKEND — Authentication API

### Scope
- Covers: `auth.controller.ts`
- Does NOT cover: AuthService, JWT strategy, password hashing

### Responsibilities
1. Customer registration and login
2. Admin and owner login
3. Email verification and password reset
4. Google OAuth flow
5. Session management (cookies)
6. Impersonation exchange

### Routes & Endpoints

#### Public Auth Endpoints

| Method | Path | Throttle | Purpose |
|--------|------|----------|---------|
| POST | `/auth/register` | 10/hour | Register customer |
| POST | `/auth/login` | 5/15min | Customer login |
| POST | `/auth/admin-login` | 3/15min | Admin login (tenantId=null) |
| POST | `/auth/owner-login` | 3/15min | Owner login (sets cookie) |
| POST | `/auth/logout` | — | Clear auth cookie |
| POST | `/auth/verify-email` | — | Verify email token |
| POST | `/auth/resend-verification` | — | Resend verification |
| POST | `/auth/forgot-password` | 3/hour | Request reset email |
| POST | `/auth/reset-password` | — | Reset with token |
| GET | `/auth/google` | — | Initiate Google OAuth |
| GET | `/auth/google/callback` | — | Handle OAuth callback |
| POST | `/auth/exchange` | — | Exchange handoff code |
| POST | `/auth/impersonate/exchange` | — | Impersonation handoff |

#### Protected Endpoints

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/auth/me` | JWT | Get current user |

### Throttle Configuration

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 10 | 1 hour |
| `/auth/login` | 5 | 15 minutes |
| `/auth/admin-login` | 3 | 15 minutes |
| `/auth/owner-login` | 3 | 15 minutes |
| `/auth/forgot-password` | 3 | 1 hour |

### Cookie Configuration
```typescript
{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // or true for tunnel
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
}
```

### Tenant Isolation Mechanism
- Customer auth uses `@TenantId() tenantId: string`
- Admin/owner login ignores tenant context (uses null)
- Token/handoff lookups are global

### OAuth Flow
1. Frontend redirects to `/auth/google?tenant=domain&returnUrl=/path`
2. Backend creates state, redirects to Google
3. Google callback at `/auth/google/callback`
4. Backend creates handoff code, redirects to tenant domain
5. Frontend calls `/auth/exchange` with code to get cookie

### Impersonation Flow
1. Owner initiates impersonation via owner API
2. Handoff code created with tenant/user info
3. Frontend calls `/auth/impersonate/exchange`
4. JWT includes `isImpersonating: true, impersonatedBy: ownerId`

### DTOs Referenced
- `RegisterDto` — UNKNOWN structure
- `LoginDto` — UNKNOWN structure
- `AuthResponseDto` — UNKNOWN structure
- `ForgotPasswordDto` — UNKNOWN structure
- `ResetPasswordDto` — UNKNOWN structure
- `VerifyEmailDto` — UNKNOWN structure
- `ResendVerificationDto` — UNKNOWN structure
- `MessageResponseDto` — UNKNOWN structure

### Side Effects
- Email sending for verification and password reset — via `AuthService`

### Unknown / External Dependencies
- `AuthService` implementation — UNKNOWN
- `GoogleOAuthService` implementation — UNKNOWN
- `OwnerService.getImpersonationHandoff()` — UNKNOWN
- Email service — UNKNOWN
- JWT secret configuration — UNKNOWN

---

## SUMMARY — Route Count by Controller

| Controller | Public | Admin (Protected) | Total |
|------------|--------|-------------------|-------|
| Tenant | 4 | 0 (8 OWNER) | 4 |
| Repairs | 8 | 16 | 24 |
| Tickets | 4 | 5 | 9 |
| Discounts | 1 | 5 | 6 |
| Categories | 2 | 3 | 5 |
| Auth | 12 | 1 | 13 |
| **Total** | **31** | **30** | **61** |

---

## SUMMARY — Guard Patterns Observed

| Pattern | Controllers Using |
|---------|-------------------|
| No guards (public) | All controllers (public endpoints) |
| `JwtAuthGuard` only | Repairs (admin) |
| `JwtAuthGuard + RolesGuard + @Roles(ADMIN)` | Discounts, Categories |
| `JwtAuthGuard + RolesGuard + @Roles(ADMIN, STAFF)` | Tickets |
| `AuthGuard('jwt')` (passport style) | Auth, some controllers |

---

## SECURITY OBSERVATIONS

### Missing Role Guards
- `RepairsController` admin endpoints use only JWT guard
- Any authenticated user can modify repair catalog

### Consistent Tenant Scoping
- Most controllers use `@TenantId()` decorator
- `RepairsController` does NOT use tenant decorator — unclear if tenant-scoped

### Throttling Applied to Auth
- Login/register endpoints protected from brute force
- Admin login more restrictive (3 attempts/15min)

---

*End of Tenant Backend API Documentation Fragments*
