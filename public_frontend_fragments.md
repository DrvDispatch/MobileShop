# PUBLIC FRONTEND DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Customer-facing frontend ONLY  
> **Source**: Direct code analysis  
> **Constraints**: No inference, no admin, mark unknowns

---

## PUBLIC FRONTEND — Tenant Configuration Provider

### Scope
- Covers: `TenantProvider.tsx`, `tenant-types.ts`
- Does NOT cover: How backend resolves tenant, any admin configuration, TenantConfig database schema

### Responsibilities
1. Fetches public tenant configuration from `/api/tenant/config` on mount
2. Applies theme CSS variables to `document.documentElement`
3. Sets document title from `branding.shopName`
4. Provides `PublicTenantConfig` via React Context

### Components

| Component | Purpose |
|-----------|---------|
| `TenantProvider` | Context provider, fetches config, applies theme, renders children |
| `TenantLoadingSkeleton` | Spinner shown during config fetch |
| `TenantErrorDisplay` | Error UI with retry button |

### Hooks

#### `useTenant(): PublicTenantConfig`
- **Returns**: Full `PublicTenantConfig` object
- **Throws**: Error if called outside `TenantProvider`
- **Side Effects**: None

#### `useTenantOptional(): PublicTenantConfig | null`
- **Returns**: Config or `null` if not loaded
- **Throws**: Never
- **Side Effects**: None

### Data Access

**API Called**:
```
GET /api/tenant/config
Headers: Accept: application/json
Credentials: include
```

**Validation**:
- Response must contain `tenantId` field or throws error

### Tenant Dependencies

**TenantConfig fields explicitly used in code**:

| Field Path | Type | Usage |
|------------|------|-------|
| `branding.primaryColor` | `string` | Sets CSS `--primary-color`, `--brand-color` |
| `branding.secondaryColor` | `string \| null` | Sets CSS `--secondary-color` |
| `branding.accentColor` | `string \| null` | Sets CSS `--accent-color` |
| `branding.borderRadius` | `string` | Sets CSS `--radius` |
| `branding.darkMode` | `boolean` | Adds/removes `.dark` class on `<html>` |
| `branding.shopName` | `string` | Sets `document.title` |

### UI Invariants
1. Children NEVER render until config fetch completes
2. Loading state shows spinner, never blank screen
3. Error state provides retry mechanism
4. Theme CSS variables applied synchronously after fetch

### Unknown / External Dependencies
- `DEFAULT_UI_CONFIG` imported from `@/lib/useUIConfig` — structure UNKNOWN
- Backend tenant resolution logic — UNKNOWN
- How `tenantId` is determined from Host header — UNKNOWN

---

## PUBLIC FRONTEND — PublicTenantConfig Type Specification

### Scope
- Covers: `tenant-types.ts` interface definitions
- Does NOT cover: Backend response transformation, defaults applied by backend

### Responsibilities
Defines TypeScript interfaces for public tenant data.

### Types

```typescript
interface PublicTenantConfig {
    tenantId: string;
    branding: TenantBranding;
    contact: TenantContact;
    locale: TenantLocale;
    business: TenantBusiness;
    integrations: TenantIntegrations;
    seo: TenantSeo;
}

interface TenantBranding {
    shopName: string;
    logoUrl: string | null;
    primaryColor: string;
    secondaryColor: string | null;
    accentColor: string | null;
    borderRadius: string;
    darkMode: boolean;
}

interface TenantContact {
    email: string | null;
    phone: string | null;
    whatsappNumber: string | null;
    address: Record<string, unknown> | null;  // Shape UNKNOWN
}

interface TenantLocale {
    locale: string;
    currency: string;
    currencySymbol: string;
}

interface TenantBusiness {
    openingHours: Record<string, unknown> | null;  // Shape UNKNOWN
    timeSlots: unknown[] | null;                   // Element type UNKNOWN
    closedDays: unknown[] | null;                  // Element type UNKNOWN
}

interface TenantIntegrations {
    googleAnalyticsId: string | null;
    cookiebotId: string | null;
}

interface TenantSeo {
    title: string | null;
    description: string | null;
}
```

### Unknown / External Dependencies
- Shape of `address` object — UNKNOWN
- Shape of `openingHours` object — UNKNOWN
- Element types of `timeSlots` and `closedDays` arrays — UNKNOWN

---

## PUBLIC FRONTEND — Booking Flow State Machine

### Scope
- Covers: `useBookingFlow.ts`, `bookingApi.ts`
- Does NOT cover: Backend controllers, repair catalog management, appointment scheduling logic

### Responsibilities
1. Manages 6-step repair booking wizard state
2. Fetches repair catalog data (device types → brands → devices → services)
3. Fetches available time slots for selected date
4. Submits appointment creation request

