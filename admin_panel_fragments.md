# ADMIN PANEL DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Tenant Admin Panel ONLY (ADMIN/STAFF users)  
> **Source**: Direct code analysis  
> **Constraints**: No inference, no Owner Panel, mark unknowns

---

## ADMIN FRONTEND — Authentication & Authorization

### Scope
- Covers: `useAdmin.ts`, `admin-layout.tsx` auth logic
- Does NOT cover: Backend JWT validation, Owner Panel access, CUSTOMER role behavior

### Responsibilities
1. Validates JWT from `localStorage.adminAccessToken`
2. Decodes JWT payload to extract role
3. Enforces ADMIN or STAFF role requirement
4. Redirects to `/admin/login` on auth failure
5. Provides logout functionality

### Hooks

#### `useAdminAuth(): UseAdminAuthReturn`

**State Exposed**:
| Property | Type | Description |
|----------|------|-------------|
| `isAuthenticated` | `boolean` | Auth check passed |
| `isLoading` | `boolean` | Auth check in progress |
| `user` | `AdminUser \| null` | Username and role |
| `logout` | `() => void` | Clear tokens and redirect |

**AdminUser Type**:
```typescript
interface AdminUser {
    username: string;
    role: 'ADMIN' | 'STAFF';
}
```

### Role Constraints

**Visible in code**:
- JWT payload `role` must be `"ADMIN"` or `"STAFF"` to access any admin page
- If role is neither, user is redirected to `/admin/login?error=unauthorized`
- No visible distinction between ADMIN and STAFF in layout navigation

**NOT visible in code**:
- Per-route permission differences
- Backend role enforcement per endpoint
- ADMIN-only vs STAFF-allowed operations

### localStorage Keys Used

| Key | Purpose |
|-----|---------|
| `adminAccessToken` | JWT token for admin API calls |
| `adminAuth` | JSON object with username for display |
| `accessToken` | Also cleared on logout (legacy?) |

### UI Invariants
1. Login page (`/admin/login`) skips auth check
2. Until auth check completes, spinner is shown
3. If not authenticated, component returns `null` (no flash of content)

### Unknown / External Dependencies
- `removeToken()` from `@/lib/api` — implementation UNKNOWN
- JWT token issuance — backend UNKNOWN
- `api` from `@/lib/api` — used for `AuthResponse`, type UNKNOWN

---

## ADMIN FRONTEND — Layout & Navigation

### Scope
- Covers: `admin-layout.tsx`, `AdminSidebar`, `AdminLayout`
- Does NOT cover: Individual page implementations

### Responsibilities
1. Renders collapsible sidebar with feature-flag-gated navigation
2. Authenticates user before rendering children
3. Polls for new orders every 15 seconds
4. Displays new order notifications with sound

### Components

| Component | Purpose |
|-----------|---------|
| `AdminLayout` | Main layout wrapper with auth guard, sidebar, order notifications |
| `AdminSidebar` | Collapsible navigation sidebar with sections |

### Feature Flags Used

**Explicitly checked in `getNavigationSections()`**:

| Flag | Source | Navigation Effect |
|------|--------|-------------------|
| `ecommerceEnabled` | `useFeatures()` | Shows: Bestellingen, Terugbetalingen, Producten, Galerij, Kortingscodes, Banners, Verzending |
| `repairsEnabled` | `useFeatures()` | Shows: Afspraken, Prijzen & Services, Toestellen Beheren |
| `ticketsEnabled` | `useFeatures()` | Shows: Support Tickets |
| `invoicingEnabled` | `useFeatures()` | Shows: Facturen |
| `inventoryEnabled` | `useFeatures()` | Shows: Voorraadbeheer |

### Navigation Structure

| Section | Items (when all features enabled) |
|---------|-----------------------------------|
| (No title) | Dashboard |
| Verkoop | Bestellingen, Terugbetalingen, Producten, Galerij |
| Reparaties | Afspraken, Prijzen & Services, Toestellen Beheren |
| Klanten | Gebruikers, Support Tickets, Marketing |
| Promoties | Kortingscodes, Banners |
| Logistiek | Voorraadbeheer, Verzending |
| Systeem | Facturen, Instellingen, Export Data, Activiteitenlog |

**UI Invariant**: "Admin should never see a tab they cannot open" (comment in code)

### Order Notification Polling

**Behavior**:
- Polls `/api/orders/admin/all` every 15 seconds
- Compares order IDs to detect new orders
- On new order: shows toast notification, plays sound (if enabled)
- Clicking notification navigates to `/admin/orders/{id}`

**NOT polled on first load** (prevents false notifications on page refresh)

