# ADMIN BACKEND DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Tenant Admin Backend (ADMIN/STAFF accessible endpoints)  
> **Source**: Direct code analysis  
> **Constraints**: Security-conscious, no inference, mark unknowns

---

## ADMIN BACKEND — Authorization Architecture

### Scope
- Covers: `roles.guard.ts`, `roles.decorator.ts`, `tenant.decorator.ts`
- Does NOT cover: Platform Owner authorization, JWT strategy implementation

### Responsibilities
1. Defines `@Roles()` decorator to set required roles
2. Implements `RolesGuard` to enforce role requirements
3. Provides `@TenantId()` decorator to extract tenant context

### Authorization Components

#### `@Roles(...roles)` Decorator
```typescript
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
```
- Sets metadata on handler or class with required roles
- Accepts `UserRole` enum or string literals
- Applies at method or controller level

#### `RolesGuard` Implementation
```typescript
canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        context.getHandler(),
        context.getClass(),
    ]);

    if (!requiredRoles) {
        return true;  // No roles required = allow
    }

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user?.role === role);
}
```

**Behavior**:
- If no `@Roles()` decorator: returns `true` (allows all)
- Requires `user.role` to match ANY of the required roles
- Does NOT verify user belongs to current tenant (see Tenant Boundaries)

#### `@TenantId()` Decorator
```typescript
export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenantId;
    },
);
```

**Behavior**:
- Extracts `request.tenantId` set by tenant middleware
- Returns `string` tenant ID

#### `@CurrentTenant()` Decorator
```typescript
export const CurrentTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant;
    },
);
```

**Behavior**:
- Returns full `TenantContext` object

### Types

```typescript
type UserRole = 'ADMIN' | 'STAFF' | 'CUSTOMER';  // From Prisma enum

interface TenantContext {
    id: string;
    name: string;
    slug: string;
    status: string;
    config?: TenantConfig;
}

interface TenantConfig {
    shopName: string;
    logoUrl?: string;
    primaryColor: string;
    email?: string;
    phone?: string;
    whatsappNumber?: string;
    locale: string;
    currency: string;
    currencySymbol: string;
    timezone: string;
    openingHours?: Record<string, { open: string; close: string }>;
    timeSlots?: string[];
    closedDays: number[];
    companyName?: string;
    vatNumber?: string;
    invoicePrefix: string;
    googleAnalyticsId?: string;
    cookiebotId?: string;
    seoTitle?: string;
    seoDescription?: string;
}
```

### Invariants
1. `RolesGuard` only checks role, NOT tenant membership
2. Tenant scoping relies on services using `tenantId` parameter
3. No `@Roles()` = endpoint open to all authenticated users
4. Guard order matters: `AuthGuard('jwt')` MUST precede `RolesGuard`

### Unknown / External Dependencies
- Tenant middleware that sets `request.tenantId` — implementation UNKNOWN
- JWT strategy that sets `request.user` — implementation UNKNOWN
- How user's tenant membership is verified — UNKNOWN

---

## ADMIN BACKEND — Users Controller

### Scope
- Covers: `users.controller.ts`
- Does NOT cover: User service implementation, password hashing

### Responsibilities
1. User listing and detail retrieval
2. Admin/staff user creation
3. User updates (role, VIP, notes)
4. Admin password reset
5. Lifetime value recalculation

### Routes & Endpoints

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/users` | JWT | ADMIN | List users with search/pagination |
| GET | `/users/:id` | JWT | ADMIN | Get user with orders/appointments |
| POST | `/users/admin` | JWT | ADMIN | Create admin/staff user |
| PATCH | `/users/:id` | JWT | ADMIN | Update user |
| DELETE | `/users/:id` | JWT | ADMIN | Delete user |
| POST | `/users/:id/reset-password` | JWT | ADMIN | Admin reset password |
| PATCH | `/users/:id/vip` | JWT | ADMIN | Toggle VIP status |
| PATCH | `/users/:id/notes` | JWT | ADMIN | Update admin notes |
| POST | `/users/:id/recalculate-lifetime-value` | JWT | ADMIN | Recalculate LTV |

### Authorization & Guards

**Controller-level**: 
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
```