### Hooks

#### `useBookingFlow(): UseBookingFlowReturn`

**State Exposed**:
| Property | Type | Description |
|----------|------|-------------|
| `step` | `BookingStep` (enum 0-5) | Current wizard step |
| `selections.deviceType` | `DeviceType \| null` | Selected device type |
| `selections.brand` | `Brand \| null` | Selected brand |
| `selections.device` | `Device \| null` | Selected device |
| `selections.repair` | `RepairService \| null` | Selected service |
| `selections.date` | `Date \| null` | Selected date |
| `selections.timeSlot` | `string` | Selected time slot |
| `customerData` | `CustomerData` | Form fields: name, email, phone, notes |
| `deviceTypes` | `DeviceType[]` | Available device types |
| `brands` | `Brand[]` | Available brands for selected type |
| `devices` | `Device[]` | Available devices for selected brand |
| `repairs` | `RepairService[]` | Available services for selected device |
| `availableSlots` | `string[]` | Time slots for selected date |
| `availableDates` | `Date[]` | Next 14 days excluding closed days |
| `canGoNext` | `boolean` | Validation for current step |
| `isLoading` | `boolean` | Data fetch in progress |
| `isSubmitting` | `boolean` | Appointment creation in progress |
| `isSuccess` | `boolean` | Appointment created successfully |
| `error` | `string \| null` | Error message |

**Actions Exposed**:
| Function | Side Effect |
|----------|-------------|
| `selectDeviceType(dt)` | Sets type, fetches brands, advances step |
| `selectBrand(b)` | Sets brand, fetches devices, advances step |
| `selectDevice(d)` | Sets device, fetches services, advances step |
| `selectRepair(r)` | Sets repair, advances step |
| `selectDate(date)` | Sets date, resets slot, fetches available slots |
| `selectTimeSlot(slot)` | Sets slot |
| `goBack()` | Decrements step |
| `goNext()` | Increments step if valid |
| `submit()` | Creates appointment via API |
| `reset()` | Resets all state to initial |

### Data Access

**APIs Called** (from `bookingApi.ts`):

| Function | Endpoint | Method |
|----------|----------|--------|
| `fetchDeviceTypes()` | `/api/repairs/device-types` | GET |
| `fetchBrands(slug)` | `/api/repairs/brands?deviceType={slug}` | GET |
| `fetchDevices(slug)` | `/api/repairs/devices?brand={slug}` | GET |
| `fetchRepairServices(slug)` | `/api/repairs/services/{slug}` | GET |
| `fetchAvailableSlots(date)` | `/api/appointments/available-slots?date={YYYY-MM-DD}` | GET |
| `createAppointment(data)` | `/api/appointments/authenticated` | POST |

**Fallback behavior**:
- If `/api/appointments/authenticated` returns 401, falls back to `/api/appointments`
- If device types fetch fails, returns hardcoded fallback: `[Smartphone, Tablet]`
- If slots fetch fails, returns `DEFAULT_TIME_SLOTS`

### Tenant Dependencies
- `closedDays` — passed to `getAvailableDates()` but **defaults to `[0]` (Sunday)** if not provided
- TenantConfig fields are NOT directly referenced in these files

### UI Invariants
1. Step can only advance when current step validation passes
2. Downstream selections reset when upstream selection changes
3. Time slot resets when date changes
4. Submit requires: device, repair, date, slot, name, email, phone

### Unknown / External Dependencies
- `DEFAULT_TIME_SLOTS = ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]` — hardcoded
- Backend appointment slot calculation — UNKNOWN
- Auth token storage mechanism — uses `localStorage.getItem('accessToken')`

---

## PUBLIC FRONTEND — Chat Widget (Support Tickets)

### Scope
- Covers: `useChatWidget.ts`, `FeatureAwareChatWidget.tsx`
- Does NOT cover: Backend ticket controller, Socket.io server implementation

### Responsibilities
1. Manages Socket.io connection to `/tickets` namespace
2. Loads customer's tickets by session ID
3. Creates new tickets
4. Sends messages with file attachments
5. Receives real-time ticket updates

### Components

#### `FeatureAwareChatWidget`
- Conditionally renders `ChatWidget` based on feature flags
- **Requirement 1**: `ticketsEnabled === true`
- **Requirement 2**: `liveChatWidget === true`
- If either is false, returns `null` (component does not mount)

### Hooks

#### `useChatWidget(): UseChatWidgetReturn`