### Mutations & Side Effects

| Action | Endpoint | Method |
|--------|----------|--------|
| Order polling | `/api/orders/admin/all` | GET |
| Logout | (Local only) | - |

### Unknown / External Dependencies
- `useFeatures()` hook — imported from `@/contexts/FeatureContext`, implementation UNKNOWN
- Feature flag default values — UNKNOWN
- Backend feature flag source — UNKNOWN

---

## ADMIN FRONTEND — Admin API Client

### Scope
- Covers: `adminApi.ts`
- Does NOT cover: Individual hook usage, Owner API

### Responsibilities
1. Provides centralized authenticated fetch wrapper
2. Manages admin token storage
3. Defines typed entity interfaces for admin entities

### Functions

#### `adminFetch<T>(endpoint, options): Promise<T>`
- Adds Authorization header from `adminAccessToken`
- Includes credentials
- Parses JSON response
- Throws `AdminApiError` on non-OK response
- Returns `undefined` on 204 No Content

#### `adminApi` Object Methods

**Generic CRUD**:
| Method | Action |
|--------|--------|
| `getAll<T>(endpoint)` | GET endpoint |
| `getOne<T>(endpoint, id)` | GET endpoint/:id |
| `create<T>(endpoint, data)` | POST endpoint |
| `update<T>(endpoint, id, data)` | PATCH endpoint/:id |
| `delete(endpoint, id)` | DELETE endpoint/:id |

**Domain-Specific**:

| Domain | Methods | Endpoints |
|--------|---------|-----------|
| `orders` | `getAll`, `getOne`, `updateStatus`, `bulkUpdateStatus` | `/api/orders/admin/*` |
| `users` | `getAll`, `getOne`, `updateRole`, `toggleVip`, `updateNotes`, `resetPassword` | `/api/users/admin/*` |
| `appointments` | `getAll`, `getOne`, `update`, `delete` | `/api/appointments/*` |
| `discounts` | `getAll`, `create`, `update`, `delete` | `/api/discounts/*` |
| `refunds` | `getAll`, `process`, `reject` | `/api/refunds/admin/*` |
| `auditLogs` | `getAll` | `/api/audit-logs` |

### Entity Types Defined

```typescript
interface AdminOrder {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    createdAt: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    fulfillmentType?: string;
    paidAt?: string;
    items: { productName: string; quantity: number; unitPrice: number }[];
}

interface AdminUser {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    role: 'CUSTOMER' | 'STAFF' | 'ADMIN';
    isActive: boolean;
    isOnline: boolean;
    isVip: boolean;
    totalSpent: number | string;
    lastActiveAt: string | null;
    createdAt: string;
    orderCount: number;
    adminNotes?: string | null;
}

interface AdminAppointment {
    id: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    deviceBrand: string;
    deviceModel: string;
    repairType: string;
    problemDescription?: string;
    damageImageUrl?: string;
    appointmentDate: string;
    timeSlot: string;
    status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
    priority: 'NORMAL' | 'URGENT' | 'VIP';
    adminNotes?: string;
    repairDuration?: number;
    createdAt: string;
}

interface AdminDiscount {
    id: string;
    code: string;
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
    minOrderValue?: number;
    maxUses?: number;
    usedCount: number;
    isActive: boolean;
    expiresAt?: string;
    createdAt: string;
}

interface AdminRefund {
    id: string;
    orderId: string;
    amount: number;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
    createdAt: string;
    order?: AdminOrder;
}

interface AdminAuditLog {
    id: string;
    action: string;
    entityType: string;
    entityId: string;
    userId: string;
    details?: Record<string, unknown>;
    createdAt: string;
    user?: { name: string; email: string };
}
```

### Unknown / External Dependencies
- Actual backend response shapes — may differ from types
- Error handling by consuming hooks — varies

---

## ADMIN FRONTEND — Orders Module

### Scope
- Covers: `useOrders.ts`
- Does NOT cover: Order detail page, order creation

### Responsibilities
1. Fetches and displays order list
2. Real-time polling for new orders (15s)
3. Filtering by status and search query
4. Bulk order selection and status updates
5. Print shipping labels

### Hooks

#### `useOrders(): UseOrdersReturn`