**Effect**: ALL routes require ADMIN role. STAFF cannot access.

### Tenant Boundaries
- All methods receive `@TenantId() tenantId: string`
- All service calls include `tenantId` as first parameter
- Cross-tenant query prevention: relies on service implementation

### DTOs Referenced
- `UpdateUserDto` — UNKNOWN structure
- `AdminResetPasswordDto` — contains `newPassword`
- `CreateAdminDto` — UNKNOWN structure

### Unknown / External Dependencies
- `UsersService` implementation — UNKNOWN
- How user deletion handles related data — UNKNOWN
- What "super admin only" means in comments (no code enforcement visible)

---

## ADMIN BACKEND — Orders Controller

### Scope
- Covers: `orders.controller.ts`
- Does NOT cover: Stripe integration details, order service implementation

### Responsibilities
1. Checkout session creation
2. Stripe webhook handling
3. Order retrieval (public and admin)
4. Order status updates (single and bulk)
5. Shipping label generation
6. Checkout redirect handling

### Routes & Endpoints

#### Public Endpoints (No Auth)
| Method | Path | Purpose |
|--------|------|---------|
| POST | `/orders/checkout` | Create Stripe checkout session |
| POST | `/orders/webhook` | Stripe webhook handler |
| GET | `/orders/by-session` | Get order by Stripe session ID |
| GET | `/orders/checkout-success` | Handle Stripe success redirect (302) |
| GET | `/orders/checkout-cancel` | Handle Stripe cancel redirect (302) |
| GET | `/orders/resolve-session/:sessionId` | Resolve order for redirect |
| GET | `/orders/my-orders` | Get orders by customer email |
| GET | `/orders/track/:orderNumber` | Track order by number |

#### Admin Endpoints (Bearer Token, no explicit role guard)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/orders/admin/all` | Get all orders |
| GET | `/orders/:id` | Get order by ID |
| PATCH | `/orders/:id` | Update order |
| GET | `/orders/:id/history` | Get order status history |
| PATCH | `/orders/bulk/status` | Bulk update status |
| POST | `/orders/bulk/labels` | Generate bulk labels |

### Authorization & Guards

**CRITICAL**: No `@UseGuards()` at controller or method level.

- `@ApiBearerAuth()` decorators are present but these are Swagger documentation only
- No actual JWT guard enforcement visible
- Admin endpoints rely on frontend to send token, but backend doesn't validate

**Security Note**: This controller may be missing authorization guards.

### Tenant Boundaries
- All endpoints except webhook use `@TenantId() tenantId`
- Webhook explicitly noted: "does NOT use @TenantId() - excluded from tenant middleware"
- Checkout success/cancel redirects do not scope to tenant

### Mutations & Side Effects

| Action | External Call |
|--------|---------------|
| `createCheckoutSession` | Stripe API |
| `handleStripeWebhook` | Processes Stripe events |
| `resolveOrderFromStripeSession` | Stripe API |

### Unknown / External Dependencies
- `OrdersService` implementation — UNKNOWN
- Stripe secret key configuration — UNKNOWN
- Webhook signature verification — implied but UNKNOWN
- Stock decrement on order — UNKNOWN

---

## ADMIN BACKEND — Products Controller

### Scope
- Covers: `products.controller.ts`
- Does NOT cover: Product service implementation, image handling

### Responsibilities
1. Product listing with filters (public)
2. Featured products (public)
3. Brand list (public)
4. Related products (public)
5. Product CRUD (admin)
6. CSV import/export (admin)

### Routes & Endpoints

#### Public Endpoints (No Auth)
| Method | Path | Purpose |
|--------|------|---------|
| GET | `/products` | List products with filters |
| GET | `/products/featured` | Get featured products |
| GET | `/products/brands` | Get all brands |
| GET | `/products/:id/related` | Get related products |
| GET | `/products/:idOrSlug` | Get product by ID or slug |

#### Admin Endpoints
| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| POST | `/products` | JWT | ADMIN, STAFF | Create product |
| PUT | `/products/:id` | JWT | ADMIN, STAFF | Update product |
| DELETE | `/products/:id` | JWT | ADMIN | Delete product |
| GET | `/products/admin/export` | JWT | ADMIN, STAFF | Export CSV |
| POST | `/products/admin/import` | JWT | ADMIN | Import CSV |