**State Exposed**:
| Property | Type | Description |
|----------|------|-------------|
| `isOpen` | `boolean` | Widget expanded state |
| `view` | `ChatView` | Current view: "list" \| "new" \| "chat" — type imported from `./types` |
| `isConnected` | `boolean` | Socket.io connection status |
| `isLoading` | `boolean` | Ticket fetch in progress |
| `tickets` | `Ticket[]` | All customer tickets |
| `activeTicket` | `Ticket \| null` | Currently viewed ticket |
| `activeTickets` | `Ticket[]` | Tickets with status OPEN or IN_PROGRESS |
| `closedTickets` | `Ticket[]` | Tickets with status RESOLVED or CLOSED |
| `hasActiveTickets` | `boolean` | `activeTickets.length > 0` |
| `form` | `NewTicketForm` | New ticket form state |
| `isFormValid` | `boolean` | Form validation result |
| `input` | `ChatInputState` | Message input state |
| `canSend` | `boolean` | Can send message |
| `categories` | `DEFAULT_CATEGORIES` | Ticket categories — value UNKNOWN |

**Actions Exposed**:
| Function | Side Effect |
|----------|-------------|
| `setIsOpen(bool)` | Toggle widget |
| `setView(view)` | Change view |
| `loadTickets()` | Fetch tickets from API |
| `createTicket()` | POST new ticket |
| `sendMessage()` | POST message to active ticket |
| `openTicket(ticket)` | Set active ticket, change view to chat |
| `handleFileUpload(files)` | Upload files to `/api/upload` |
| `removeAttachment(index)` | Remove pending attachment |
| `cancelUpload()` | Abort ongoing upload |
| `goBack()` | Return to list view |

### Data Access