**State Exposed**:
| Property | Type | Description |
|----------|------|-------------|
| `orders` | `OrderListItem[]` | All orders |
| `filteredOrders` | `OrderListItem[]` | After search/status filter |
| `newOrderIds` | `Set<string>` | Recently arrived order IDs (30s highlight) |
| `notification` | `OrderListItem \| null` | Newest order for toast |
| `isLoading` | `boolean` | Initial load |
| `isRefreshing` | `boolean` | Manual refresh |
| `isBulkUpdating` | `boolean` | Bulk action in progress |
| `searchQuery` | `string` | Search filter |
| `statusFilter` | `string` | From URL `?status=` |
| `soundEnabled` | `boolean` | Notification sound on/off |
| `selectedOrders` | `Set<string>` | Selected order IDs |
| `bulkStatus` | `string` | Target status for bulk update |
| `stats` | Object | Aggregated counts and revenue |

**Stats Object**:
```typescript
{
    pendingCount: number;
    processingCount: number;
    paidCount: number;
    todaysOrders: number;
    todaysRevenue: number;  // Excludes CANCELLED
    statusCounts: Record<string, number>;
}
```

**Actions**:
| Function | API Call | Side Effect |
|----------|----------|-------------|
| `refresh()` | GET `/api/orders/admin/all` | Refetch orders |
| `handleBulkStatusUpdate()` | PATCH `/api/orders/bulk/status` | Update selected orders |
| `handlePrintLabels()` | POST `/api/orders/bulk/labels` | Open print window |
| `dismissNotification()` | - | Clear toast |

### Status Configurations

```typescript
const ORDER_STATUS_CONFIGS = {
    PENDING: { label: 'In afwachting', color: 'text-yellow-600' },
    PAID: { label: 'Betaald', color: 'text-blue-600' },
    PROCESSING: { label: 'Verwerken', color: 'text-blue-600' },
    SHIPPED: { label: 'Verzonden', color: 'text-purple-600' },
    DELIVERED: { label: 'Afgeleverd', color: 'text-green-600' },
    CANCELLED: { label: 'Geannuleerd', color: 'text-red-600' },
    REFUNDED: { label: 'Terugbetaald', color: 'text-orange-600' },
};
```

### Mutations & Side Effects

| Mutation | Endpoint | Method | Body |
|----------|----------|--------|------|
| Bulk status | `/api/orders/bulk/status` | PATCH | `{ orderIds, status }` |
| Print labels | `/api/orders/bulk/labels` | POST | `{ orderIds }` |

### UI Invariants
1. Orders sorted by `createdAt` descending (newest first)
2. New order highlight clears after 30 seconds
3. Sound only plays for orders arriving after initial load
4. Search matches: orderNumber, customerName, customerEmail

### Unknown / External Dependencies
- Order detail fields (full order vs list item) — partial
- Actual label printing format defined in response — shape shown in inline HTML

---

## ADMIN FRONTEND — Tickets Module

### Scope
- Covers: `useTickets.ts`
- Does NOT cover: Real-time socket updates (admin-side), ticket creation (admin-side)

### Responsibilities
1. Fetches admin ticket list
2. Filtering by status and search query
3. Selecting and viewing ticket details
4. Sending admin replies
5. Updating ticket status

### Hooks

#### `useTickets(): UseTicketsReturn`

**State Exposed**:
| Property | Type | Description |
|----------|------|-------------|
| `tickets` | `Ticket[]` | All tickets |
| `filteredTickets` | `Ticket[]` | After filters |
| `selectedTicket` | `Ticket \| null` | Currently selected |
| `isLoading` | `boolean` | Fetch in progress |
| `isSending` | `boolean` | Reply in progress |
| `searchQuery` | `string` | Search filter |
| `statusFilter` | `string` | Status filter |

**Actions**:
| Function | API Call | Returns |
|----------|----------|---------|
| `refresh()` | GET `/api/tickets` | void |
| `selectTicket(ticket)` | - | void |
| `sendReply(id, content, attachments?)` | POST `/api/tickets/{id}/reply` | boolean |
| `updateTicketStatus(id, status)` | PATCH `/api/tickets/{id}` | boolean |
| `closeTicket(id)` | (calls updateTicketStatus) | boolean |

### Types

```typescript
interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    customerName: string;
    customerEmail: string;
    createdAt: string;
    updatedAt: string;
    messages: TicketMessage[];
}

interface TicketMessage {
    id: string;
    content: string;
    isAdmin: boolean;
    createdAt: string;
    attachments?: string[];
}
```

### Status Configurations

```typescript
const TICKET_STATUS_CONFIGS = {
    OPEN: { label: 'Open', color: 'text-blue-600', bg: 'bg-blue-100' },
    IN_PROGRESS: { label: 'In behandeling', color: 'text-yellow-600' },
    RESOLVED: { label: 'Opgelost', color: 'text-green-600' },
    CLOSED: { label: 'Gesloten', color: 'text-zinc-600' },
};

const TICKET_PRIORITY_CONFIGS = {
    LOW: { label: 'Laag', color: 'text-zinc-500' },
    MEDIUM: { label: 'Normaal', color: 'text-blue-500' },
    HIGH: { label: 'Hoog', color: 'text-orange-500' },
    URGENT: { label: 'Urgent', color: 'text-red-500' },
};
```