### Authorization & Guards

**Per-method guards**:
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)  // or just ADMIN for delete/import
```

**Role Distinctions**:
- ADMIN + STAFF: create, update, export
- ADMIN only: delete, import

### Tenant Boundaries
- All methods receive `@TenantId() tenantId: string`
- Service calls include `tenantId`

### Unknown / External Dependencies
- `ProductsService` — UNKNOWN
- `ProductImportService` — UNKNOWN
- `CreateProductDto`, `UpdateProductDto`, `ProductQueryDto` — UNKNOWN

---

## ADMIN BACKEND — Appointments Controller

### Scope
- Covers: `appointments.controller.ts`
- Does NOT cover: Appointment service implementation, slot calculation

### Responsibilities
1. Public booking (anonymous and authenticated)
2. Available slot retrieval
3. User's own appointments
4. Admin appointment management

### Routes & Endpoints

#### Public Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/appointments` | None | Book appointment (anonymous) |
| POST | `/appointments/authenticated` | JWT | Book with booker tracking |
| GET | `/appointments/available-slots` | None | Get available slots for date |
| GET | `/appointments/my` | JWT | Get own appointments |

#### Admin Endpoints
| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/appointments` | JWT | ADMIN, STAFF | List all appointments |
| GET | `/appointments/:id` | JWT | ADMIN, STAFF | Get appointment |
| PATCH | `/appointments/:id` | JWT | ADMIN, STAFF | Update appointment |
| DELETE | `/appointments/:id` | JWT | ADMIN, STAFF | Delete appointment |

### Authorization & Guards

**Admin methods**:
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
```

**Role Distinctions**: None — both ADMIN and STAFF have full access

### Tenant Boundaries
- All methods receive `@TenantId() tenantId: string`
- Authenticated booking extracts `bookerEmail` and `bookerName` from `req.user`

### Query Parameters

| Endpoint | Parameters |
|----------|------------|
| GET `/appointments` | `status`, `startDate`, `endDate` |
| GET `/appointments/available-slots` | `date` (YYYY-MM-DD) |

### Unknown / External Dependencies
- `AppointmentsService` — UNKNOWN
- `CreateAppointmentDto`, `UpdateAppointmentDto` — UNKNOWN
- `AppointmentStatus` enum values — UNKNOWN
- How slots are calculated — UNKNOWN

---

## SUMMARY — Role Requirements by Controller

| Controller | Controller-Level Role | Method-Level Variations |
|------------|----------------------|------------------------|
| `UsersController` | ADMIN | None — all ADMIN only |
| `OrdersController` | None | None — **NO GUARDS** |
| `ProductsController` | None | Per-method: ADMIN/STAFF (create/update/export), ADMIN (delete/import) |
| `AppointmentsController` | None | Per-method: ADMIN/STAFF (all admin ops) |

---

## SUMMARY — Guard Pattern

**Recommended pattern** (seen in users, products, appointments):
```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
```

**Order matters**:
1. `AuthGuard('jwt')` — validates JWT, populates `request.user`
2. `RolesGuard` — checks `user.role` against `@Roles()` metadata

---

## SUMMARY — Tenant Boundary Pattern

All admin controllers use:
```typescript
@TenantId() tenantId: string
```

Passed to all service methods as first parameter:
```typescript
return this.usersService.findAll(tenantId, { ... });
```

**Security Note**: Cross-tenant prevention relies on service layer implementations.  
Service layer queries should ALWAYS include `where: { tenantId }`.

---

## SECURITY OBSERVATIONS

### Missing Guards (Potential Issue)
- `OrdersController` has NO guards on admin endpoints
- `@ApiBearerAuth()` is documentation-only, does not enforce auth

### No STAFF Restrictions Visible
- STAFF can:
  - Create/update products
  - Update/delete appointments
  - Export products
- STAFF cannot:
  - Delete products
  - Import products
  - Any user management

### Tenant Isolation
- Relies entirely on service layer including `tenantId` in queries
- No guard-level tenant validation visible
- No check that authenticated user belongs to requested tenant

---

*End of Admin Backend Documentation Fragments*