**APIs Called**:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/tickets/session/{sessionId}` | GET | Load customer's tickets |
| `/api/tickets` | POST | Create new ticket |
| `/api/tickets/{id}/messages` | POST | Send message |
| `/api/upload` | POST | Upload file attachment |

**Socket.io Events**:

| Event | Direction | Payload |
|-------|-----------|---------|
| `join:session` | Emit | `{ sessionId }` |
| `ticket:message` | Receive | `{ ticketId, message }` |
| `ticket:update` | Receive | `{ ticketId, status? }` |

**Session Management**:
- Session ID stored in `localStorage.chat_session_id`
- Customer name stored in `localStorage.chat_customer_name`
- Customer email stored in `localStorage.chat_customer_email`

### Tenant Dependencies

**Feature flags explicitly checked**:
| Flag | Source | Purpose |
|------|--------|---------|
| `ticketsEnabled` | `useFeatures()` | Parent feature gate |
| `liveChatWidget` | `useFeatures()` | Sub-feature gate |

### UI Invariants
1. Widget MUST NOT mount if either feature flag is false
2. Socket connection only established if NOT on `/admin/*` route
3. Most recent active ticket auto-opens when widget opens
4. Messages scroll to bottom on new message

### Unknown / External Dependencies
- `useFeatures()` hook implementation — UNKNOWN (imported from `@/contexts/FeatureContext`)
- `ChatView`, `Ticket`, `Message`, `Attachment`, `NewTicketForm`, `ChatInputState` types — imported from `./types`, shapes UNKNOWN
- `DEFAULT_CATEGORIES` — imported from `./types`, value UNKNOWN
- Socket.io server URL from `process.env.NEXT_PUBLIC_API_URL` or defaults to `http://localhost:3001`

---

## PUBLIC FRONTEND — Cart Store (Zustand)

### Scope
- Covers: `store/cart.ts`
- Does NOT cover: How products are added to cart, checkout process

### Responsibilities
1. Manages shopping cart items in client-side state
2. Persists cart to `localStorage` under key `cart-storage`

### Types

```typescript
interface CartItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image?: string;
    slug?: string;
}
```

### Hooks

#### `useCartStore()`

**State**:
| Property | Type | Description |
|----------|------|-------------|
| `items` | `CartItem[]` | Current cart items |

**Actions**:
| Function | Behavior |
|----------|----------|
| `addItem(item, quantity?)` | Adds item or increments existing quantity |
| `removeItem(id)` | Removes item by ID |
| `updateQuantity(id, quantity)` | Updates quantity; removes if ≤ 0 |
| `clearCart()` | Empties cart |
| `getTotal()` | Returns sum of `price * quantity` |
| `getItemCount()` | Returns sum of quantities |

### Tenant Dependencies
None. Cart is tenant-agnostic in implementation.

### UI Invariants
1. Cart persists across page reloads via localStorage
2. Quantity ≤ 0 results in item removal

### Unknown / External Dependencies
- Zustand persist middleware — handles serialization

---

## PUBLIC FRONTEND — Checkout Flow

### Scope
- Covers: `useCheckout.ts`
- Does NOT cover: `checkoutApi.ts` implementation, Stripe backend integration

### Responsibilities
1. Manages checkout form state (contact, address)
2. Validates and applies coupon codes
3. Calculates order totals
4. Submits checkout to create Stripe session
5. Prefills form from authenticated user

### Hooks

#### `useCheckout(): UseCheckoutReturn`

**State Exposed**:
| Property | Type | Description |
|----------|------|-------------|
| `items` | `CartItem[]` | Cart items from store |
| `isEmpty` | `boolean` | Cart empty check |
| `formData` | `CheckoutFormState` | Contact + address fields |
| `phonePrefix` | `string` | Default: "+32" |
| `isLoggedIn` | `boolean` | User authenticated |
| `couponCode` | `string` | Input value |
| `appliedDiscount` | `DiscountValidation \| null` | Validated discount — type UNKNOWN |
| `couponError` | `string \| null` | Validation error |
| `couponLoading` | `boolean` | Validation in progress |
| `subtotal` | `number` | Pre-discount total |
| `shipping` | `number` | Shipping cost |
| `discount` | `number` | Discount amount |
| `total` | `number` | Final total |
| `isLoading` | `boolean` | Checkout in progress |
| `error` | `string \| null` | Checkout error |

**Form Fields** (CheckoutFormState):
```typescript
{
    email: string;
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;  // Default: "BE"
}
```

**Actions Exposed**:
| Function | Side Effect |
|----------|-------------|
| `setFormData(setter)` | Update form fields |
| `setPhonePrefix(prefix)` | Update phone prefix |
| `setCouponCode(code)` | Update coupon input |
| `validateCouponCode()` | Validates coupon via API |
| `removeCoupon()` | Clears applied discount |
| `submit()` | Creates checkout session, redirects to Stripe |

### Data Access

**APIs Called** (via `checkoutApi`):
| Function | Purpose |
|----------|---------|
| `api.getMe()` | Prefill user data (if authenticated) |
| `validateCoupon(code, subtotal, email?, productIds)` | Validate discount |
| `createCheckoutSession(data)` | Create Stripe session |

**Auth Check**:
- Uses `getToken()` from `../api` to check authentication
- If token exists, calls `api.getMe()` to prefill email and name

### Tenant Dependencies
None explicitly referenced in this file.

### UI Invariants
1. On successful checkout, browser redirects to `response.checkoutUrl`
2. Form prefilled from auth on mount (if logged in)
3. Coupon validation requires non-empty code

### Unknown / External Dependencies
- `COUNTRY_CODES` — imported from `checkoutApi`, value UNKNOWN
- `DiscountValidation` type — imported from `checkoutApi`, shape UNKNOWN
- `validateCoupon`, `createCheckoutSession`, `calculateTotals`, `buildCheckoutData` — implementations UNKNOWN
- `getToken`, `api` — imported from `../api`, implementation UNKNOWN

---

## PUBLIC FRONTEND — Storefront Components

### Scope
- Covers: Component file listing in `components/storefront/`
- Does NOT cover: Component implementations (not read)

### Components (7 files)

| File | Purpose (inferred from name) |
|------|------------------------------|
| `cart-drawer.tsx` | Slide-out cart panel |
| `category-tabs.tsx` | Category navigation tabs |
| `featured-products.tsx` | Featured products section |
| `filter-sidebar.tsx` | Product filter sidebar |
| `index.ts` | Module exports |
| `product-card.tsx` | Individual product card |
| `product-grid.tsx` | Product grid layout |

### Unknown / External Dependencies
- Component implementations — NOT READ
- Props, hooks used, tenant dependencies — UNKNOWN

---

## SUMMARY — Feature Flags Referenced in Public Frontend

| Flag | Source | Component |
|------|--------|-----------|
| `ticketsEnabled` | `useFeatures()` | `FeatureAwareChatWidget` |
| `liveChatWidget` | `useFeatures()` | `FeatureAwareChatWidget` |

---

## SUMMARY — localStorage Keys Used

| Key | Purpose |
|-----|---------|
| `cart-storage` | Zustand cart persistence |
| `chat_session_id` | Ticket session identifier |
| `chat_customer_name` | Customer name for tickets |
| `chat_customer_email` | Customer email for tickets |
| `accessToken` | JWT auth token (checked in booking flow) |

---

## SUMMARY — CSS Variables Set by TenantProvider

| CSS Variable | Source |
|--------------|--------|
| `--primary-color` | `branding.primaryColor` |
| `--brand-color` | `branding.primaryColor` |
| `--secondary-color` | `branding.secondaryColor` |
| `--accent-color` | `branding.accentColor` |
| `--radius` | `branding.borderRadius` |

---

*End of Documentation Fragments*