### Role Constraints
- No ADMIN vs STAFF distinction visible in this hook
- All actions available to any authenticated user

### UI Invariants
1. Search matches: ticketNumber, subject, customerName
2. After reply or status update, tickets list is refetched
3. Sending returns boolean for success/failure handling

---

## ADMIN FRONTEND — Admin Pages Structure

### Scope
- Covers: Directory listing of `/app/admin/`
- Does NOT cover: Page implementations (not read)

### 20 Admin Routes

| Route | Purpose (inferred from name) |
|-------|------------------------------|
| `/admin` | Dashboard (page.tsx) |
| `/admin/appointments` | Appointment management |
| `/admin/audit-logs` | Activity log viewing |
| `/admin/banners` | Promotional banner CRUD |
| `/admin/devices` | Device catalog management |
| `/admin/discounts` | Coupon code management |
| `/admin/export` | Data export tools |
| `/admin/gallery` | Image asset library |
| `/admin/inventory` | Stock management |
| `/admin/invoice` | Invoice creation/management |
| `/admin/login` | Admin login page |
| `/admin/marketing` | Email campaigns |
| `/admin/orders` | Order list |
| `/admin/orders/[id]` | Order detail (dynamic) |
| `/admin/products` | Product list |
| `/admin/products/[id]` | Product edit (dynamic) |
| `/admin/products/new` | Product creation |
| `/admin/products/new-ai` | AI-assisted product creation |
| `/admin/refunds` | Refund processing |
| `/admin/repairs` | Repair service pricing |
| `/admin/settings` | Tenant settings |
| `/admin/shipping` | Shipping zone management |
| `/admin/tickets` | Support ticket management |
| `/admin/users` | User management |

### Unknown / External Dependencies
- Page implementations — NOT READ
- Route guards per page — UNKNOWN
- Feature flag enforcement per page — UNKNOWN

---

## SUMMARY — Feature Flags in Admin Panel

| Flag | Source | Effect |
|------|--------|--------|
| `ecommerceEnabled` | `useFeatures()` | Gates Verkoop + Promoties + Logistiek sections |
| `repairsEnabled` | `useFeatures()` | Gates Reparaties section |
| `ticketsEnabled` | `useFeatures()` | Gates Support Tickets nav item |
| `invoicingEnabled` | `useFeatures()` | Gates Facturen nav item |
| `inventoryEnabled` | `useFeatures()` | Gates Voorraadbeheer nav item |

---

## SUMMARY — Admin API Endpoints Used

| Category | Endpoint | Methods |
|----------|----------|---------|
| Orders | `/api/orders/admin/all` | GET |
| Orders | `/api/orders/admin/{id}` | GET |
| Orders | `/api/orders/admin/{id}/status` | PATCH |
| Orders | `/api/orders/bulk/status` | PATCH |
| Orders | `/api/orders/bulk/labels` | POST |
| Users | `/api/users/admin` | GET |
| Users | `/api/users/admin/{id}` | GET |
| Users | `/api/users/admin/{id}/role` | PATCH |
| Users | `/api/users/admin/{id}/vip` | PATCH |
| Users | `/api/users/admin/{id}/notes` | PATCH |
| Auth | `/api/auth/admin-reset-password` | POST |
| Appointments | `/api/appointments/admin` | GET |
| Appointments | `/api/appointments/admin/{id}` | GET |
| Appointments | `/api/appointments/{id}` | PATCH, DELETE |
| Discounts | `/api/discounts` | GET, POST |
| Discounts | `/api/discounts/{id}` | PATCH, DELETE |
| Refunds | `/api/refunds/admin` | GET |
| Refunds | `/api/refunds/admin/{id}/process` | POST |
| Refunds | `/api/refunds/admin/{id}/reject` | POST |
| Tickets | `/api/tickets` | GET |
| Tickets | `/api/tickets/{id}` | PATCH |
| Tickets | `/api/tickets/{id}/reply` | POST |
| Audit | `/api/audit-logs` | GET |

---

## SUMMARY — localStorage Keys Used in Admin

| Key | Purpose |
|-----|---------|
| `adminAccessToken` | JWT for admin API authentication |
| `adminAuth` | JSON with username for display |
| `accessToken` | Cleared on logout (legacy compatibility) |

---

*End of Admin Panel Documentation Fragments*
