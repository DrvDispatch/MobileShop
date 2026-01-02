

1:
# ServicePulse Platform Documentation

> **Version**: 1.0  
> **Last Updated**: January 2026  
> **Status**: Production-Ready Multi-Tenant SaaS

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack Documentation](#2-tech-stack-documentation)
3. [Backend API Documentation](#3-backend-api-documentation)
4. [Frontend Core API](#4-frontend-core-api)
5. [TenantConfig Specification](#5-tenantconfig-specification)
6. [Owner Panel Documentation](#6-owner-panel-documentation)
7. [Skin System Documentation](#7-skin-system-documentation)
8. [Special Feature Playbook](#8-special-feature-playbook)
9. [AI Operating Rules](#9-ai-operating-rules)

---

# 1. Platform Overview

## What is ServicePulse?

ServicePulse is a **multi-tenant SaaS platform** designed for device repair shops, mobile phone retailers, and similar service businesses. It provides:

- **E-commerce**: Product catalog, cart, checkout with Stripe
- **Repair Booking**: Multi-step appointment scheduler
- **Ticketing System**: Customer support with real-time chat
- **Invoicing**: PDF generation, email delivery
- **Admin Panel**: Full business management
- **Owner Panel**: Platform-level tenant management

## Multi-Tenant Model

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM OWNER                          │
│              (servicespulse.com - Owner Panel)              │
└─────────────────────────┬───────────────────────────────────┘
                          │ Creates & Manages
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Tenant A │    │ Tenant B │    │ Tenant C │
    │ shop.com │    │ fix.nl   │    │ repair.be│
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
    ┌────▼────┐     ┌────▼────┐     ┌────▼────┐
    │  Users  │     │  Users  │     │  Users  │
    │  Orders │     │  Orders │     │  Orders │
    │  Data   │     │  Data   │     │  Data   │
    └─────────┘     └─────────┘     └─────────┘
```

**Isolation Strategy**: Every database entity has a `tenantId` column. All queries are automatically scoped.

## Request Flow: Domain → Tenant → Config

```
1. User visits: https://bikerepair.site/repair/book
                    │
2. TenantMiddleware extracts Host header: "bikerepair.site"
                    │
3. Query: TenantDomain WHERE domain = "bikerepair.site"
                    │
4. Load: Tenant + TenantConfig + TenantFeatures
                    │
5. Attach to request: req.tenantId, req.tenant
                    │
6. Controller uses @TenantId() decorator → scoped queries
                    │
7. Response includes tenant-specific branding/data
```

## User Roles

| Role | Access | App |
|------|--------|-----|
| `OWNER` | Platform-wide tenant management | Owner Panel (port 3000) |
| `ADMIN` | Tenant admin panel, full CRUD | Admin Panel (tenant domain) |
| `STAFF` | Limited admin (read + update) | Admin Panel |
| `CUSTOMER` | Public site, orders, tickets | Public Frontend (port 3002) |

## How TenantConfig Flows Through the System

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Owner Panel   │────▶│  Backend API    │────▶│    Database     │
│ (Config Form)   │     │ PATCH /config   │     │  TenantConfig   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│    Frontend     │◀────│ TenantProvider  │◀─────────────┘
│   (Components)  │     │  useTenant()    │  GET /tenant/config
└─────────────────┘     └─────────────────┘
```

---

# 2. Tech Stack Documentation

## Backend (NestJS)

### Framework
- **NestJS 10.x** with TypeScript
- **Prisma 5.x** ORM with PostgreSQL
- **JWT** authentication via `@nestjs/jwt`
- **Socket.io** for real-time ticket chat
- **PDFKit** for invoice generation
- **Nodemailer** for emails

### Module Structure
```
backend/src/modules/
├── appointments/    # Repair booking system
├── auth/           # JWT, OAuth, impersonation
├── email/          # Template-based email service
├── invoice/        # PDF generation + email
├── orders/         # Stripe checkout + webhooks
├── owner/          # Platform admin (OWNER only)
├── pages/          # CMS endpoints
├── settings/       # Tenant settings API
├── sms/            # SMS abstraction (Twilio ready)
├── tenant/         # Config + features API
├── tickets/        # Support system + Socket.io
└── ... (32 total modules)
```

### Tenant Isolation Strategy

```typescript
// Every controller uses:
@Controller('appointments')
export class AppointmentsController {
    @Post()
    create(@TenantId() tenantId: string, @Body() dto: CreateAppointmentDto) {
        return this.service.create(tenantId, dto);
    }
}

// Service queries are always scoped:
findAll(tenantId: string) {
    return this.prisma.appointment.findMany({
        where: { tenantId }  // ← Always filtered
    });
}
```

### Auth & Guards

| Guard | Purpose |
|-------|---------|
| `JwtAuthGuard` | Validates JWT token |
| `RolesGuard` | Checks `@Roles('ADMIN')` decorator |
| `OwnerGuard` | Ensures `user.role === 'OWNER'` |

### Feature Flags

Stored in `TenantFeature` table, queried via `TenantFeaturesService`:

```typescript
const features = await featuresService.getFeatures(tenantId);
if (!features.ticketsEnabled) {
    throw new ForbiddenException('Tickets disabled');
}
```

### Email Abstraction

```typescript
// email.service.ts
async sendOrderConfirmation(tenantId: string, order: Order) {
    const config = await this.getTenantConfig(tenantId);
    await this.send({
        to: order.email,
        subject: `Order Confirmed - ${config.shopName}`,
        template: 'order-confirmation',
        context: { order, config }
    });
}
```

### Invoice System (PDF + Email)

```typescript
// invoice.service.ts
async generateInvoice(id: string): Promise<Buffer> {
    const invoice = await this.findOne(id);
    const config = await this.getTenantConfig(invoice.tenantId);
    
    // PDFKit generates branded invoice
    const pdf = await this.pdfGenerator.create(invoice, {
        companyName: config.companyName,
        vatNumber: config.vatNumber,
        bankAccount: config.bankAccount,
        logoUrl: config.logoUrl,
    });
    
    return pdf;
}
```

---

## Frontend (Next.js)

### Framework
- **Next.js 14** with App Router
- **TypeScript** strict mode
- **TailwindCSS** for styling
- **Zustand** for cart state
- **Socket.io-client** for chat

### TenantProvider

```typescript
// lib/TenantProvider.tsx
export function TenantProvider({ children }) {
    const [tenant, setTenant] = useState<PublicTenantConfig | null>(null);
    
    useEffect(() => {
        fetch('/api/tenant/config')
            .then(res => res.json())
            .then(setTenant);
    }, []);
    
    return (
        <TenantContext.Provider value={tenant}>
            {children}
        </TenantContext.Provider>
    );
}

// Usage in any component:
export function Header() {
    const tenant = useTenant();
    return <h1>{tenant.branding.shopName}</h1>;
}
```

### Hooks Philosophy

All business logic lives in hooks, UI is purely presentational:

```
┌─────────────────────┐
│   useBookingFlow()  │  ← Business Logic
├─────────────────────┤
│ - step state        │
│ - selections        │
│ - validation        │
│ - API calls         │
└──────────┬──────────┘
           │ Returns state + actions
           ▼
┌─────────────────────┐
│   BookingPage.tsx   │  ← Pure UI
├─────────────────────┤
│ - Renders step UI   │
│ - Calls hook funcs  │
│ - No fetch() calls  │
└─────────────────────┘
```

---

# 3. Backend API Documentation

## Appointments Module

### POST /appointments
- **Purpose**: Book a new repair appointment (anonymous)
- **Auth**: None (public)
- **DTO Input**: `{ deviceType, brand, device, repairService, date, timeSlot, customerName, customerEmail, customerPhone, notes? }`
- **TenantConfig Used**: `timeSlots`, `closedDays`
- **Side Effects**: Email confirmation sent

### GET /appointments/available-slots?date=YYYY-MM-DD
- **Purpose**: Get available time slots for a date
- **Auth**: None
- **Returns**: `{ slots: string[], closedDays: number[] }`

### GET /appointments (Admin)
- **Auth**: JWT + ADMIN/STAFF role
- **Query**: `?status=PENDING&startDate=...&endDate=...`

### PATCH /appointments/:id (Admin)
- **Auth**: JWT + ADMIN/STAFF
- **DTO**: `{ status: 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' }`

---

## Tickets Module

### POST /tickets
- **Purpose**: Create support ticket
- **Auth**: None (public)
- **DTO**: `{ subject, message, customerName, customerEmail, sessionId, category? }`
- **Side Effects**: Email notification to admin

### GET /tickets/session/:sessionId
- **Purpose**: Get tickets for a browser session
- **Auth**: None

### POST /tickets/:id/messages
- **Purpose**: Add message to ticket
- **DTO**: `{ content, isAdmin? }`
- **Side Effects**: Socket.io broadcast, email if admin reply

### GET /tickets (Admin)
- **Auth**: JWT + ADMIN/STAFF

---

## Invoice Module

### POST /invoices
- **Purpose**: Create manual invoice
- **Auth**: JWT + ADMIN
- **DTO**: `{ type, customer, items[] }`

### GET /invoices/:id/pdf
- **Auth**: JWT + ADMIN
- **Returns**: PDF Buffer
- **TenantConfig Used**: All branding + company info

### POST /invoices/:id/email
- **Side Effects**: PDF generated and emailed

---

## Orders Module

### POST /orders/checkout
- **Purpose**: Create Stripe checkout session
- **DTO**: `{ items[], customer, discountId? }`
- **Returns**: `{ checkoutUrl, sessionId }`

### POST /orders/webhook
- **Purpose**: Handle Stripe webhooks
- **Side Effects**: Order created, confirmation email, invoice generated

---

## Auth Module

### POST /auth/login
- **DTO**: `{ email, password }`
- **Returns**: `{ accessToken, user }`

### POST /auth/owner-login
- **Purpose**: Owner panel authentication
- **Returns**: JWT with `role: 'OWNER'`

### GET /auth/me
- **Auth**: JWT required

---

## Tenant Module

### GET /tenant/config
- **Purpose**: Public tenant configuration
- **Returns**: `PublicTenantConfig`

### GET /tenant/features
- **Purpose**: Feature flags for frontend

---

## Owner Module

### GET /owner/tenants
- **Auth**: JWT + OWNER

### PATCH /owner/tenants/:id/config
- **Auth**: JWT + OWNER

### POST /owner/impersonate
- **DTO**: `{ tenantId, userId }`
- **Returns**: `{ handoffCode, redirectUrl }`

---

# 4. Frontend Core API

## useTenant / TenantProvider

```typescript
export function useTenant(): PublicTenantConfig;
export function useTenantOptional(): PublicTenantConfig | null;
```

**Purpose**: Access tenant configuration anywhere  
**Throws**: If used outside TenantProvider

---

## useBookingFlow()

**Purpose**: Complete state machine for repair booking wizard

**Returns**: `{ step, selections, deviceTypes, brands, devices, repairs, availableSlots, customerData, select, isLoading, isSubmitting, submit, reset }`

**TenantConfig Dependencies**: `business.timeSlots`, `business.closedDays`

---

## useCheckout()

**Purpose**: Cart checkout flow with Stripe

**Returns**: `{ items, formData, couponCode, appliedDiscount, subtotal, shipping, total, isLoading, submit }`

---

## useChatWidget()

**Purpose**: Real-time support chat with Socket.io

**Returns**: `{ isOpen, view, tickets, activeTicket, messages, sendMessage, openWidget, closeWidget }`

**TenantConfig Dependencies**: `contact.whatsappNumber`

---

## useTickets() (Admin)

**Purpose**: Admin ticket management

**Returns**: `{ tickets, filteredTickets, selectedTicket, sendReply, updateTicketStatus, closeTicket }`

---

# 5. TenantConfig Specification

## Complete Schema

| Field | Type | Owner Panel | Backend | Frontend | If Null |
|-------|------|-------------|---------|----------|---------|
| **shopName** | `String` | ✅ | invoice, email | Header | Required |
| **logoUrl** | `String?` | ✅ | invoice PDF | Header | Generic icon |
| **primaryColor** | `String` | ✅ | - | CSS | `#7c3aed` |
| **email** | `String?` | ✅ | email, invoice | Contact | Hidden |
| **phone** | `String?` | ✅ | invoice | Contact | Hidden |
| **whatsappNumber** | `String?` | ✅ | - | ChatWidget | Hidden |
| **address** | `Json?` | ✅ | invoice | Contact | Hidden |
| **openingHours** | `Json?` | ✅ | - | Contact | "Contact us" |
| **timeSlots** | `Json?` | ✅ | appointments | Booking | Default slots |
| **closedDays** | `Int[]` | ✅ | appointments | Booking | `[0]` |
| **companyName** | `String?` | ✅ | invoice | Invoice | shopName |
| **vatNumber** | `String?` | ✅ | invoice | Invoice | Hidden |
| **bankAccount** | `String?` | ✅ | invoice | Invoice | Hidden |
| **invoicePrefix** | `String` | ✅ | invoice | Invoice | `INV` |
| **website** | `String?` | ✅ | invoice | Invoice | Hidden |

## openingHours Format

```typescript
type OpeningHours = Record<
  'monday' | 'tuesday' | ... | 'sunday',
  { open: string; close: string } | null
>;
```

---

# 6. Owner Panel Documentation

## Config Sections

- **Branding**: Shop Name, Colors, Logo, Dark Mode
- **Contact**: Email, Phone, WhatsApp
- **Company**: Company Name, VAT, Address, Website
- **Invoice**: Prefix, Bank Account, Footer
- **Business Hours**: Per-day hours, Time Slots, Closed Days

## Update Flow

```
UI Form → ownerApi.updateConfig() → PATCH /owner/tenants/:id/config
    └── UpdateConfigDto validated → prisma.tenantConfig.upsert()
```

---

# 7. Skin System Documentation

> **Status**: Design Phase - Not Yet Implemented

## Structure
```
frontend/src/skins/
├── default/
│   ├── skin.config.ts
│   └── pages/
└── minimal/
    └── ...
```

## What Skins Cannot Do
- Direct API calls (use hooks)
- Modify TenantConfig
- Create new routes
- Use `any` type

---

# 8. Special Feature Playbook

## When to Add Feature Flags
1. Optional functionality
2. Pricing tiers
3. Beta features

## When to Extend TenantConfig
1. Branding/customization
2. Business settings
3. Integration IDs

## When to Reject Requests
1. Breaks tenant isolation
2. Hardcodes business logic
3. Uses `any` types

---

# 9. AI Operating Rules

## ❌ Never Use
- `any` type
- `// @ts-ignore`
- Hardcoded tenantId
- Direct fetch() in components
- Cross-tenant queries

## ✅ Always Use
- Strict TypeScript
- @TenantId() decorator
- Feature flag checks
- Existing hooks
- class-validator DTOs

## Follow Existing Patterns

| For | Copy From |
|-----|-----------|
| Controller | `appointments.controller.ts` |
| Service | `appointments.service.ts` |
| Hook | `useBookingFlow.ts` |
| PDF | `invoice.service.ts` |

## TenantConfig Access Pattern

```typescript
// ✅ Single canonical accessor
const tenant = useTenant();
const { shopName } = tenant.branding;
const { whatsappNumber } = tenant.contact;

// ❌ Don't create alternatives
const config = useSettings(); // Wrong
```

---

## Quick Reference

```
PORTS:
  Backend:      localhost:3001
  Owner Panel:  localhost:3000
  Frontend:     localhost:3002

OWNER CREDENTIALS (dev):
  Email:    owner@servicespulse.com
  Password: OwnerPass123!

ADD NEW CONFIG FIELD:
  1. Add to Prisma schema
  2. Run: npx prisma migrate dev
  3. Add to UpdateConfigDto
  4. Add to Owner Panel form
  5. Add to PublicTenantConfig if needed
  6. Document in this file
```


2:
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

### Resolved Dependencies (from code analysis)

**Backend Tenant Resolution** (from `tenant.middleware.ts`):
1. Extracts Host header from `x-forwarded-host` or `host`
2. Normalizes domain: lowercase, strips port, strips `www.` prefix
3. Queries `TenantDomain` table for matching domain
4. Loads `Tenant` + `TenantConfig` + `TenantFeature` 
5. Caches result for 5 minutes
6. Attaches to `req.tenantId`, `req.tenant`, `req.features`
7. Returns 404 if domain not found, 403 if SUSPENDED, 503 if ARCHIVED

**Skip Paths** (excluded from tenant resolution):
- `/owner/*`, `/api/owner/*`
- `/auth/owner-login`, `/auth/logout`, `/auth/google`
- `/orders/webhook`, `/orders/checkout-success`, `/orders/checkout-cancel`

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

### Resolved Types (from `tenant.middleware.ts`)

**address** object:
```typescript
{
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}
```

**openingHours** object:
```typescript
Record<string, { open: string; close: string } | null>
// Keys: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
// Example: { "monday": { "open": "09:00", "close": "18:00" }, "sunday": null }
```

**timeSlots** array:
```typescript
string[]  // Example: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
```

**closedDays** array:
```typescript
number[]  // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
// Example: [0] = closed on Sundays
```

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

### Resolved Dependencies (from code analysis)

**`useFeatures()` hook** (from `@/contexts/FeatureContext`):
- Fetches flags from `/api/tenant/features` using SWR (60s cache)
- Returns `FeatureFlags` or `DEFAULT_FEATURES` on error
- `isFeatureEnabled()` helper respects parent-child hierarchy

**Chat Types** (from `./types`):
```typescript
type ChatView = 'list' | 'new' | 'chat';

interface Attachment {
    id?: string;
    name: string;
    url: string;
    size: number;
    type: string;
    preview?: string;
}

interface Message {
    id?: string;
    content: string;
    isAdmin: boolean;
    createdAt: string | Date;
    attachments?: Attachment[];
}

interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    category: string;
    customerName: string;
    customerEmail: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}

interface NewTicketForm {
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
    attachments: Attachment[];
}

interface ChatInputState {
    content: string;
    attachments: Attachment[];
    isUploading: boolean;
    uploadProgress: number;
}
```

**DEFAULT_CATEGORIES**:
```typescript
[
    { id: "REPAIR_QUESTION", label: "Reparatie vraag", icon: "🔧", color: "from-orange-500 to-amber-500" },
    { id: "ORDER_QUESTION", label: "Bestelling vraag", icon: "📦", color: "from-blue-500 to-cyan-500" },
    { id: "PRICE_QUOTE", label: "Prijs offerte", icon: "💰", color: "from-emerald-500 to-green-500" },
    { id: "GENERAL", label: "Algemene vraag", icon: "❓", color: "from-violet-500 to-purple-500" },
    { id: "DISPUTE", label: "Geschil", icon: "⚠️", color: "from-red-500 to-rose-500" },
    { id: "REFUND", label: "Terugbetaling", icon: "💸", color: "from-orange-500 to-red-500" },
]
```

- Socket.io server URL: `process.env.NEXT_PUBLIC_API_URL` or defaults to `http://localhost:3001`

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

### Resolved Dependencies (from code analysis)

**COUNTRY_CODES** (from `checkoutApi.ts`):
```typescript
["+32", "+31", "+33", "+49"]  // BE, NL, FR, DE
```

**DiscountValidation** type:
```typescript
interface DiscountValidation {
    valid: boolean;
    code?: string;
    type?: 'PERCENTAGE' | 'FIXED';
    value?: number;
    id?: string;
    error?: string;
}
```

**Key Functions**:
- `validateCoupon(code, subtotal, email?, productIds)` → POST `/api/discounts/validate`
- `calculateShipping(country)` → Returns `SHIPPING_RATES.BE` (€4.99) or `SHIPPING_RATES.DEFAULT` (€7.99)
- `buildCheckoutData(items, formData, discountId?)` → Constructs `CheckoutData` for Stripe
- `formatPhoneNumber(prefix, phone)` → Normalizes phone number

- `getToken`, `api` — from `../api`, see API Client section above

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


2.,:
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


3:
# ADMIN FRONTEND DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Admin Panel Frontend ONLY  
> **Source**: Direct code analysis  
> **Constraints**: No inference, strict role constraints, mark unknowns

---

## ADMIN FRONTEND — Repair Catalog & API Layer

### Scope
This fragment covers the **Repair Catalog Management** interface (`app/admin/repairs`), its business logic hook (`useRepairsCatalog`), and the centralized **Admin API Client** (`lib/admin/adminApi.ts`) used for authenticated operations.
It excludes the `useRepairs` hook (unused in this view) and the authentication flow (login page) itself.

### Responsibilities
- **Catalog Visualization**: displaying metrics and lists of supported device types, brands, devices, and repair services.
- **Bulk Import**: parsing and uploading JSON configurations (`devices.json`) to update the catalog.
- **Authenticated Data Access**: handling Bearer token injection and standardized error parsing for admin requests.

### Pages & Components
- **`AdminRepairsPage`** (`app/admin/repairs/page.tsx`): The main controller component. Manages the tab interface ("Overzicht" vs "Import") and orchestrates data loading.
- **`OverviewTab`**: Renders high-level statistics (`StatCard`) and searchable lists (`CatalogSection`) of catalog entities.
- **`ImportTab`**: Provides a drag-and-drop style file input for `devices.json`, with visual feedback for loading and results.
- **`StatCard`**: Reusable component for displaying metric counts with color-coded icons.
- **`CatalogSection`**: Container component for lists of entities with a standard header and "Add" button.

### Hooks & State
**`useRepairsCatalog`** (`lib/admin/repairs/useRepairsCatalog.ts`):
- **Data State**: Manages arrays for `deviceTypes`, `brands`, `devices`, and `serviceTypes`.
- **UI State**: Tracks `isLoading` (initial fetch), `isImporting` (mutation status), and `activeTab`.
- **Feedback State**: Stores `importResult` object ({ success, message, stats }) for post-import feedback.
- **Ref**: `fileInputRef` to reset the file picker after submission.

### Mutations & Side Effects
- **Public Read**: Fetches catalog data via standard `fetch` from:
  - `/api/repairs/device-types`
  - `/api/repairs/brands`
  - `/api/repairs/devices`
  - `/api/repairs/service-types`
- **Protected Write**: `handleFileImport` triggers a POST to `/api/repairs/admin/import` using `adminFetch`.
- **Authentication Injection**: `adminFetch` automatically retrieves `adminAccessToken` from `localStorage` and appends `Authorization: Bearer <token>` to requests.
- **Error Handling**: `adminFetch` intercepts non-200 responses, extracting error messages from JSON or falling back to defaults before throwing an `AdminApiError`.

### Tenant Dependencies
- **TenantConfig**: Not explicitly accessed in this fragment (logic likely handled server-side).
- **Feature Flags**: Not visible in this fragment.

### Role Constraints
- **Authentication Enforced**: All write operations (Import) go through `adminFetch`, which requires a valid token in `localStorage`.
- **Implicit Access**: The UI does not visibly distinguish between ADMIN and STAFF roles; access control is presumed to be at the page routing level or backend validation.

### UI Invariants
- **Blocking Mutations**: File import sets `isImporting`, showing a spinner and locking the upload interface until the Promise resolves.
- **Feedback Persistence**: Import results (success/error banners) remain visible until a new file is selected or the component unmounts.
- **Token Persistence**: Admin tokens are stored in `localStorage` ('adminAccessToken') and persist across sessions until explicitly removed.

### Unknown / External Dependencies
- **`DeviceType` / `Brand` Types**: Interfaces are defined within `useRepairsCatalog.ts`, but backend validation schemas are unknown.
- **Authentication Flow**: The mechanism for *setting* the `adminAccessToken` (login form) is external to this fragment.
- **`/api/repairs/...` Endpoints**: Internal implementation of these endpoints is unknown.

---
 3.1:
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
 

3.2:
# SHARED FRONTEND CORE DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Shared utilities used by BOTH public frontend AND admin panel  
> **Source**: Direct code analysis  
> **Constraints**: Zero inference, contract-like precision

---

## FRONTEND CORE — API Client

### Scope
- Covers: `api.ts`
- Does NOT cover: Admin-specific API methods (see admin fragments), backend implementation

### Responsibilities
1. Provides authenticated HTTP client for all API calls
2. Manages JWT token storage in localStorage
3. Defines typed interfaces for core entities (Product, Category)
4. Handles cookie-based and token-based authentication

### Public API

#### Token Management Functions

```typescript
function saveToken(token: string): void
// Stores token in localStorage.accessToken

function removeToken(): void
// Removes localStorage.accessToken

function getToken(): string | null
// Returns localStorage.accessToken or null (SSR-safe)

function isAuthenticated(): boolean
// Returns true if token exists
```

#### Admin-Specific Functions

```typescript
async function adminFetch(endpoint: string, options?: RequestInit): Promise<Response>
// Uses localStorage.adminAccessToken
// Auto-prefixes with /api if needed
// Auto-adds Content-Type: application/json for JSON body

function getAdminHeaders(): Record<string, string>
// Returns { Authorization: `Bearer ${adminAccessToken}` } or {}
```

#### ApiClient Class (`api` singleton)

**Auth Methods**:
| Method | Endpoint | Returns |
|--------|----------|---------|
| `register(email, password, name, phone?)` | POST `/api/auth/register` | `AuthResponse` |
| `login(email, password)` | POST `/api/auth/login` | `AuthResponse` |
| `verifyEmail(token)` | POST `/api/auth/verify-email` | `MessageResponse` |
| `resendVerification(email)` | POST `/api/auth/resend-verification` | `MessageResponse` |
| `forgotPassword(email)` | POST `/api/auth/forgot-password` | `MessageResponse` |
| `resetPassword(token, password)` | POST `/api/auth/reset-password` | `MessageResponse` |
| `getMe()` | GET `/api/auth/me` | `AuthResponse['user']` |
| `getGoogleAuthUrl(returnUrl)` | — | `string` (URL) |

**Product Methods**:
| Method | Endpoint | Returns |
|--------|----------|---------|
| `getProducts(params?)` | GET `/api/products` | `ProductsResponse` |
| `getFeaturedProducts(limit?)` | GET `/api/products/featured` | `Product[]` |
| `getProduct(idOrSlug)` | GET `/api/products/{id}` | `Product` |
| `getBrands()` | GET `/api/products/brands` | `string[]` |
| `getRelatedProducts(id, limit?)` | GET `/api/products/{id}/related` | `Product[]` |
| `createProduct(data)` | POST `/api/products` | `Product` |
| `updateProduct(id, data)` | PUT `/api/products/{id}` | `Product` |
| `deleteProduct(id)` | DELETE `/api/products/{id}` | `void` |

**Category Methods**:
| Method | Endpoint | Returns |
|--------|----------|---------|
| `getCategories()` | GET `/api/categories` | `Category[]` |
| `getCategory(idOrSlug)` | GET `/api/categories/{id}` | `Category` |
| `createCategory(data)` | POST `/api/categories` | `Category` |
| `updateCategory(id, data)` | PUT `/api/categories/{id}` | `Category` |
| `deleteCategory(id)` | DELETE `/api/categories/{id}` | `void` |

**Upload Methods**:
| Method | Endpoint | Returns |
|--------|----------|---------|
| `uploadImage(file)` | POST `/api/upload/image` | `{ url, key }` |
| `uploadImages(files)` | POST `/api/upload/images` | `{ url, key }[]` |

**Order Methods**:
| Method | Endpoint | Returns |
|--------|----------|---------|
| `createCheckout(data)` | POST `/api/orders/checkout` | `{ checkoutUrl, sessionId }` |
| `getOrderBySession(sessionId)` | GET `/api/orders/by-session` | Order object |
| `getMyOrders(email)` | GET `/api/orders/my-orders` | Order[] |
| `getOrderById(id)` | GET `/api/orders/{id}` | Order object |

**Appointment Methods**:
| Method | Endpoint | Returns |
|--------|----------|---------|
| `getMyAppointments()` | GET `/api/appointments/my` | Appointment[] |

### Types Exported

```typescript
type ProductType = 'PHONE' | 'PART' | 'ACCESSORY';
type DeviceGrade = 'A_PLUS' | 'A' | 'B' | 'C';

interface Product {
    id: string;
    name: string;
    slug: string;
    description?: string;
    shortDescription?: string;
    price: number;
    compareAtPrice?: number;
    stockQty: number;
    condition: 'NEW' | 'USED' | 'REFURBISHED';
    brand?: string;
    isFeatured: boolean;
    isActive: boolean;
    categoryId?: string;
    category?: Category;
    images: ProductImage[];
    createdAt: string;
    productType?: ProductType;
    storage?: string;
    color?: string;
    batteryHealth?: number;
    deviceGrade?: DeviceGrade;
}

interface ProductImage {
    id: string;
    url: string;
    alt?: string;
    isPrimary: boolean;
}

interface Category {
    id: string;
    name: string;
    slug: string;
    description?: string;
    image?: string;
    parentId?: string;
    children?: Category[];
    _count?: { products: number };
}

interface ProductsResponse {
    data: Product[];
    meta: { total: number; page: number; limit: number; totalPages: number };
}

interface ProductQueryParams {
    category?: string;
    brand?: string;
    condition?: 'NEW' | 'USED' | 'REFURBISHED';
    featured?: boolean;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
        avatar?: string;
        phone?: string;
    };
}

interface MessageResponse {
    message: string;
    success: boolean;
}

interface ApiError {
    message: string;
    statusCode: number;
}
```

### Tenant Access Pattern
- All requests use relative URLs (empty `API_URL`)
- Requests go through Next.js rewrite proxy
- Host header preserved for multi-tenant resolution
- `credentials: 'include'` always set for cookie-based auth

### Invariants
1. Token is NEVER sent if value is `'cookie-based'`
2. All requests include `credentials: 'include'`
3. Non-OK responses throw `ApiError`
4. SSR-safe: all localStorage access guarded by `typeof window !== 'undefined'`

### localStorage Keys

| Key | Consumer | Purpose |
|-----|----------|---------|
| `accessToken` | Public API client | User JWT |
| `adminAccessToken` | Admin API functions | Admin JWT |

---

## FRONTEND CORE — Feature Flags

### Scope
- Covers: `FeatureContext.tsx`
- Does NOT cover: Backend feature flag storage, Owner Panel toggle UI

### Responsibilities
1. Fetches feature flags from `/api/tenant/features`
2. Provides React Context for feature flag access
3. Defines parent-child feature hierarchy
4. Provides default flags during loading (graceful degradation)

### Public API

#### Provider

```typescript
function FeatureProvider({ children }: { children: ReactNode }): JSX.Element
// Mount at app root. Fetches flags once, caches for 60s.
```

#### Hook

```typescript
function useFeatures(): FeatureFlags
// Returns flags from context or DEFAULT_FEATURES if outside provider
```

#### Helper

```typescript
function isFeatureEnabled(features: FeatureFlags, feature: keyof FeatureFlags): boolean
// Respects parent-child hierarchy
```

### Types

```typescript
interface FeatureFlags {
    // E-Commerce (parent: none)
    ecommerceEnabled: boolean;
    refurbishedGrading: boolean;     // parent: ecommerceEnabled
    wishlistEnabled: boolean;        // parent: ecommerceEnabled
    stockNotifications: boolean;     // parent: ecommerceEnabled
    couponsEnabled: boolean;         // parent: ecommerceEnabled
    
    // Repairs (parent: none)
    repairsEnabled: boolean;
    quoteOnRequest: boolean;         // parent: repairsEnabled
    mailInRepairs: boolean;          // parent: repairsEnabled
    walkInQueue: boolean;            // parent: repairsEnabled
    
    // Tickets (parent: none)
    ticketsEnabled: boolean;
    liveChatWidget: boolean;         // parent: ticketsEnabled
    
    // Invoicing (parent: none)
    invoicingEnabled: boolean;
    vatCalculation: boolean;         // parent: invoicingEnabled
    pdfGeneration: boolean;          // parent: invoicingEnabled
    
    // Inventory (parent: none)
    inventoryEnabled: boolean;
    advancedInventory: boolean;      // parent: inventoryEnabled
    
    // Team (parent: none)
    employeeManagement: boolean;
    maxAdminUsers: number;
    
    // Analytics (parent: none)
    analyticsEnabled: boolean;
}
```

### Parent-Child Hierarchy

```
ecommerceEnabled
├── refurbishedGrading
├── wishlistEnabled
├── stockNotifications
└── couponsEnabled

repairsEnabled
├── quoteOnRequest
├── mailInRepairs
└── walkInQueue

ticketsEnabled
└── liveChatWidget

invoicingEnabled
├── vatCalculation
└── pdfGeneration

inventoryEnabled
└── advancedInventory
```

### Default Values

| Flag | Default |
|------|---------|
| `ecommerceEnabled` | `true` |
| `refurbishedGrading` | `true` |
| `wishlistEnabled` | `true` |
| `stockNotifications` | `true` |
| `couponsEnabled` | `true` |
| `repairsEnabled` | `true` |
| `quoteOnRequest` | `false` |
| `mailInRepairs` | `false` |
| `walkInQueue` | `false` |
| `ticketsEnabled` | `true` |
| `liveChatWidget` | `true` |
| `invoicingEnabled` | `true` |
| `vatCalculation` | `true` |
| `pdfGeneration` | `true` |
| `inventoryEnabled` | `true` |
| `advancedInventory` | `false` |
| `employeeManagement` | `false` |
| `maxAdminUsers` | `1` |
| `analyticsEnabled` | `true` |

### Data Flow

```
App Mount
    │
    ▼ FeatureProvider
Fetch GET /api/tenant/features
    │
    ├── Success: Store in context
    │
    └── Error: Use DEFAULT_FEATURES (console.warn)
    │
    ▼ Children render
Components call useFeatures()
```

### Invariants
1. Defaults used while loading (no flash of missing content)
2. Error logs warning but renders with defaults (graceful degradation)
3. `isFeatureEnabled()` returns `false` if parent is `false`
4. If used outside `FeatureProvider`, returns `DEFAULT_FEATURES` with warning

### Unknown / External Dependencies
- Backend storage and mutation of flags — UNKNOWN
- How flags are set per tenant — UNKNOWN

---

## FRONTEND CORE — UI Configuration

### Scope
- Covers: `useUIConfig.ts`, `ui-config-types.ts`
- Does NOT cover: Backend UI config generation, vertical-specific rendering

### Responsibilities
1. Fetches UI configuration from `/api/tenant/ui-config`
2. Provides typed UI labels and formatting config
3. Provides default Dutch REPAIR_SHOP configuration
4. Provides template interpolation utility

### Public API

#### Hook

```typescript
function useUIConfig(): UseUIConfigResult
// Returns { uiConfig, isLoading, error }
// Cached for 60 seconds via SWR
// Falls back to DEFAULT_UI_CONFIG

interface UseUIConfigResult {
    uiConfig: UIConfig;
    isLoading: boolean;
    error: Error | undefined;
}
```

#### Utility

```typescript
function interpolate(template: string, values: Record<string, string | number>): string
// Replaces {key} placeholders with values
// Example: interpolate("Bedankt {name}!", {name: "John"}) → "Bedankt John!"
```

#### Constant

```typescript
const DEFAULT_UI_CONFIG: UIConfig
// Dutch labels for REPAIR_SHOP vertical
// Exported for use as fallback
```

### Types

```typescript
type TenantVertical = 'REPAIR_SHOP' | 'BARBER' | 'CAR_WASH' | 'BIKE_REPAIR' | 'GENERAL_SERVICE';

type MarqueeIcon = 'location' | 'star' | 'wrench' | 'clock' | 'shield' | 'package';

interface MarqueeItem {
    icon: MarqueeIcon;
    text: string;
}

interface UIConfig {
    vertical: TenantVertical;
    marquee: MarqueeItem[];
    footer: FooterConfig;
    formatting: FormattingConfig;
    labels: UILabels;
}

interface FooterConfig {
    tagline: string;
    newsletterTitle: string;
    newsletterSubtitle: string;
    googleReviewUrl: string | null;
    googleReviewRating: string | null;
}

interface FormattingConfig {
    dateLocale: string;      // e.g., "nl-BE"
    dateFormat: string;      // e.g., "dd MMMM yyyy"
}

interface UILabels {
    checkout: CheckoutLabels;
    booking: BookingLabels;
    reviews: ReviewLabels;
    nav: NavLabels;
    auth: AuthLabels;
    footer: FooterLabels;
    loading: LoadingLabels;
}
```

### Label Categories (from `ui-config-types.ts`)

| Category | Fields Count | Purpose |
|----------|--------------|---------|
| `CheckoutLabels` | 5 | Coupon and confirmation text |
| `BookingLabels` | 8 nested | All booking flow text |
| `ReviewLabels` | 12 | Product review form/display |
| `NavLabels` | 5 | Navigation menu items |
| `AuthLabels` | 4 | Auth button labels |
| `FooterLabels` | 7 | Footer section labels |
| `LoadingLabels` | 3 | Loading/error states |

### Invariants
1. Always returns `UIConfig` (never null)
2. `DEFAULT_UI_CONFIG.vertical` is `'REPAIR_SHOP'`
3. Default labels are Dutch (nl-BE)
4. SWR caches for 60 seconds, does not revalidate on focus

### Unknown / External Dependencies
- Backend vertical-specific config generation — UNKNOWN
- How verticals are assigned to tenants — UNKNOWN

---

## FRONTEND CORE — Image URL Handling

### Scope
- Covers: `image-utils.ts`
- Does NOT cover: Image upload, storage backend

### Responsibilities
1. Converts image URLs between production and development environments
2. Detects environment (production vs localhost)
3. Provides fallback URL for error handling

### Public API

```typescript
function getImageUrl(url: string | null | undefined): string
// Main utility: returns environment-appropriate URL
// Development: converts to localhost:9000
// Production: converts to /storage path

function getLocalImageUrl(productionUrl: string): string
// Converts production URL to localhost MinIO

function getProductionImageUrl(localUrl: string): string
// Converts localhost URL to production path

function isDevelopment(): boolean
// Returns true if hostname is localhost or 127.0.0.1

function getImageFallbackUrl(currentSrc: string): string | null
// Returns localhost fallback or null if already localhost
```

### Constants

```typescript
const PRODUCTION_STORAGE_PATH = '/storage';
const LOCAL_MINIO_URL = 'http://localhost:9000';
const PRODUCTION_MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || '/storage';
```

### Data Flow

```
getImageUrl(url)
    │
    ├── isDevelopment() === true?
    │   └── getLocalImageUrl(url) → localhost:9000/{path}
    │
    └── isDevelopment() === false?
        └── getProductionImageUrl(url) → /storage/{path}
```

### URL Transformations

| Input Pattern | Output (Dev) | Output (Prod) |
|---------------|--------------|---------------|
| `localhost:9002/bucket/key` | `localhost:9000/bucket/key` | `/storage/bucket/key` |
| `localhost:9000/bucket/key` | `localhost:9000/bucket/key` | `/storage/bucket/key` |
| `/storage/bucket/key` | `localhost:9000/bucket/key` | `/storage/bucket/key` |
| `images.domain.com/key` | `localhost:9000/key` | `/storage/key` |

### Invariants
1. Returns empty string for null/undefined input
2. Returns original URL if parsing fails
3. `isDevelopment()` is SSR-safe (checks `process.env.NODE_ENV` on server)

### Unknown / External Dependencies
- `NEXT_PUBLIC_MINIO_URL` environment variable — defaults to `/storage`
- Actual MinIO bucket structure — UNKNOWN

---

## SUMMARY — localStorage Keys (Shared Core)

| Key | Purpose | Consumer |
|-----|---------|----------|
| `accessToken` | User JWT for public API | `api.ts` |
| `adminAccessToken` | Admin JWT for admin API | `api.ts`, `adminApi.ts` |

---

## SUMMARY — Environment Variables (Shared Core)

| Variable | Purpose | Default |
|----------|---------|---------|
| `NEXT_PUBLIC_MINIO_URL` | Production storage base URL | `/storage` |
| `NODE_ENV` | Environment detection | — |

---

## SUMMARY — SWR Cache Configuration

| Hook | Endpoint | Cache Duration | Revalidation |
|------|----------|----------------|--------------|
| `useFeatures()` | `/api/tenant/features` | 60s | Never on focus/reconnect |
| `useUIConfig()` | `/api/tenant/ui-config` | 60s | Never on focus/reconnect |

---

*End of Shared Frontend Core Documentation Fragments*

# TENANT BACKEND DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Tenant-Scoped Backend Modules  
> **Source**: Direct code analysis  
> **Constraints**: No inference, strict contract definitions, mark unknowns

---

## TENANT BACKEND — Repair Catalog Module

### Scope
Covers the **Repairs Module** (`modules/repairs`), including public catalog retrieval and admin management of device types, brands, devices, and service pricing.
Explicitly excludes: Appointment scheduling logic.

### Responsibilities
1. **Public Catalog Access**: Serving hierarchical data (Device Type → Brand → Device → Services) for the frontend wizard.
2. **Catalog Management**: Admin CRUD operations for all catalog entities.
3. **Bulk Import**: Processing `devices.json` to populate the global repair catalog.
4. **Asset URL Resolution**: Resolving relative image paths to full MinIO URLs.

### Routes & Endpoints

**Public Endpoints** (Unauthenticated)
- `GET /repairs/device-types` - List active device types
- `GET /repairs/device-types/:slug` - Get type with brands
- `GET /repairs/brands` - List brands (optional `?deviceType` filter)
- `GET /repairs/brands/:slug` - Get brand with devices
- `GET /repairs/devices` - List devices (optional `?brand` filter)
- `GET /repairs/devices/:slug` - Get device with services
- `GET /repairs/services/:deviceSlug` - Get services for specific device
- `GET /repairs/service-types` - List all service types

**Admin Endpoints** (Authenticated: `JwtAuthGuard`)
- `POST /repairs/admin/device-types` - Create device type
- `PUT /repairs/admin/device-types/:id` - Update device type
- `DELETE /repairs/admin/device-types/:id` - Delete device type
- *(Similar CRUD pattern exists for Brands, Devices, Service Types, and Device Services)*
- `POST /repairs/admin/import` - Bulk import from JSON

### DTOs & Validation
**Data Transfer Objects** (defined in `dto/repairs.dto.ts`):
- `CreateDeviceTypeDto`: `name`, `slug` (required), `icon`, `sortOrder`.
- `CreateBrandDto`: `name`, `slug`, `deviceTypeId` (required), `logo`.
- `CreateRepairDeviceDto`: `name`, `slug`, `brandId` (required), `image`.
- `CreateServiceTypeDto`: `name`, `slug` (required), `icon`, `description`.
- `CreateDeviceServiceDto`: `deviceId`, `serviceId` (required), `price`, `priceText`, `duration`.

**Validation Rules**:
- Swagger decorators (`@ApiProperty`) are present.
- `class-validator` rules (e.g., `@IsString`) are **NOT visible** in the provided snippets.

### Tenant Isolation Mechanism
- **Controller Level**: Tenant isolation is **NOT enforced** in the visible `RepairsController`. Methods do not extract or pass a `tenantId`.
- **Service Level**: `getBrandBySlug` and `getDeviceBySlug` accept an optional `tenantId`, but it is not provided by the controller in the visible code.
- **Import Logic**: `importFromJson` explicitly queries for `tenantId: null`, suggesting a **Shared Global Catalog** model rather than tenant-specific catalogs.

### Data Access
**Prisma Models**:
- `RepairDeviceType`
- `RepairBrand`
- `RepairDevice`
- `RepairServiceType`
- `RepairDeviceService`

**Query Patterns**:
- Public Getters: Always filter by `where: { isActive: true }` and `orderBy: { sortOrder: 'asc' }`.
- Import: Uses `upsert` for Types, `findFirst` to check existence, and `createMany` for bulk inserts (`skipDuplicates: true`).

### Side Effects
- **Asset URL Construction**: `getAssetUrl` prepends `MINIO_PUBLIC_URL` (default: `https://images.smartphoneservice.be`) to relative paths.
- **Logo Mapping**: `getBrandLogoUrl` maps known brand names (e.g., "Apple", "Samsung") to specific filenames, defaulting to dynamic kebab-case filenames for others.

### Feature Flag Dependencies
None explicitly referenced in this module.

### Invariants
1. **Active Filter**: Public endpoints only return entities with `isActive: true`.
2. **Slug Consistency**: Service slugs are auto-generated/normalized in `createServiceSlug`.
3. **Mandatory Categories**: `importFromJson` ensures 'smartphone' and 'tablet' device types always exist.

### Unknown / External Dependencies
- `PrismaService`: Implementation of database connection.
- `TenantMiddleware`: Referenced in comments but code not visible.
- `JwtAuthGuard`: Implementation details (e.g., strategy) not visible in module.
- `ConfigService`: Used for `MINIO_PUBLIC_URL`.

---
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


# OWNER PANEL DOCUMENTATION FRAGMENTS

> **Generated**: 2026-01-02  
> **Scope**: Platform Owner Interface ONLY  
> **Source**: Direct code analysis of `owner-app`  
> **Constraints**: Strict platform contract, zero assumptions

---

## OWNER PANEL — Tenant Configuration & Feature Authority

### Scope
Covers the **Tenant Configuration** interface (`app/tenants/[tenantId]/config`) and the underlying **Owner API** (`lib/owner-api.ts`).
Includes capabilities for branding, business settings, feature flag management, domain orchestration, and data seeding.
Excludes: Tenant creation wizard and global platform analytics.

### Responsibilities
- **Configuration Authority**: Enforcing or overriding tenant-level settings (branding, localization, legal).
- **Feature Governance**: Granular control over platform capabilities enabled for each tenant.
- **Lifecycle Management**: Suspending, activating, or archiving tenants.
- **Data Injection**: Seeding tenants with standardized repair and product catalogs.
- **Identity Assumption**: Impersonating tenant users for support/debugging.

### Capabilities

#### 1. Tenant Lifecycle Operations
- **Activation/Suspension**: `activateTenant`, `suspendTenant`, `archiveTenant` endpoints.
- **Catalog Seeding**:
  - `seedTenant`: Populates repair catalog (Brands/Devices/Services).
  - `reseedTenant`: Destructive clear + re-seed.
  - `seedProducts`: Injects products from the global pool.

#### 2. Configuration Mutations
- **Branding**: Colors (Primary, Secondary, Accent), Radius, Dark Mode.
- **Localization**: Locale, Currency, Timezone.
- **Legal/Invoice**: Company Name, VAT, Bank Details, Invoice Footer.
- **Business Hours**: Weekly schedule + specific appointment time slots.

#### 3. Domain Orchestration
- **Cloudflare Integration**:
  - `setupDomainCloudflare`: Initiates setup, returning nameservers.
  - `checkAndConfigureDomain`: Triggers verification.
  - `getDomainCloudflareStatus`: Polling for SSL/Zone status.

#### 4. Feature Management
- **E-Commerce Scope**: `ecommerceEnabled`, `refurbishedGrading`, `wishlistEnabled`, `stockNotifications`, `couponsEnabled`.
- **Repairs Scope**: `repairsEnabled`, `quoteOnRequest`, `mailInRepairs`, `walkInQueue`.
- **Operations Scope**: `ticketsEnabled`, `invoicingEnabled`, `inventoryEnabled`.
- **Plan Templates**: `applyPlanTemplate` to bulk-set features.

### Routes / Actions

**Configuration & Features**
- `PATCH /api/owner/tenants/:id/config` - Partial update of `TenantConfig`.
- `GET /api/owner/tenants/:id/features` - Read current feature state.
- `PATCH /api/owner/tenants/:id/features` - Update specific flags.

**Domains**
- `POST .../domains` - Add domain.
- `POST .../domains/:id/verify` - Verify ownership.
- `POST .../domains/:id/set-primary` - Switch primary domain.
- `POST .../domains/:id/cloudflare/setup` - Provision Cloudflare resources.

**Security**
- `POST /api/owner/impersonate`
  - **Auth**: Owner Token.
  - **Payload**: `{ tenantId, userId }`.
  - **Effect**: Returns `handoffCode` and `redirectUrl` to sign in as target user.

### Data Authority
- **Read/Write**: Full control over `TenantConfig`, `TenantFeatures`, `TenantDomain`.
- **Write-Only**: `TenantUser` password resets (`resetUserPassword`).
- **Injection**: Can insert records into `RepairCatalog` and `ProductCatalog` tables via seed endpoints.

### Safety Boundaries
- **Impersonation**: Handled via `handoffCode`, ensuring the Owner token is not directly exchanged for a Tenant User token on the client side.
- **Reseeding**: `reseedTenant` is explicitly distinct from `seedTenant`, implying a destructive operation that should be gated.
- **Config Updates**: UI explicitly filters empty strings to `undefined` before sending `UpdateConfigDto`, preventing accidental blanking of fields.

### Invariants
1. **Tenant Isolation**: All operations MUST be scoped by `tenantId` in the URL path.
2. **Feature Hierarchy**: Feature flags are grouped (e.g., `ecommerceEnabled` is a parent concept), though UI toggles may appear independent.
3. **Domain Uniqueness**: Domains must be verified before becoming primary (implied by `verifyDomain` endpoint).

### Unknown / External Dependencies
- **`TenantConfig` Schema**: Inferred from UI state (contains `branding`, `address`, `openingHours`), but full backend type definition not read.
- **Cloudflare API**: Backend implementation of `setupDomainCloudflare` is opaque.
- **Handoff Mechanism**: How the `handoffCode` is validated on the tenant frontend is UNKNOWN.

---# TENANT BACKEND API DOCUMENTATION FRAGMENTS

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

---

# PREVIOUSLY UNDOCUMENTED MODULES
> **Added**: 2026-01-02
> **Source**: Direct controller analysis
> **Status**: Complete endpoint documentation

---

## TENANT BACKEND — Banners API

### Scope
- Controller: `banners.controller.ts`
- Purpose: Promotional banner management for homepage

### Routes & Endpoints (6 total)

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| POST | `/banners` | JWT | ADMIN | Create banner |
| GET | `/banners` | JWT | ADMIN | List all banners |
| GET | `/banners/active` | None | — | Get active banners for display |
| GET | `/banners/:id` | JWT | ADMIN | Get banner by ID |
| PATCH | `/banners/:id` | JWT | ADMIN | Update banner |
| DELETE | `/banners/:id` | JWT | ADMIN | Delete banner |

### Query Parameters
- `GET /banners/active`: `?position=HERO|POPUP|SIDEBAR` (optional filter by position)

### Tenant Isolation
- All endpoints use `@TenantId()` decorator

---

## TENANT BACKEND — Marketing API

### Scope
- Controller: `marketing.controller.ts`
- Purpose: Email campaigns and user segmentation

### Routes & Endpoints (6 total)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/marketing/segments` | None | Get user segments with counts |
| GET | `/marketing/users` | None | Get users by segment (preview) |
| POST | `/marketing/send` | None | Send marketing email to segment |
| POST | `/marketing/unsubscribe` | None | Unsubscribe from marketing |
| GET | `/marketing/unsubscribe/check` | None | Check if email unsubscribed |
| POST | `/marketing/subscribe` | None | Subscribe to newsletter |

### User Segments (enum)
```typescript
type UserSegment = 'ALL' | 'VIP' | 'FREQUENT' | 'NEW' | 'INACTIVE' | 'NEWSLETTER';
```

### Tenant Isolation
- All endpoints use `@TenantId()` decorator

### ⚠️ Security Note
- No authentication guards visible on controller
- All endpoints appear publicly accessible

---

## TENANT BACKEND — Inventory API

### Scope
- Controller: `inventory.controller.ts`
- Purpose: Stock tracking and inventory management

### Routes & Endpoints (6 total)

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/inventory/movements` | JWT | ADMIN, STAFF | Get inventory movements |
| GET | `/inventory/low-stock` | JWT | ADMIN, STAFF | Get low stock products |
| GET | `/inventory/products` | JWT | ADMIN, STAFF | Get all products with stock |
| POST | `/inventory/adjust` | JWT | ADMIN, STAFF | Adjust stock |
| GET | `/inventory/product/:id/history` | JWT | ADMIN, STAFF | Get product history |
| GET | `/inventory/summary` | JWT | ADMIN, STAFF | Get inventory summary |

### Stock Adjustment Types
```typescript
type MovementType = 'STOCK_IN' | 'STOCK_OUT' | 'ADJUSTMENT';
```

### Controller-Level Guard
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'STAFF')
```

---

## TENANT BACKEND — Shipping API

### Scope
- Controller: `shipping.controller.ts`
- Purpose: Shipping zone management and rate calculation

### Routes & Endpoints (7 total)

| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/shipping/zones` | None | — | Get all zones |
| GET | `/shipping/zones/:id` | None | — | Get zone by ID |
| POST | `/shipping/zones` | JWT | ADMIN | Create zone |
| PUT | `/shipping/zones/:id` | JWT | ADMIN | Update zone |
| DELETE | `/shipping/zones/:id` | JWT | ADMIN | Delete zone |
| GET | `/shipping/calculate` | None | — | Calculate rate |

### Zone Structure
```typescript
{
    name: string;
    countries: string[];  // ISO country codes
    rate: number;
    freeAbove?: number;   // Free shipping threshold
    minDays?: number;
    maxDays?: number;
    carrier?: string;
    isActive: boolean;
}
```

---

## TENANT BACKEND — Reviews API

### Scope
- Controller: `reviews.controller.ts`
- Purpose: Product reviews + Google Places reviews sync

### Routes & Endpoints (12 total)

#### Public Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/reviews/product/:productId` | None | Get approved reviews |
| POST | `/api/reviews` | None | Submit review |

#### Admin Endpoints
| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/api/reviews/admin` | JWT | ADMIN, STAFF | Get all reviews (paginated) |
| GET | `/api/reviews/admin/pending-count` | JWT | ADMIN, STAFF | Get pending count |
| PATCH | `/api/reviews/admin/:id/moderate` | JWT | ADMIN, STAFF | Approve/reject/hide |
| DELETE | `/api/reviews/admin/:id` | JWT | ADMIN | Delete review |

#### Google Reviews Endpoints
| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/api/reviews/google/status` | JWT | ADMIN, STAFF | Get sync status |
| GET | `/api/reviews/google` | JWT | ADMIN, STAFF | Get Google reviews |
| POST | `/api/reviews/google/sync` | JWT | ADMIN | Sync from Google |
| PATCH | `/api/reviews/google/:id/visibility` | JWT | ADMIN, STAFF | Toggle visibility |

### Moderation Actions
```typescript
type ModerationAction = 'approve' | 'reject' | 'hide';
```

---

## TENANT BACKEND — Wishlist API

### Scope
- Controller: `wishlist.controller.ts`
- Purpose: User wishlist management (authenticated users)

### Routes & Endpoints (6 total)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/wishlist` | JWT | Get user's wishlist |
| GET | `/api/wishlist/count` | JWT | Get wishlist count |
| GET | `/api/wishlist/check/:productId` | JWT | Check if product in wishlist |
| POST | `/api/wishlist/:productId` | JWT | Add to wishlist |
| DELETE | `/api/wishlist/:productId` | JWT | Remove from wishlist |
| DELETE | `/api/wishlist` | JWT | Clear entire wishlist |

### Controller-Level Guard
```typescript
@UseGuards(JwtAuthGuard)  // Requires authentication
```

### User Context
- User ID extracted from `req.user.sub` (JWT payload)

---

## TENANT BACKEND — Export API

### Scope
- Controller: `export.controller.ts`
- Purpose: CSV exports for admin data + Belgian tax reports

### Routes & Endpoints (8 total)

| Method | Path | Auth | Roles | Purpose | Output |
|--------|------|------|-------|---------|--------|
| GET | `/export/orders` | JWT | ADMIN, STAFF | Export orders | CSV |
| GET | `/export/products` | JWT | ADMIN, STAFF | Export products | CSV |
| GET | `/export/customers` | JWT | ADMIN, STAFF | Export customers | CSV |
| GET | `/export/refunds` | JWT | ADMIN, STAFF | Export refunds | CSV |
| GET | `/export/reviews` | JWT | ADMIN, STAFF | Export reviews | CSV |
| GET | `/export/btw-aangifte` | JWT | ADMIN, STAFF | Belgian VAT report | CSV |
| GET | `/export/accountant` | JWT | ADMIN, STAFF | Accountant report | CSV |
| GET | `/export/annual-summary` | JWT | ADMIN, STAFF | Annual summary | CSV |

### Belgian Tax Reports
- BTW Aangifte: `?quarter=1-4&year=YYYY`
- Accountant Report: `?quarter=1-4&year=YYYY`
- Annual Summary: `?year=YYYY`

### Audit Logging
- All exports are logged via `AuditLogService`

---

## TENANT BACKEND — Stock Notifications API

### Scope
- Controller: `stock-notifications.controller.ts`
- Purpose: "Notify me when back in stock" functionality

### Routes & Endpoints (6 total)

#### Public Endpoints
| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/api/stock-notifications/subscribe` | None | Subscribe to notifications |
| POST | `/api/stock-notifications/unsubscribe` | None | Unsubscribe |
| GET | `/api/stock-notifications/check/:productId` | None | Check subscription status |

#### Admin Endpoints
| Method | Path | Auth | Roles | Purpose |
|--------|------|------|-------|---------|
| GET | `/api/stock-notifications/admin` | JWT | ADMIN, STAFF | Get all subscriptions |
| GET | `/api/stock-notifications/admin/waiting-counts` | JWT | ADMIN, STAFF | Get waiting counts per product |

### Subscription Payload
```typescript
{ email: string; productId: string }
```

---

## TENANT BACKEND — Feedback API

### Scope
- Controller: `feedback.controller.ts`
- Purpose: Token-based customer feedback collection (post-service)

### Routes & Endpoints (4 total)

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/feedback/:token` | None | Get feedback form by token |
| POST | `/feedback/:token/rate` | None | Submit rating |
| GET | `/feedback` | None | Get all ratings (admin) |
| GET | `/feedback/stats/average` | None | Get average rating stats |

### Token-Based Access
- Feedback token is proof of authority (emailed to customer)
- No tenant context needed for token-based endpoints

---

## TENANT BACKEND — Upload API

### Scope
- Controller: `upload.controller.ts`
- Purpose: File uploads (images + documents)

### Routes & Endpoints (5 total)

| Method | Path | Auth | Purpose | Max Size |
|--------|------|------|---------|----------|
| POST | `/upload` | None | Public upload (tickets) | 10MB |
| POST | `/upload/image` | JWT | Single image | 10MB |
| POST | `/upload/images` | JWT | Multiple images (max 10) | 10MB ea |
| DELETE | `/upload/:key` | JWT | Delete uploaded file | — |
| GET | `/upload/assets` | JWT | List uploaded images | — |

### Allowed MIME Types

**Admin Uploads** (images only):
- `image/jpeg`, `image/png`, `image/webp`, `image/gif`

**Public Uploads** (tickets):
- Images + `application/pdf`, `application/msword`, `text/plain`

---

## SUMMARY — Previously Undocumented Modules

| Module | Endpoints | Auth Pattern |
|--------|-----------|--------------|
| Banners | 6 | ADMIN only |
| Marketing | 6 | ⚠️ No guards (security risk) |
| Inventory | 6 | ADMIN/STAFF |
| Shipping | 7 | ADMIN for mutations |
| Reviews | 12 | Mixed (public + ADMIN/STAFF) |
| Wishlist | 6 | JWT required |
| Export | 8 | ADMIN/STAFF |
| Stock Notifications | 6 | Mixed |
| Feedback | 4 | Token-based |
| Upload | 5 | Mixed |
| **Total** | **66** | — |

---

*End of Undocumented Modules Documentation*

---

# 9. RESOLVED UNKNOWNS
> **Added**: 2026-01-02
> **Source**: Direct code immersion
> **Status**: Previously unknown items now documented with implementation details

This section resolves all items previously marked as "UNKNOWN" in Section 9 (Known Unknowns).

---

## 9.1 Frontend Unknowns — RESOLVED

### 9.1.1 Backend Tenant Resolution Logic (Host → tenantId)

**Source**: `tenant.middleware.ts`

```typescript
// Tenant resolution flow:
// 1. Extract Host header from request
// 2. Query TenantDomain table: WHERE domain = hostHeader
// 3. Load Tenant + TenantConfig + TenantFeatures
// 4. Attach to request: req.tenantId, req.tenant
// 5. Cache for 5 minutes

// Skip paths (no tenant resolution):
const SKIP_PATHS = [
    '/api/owner',           // Owner panel routes
    '/api/auth/owner-',     // Owner auth
    '/api/auth/exchange',   // OAuth handoff
    '/api/auth/impersonate', // Impersonation handoff
    '/orders/webhook',      // Stripe webhook
    '/health',              // Health check
];
```

**Tenant Status Handling**:
- `ACTIVE` → Continue normal processing
- `SUSPENDED` → Returns 403 "Tenant suspended"
- `ARCHIVED` → Returns 404 "Shop not found"
- `DRAFT`/`SEEDING` → Returns 503 "Shop temporarily unavailable"

---

### 9.1.2 TenantService.getPublicConfig Implementation

**Source**: `tenant.service.ts` (lines 325-394)

```typescript
async getPublicConfig(tenantId: string) {
    const config = await this.prisma.tenantConfig.findUnique({
        where: { tenantId },
        select: {
            shopName: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
            accentColor: true,
            borderRadius: true,
            darkMode: true,
            email: true,
            phone: true,
            whatsappNumber: true,
            address: true,
            locale: true,
            currency: true,
            currencySymbol: true,
            openingHours: true,
            timeSlots: true,
            closedDays: true,
            googleAnalyticsId: true,
            cookiebotId: true,
            seoTitle: true,
            seoDescription: true,
        }
    });

    if (!config) return null;

    // Transform flat DB structure to nested PublicTenantConfig
    return {
        tenantId,
        branding: {
            shopName: config.shopName,
            logoUrl: config.logoUrl,
            primaryColor: config.primaryColor,
            secondaryColor: config.secondaryColor,
            accentColor: config.accentColor,
            borderRadius: config.borderRadius,
            darkMode: config.darkMode,
        },
        contact: {
            email: config.email,
            phone: config.phone,
            whatsappNumber: config.whatsappNumber,
            address: config.address,
        },
        locale: {
            locale: config.locale,
            currency: config.currency,
            currencySymbol: config.currencySymbol,
        },
        business: {
            openingHours: config.openingHours,
            timeSlots: config.timeSlots,
            closedDays: config.closedDays,
        },
        integrations: {
            googleAnalyticsId: config.googleAnalyticsId,
            cookiebotId: config.cookiebotId,
        },
        seo: {
            title: config.seoTitle,
            description: config.seoDescription,
        },
    };
}
```

---

### 9.1.3 DEFAULT_UI_CONFIG Full Content

**Source**: `useUIConfig.ts` (lines 26-153)

```typescript
export const DEFAULT_UI_CONFIG: UIConfig = {
    vertical: 'REPAIR_SHOP',
    marquee: [
        { icon: 'location', text: 'Lokale experts in uw regio' },
        { icon: 'star', text: '4.7 klantbeoordeling' },
        { icon: 'wrench', text: '5 jaar ervaring in reparaties' },
        { icon: 'clock', text: 'Snelle service - vaak dezelfde dag klaar' },
        { icon: 'shield', text: 'Garantie op alle reparaties' },
        { icon: 'package', text: 'Gratis verzending vanaf €50' },
    ],
    footer: {
        tagline: 'Uw lokale expert voor smartphones, tablets en accessoires.',
        newsletterTitle: 'Blijf op de hoogte',
        newsletterSubtitle: 'Ontvang als eerste onze aanbiedingen en tips.',
        googleReviewUrl: null,
        googleReviewRating: null,
    },
    formatting: {
        dateLocale: 'nl-BE',
        dateFormat: 'dd MMMM yyyy',
    },
    labels: {
        checkout: {
            couponCode: 'Kortingscode',
            couponPlaceholder: 'KORTINGSCODE',
            apply: 'Toepassen',
            discount: 'Korting',
            confirmationNote: 'Bestellingsbevestiging wordt verzonden naar uw account e-mail',
        },
        booking: {
            stepTitles: {
                deviceType: 'Wat wilt u laten repareren?',
                brand: 'Selecteer uw merk',
                device: 'Selecteer uw toestel',
                repair: 'Selecteer reparatie',
                datetime: 'Kies datum & tijd',
                contact: 'Uw gegevens',
            },
            success: { /* ... Dutch labels */ },
            navigation: { previous: 'Vorige', next: 'Volgende', confirm: 'Afspraak Bevestigen' },
            form: { /* ... Dutch labels */ },
            emptyStates: { /* ... Dutch labels */ },
        },
        reviews: { /* ... Dutch labels */ },
        nav: { devices: 'Toestellen', accessories: 'Accessoires', repairs: 'Reparaties' },
        auth: { myAccount: 'Mijn Account', logout: 'Uitloggen', login: 'Inloggen' },
        footer: { services: 'Diensten', legal: 'Juridisch', terms: 'Algemene voorwaarden' },
        loading: { loading: 'Laden...', configError: 'Configuratie Fout', retry: 'Opnieuw proberen' },
    },
};
```

---

### 9.1.4 PublicTenantConfig Object Shapes — RESOLVED

**Address Shape** (from `owner.service.ts`):
```typescript
interface Address {
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}
```

**OpeningHours Shape** (from `tenant.service.ts`):
```typescript
Record<string, { open: string; close: string } | null>

// Example:
{
    monday: { open: "09:00", close: "18:00" },
    tuesday: { open: "09:00", close: "18:00" },
    wednesday: null,  // Closed
    // ...
}
```

**TimeSlots Element Type**:
```typescript
string[]  // Array of HH:MM strings
// Example: ["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]
```

**ClosedDays Element Type**:
```typescript
number[]  // Array of day-of-week integers (0=Sunday, 6=Saturday)
// Example: [0] = Closed on Sundays
```

---

### 9.1.5 Chat Widget Types — RESOLVED

**Source**: `frontend/src/lib/chat/types.ts`

```typescript
export type ChatView = 'categories' | 'form' | 'ticket' | 'history';

export interface Attachment {
    url: string;
    type: 'image' | 'document';
    name: string;
    size: number;
    mimeType?: string;
}

export interface Message {
    id: string;
    sender: string;
    message: string;
    createdAt: string;
    attachments?: Attachment[];
}

export interface Ticket {
    id: string;
    caseId: string;
    sessionId: string;
    customerName: string;
    customerEmail?: string;
    category: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}

export interface NewTicketForm {
    name: string;
    email: string;
    phone: string;
    category: string;
    subject: string;
    message: string;
}

export interface ChatInputState {
    message: string;
    attachments: Attachment[];
    isUploading: boolean;
    uploadProgress: number;
}
```

---

### 9.1.6 DEFAULT_CATEGORIES Value — RESOLVED

**Source**: `frontend/src/lib/chat/types.ts` (lines 91-98)

```typescript
export const DEFAULT_CATEGORIES: Category[] = [
    { id: "REPAIR_QUESTION", label: "Reparatie vraag", icon: "🔧", color: "from-orange-500 to-amber-500" },
    { id: "ORDER_QUESTION", label: "Bestelling vraag", icon: "📦", color: "from-blue-500 to-cyan-500" },
    { id: "PRICE_QUOTE", label: "Prijs offerte", icon: "💰", color: "from-emerald-500 to-green-500" },
    { id: "GENERAL", label: "Algemene vraag", icon: "❓", color: "from-violet-500 to-purple-500" },
    { id: "DISPUTE", label: "Geschil", icon: "⚠️", color: "from-red-500 to-rose-500" },
    { id: "REFUND", label: "Terugbetaling", icon: "💸", color: "from-orange-500 to-red-500" },
];
```

---

### 9.1.7 Checkout API Details — RESOLVED

**Source**: `frontend/src/lib/checkout/checkoutApi.ts`

```typescript
// COUNTRY_CODES
export const COUNTRY_CODES = ["+32", "+31", "+33", "+49"];

// SHIPPING_RATES
export const SHIPPING_RATES = { BE: 4.95, DEFAULT: 9.95 };

// DiscountValidation
export interface DiscountValidation {
    valid: boolean;
    discount?: { type: 'PERCENTAGE' | 'FIXED'; value: number; code: string };
    error?: string;
}

// validateCoupon implementation
export async function validateCoupon(
    code: string,
    subtotal: number,
    customerEmail?: string,
    productIds?: string[]
): Promise<DiscountValidation> {
    const response = await fetch('/api/discounts/validate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            code: code.toUpperCase(),
            subtotal,
            customerEmail,
            productIds,
        }),
    });
    return response.json();
}

// calculateShipping implementation
export function calculateShipping(country: string): number {
    return country === "BE" ? SHIPPING_RATES.BE : SHIPPING_RATES.DEFAULT;
}

// buildCheckoutData constructs CheckoutData object from form + cart + coupon
// createCheckoutSession posts to /api/orders/checkout
```

---

## 9.2 Backend Unknowns — RESOLVED

### 9.2.1 JWT Strategy Implementation

**Source**: `jwt.strategy.ts` (full 125 lines)

```typescript
export interface JwtPayload {
    sub: string;          // User ID
    email: string;
    role: string;         // 'ADMIN' | 'STAFF' | 'CUSTOMER' | 'OWNER'
    tenantId?: string | null;  // null = OWNER/platform
    isImpersonating?: boolean;
    impersonatedBy?: string;   // Owner ID
}

// JWT extraction: Bearer header OR auth_token cookie
// Secret from: ConfigService.get('JWT_SECRET')
// Expiration: Not ignored (ignoreExpiration: false)

// CRITICAL: Tenant validation in validate():
if (requestTenantId && !payload.isImpersonating) {
    if (tokenTenantId !== requestTenantId) {
        throw new UnauthorizedException('Session not valid for this tenant');
    }
}

// Side effect: Updates user.lastActiveAt on every request
```

**Special Cases**:
- `sub: 'super-admin'` → Returns hardcoded super admin user
- `role: 'OWNER'` → Sets `tenantId: null` for platform access
- Impersonation → Skips tenant validation, preserves `impersonatedBy`

---

### 9.2.2 PrismaService Implementation

**Source**: `prisma.service.ts` (28 lines)

```typescript
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        const adapter = new PrismaPg({
            connectionString: process.env.DATABASE_URL!,
        });

        super({
            adapter,
            log: process.env.NODE_ENV === 'development'
                ? ['query', 'info', 'warn', 'error']
                : ['error'],
        });
    }

    async onModuleInit() { await this.$connect(); }
    async onModuleDestroy() { await this.$disconnect(); }
}
```

---

### 9.2.3 AppointmentsService Implementation — RESOLVED

**Source**: `appointments.service.ts` (352 lines)

**Slot Calculation**:
```typescript
async getAvailableSlots(tenantId: string, dateStr: string) {
    const { timeSlots, closedDays } = await this.getBusinessConfig(tenantId);
    const date = new Date(dateStr);

    // Check if closed day
    if (closedDays.includes(date.getDay())) {
        return { date: dateStr, slots: [], closed: true };
    }

    // Get booked slots (tenant-scoped, exclude CANCELLED)
    const bookedAppointments = await this.prisma.appointment.findMany({
        where: { tenantId, appointmentDate: date, status: { not: 'CANCELLED' } },
        select: { timeSlot: true },
    });

    const bookedSlots = bookedAppointments.map(a => a.timeSlot);
    const availableSlots = timeSlots.filter(slot => !bookedSlots.includes(slot));

    return { date: dateStr, slots: availableSlots, closed: false };
}
```

**DTOs — RESOLVED**:
```typescript
export enum RepairType {
    SCREEN = 'SCREEN',
    BATTERY = 'BATTERY',
    BACKCOVER = 'BACKCOVER',
    CHARGING_PORT = 'CHARGING_PORT',
    WATER_DAMAGE = 'WATER_DAMAGE',
    OTHER = 'OTHER',
}

export enum AppointmentStatus {
    CONFIRMED = 'CONFIRMED',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
    NO_SHOW = 'NO_SHOW',
}

export enum AppointmentPriority {
    NORMAL = 'NORMAL',
    URGENT = 'URGENT',
    VIP = 'VIP',
}

export class CreateAppointmentDto {
    @IsString() customerName: string;
    @IsEmail() customerEmail: string;
    @IsString() customerPhone: string;
    @IsString() deviceBrand: string;
    @IsString() deviceModel: string;
    @IsEnum(RepairType) repairType: RepairType;
    @IsOptional() @IsString() problemDescription?: string;
    @IsOptional() @IsString() damageImageUrl?: string;
    @IsDateString() appointmentDate: string;
    @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) timeSlot: string;
}

export class UpdateAppointmentDto {
    @IsOptional() @IsEnum(AppointmentStatus) status?: AppointmentStatus;
    @IsOptional() @IsEnum(AppointmentPriority) priority?: AppointmentPriority;
    @IsOptional() @IsString() adminNotes?: string;
    @IsOptional() @IsInt() @Min(1) @Max(480) repairDuration?: number;
    @IsOptional() @IsDateString() appointmentDate?: string;
    @IsOptional() @Matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/) timeSlot?: string;
}
```

---

### 9.2.4 TicketsService Implementation — RESOLVED

**Source**: `tickets.service.ts` (340 lines)

**TicketStatus Enum**:
```typescript
export enum TicketStatus {
    OPEN = 'OPEN',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    CLOSED = 'CLOSED',
}

export enum TicketCategory {
    REPAIR_QUESTION = 'REPAIR_QUESTION',
    ORDER_QUESTION = 'ORDER_QUESTION',
    PRICE_QUOTE = 'PRICE_QUOTE',
    GENERAL = 'GENERAL',
    DISPUTE = 'DISPUTE',
    REFUND = 'REFUND',
}
```

**Reply Mechanism** — `/tickets/:id/messages` with `AddMessageDto`:
```typescript
export class AddMessageDto {
    @IsString() message: string;
    @IsString() sender: string;  // 'customer' or staff name
    @IsOptional() @IsArray() attachments?: AttachmentDto[];
}
```

**Case ID Format**: `NEO-{YYYY}-{0001}-{ABC}` (year + sequential + random suffix)

---

### 9.2.5 OrdersService & Webhook — RESOLVED

**Source**: `orders.service.ts`, `order-webhook.service.ts`

**Facade Pattern**: OrdersService delegates to:
- `OrderCheckoutService` → Stripe session creation
- `OrderWebhookService` → Webhook handling
- `OrderFulfillmentService` → Queries and updates

**Stripe Configuration**:
```typescript
const stripeKey = this.configService.get<string>('STRIPE_SECRET_KEY');
const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

// Signature verification
event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
```

**Stock Decrement Behavior**:
```typescript
// In handleCheckoutCompleted, after order marked PAID:
await this.prisma.$transaction(async (tx) => {
    for (const item of order.items) {
        await tx.product.update({
            where: { id: item.productId },
            data: { stockQty: { decrement: item.quantity } },
        });
    }
});
```

**Tenant Validation in Webhook**:
```typescript
const sessionTenantId = session.metadata?.tenantId;
if (sessionTenantId && existingOrder.tenantId && sessionTenantId !== existingOrder.tenantId) {
    throw new Error('Stripe tenant mismatch - possible security issue');
}
```

---

## 9.3 Owner Panel Unknowns — RESOLVED

### 9.3.1 OwnerService Implementation

**Source**: `owner.service.ts` (896 lines)

**Key Methods**:
- `findAllTenants()` / `findTenantById()` → Tenant CRUD
- `createTenant()` → Creates tenant with DRAFT status, auto-seeds CMS pages
- `activateTenant()` → Requires verified domain + config
- `suspendTenant()` / `archiveTenant()` → Lifecycle management
- `addDomain()` / `verifyDomain()` / `setPrimaryDomain()` → Domain management
- `setupDomainCloudflare()` / `checkAndConfigureDomain()` → Cloudflare automation
- `updateTenantConfig()` → Config upsert with features JSON conversion
- `logOwnerAction()` / `getAuditLogs()` → Audit logging
- `createImpersonationHandoff()` / `getImpersonationHandoff()` → Secure impersonation

**Impersonation Handoff Pattern**:
```typescript
// In-memory storage with 60s TTL
private impersonationHandoffs = new Map<string, {
    tenantId: string;
    userId: string;
    ownerId: string;
    userEmail: string;
    userName: string | null;
    userRole: string;
    expiresAt: number;  // Date.now() + 60000
}>();

// One-time use: deleted after retrieval
getImpersonationHandoff(handoffCode: string) {
    const data = this.impersonationHandoffs.get(handoffCode);
    if (!data || Date.now() > data.expiresAt) return null;
    this.impersonationHandoffs.delete(handoffCode);  // One-time use
    return data;
}
```

---

### 9.3.2 TenantSeederService Implementation

**Source**: `tenant-seeder.service.ts` (478 lines)

**Seeding Flow**:
1. Load `devices.json` from project root
2. Set tenant status to `SEEDING`
3. Create global device types (Smartphone, Tablet)
4. Extract and create per-tenant service types
5. For each brand in devices.json:
   - Create brand with MinIO logo URL
   - Create devices with images
   - Create device services with pricing
6. Set tenant status to `ACTIVE`

**Asset URL Generation**:
```typescript
private getAssetUrl(relativePath: string): string {
    const baseUrl = `${this.minioPublicUrl}/${this.minioBucket}/${this.assetsPrefix}`;
    const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
    return `${baseUrl}/${encodedPath}`;
}
// Example: https://images.servicespulse.com/products/repairs/assets/Apple/iPhone%2016%20Pro/image.webp
```

**Statistics Query**:
```typescript
async getSeedingStats(tenantId: string) {
    return {
        brands: await this.prisma.repairBrand.count({ where: { tenantId } }),
        devices: await this.prisma.repairDevice.count({ where: { tenantId } }),
        serviceTypes: await this.prisma.repairServiceType.count({ where: { tenantId } }),
        deviceServices: await this.prisma.repairDeviceService.count({ where: { tenantId } }),
    };
}
```

---

### 9.3.3 Owner Panel API Client (apiClient)

**Source**: `owner-app/src/lib/api-client.ts` (88 lines)

```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class ApiClient {
    private baseUrl: string;

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const config: RequestInit = {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            credentials: 'include',  // HttpOnly cookies for auth
        };

        const response = await fetch(`${this.baseUrl}${endpoint}`, config);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        if (response.status === 204) return undefined as T;
        return response.json();
    }

    get<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint, { method: 'GET' }); }
    post<T>(endpoint: string, data?: unknown): Promise<T> { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
    patch<T>(endpoint: string, data?: unknown): Promise<T> { return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
    delete<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export const apiClient = new ApiClient(API_URL);
```

**Authentication**: Uses HttpOnly `auth_token` cookie (set by `/auth/owner-login`)

---

### 9.3.4 Cloudflare Integration Implementation

**Source**: `cloudflare.service.ts` (514 lines)

**Configuration**:
```typescript
const apiToken = this.config.get<string>('CLOUDFLARE_API_TOKEN');
const accountId = this.config.get<string>('CLOUDFLARE_ACCOUNT_ID');
const tunnelId = this.config.get<string>('CLOUDFLARE_TUNNEL_ID');
const frontendServiceUrl = this.config.get<string>('TUNNEL_FRONTEND_URL', 'http://localhost:3002');
const backendServiceUrl = this.config.get<string>('TUNNEL_BACKEND_URL', 'http://localhost:3001');
```

**Workflow**:
```
1. createZone(domain) → Returns nameservers (status: pending)
2. User updates nameservers at registrar
3. getZoneStatus(zoneId) → Polls until 'active'
4. configureDNS(zoneId, domain) → 
   - Clears conflicting A/AAAA records
   - Creates CNAME @ → tunnelId.cfargotunnel.com
   - Creates CNAME www → domain
5. addDomainToTunnel(domain) → Updates tunnel ingress rules
6. enableSSL(zoneId) → Sets SSL mode to 'full', enables Always HTTPS
```

**Edge Case Handling**:
- Zone already exists (error 1061) → Looks up existing zone
- DNS record exists (error 81057/81058) → Skips duplicate

---

### 9.3.5 Audit Log Storage

**Source**: `owner.service.ts`

```typescript
// Stored in OwnerAuditLog table via Prisma
await this.prisma.ownerAuditLog.create({
    data: {
        ownerId,     // User ID of owner
        action,      // Action name (e.g., 'CREATE_TENANT')
        targetType,  // Entity type (TENANT, DOMAIN, CONFIG, USER)
        targetId,    // Entity ID
        metadata,    // Action-specific JSON data
        ipAddress,   // req.ip
        userAgent,   // req.headers['user-agent']
    }
});

// Query with filters:
async getAuditLogs(options?: { ownerId?: string; action?: string; targetType?: string; limit?: number }) {
    return this.prisma.ownerAuditLog.findMany({
        where: { ownerId, action, targetType },
        orderBy: { createdAt: 'desc' },
        take: options?.limit || 100
    });
}
```

---

## 9.4 Summary of Resolved Items

| Category | Previously Unknown | Now Documented |
|----------|-------------------|----------------|
| **Frontend** | DEFAULT_UI_CONFIG | Full 200-line structure with Dutch labels |
| **Frontend** | Chat widget types | All 6 interfaces with shapes |
| **Frontend** | Checkout API | COUNTRY_CODES, SHIPPING_RATES, DiscountValidation |
| **Frontend** | Tenant resolution | Full middleware flow with skip paths |
| **Backend** | JWT Strategy | Full implementation with tenant validation |
| **Backend** | PrismaService | PrismaPg adapter configuration |
| **Backend** | AppointmentsService | Slot calculation, full DTOs with enums |
| **Backend** | TicketsService | Status enum, case ID format, reply mechanism |
| **Backend** | OrdersService | Facade pattern, Stripe verification, stock decrement |
| **Owner Panel** | OwnerService | 896-line implementation with all methods |
| **Owner Panel** | TenantSeederService | Full seeding flow from devices.json |
| **Owner Panel** | apiClient | Cookie-based auth, full HTTP client |
| **Owner Panel** | CloudflareService | 514-line implementation with tunnel management |
| **Owner Panel** | Audit logs | OwnerAuditLog table with query methods |

---

*End of Resolved Unknowns Section*

# ServicePulse Platform Documentation

## 1. Platform Overview

### Purpose

ServicePulse is a multi-tenant SaaS platform designed for device repair shops, mobile phone retailers, and similar service businesses. It provides:

* E-commerce: product catalog, cart, checkout with Stripe
* Repair booking: multi-step appointment scheduler
* Ticketing system: customer support with real-time chat
* Invoicing: PDF generation, email delivery
* Admin panel: business management
* Owner panel: platform-level tenant management

### Multi-tenant model

* Tenants are identified by domain (e.g., `shop.com`, `fix.nl`, `repair.be`).
* Isolation strategy: every database entity has a `tenantId` column; queries are scoped by tenant (see examples in §3.3 and §5).

### Role definitions

| Role       | Access                          | App                         |
| ---------- | ------------------------------- | --------------------------- |
| `OWNER`    | Platform-wide tenant management | Owner Panel (port 3000)     |
| `ADMIN`    | Tenant admin panel, full CRUD   | Admin Panel (tenant domain) |
| `STAFF`    | Limited admin (read + update)   | Admin Panel                 |
| `CUSTOMER` | Public site, orders, tickets    | Public Frontend (port 3002) |

### Tenant isolation strategy

* Database-level: entities include `tenantId`.
* Request-level: `tenantId` is attached to the request by tenant middleware and extracted via `@TenantId()` decorator (see §2.3 and §5.1).

### High-level request flow

#### Domain → Tenant → Config (documented flow)

```
1. User visits: https://bikerepair.site/repair/book
                    │
2. TenantMiddleware extracts Host header: "bikerepair.site"
                    │
3. Query: TenantDomain WHERE domain = "bikerepair.site"
                    │
4. Load: Tenant + TenantConfig + TenantFeatures
                    │
5. Attach to request: req.tenantId, req.tenant
                    │
6. Controller uses @TenantId() decorator → scoped queries
                    │
7. Response includes tenant-specific branding/data
```

#### Tenant resolution details (from `tenant.middleware.ts`)

1. Extracts Host header from `x-forwarded-host` or `host`
2. Normalizes domain: lowercase, strips port, strips `www.` prefix
3. Queries `TenantDomain` table for matching domain
4. Loads `Tenant` + `TenantConfig` + `TenantFeature`
5. Caches result for 5 minutes
6. Attaches to `req.tenantId`, `req.tenant`, `req.features`
7. Returns:

   * `404` if domain not found
   * `403` if status is `SUSPENDED`
   * `503` if status is `ARCHIVED`

#### Skip paths excluded from tenant resolution

* `/owner/*`, `/api/owner/*`
* `/auth/owner-login`, `/auth/logout`, `/auth/google`
* `/orders/webhook`, `/orders/checkout-success`, `/orders/checkout-cancel`

### TenantConfig flow through the system

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Owner Panel   │────▶│  Backend API    │────▶│    Database     │
│ (Config Form)   │     │ PATCH /config   │     │  TenantConfig   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│    Frontend     │◀────│ TenantProvider  │◀─────────────┘
│   (Components)  │     │  useTenant()    │  GET /tenant/config
└─────────────────┘     └─────────────────┘
```

**UNKNOWN**: The exact backend response transformation from stored `TenantConfig` to `PublicTenantConfig` (nested) is not fully specified (see §3.1).

---

## 2. System Architecture

### 2.1 Tech Stack

#### Backend (NestJS)

* NestJS 10.x with TypeScript
* Prisma 5.x ORM with PostgreSQL
* JWT authentication via `@nestjs/jwt`
* Socket.io for real-time ticket chat
* PDFKit for invoice generation
* Nodemailer for emails

Backend module structure (partial listing shown):

```
backend/src/modules/
├── appointments/    # Repair booking system
├── auth/           # JWT, OAuth, impersonation
├── email/          # Template-based email service
├── invoice/        # PDF generation + email
├── orders/         # Stripe checkout + webhooks
├── owner/          # Platform admin (OWNER only)
├── pages/          # CMS endpoints
├── settings/       # Tenant settings API
├── sms/            # SMS abstraction (Twilio ready)
├── tenant/         # Config + features API
├── tickets/        # Support system + Socket.io
└── ... (32 total modules)
```

#### Frontend (Next.js)

* Next.js 14 with App Router
* TypeScript strict mode
* TailwindCSS for styling
* Zustand for cart state
* Socket.io-client for chat

### 2.2 Runtime Topology (Frontend / Admin / Owner / Backend)

#### Local ports (quick reference)

```
PORTS:
  Backend:      localhost:3001
  Owner Panel:  localhost:3000
  Frontend:     localhost:3002
```

#### Runtime components

* **Backend API**: NestJS server (port 3001)
* **Owner Panel**: Platform owner UI (port 3000)
* **Public Frontend**: Customer-facing UI (port 3002)
* **Admin Panel**: Tenant admin UI (served under `/admin/*` routes; tenant domain context implied in multiple fragments)

**UNKNOWN**: Exact deployment topology (hosts/domains per component) beyond the above ports and tenant-domain routing references.

### 2.3 Tenant Resolution & Context Propagation

#### Backend request context

* Tenant middleware attaches:

  * `req.tenantId`
  * `req.tenant`
  * `req.features`

#### Decorators used to access tenant context

```typescript
export const TenantId = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenantId;
    },
);

export const CurrentTenant = createParamDecorator(
    (data: unknown, ctx: ExecutionContext) => {
        const request = ctx.switchToHttp().getRequest();
        return request.tenant;
    },
);
```

#### Frontend tenant resolution

* Frontend requests use relative URLs and go through a Next.js rewrite proxy.
* Host header is preserved for multi-tenant resolution.
* Many frontend calls are prefixed with `/api/...` (see §4 and §4.1).
* `TenantProvider` fetches public tenant configuration from `GET /api/tenant/config` on mount and provides it via context.

---

## 3. Shared Concepts

### 3.1 TenantConfig

#### Observed shapes and aliases

Multiple fragments describe tenant configuration in different shapes:

1. **Backend-side `TenantConfig` type** (from admin backend fragments; flat fields):

```typescript
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

2. **Frontend-side `PublicTenantConfig`** (nested):

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
    address: Record<string, unknown> | null;  // Shape documented below
}

interface TenantLocale {
    locale: string;
    currency: string;
    currencySymbol: string;
}

interface TenantBusiness {
    openingHours: Record<string, unknown> | null;  // Shape documented below
    timeSlots: unknown[] | null;                   // Element type documented below
    closedDays: unknown[] | null;                  // Element type documented below
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

3. **Owner Panel `UpdateConfigDto` updatable fields** (flat list; includes additional fields not present in the backend `TenantConfig` type excerpt above):
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

**UNKNOWN**: Whether `bankName`, `invoiceFooter`, and `website` are stored in the same `TenantConfig` table/schema as other config fields.

#### Field-level usage (explicitly stated)

##### Backend usage

* Invoice generation uses:

  * `companyName`, `vatNumber`, `bankAccount`, `logoUrl` (invoice PDF branding)

```typescript
const pdf = await this.pdfGenerator.create(invoice, {
    companyName: config.companyName,
    vatNumber: config.vatNumber,
    bankAccount: config.bankAccount,
    logoUrl: config.logoUrl,
});
```

* Email service uses `config.shopName` in email subject:

```typescript
subject: `Order Confirmed - ${config.shopName}`,
```

* Appointments use `timeSlots`, `closedDays` for booking/availability.

##### Frontend usage (explicitly referenced paths)

TenantProvider (public frontend) uses:

| PublicTenantConfig path   |          Type | Usage                                       |
| ------------------------- | ------------: | ------------------------------------------- |
| `branding.primaryColor`   |        string | Sets CSS `--primary-color`, `--brand-color` |
| `branding.secondaryColor` | string | null | Sets CSS `--secondary-color`                |
| `branding.accentColor`    | string | null | Sets CSS `--accent-color`                   |
| `branding.borderRadius`   |        string | Sets CSS `--radius`                         |
| `branding.darkMode`       |       boolean | Adds/removes `.dark` class on `<html>`      |
| `branding.shopName`       |        string | Sets `document.title`                       |

Other frontend references:

* Chat widget lists `contact.whatsappNumber` as a documented dependency in one fragment, but the chat widget itself is gated by feature flags (see §4.2).

##### Defaults and null-handling behavior (ONLY what is explicitly stated)

From the TenantConfig specification table (flat fields):

| Field            | Type      | If Null (explicit) | Default (explicit) |
| ---------------- | --------- | ------------------ | ------------------ |
| `logoUrl`        | `String?` | Generic icon       | —                  |
| `primaryColor`   | `String`  | —                  | `#7c3aed`          |
| `email`          | `String?` | Hidden             | —                  |
| `phone`          | `String?` | Hidden             | —                  |
| `whatsappNumber` | `String?` | Hidden             | —                  |
| `address`        | `Json?`   | Hidden             | —                  |
| `openingHours`   | `Json?`   | "Contact us"       | —                  |
| `timeSlots`      | `Json?`   | Default slots      | —                  |
| `closedDays`     | `Int[]`   | —                  | `[0]`              |
| `companyName`    | `String?` | shopName           | —                  |
| `vatNumber`      | `String?` | Hidden             | —                  |
| `bankAccount`    | `String?` | Hidden             | —                  |
| `invoicePrefix`  | `String`  | —                  | `INV`              |
| `website`        | `String?` | Hidden             | —                  |

Additional default behaviors from frontend code analysis:

* Booking flow: `closedDays` defaults to `[0]` (Sunday) if not provided when computing available dates.
* Booking flow: if slots fetch fails, returns `DEFAULT_TIME_SLOTS`:

  * `["09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"]` (hardcoded)
* Feature flags: see §3.2 for defaults.

#### Structured subfields (explicit)

##### Address structure

```typescript
{
    line1?: string;
    line2?: string;
    city?: string;
    postalCode?: string;
    country?: string;
}
```

##### Opening hours structure

```typescript
Record<string, { open: string; close: string } | null>
// Keys: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'
```

##### Time slots and closed days

```typescript
string[]  // timeSlots
number[]  // closedDays, 0 = Sunday, 1 = Monday, ..., 6 = Saturday
```

**UNKNOWN**: Whether `openingHours`, `timeSlots`, and `closedDays` are always present in `PublicTenantConfig.business` or may be omitted; the type uses `null` but backend behavior is not fully specified.

---

### 3.2 Feature Flags

#### Full list (19 total)

From `FeatureContext.tsx` and `tenant-features.service.ts`:

| Category   | Flag                 | Type    | Default |
| ---------- | -------------------- | ------- | ------- |
| E-Commerce | `ecommerceEnabled`   | boolean | `true`  |
| E-Commerce | `refurbishedGrading` | boolean | `true`  |
| E-Commerce | `wishlistEnabled`    | boolean | `true`  |
| E-Commerce | `stockNotifications` | boolean | `true`  |
| E-Commerce | `couponsEnabled`     | boolean | `true`  |
| Repairs    | `repairsEnabled`     | boolean | `true`  |
| Repairs    | `quoteOnRequest`     | boolean | `false` |
| Repairs    | `mailInRepairs`      | boolean | `false` |
| Repairs    | `walkInQueue`        | boolean | `false` |
| Tickets    | `ticketsEnabled`     | boolean | `true`  |
| Tickets    | `liveChatWidget`     | boolean | `true`  |
| Invoicing  | `invoicingEnabled`   | boolean | `true`  |
| Invoicing  | `vatCalculation`     | boolean | `true`  |
| Invoicing  | `pdfGeneration`      | boolean | `true`  |
| Inventory  | `inventoryEnabled`   | boolean | `true`  |
| Inventory  | `advancedInventory`  | boolean | `false` |
| Team       | `employeeManagement` | boolean | `false` |
| Team       | `maxAdminUsers`      | number  | `1`     |
| Analytics  | `analyticsEnabled`   | boolean | `true`  |

#### Parent-child hierarchy

```
ecommerceEnabled
├── refurbishedGrading
├── wishlistEnabled
├── stockNotifications
└── couponsEnabled

repairsEnabled
├── quoteOnRequest
├── mailInRepairs
└── walkInQueue

ticketsEnabled
└── liveChatWidget

invoicingEnabled
├── vatCalculation
└── pdfGeneration

inventoryEnabled
└── advancedInventory
```

#### Enforcement rules (explicit)

* `isFeatureEnabled(features, feature)` returns `false` if the parent is `false`.
* `FeatureProvider` fetches flags from `GET /api/tenant/features` (via SWR) and caches for 60s.
* On error, `useFeatures()` returns `DEFAULT_FEATURES` with a warning (graceful degradation).
* If used outside `FeatureProvider`, returns `DEFAULT_FEATURES` with a warning.

#### Backend defaults when no tenant context (partial)

Tenant backend fragment states default feature flags (when no tenant):

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

**CONFLICT / UNKNOWN**:

* Frontend `FeatureFlags` includes 19 flags with defaults.
* Backend “no tenant” default object lists only 6 flags.
* **UNKNOWN**: Whether backend returns omitted flags as defaults, omits them entirely, or returns a different structure in practice.

---

### 3.3 Tenant Isolation & Security Model

#### Tenant scoping mechanism (documented)

* Tenant middleware resolves tenant from Host header and sets `request.tenantId`.
* `@TenantId()` decorator extracts `request.tenantId`.
* Services are expected to scope Prisma queries using `tenantId`.

Example (documented pattern):

```typescript
findAll(tenantId: string) {
    return this.prisma.appointment.findMany({
        where: { tenantId }  // ← Always filtered
    });
}
```

#### Guards and decorators (overview)

* Guards: `JwtAuthGuard`, `RolesGuard`, `OwnerGuard`
* Decorators: `@Roles(...)`, `@TenantId()`, `@CurrentTenant()`

#### Known gaps / risks (explicitly documented)

* `RolesGuard` checks role only and does **not** verify tenant membership:

  * “RolesGuard only checks role, NOT tenant membership”
* Cross-tenant query prevention relies on service layer `where: { tenantId }` usage.
* No guard-level tenant validation is visible.
* `OrdersController` admin endpoints: **no guards** visible.
* Repairs admin endpoints: JWT guard only (no RolesGuard) ⇒ any authenticated user may access admin endpoints (CUSTOMER/STAFF/ADMIN).
* Repairs controller: tenant isolation not enforced in visible controller code; import logic queries `tenantId: null`, suggesting a shared global catalog model.

---

## 4. Frontend Documentation

### 4.1 Frontend Core

#### API client (`api.ts`)

##### Token handling

```typescript
function saveToken(token: string): void
// Stores token in localStorage.accessToken

function removeToken(): void
// Removes localStorage.accessToken

function getToken(): string | null
// Returns localStorage.accessToken or null (SSR-safe)

function isAuthenticated(): boolean
// Returns true if token exists
```

##### Admin token helper functions

```typescript
async function adminFetch(endpoint: string, options?: RequestInit): Promise<Response>
// Uses localStorage.adminAccessToken
// Auto-prefixes with /api if needed
// Auto-adds Content-Type: application/json for JSON body

function getAdminHeaders(): Record<string, string>
// Returns { Authorization: `Bearer ${adminAccessToken}` } or {}
```

##### ApiClient class (`api` singleton) — endpoints and methods

Auth:

| Method                                    | Endpoint                             | Returns                |
| ----------------------------------------- | ------------------------------------ | ---------------------- |
| `register(email, password, name, phone?)` | POST `/api/auth/register`            | `AuthResponse`         |
| `login(email, password)`                  | POST `/api/auth/login`               | `AuthResponse`         |
| `verifyEmail(token)`                      | POST `/api/auth/verify-email`        | `MessageResponse`      |
| `resendVerification(email)`               | POST `/api/auth/resend-verification` | `MessageResponse`      |
| `forgotPassword(email)`                   | POST `/api/auth/forgot-password`     | `MessageResponse`      |
| `resetPassword(token, password)`          | POST `/api/auth/reset-password`      | `MessageResponse`      |
| `getMe()`                                 | GET `/api/auth/me`                   | `AuthResponse['user']` |
| `getGoogleAuthUrl(returnUrl)`             | —                                    | `string` (URL)         |

Products:

| Method                           | Endpoint                         | Returns            |
| -------------------------------- | -------------------------------- | ------------------ |
| `getProducts(params?)`           | GET `/api/products`              | `ProductsResponse` |
| `getFeaturedProducts(limit?)`    | GET `/api/products/featured`     | `Product[]`        |
| `getProduct(idOrSlug)`           | GET `/api/products/{id}`         | `Product`          |
| `getBrands()`                    | GET `/api/products/brands`       | `string[]`         |
| `getRelatedProducts(id, limit?)` | GET `/api/products/{id}/related` | `Product[]`        |
| `createProduct(data)`            | POST `/api/products`             | `Product`          |
| `updateProduct(id, data)`        | PUT `/api/products/{id}`         | `Product`          |
| `deleteProduct(id)`              | DELETE `/api/products/{id}`      | `void`             |

Categories:

| Method                     | Endpoint                      | Returns      |
| -------------------------- | ----------------------------- | ------------ |
| `getCategories()`          | GET `/api/categories`         | `Category[]` |
| `getCategory(idOrSlug)`    | GET `/api/categories/{id}`    | `Category`   |
| `createCategory(data)`     | POST `/api/categories`        | `Category`   |
| `updateCategory(id, data)` | PUT `/api/categories/{id}`    | `Category`   |
| `deleteCategory(id)`       | DELETE `/api/categories/{id}` | `void`       |

Upload:

| Method                | Endpoint                  | Returns          |
| --------------------- | ------------------------- | ---------------- |
| `uploadImage(file)`   | POST `/api/upload/image`  | `{ url, key }`   |
| `uploadImages(files)` | POST `/api/upload/images` | `{ url, key }[]` |

Orders:

| Method                         | Endpoint                     | Returns                      |
| ------------------------------ | ---------------------------- | ---------------------------- |
| `createCheckout(data)`         | POST `/api/orders/checkout`  | `{ checkoutUrl, sessionId }` |
| `getOrderBySession(sessionId)` | GET `/api/orders/by-session` | Order object                 |
| `getMyOrders(email)`           | GET `/api/orders/my-orders`  | Order[]                      |
| `getOrderById(id)`             | GET `/api/orders/{id}`       | Order object                 |

Appointments:

| Method                | Endpoint                   | Returns       |
| --------------------- | -------------------------- | ------------- |
| `getMyAppointments()` | GET `/api/appointments/my` | Appointment[] |

##### Types exported (selected)

```typescript
interface AuthResponse {
    accessToken: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        emailVerified: boolean;
        avatar?: string;
        phone?: string;
    };
}
```

(Additional `Product`, `Category`, query params, and error types are defined in source fragments.)

##### Tenant access pattern (explicit)

* All requests use relative URLs (empty `API_URL`)
* Requests go through Next.js rewrite proxy
* Host header preserved for multi-tenant resolution
* `credentials: 'include'` always set for cookie-based auth

##### Invariants (explicit)

1. Token is NEVER sent if value is `'cookie-based'`
2. All requests include `credentials: 'include'`
3. Non-OK responses throw `ApiError`
4. SSR-safe localStorage access guarded by `typeof window !== 'undefined'`

#### Feature context (`FeatureContext.tsx`)

* Fetches: `GET /api/tenant/features` (SWR, 60s cache)
* Default flags are used while loading and on error (`DEFAULT_FEATURES`)
* `isFeatureEnabled` enforces parent-child hierarchy

#### UI configuration (`useUIConfig.ts`)

* Fetches: `GET /api/tenant/ui-config` (SWR, 60s cache)
* Falls back to `DEFAULT_UI_CONFIG` (Dutch labels for `REPAIR_SHOP`)
* `interpolate(template, values)` replaces `{key}` placeholders

**UIConfig type excerpt**:

```typescript
interface UIConfig {
    vertical: TenantVertical;
    marquee: MarqueeItem[];
    footer: FooterConfig;
    formatting: FormattingConfig;
    labels: UILabels;
}
```

#### Image utilities (`image-utils.ts`)

Key functions:

```typescript
function getImageUrl(url: string | null | undefined): string
function getLocalImageUrl(productionUrl: string): string
function getProductionImageUrl(localUrl: string): string
function isDevelopment(): boolean
function getImageFallbackUrl(currentSrc: string): string | null
```

Constants:

```typescript
const PRODUCTION_STORAGE_PATH = '/storage';
const LOCAL_MINIO_URL = 'http://localhost:9000';
const PRODUCTION_MINIO_URL = process.env.NEXT_PUBLIC_MINIO_URL || '/storage';
```

Invariants (explicit):

1. Returns empty string for null/undefined input
2. Returns original URL if parsing fails
3. `isDevelopment()` is SSR-safe (checks `process.env.NODE_ENV` on server)

#### localStorage keys (shared core)

| Key                | Purpose   | Consumer                |
| ------------------ | --------- | ----------------------- |
| `accessToken`      | User JWT  | `api.ts`                |
| `adminAccessToken` | Admin JWT | `api.ts`, `adminApi.ts` |

#### SWR cache configuration (explicit)

| Hook            | Endpoint                | Cache Duration | Revalidation             |
| --------------- | ----------------------- | -------------- | ------------------------ |
| `useFeatures()` | `/api/tenant/features`  | 60s            | Never on focus/reconnect |
| `useUIConfig()` | `/api/tenant/ui-config` | 60s            | Never on focus/reconnect |

---

### 4.2 Public Frontend (Customer)

#### TenantProvider / Tenant configuration provider

**Purpose**

* Fetches public tenant configuration from `/api/tenant/config` on mount
* Applies theme CSS variables to `document.documentElement`
* Sets `document.title` from `branding.shopName`
* Provides `PublicTenantConfig` via React Context

**Inputs**

* `children` (React children)

**Outputs**

* React Context value: `PublicTenantConfig`

**Side effects**

* Applies CSS variables:

  * `--primary-color`, `--brand-color`, `--secondary-color`, `--accent-color`, `--radius`
* Adds/removes `.dark` class on `<html>` based on `branding.darkMode`
* Sets `document.title`

**API calls**

```
GET /api/tenant/config
Headers: Accept: application/json
Credentials: include
```

**Validation**

* Response must contain `tenantId` or throws error.

**Components**

| Component               | Purpose                                                           |
| ----------------------- | ----------------------------------------------------------------- |
| `TenantProvider`        | Context provider, fetches config, applies theme, renders children |
| `TenantLoadingSkeleton` | Spinner shown during config fetch                                 |
| `TenantErrorDisplay`    | Error UI with retry button                                        |

**UI invariants**

1. Children never render until config fetch completes
2. Loading state shows spinner, never blank screen
3. Error state provides retry mechanism
4. Theme CSS variables applied synchronously after fetch

**Unknowns**

* None stated for `TenantProvider` behavior beyond what is listed above.

#### Hook: `useTenant()`

```typescript
export function useTenant(): PublicTenantConfig;
```

* Purpose: access tenant configuration from context.
* Throws: error if called outside `TenantProvider`.
* Side effects: none.

#### Hook: `useTenantOptional()`

```typescript
export function useTenantOptional(): PublicTenantConfig | null;
```

* Purpose: access config or `null` if not loaded.
* Throws: never.
* Side effects: none.

---

#### Hook: `useBookingFlow()`

**Purpose**

* State machine for 6-step repair booking wizard
* Fetches repair catalog data (device types → brands → devices → services)
* Fetches available time slots for selected date
* Submits appointment creation request

**Inputs**

* None documented as parameters.

**Outputs**
Returns state + actions, including:

* `step` (`BookingStep` enum 0–5)
* `selections` (`deviceType`, `brand`, `device`, `repair`, `date`, `timeSlot`)
* `customerData` (name, email, phone, notes)
* `deviceTypes`, `brands`, `devices`, `repairs`
* `availableSlots`, `availableDates`
* `canGoNext`, `isLoading`, `isSubmitting`, `isSuccess`, `error`
* Actions: `selectDeviceType`, `selectBrand`, `selectDevice`, `selectRepair`, `selectDate`, `selectTimeSlot`, `goBack`, `goNext`, `submit`, `reset`

**API calls**

| Function                    | Endpoint                                              | Method |
| --------------------------- | ----------------------------------------------------- | ------ |
| `fetchDeviceTypes()`        | `/api/repairs/device-types`                           | GET    |
| `fetchBrands(slug)`         | `/api/repairs/brands?deviceType={slug}`               | GET    |
| `fetchDevices(slug)`        | `/api/repairs/devices?brand={slug}`                   | GET    |
| `fetchRepairServices(slug)` | `/api/repairs/services/{slug}`                        | GET    |
| `fetchAvailableSlots(date)` | `/api/appointments/available-slots?date={YYYY-MM-DD}` | GET    |
| `createAppointment(data)`   | `/api/appointments/authenticated`                     | POST   |

**Fallback behavior**

* If `/api/appointments/authenticated` returns 401, falls back to `/api/appointments`
* If device types fetch fails, returns hardcoded fallback: `[Smartphone, Tablet]`
* If slots fetch fails, returns `DEFAULT_TIME_SLOTS`

**Tenant dependencies**

* `closedDays` is passed to `getAvailableDates()` and defaults to `[0]` (Sunday) if not provided.
* TenantConfig fields are not directly referenced in these files.

**Side effects**

* Uses `localStorage.getItem('accessToken')` (auth token storage mechanism referenced by booking flow).

**UI invariants**

1. Step can only advance when current step validation passes
2. Downstream selections reset when upstream selection changes
3. Time slot resets when date changes
4. Submit requires: device, repair, date, slot, name, email, phone

**Unknowns**

* Backend appointment slot calculation
* Appointment scheduling logic (beyond endpoints)
* Full DTO schemas used by backend for booking flow endpoints

---

#### Chat widget: `FeatureAwareChatWidget` + `useChatWidget()`

**Purpose**

* Real-time support chat with Socket.io
* Loads customer tickets by session ID
* Creates new tickets, sends messages (with attachments), receives real-time updates

**Feature dependencies**

* `FeatureAwareChatWidget` gates rendering:

  * Requirement 1: `ticketsEnabled === true`
  * Requirement 2: `liveChatWidget === true`
* If either is false: returns `null` (component does not mount)

**Hook: `useChatWidget()` outputs**
State includes:

* `isOpen`, `view` (`'list' | 'new' | 'chat'`), `isConnected`, `isLoading`
* `tickets`, `activeTicket`, `activeTickets`, `closedTickets`, `hasActiveTickets`
* `form` (`NewTicketForm`), `isFormValid`
* `input` (`ChatInputState`), `canSend`
* `categories` (`DEFAULT_CATEGORIES`)

Actions include:

* `setIsOpen`, `setView`, `loadTickets`, `createTicket`, `sendMessage`
* `openTicket`, `handleFileUpload`, `removeAttachment`, `cancelUpload`, `goBack`

**API calls**

| Endpoint                           | Method | Purpose                 |
| ---------------------------------- | ------ | ----------------------- |
| `/api/tickets/session/{sessionId}` | GET    | Load customer's tickets |
| `/api/tickets`                     | POST   | Create new ticket       |
| `/api/tickets/{id}/messages`       | POST   | Send message            |
| `/api/upload`                      | POST   | Upload file attachment  |

**Socket.io events**

| Event            | Direction | Payload                 |
| ---------------- | --------- | ----------------------- |
| `join:session`   | Emit      | `{ sessionId }`         |
| `ticket:message` | Receive   | `{ ticketId, message }` |
| `ticket:update`  | Receive   | `{ ticketId, status? }` |

**Session management (localStorage)**

* `chat_session_id`
* `chat_customer_name`
* `chat_customer_email`

**Socket server URL**

* `process.env.NEXT_PUBLIC_API_URL` or defaults to `http://localhost:3001`

**Types (from `./types`)**

```typescript
type ChatView = 'list' | 'new' | 'chat';

interface Attachment {
    id?: string;
    name: string;
    url: string;
    size: number;
    type: string;
    preview?: string;
}

interface Message {
    id?: string;
    content: string;
    isAdmin: boolean;
    createdAt: string | Date;
    attachments?: Attachment[];
}

interface Ticket {
    id: string;
    ticketNumber: string;
    subject: string;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
    category: string;
    customerName: string;
    customerEmail: string;
    sessionId: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}

interface NewTicketForm {
    name: string;
    email: string;
    subject: string;
    category: string;
    message: string;
    attachments: Attachment[];
}

interface ChatInputState {
    content: string;
    attachments: Attachment[];
    isUploading: boolean;
    uploadProgress: number;
}
```

**DEFAULT_CATEGORIES**

```typescript
[
    { id: "REPAIR_QUESTION", label: "Reparatie vraag", icon: "🔧", color: "from-orange-500 to-amber-500" },
    { id: "ORDER_QUESTION", label: "Bestelling vraag", icon: "📦", color: "from-blue-500 to-cyan-500" },
    { id: "PRICE_QUOTE", label: "Prijs offerte", icon: "💰", color: "from-emerald-500 to-green-500" },
    { id: "GENERAL", label: "Algemene vraag", icon: "❓", color: "from-violet-500 to-purple-500" },
    { id: "DISPUTE", label: "Geschil", icon: "⚠️", color: "from-red-500 to-rose-500" },
    { id: "REFUND", label: "Terugbetaling", icon: "💸", color: "from-orange-500 to-red-500" },
]
```

**Tenant dependencies**

* Feature flags: `ticketsEnabled`, `liveChatWidget` via `useFeatures()`
* Socket connection only established if NOT on `/admin/*` route
* One fragment lists `contact.whatsappNumber` as a tenant dependency for `useChatWidget`; the chat widget fragments otherwise describe feature gating and session behavior. **UNKNOWN**: how `whatsappNumber` is used inside chat widget based on provided text.

**UI invariants**

1. Widget must not mount if either feature flag is false
2. Socket connection only established if NOT on `/admin/*` route
3. Most recent active ticket auto-opens when widget opens
4. Messages scroll to bottom on new message

---

#### Cart store (Zustand): `useCartStore()`

**Purpose**

* Client-side cart management and persistence

**Inputs**

* Actions accept `CartItem` and IDs; no hook parameters documented.

**Outputs**
State:

* `items: CartItem[]`

Actions:

* `addItem(item, quantity?)`
* `removeItem(id)`
* `updateQuantity(id, quantity)` (removes if ≤ 0)
* `clearCart()`
* `getTotal()`
* `getItemCount()`

**Types**

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

**Side effects**

* Persists to `localStorage` under key `cart-storage`

**Tenant dependencies**

* None (tenant-agnostic in implementation)

**UI invariants**

1. Cart persists across reloads via localStorage
2. Quantity ≤ 0 results in item removal

**Unknowns**

* Zustand persist middleware implementation details

---

#### Hook: `useCheckout()`

**Purpose**

* Checkout form state (contact/address), coupon validation, totals calculation, Stripe checkout redirect
* Prefills form from authenticated user (if logged in)

**Outputs**
State includes:

* `items`, `isEmpty`, `formData`, `phonePrefix` (default: `"+32"`), `isLoggedIn`
* `couponCode`, `appliedDiscount`, `couponError`, `couponLoading`
* `subtotal`, `shipping`, `discount`, `total`
* `isLoading`, `error`

Form fields:

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

Actions:

* `setFormData(setter)`
* `setPhonePrefix(prefix)`
* `setCouponCode(code)`
* `validateCouponCode()`
* `removeCoupon()`
* `submit()` (creates checkout session, redirects to Stripe)

**API usage (via `checkoutApi`)**

* `api.getMe()` to prefill user data (if authenticated)
* `validateCoupon(code, subtotal, email?, productIds)` → POST `/api/discounts/validate`
* `createCheckoutSession(data)` (endpoint not listed in the checkout fragment, but function name is stated)

**Resolved dependencies**

* `COUNTRY_CODES`:

```typescript
["+32", "+31", "+33", "+49"]  // BE, NL, FR, DE
```

* `DiscountValidation`:

```typescript
interface DiscountValidation {
    valid: boolean;
    code?: string;
    type?: 'PERCENTAGE' | 'FIXED';
    value?: number;
    id?: string;
    error?: string;
}
```

* Shipping calculation:

  * `calculateShipping(country)` returns `SHIPPING_RATES.BE` (€4.99) or `SHIPPING_RATES.DEFAULT` (€7.99)

**Tenant dependencies**

* None explicitly referenced in this file.

**UI invariants**

1. On successful checkout, browser redirects to `response.checkoutUrl`
2. Form prefilled from auth on mount (if logged in)
3. Coupon validation requires non-empty code

**Unknowns**

* `checkoutApi.ts` implementation details beyond what is listed
* Stripe backend integration details

---

#### Storefront components (`components/storefront/`)

**Known files (implementations not read)**

| File                    | Purpose (inferred from name) |
| ----------------------- | ---------------------------- |
| `cart-drawer.tsx`       | Slide-out cart panel         |
| `category-tabs.tsx`     | Category navigation tabs     |
| `featured-products.tsx` | Featured products section    |
| `filter-sidebar.tsx`    | Product filter sidebar       |
| `index.ts`              | Module exports               |
| `product-card.tsx`      | Individual product card      |
| `product-grid.tsx`      | Product grid layout          |

**Unknowns**

* Component implementations
* Props, hooks used, tenant dependencies

---

### 4.3 Admin Frontend (Tenant Admin)

#### Authentication & authorization (`useAdmin.ts`, `admin-layout.tsx`)

**Purpose**

* Validates JWT from `localStorage.adminAccessToken`
* Decodes JWT payload to extract role
* Enforces `ADMIN` or `STAFF` role
* Redirects to `/admin/login` on failure
* Provides logout

**Hook: `useAdminAuth()`**
State:

* `isAuthenticated`, `isLoading`, `user`, `logout`

User type:

```typescript
interface AdminUser {
    username: string;
    role: 'ADMIN' | 'STAFF';
}
```

Role constraints (visible)

* JWT payload `role` must be `"ADMIN"` or `"STAFF"` for admin access
* Otherwise redirect to `/admin/login?error=unauthorized`
* No visible distinction between ADMIN and STAFF in layout navigation

localStorage keys:

| Key                | Purpose                               |
| ------------------ | ------------------------------------- |
| `adminAccessToken` | JWT token for admin API calls         |
| `adminAuth`        | JSON object with username for display |
| `accessToken`      | Also cleared on logout (legacy?)      |

UI invariants:

1. `/admin/login` skips auth check
2. Spinner shown until auth check completes
3. If not authenticated, component returns `null` (no flash of content)

Unknowns:

* `removeToken()` from `@/lib/api` implementation
* Backend JWT issuance/validation details for admin tokens

---

#### Layout & navigation (`AdminLayout`, `AdminSidebar`)

**Responsibilities**

1. Renders collapsible sidebar with feature-flag-gated navigation
2. Authenticates user before rendering children
3. Polls for new orders every 15 seconds
4. Displays new order notifications with sound

Feature flags used in navigation gating:

| Flag               | Effect                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------- |
| `ecommerceEnabled` | Shows Bestellingen, Terugbetalingen, Producten, Galerij, Kortingscodes, Banners, Verzending |
| `repairsEnabled`   | Shows Afspraken, Prijzen & Services, Toestellen Beheren                                     |
| `ticketsEnabled`   | Shows Support Tickets                                                                       |
| `invoicingEnabled` | Shows Facturen                                                                              |
| `inventoryEnabled` | Shows Voorraadbeheer                                                                        |

Navigation structure (when all features enabled):

| Section    | Items                                                |
| ---------- | ---------------------------------------------------- |
| (No title) | Dashboard                                            |
| Verkoop    | Bestellingen, Terugbetalingen, Producten, Galerij    |
| Reparaties | Afspraken, Prijzen & Services, Toestellen Beheren    |
| Klanten    | Gebruikers, Support Tickets, Marketing               |
| Promoties  | Kortingscodes, Banners                               |
| Logistiek  | Voorraadbeheer, Verzending                           |
| Systeem    | Facturen, Instellingen, Export Data, Activiteitenlog |

UI invariant (comment):

* “Admin should never see a tab they cannot open”

Order polling:

* Polls `GET /api/orders/admin/all` every 15 seconds
* Compares order IDs to detect new orders
* On new order: toast notification + sound (if enabled)
* Clicking navigates to `/admin/orders/{id}`
* Not polled on first load

Unknowns:

* `useFeatures()` implementation details beyond those stated in §4.1

---

#### Admin API client (`lib/admin/adminApi.ts`)

**Responsibilities**

1. Centralized authenticated fetch wrapper
2. Admin token storage
3. Defines typed interfaces for admin entities

`adminFetch<T>(endpoint, options): Promise<T>`

* Adds Authorization header from `adminAccessToken`
* Includes credentials
* Parses JSON
* Throws `AdminApiError` on non-OK response
* Returns `undefined` on 204 No Content

`adminApi` methods:

* Generic CRUD: `getAll`, `getOne`, `create`, `update`, `delete`
* Domain-specific endpoints used:

  * Orders: `/api/orders/admin/*`, `/api/orders/bulk/*`
  * Users: `/api/users/admin/*`
  * Appointments: `/api/appointments/*`
  * Discounts: `/api/discounts/*`
  * Refunds: `/api/refunds/admin/*`
  * Audit logs: `/api/audit-logs`

Entity types defined (excerpt):

```typescript
interface AdminOrder { /* fields as provided in fragments */ }
interface AdminUser { /* fields as provided in fragments */ }
interface AdminAppointment { /* fields as provided in fragments */ }
interface AdminDiscount { /* fields as provided in fragments */ }
interface AdminRefund { /* fields as provided in fragments */ }
interface AdminAuditLog { /* fields as provided in fragments */ }
```

Unknowns:

* Actual backend response shapes may differ from frontend types
* Error handling by consuming hooks varies

---

#### Repair catalog management (`app/admin/repairs`, `useRepairsCatalog`)

**Responsibilities**

* Visualization: metrics and lists of device types, brands, devices, service types
* Bulk import: parse/upload `devices.json`
* Authenticated admin fetch wrapper usage (`adminFetch`)

Reads (public fetch):

* `/api/repairs/device-types`
* `/api/repairs/brands`
* `/api/repairs/devices`
* `/api/repairs/service-types`

Writes (protected via `adminFetch`):

* `POST /api/repairs/admin/import`

Role constraints (visible)

* Write operations require token in `localStorage.adminAccessToken` (injected by `adminFetch`)
* UI does not distinguish ADMIN vs STAFF; access is presumed elsewhere (routing/backend), **UNKNOWN**

UI invariants

* Import sets `isImporting`, locks UI until completion
* Import results remain visible until new file selection/unmount
* Token persists across sessions until removed

Unknowns

* Login flow for setting `adminAccessToken` is not covered
* Backend validation schemas not provided for device types/brands/devices/services

---

#### Orders module (`useOrders.ts`)

**Responsibilities**

* Order list fetch & display
* Polling for new orders (15s)
* Filtering/search
* Bulk status updates
* Print shipping labels

API calls:

* `GET /api/orders/admin/all` (refresh)
* `PATCH /api/orders/bulk/status` (bulk update)
* `POST /api/orders/bulk/labels` (print labels)

UI invariants:

1. Sorted by `createdAt` desc
2. New order highlight clears after 30s
3. Sound only for orders arriving after initial load
4. Search matches orderNumber, customerName, customerEmail

Unknowns:

* Full order detail shape vs list item is partial
* Label printing response format is not fully specified beyond “shape shown in inline HTML” (exact HTML not provided)

---

#### Tickets module (`useTickets.ts` — admin)

**Responsibilities**

* Fetch ticket list
* Filter by status/search
* Select/view details
* Send replies
* Update status

API calls:

* `GET /api/tickets` (refresh)
* `POST /api/tickets/{id}/reply` (send reply)
* `PATCH /api/tickets/{id}` (update status)

Types (admin hook):

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

UI invariants:

1. Search matches ticketNumber, subject, customerName
2. After reply/status update, list refetched
3. Sending returns boolean for success/failure handling

Role constraints:

* No ADMIN vs STAFF distinction visible; all actions available to any authenticated user in frontend.

Unknowns:

* Admin-side real-time socket updates are not covered

---

#### Admin pages structure (`/app/admin/`)

Known routes (implementations not read):

* `/admin`, `/admin/appointments`, `/admin/audit-logs`, `/admin/banners`, `/admin/devices`, `/admin/discounts`, `/admin/export`, `/admin/gallery`, `/admin/inventory`, `/admin/invoice`, `/admin/login`, `/admin/marketing`, `/admin/orders`, `/admin/orders/[id]`, `/admin/products`, `/admin/products/[id]`, `/admin/products/new`, `/admin/products/new-ai`, `/admin/refunds`, `/admin/repairs`, `/admin/settings`, `/admin/shipping`, `/admin/tickets`, `/admin/users`

Unknowns:

* Page implementations
* Route guards per page
* Feature flag enforcement per page (beyond sidebar gating)

---

## 5. Backend Documentation

### 5.1 Authorization & Guards

#### JwtAuthGuard

* Purpose (as stated in platform docs): validates JWT token.
* Used as `JwtAuthGuard` in several controllers (e.g., repairs admin endpoints; owner controller uses `JwtAuthGuard`).
* **UNKNOWN**: Implementation details (strategy, validation, request.user shape) are not included.

#### AuthGuard('jwt')

* Used as `AuthGuard('jwt')` in multiple controllers (e.g., users, products, tickets, appointments).
* **UNKNOWN**: Relationship/aliasing between `JwtAuthGuard` and `AuthGuard('jwt')` across modules.

#### `@Roles(...roles)` decorator

```typescript
export const Roles = (...roles: (UserRole | string)[]) => SetMetadata(ROLES_KEY, roles);
```

#### RolesGuard

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

Behavior (explicit):

* If no `@Roles()` decorator: allows
* Requires `user.role` matches any required role
* Does not verify user belongs to current tenant

#### Tenant decorators

* `@TenantId()` extracts `request.tenantId`
* `@CurrentTenant()` returns full tenant context object (`request.tenant`)

#### OwnerGuard

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

Requirements:

| Condition       | Required value        | Error                            |
| --------------- | --------------------- | -------------------------------- |
| `user` exists   | truthy                | “Authentication required”        |
| `user.role`     | `'OWNER'`             | “Owner access required”          |
| `user.tenantId` | `null` or `undefined` | “Platform-level access required” |

Invariants:

1. All owner endpoints must use `OwnerGuard`
2. OWNER role alone is insufficient — `tenantId` must be null
3. This is the only guard allowing platform-wide data access

#### Guard ordering rules (explicit)

* `AuthGuard('jwt')` must precede `RolesGuard`:

  1. `AuthGuard('jwt')` validates JWT and populates `request.user`
  2. `RolesGuard` checks `user.role` against `@Roles()` metadata

---

### 5.2 Tenant-Scoped APIs

> “Tenant-scoped” below refers to APIs that operate within a tenant context resolved by middleware (Host header → `req.tenantId`) unless explicitly stated otherwise.

#### Tenant configuration controller (`tenant.controller.ts`) — public endpoints

Responsibilities:

1. Provide public tenant configuration from Host header
2. Provide tenant feature flags
3. Provide tenant UI configuration

Endpoints:

| Method | Path                | Auth | Public | Purpose                          |
| ------ | ------------------- | ---- | ------ | -------------------------------- |
| GET    | `/tenant/config`    | None | Yes    | Get current tenant configuration |
| GET    | `/tenant/context`   | None | Yes    | Get full tenant context object   |
| GET    | `/tenant/features`  | None | Yes    | Get tenant feature flags         |
| GET    | `/tenant/ui-config` | None | Yes    | Get UI configuration             |

Tenant isolation mechanism:

* Tenant resolved from `req.tenantId`
* If no tenant context, returns defaults or null

Defaults (explicit):

* Default feature flags when no tenant: see §3.2 (partial object)
* Default UI config when no tenant: `uiConfigService.getVerticalDefaults('REPAIR_SHOP')`

Unknowns:

* `TenantService.getPublicConfig(tenantId)` query behavior
* `TenantFeaturesService.getFeatures(tenantId)` query behavior
* `UIConfigService.getPublicUIConfig(tenantId)` query behavior

---

#### Repairs catalog controller (`repairs.controller.ts`)

Responsibilities:

1. Serve repair catalog (device types, brands, devices, services)
2. CRUD for repair catalog entities (admin)
3. Import from JSON (admin)

Public endpoints (no auth):

* `GET /repairs/device-types`
* `GET /repairs/device-types/:slug`
* `GET /repairs/brands` (optional `?deviceType=`)
* `GET /repairs/brands/:slug`
* `GET /repairs/devices` (optional `?brand=`)
* `GET /repairs/devices/:slug`
* `GET /repairs/services/:deviceSlug`
* `GET /repairs/service-types`

Tenant isolation notes (explicit):

* Tenant isolation is not enforced in visible controller code (no `@TenantId()` used).
* Service methods may accept `tenantId` optionally, but controller does not pass it in visible snippets.
* Import logic queries `tenantId: null`, suggesting shared global catalog.

Invariants (explicit):

1. Public endpoints filter `isActive: true` and order by `sortOrder: 'asc'`
2. Slug consistency: service slugs normalized in `createServiceSlug`
3. Import ensures ‘smartphone’ and ‘tablet’ device types always exist

Side effects (explicit):

* Asset URL resolution: `MINIO_PUBLIC_URL` prepended to relative paths (default: `https://images.smartphoneservice.be`)
* Brand logo mapping uses known brand names to filenames; others use kebab-case filename mapping

Unknowns:

* `RepairsService` implementation
* Whether repairs are tenant-scoped or global in all modes (only import explicitly uses `tenantId: null`)

---

#### Support tickets controller (`tickets.controller.ts`) — public endpoints

Public endpoints (no auth):

| Method | Path                          | Purpose                   |
| ------ | ----------------------------- | ------------------------- |
| POST   | `/tickets`                    | Create support ticket     |
| GET    | `/tickets/session/:sessionId` | Get tickets by session ID |
| GET    | `/tickets/case/:caseId`       | Get ticket by case ID     |
| POST   | `/tickets/:id/messages`       | Add message to ticket     |

Tenant scoping:

* Endpoints use `@TenantId() tenantId: string`; service calls include tenantId

Invariants:

1. Tickets identified by session ID OR case ID
2. Public message submission allowed (no auth)

Unknowns:

* DTO structures: `CreateTicketDto`, `AddMessageDto`
* Socket.io integration details beyond event names listed in §4.2

---

#### Discounts controller (`discounts.controller.ts`) — public endpoint

Public endpoint:

| Method | Path                  | Auth | Purpose                |
| ------ | --------------------- | ---- | ---------------------- |
| POST   | `/discounts/validate` | None | Validate discount code |

Unknowns:

* `ValidateDiscountDto` structure
* Discount calculation and usage tracking logic

---

#### Categories controller (`categories.controller.ts`) — public endpoints

Public endpoints:

| Method | Path                    | Purpose             |
| ------ | ----------------------- | ------------------- |
| GET    | `/categories`           | List all categories |
| GET    | `/categories/:idOrSlug` | Get by ID or slug   |

Lookup logic (explicit):

* UUID pattern detection:

  * `/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`

Unknowns:

* `CategoriesService` implementation
* Product-category relationship

---

#### Products controller (`products.controller.ts`) — public endpoints

Public endpoints:

| Method | Path                    | Purpose                    |
| ------ | ----------------------- | -------------------------- |
| GET    | `/products`             | List products with filters |
| GET    | `/products/featured`    | Get featured products      |
| GET    | `/products/brands`      | Get all brands             |
| GET    | `/products/:id/related` | Get related products       |
| GET    | `/products/:idOrSlug`   | Get product by ID or slug  |

Unknowns:

* DTOs `ProductQueryDto` and service logic for filtering and relations

---

#### Appointments controller (`appointments.controller.ts`) — public endpoints

Public endpoints:

| Method | Path                            | Auth | Purpose                      |
| ------ | ------------------------------- | ---- | ---------------------------- |
| POST   | `/appointments`                 | None | Book appointment (anonymous) |
| POST   | `/appointments/authenticated`   | JWT  | Book with booker tracking    |
| GET    | `/appointments/available-slots` | None | Get available slots for date |
| GET    | `/appointments/my`              | JWT  | Get own appointments         |

Query parameters:

* `GET /appointments/available-slots`: `date` (YYYY-MM-DD)

Tenant scoping:

* Uses `@TenantId() tenantId: string`
* Authenticated booking extracts `bookerEmail` and `bookerName` from `req.user`

Unknowns:

* Slot calculation logic
* DTO schemas: `CreateAppointmentDto`, `UpdateAppointmentDto`
* `AppointmentStatus` enum values

---

#### Orders controller (`orders.controller.ts`) — public endpoints

Public endpoints (no auth):

| Method | Path                                 | Purpose                              |
| ------ | ------------------------------------ | ------------------------------------ |
| POST   | `/orders/checkout`                   | Create Stripe checkout session       |
| POST   | `/orders/webhook`                    | Stripe webhook handler               |
| GET    | `/orders/by-session`                 | Get order by Stripe session ID       |
| GET    | `/orders/checkout-success`           | Handle Stripe success redirect (302) |
| GET    | `/orders/checkout-cancel`            | Handle Stripe cancel redirect (302)  |
| GET    | `/orders/resolve-session/:sessionId` | Resolve order for redirect           |
| GET    | `/orders/my-orders`                  | Get orders by customer email         |
| GET    | `/orders/track/:orderNumber`         | Track order by number                |

Tenant scoping notes:

* All endpoints except webhook use `@TenantId() tenantId`
* Webhook: does not use `@TenantId()` and is excluded from tenant middleware
* Checkout success/cancel redirects do not scope to tenant

Side effects:

* Stripe API calls for checkout, webhook processing, and session resolution

Unknowns:

* `OrdersService` implementation
* Webhook signature verification behavior
* Stock decrement behavior

---

#### Auth controller (`auth.controller.ts`)

Public auth endpoints:

| Method | Path                         | Throttle | Purpose                     |
| ------ | ---------------------------- | -------- | --------------------------- |
| POST   | `/auth/register`             | 10/hour  | Register customer           |
| POST   | `/auth/login`                | 5/15min  | Customer login              |
| POST   | `/auth/admin-login`          | 3/15min  | Admin login (tenantId=null) |
| POST   | `/auth/owner-login`          | 3/15min  | Owner login (sets cookie)   |
| POST   | `/auth/logout`               | —        | Clear auth cookie           |
| POST   | `/auth/verify-email`         | —        | Verify email token          |
| POST   | `/auth/resend-verification`  | —        | Resend verification         |
| POST   | `/auth/forgot-password`      | 3/hour   | Request reset email         |
| POST   | `/auth/reset-password`       | —        | Reset with token            |
| GET    | `/auth/google`               | —        | Initiate Google OAuth       |
| GET    | `/auth/google/callback`      | —        | Handle OAuth callback       |
| POST   | `/auth/exchange`             | —        | Exchange handoff code       |
| POST   | `/auth/impersonate/exchange` | —        | Impersonation handoff       |

Protected:
| Method | Path | Auth | Purpose |
|---|---|---|
| GET | `/auth/me` | JWT | Get current user |

Cookie configuration (explicit):

```typescript
{
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // or true for tunnel
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
}
```

Tenant isolation notes:

* Customer auth uses `@TenantId() tenantId`
* Admin/owner login ignores tenant context (uses null)
* Token/handoff lookups are global

OAuth flow (explicit steps):

1. Frontend redirects to `/auth/google?tenant=domain&returnUrl=/path`
2. Backend creates state, redirects to Google
3. Google callback at `/auth/google/callback`
4. Backend creates handoff code, redirects to tenant domain
5. Frontend calls `/auth/exchange` with code to get cookie

Impersonation exchange (explicit):

* `/auth/impersonate/exchange` returns JWT including `isImpersonating: true, impersonatedBy: ownerId`

Unknowns:

* DTO structures (Register/Login/Reset/etc.)
* `AuthService` and `GoogleOAuthService` implementations
* JWT secret configuration

---

### 5.3 Admin APIs (Tenant Admin)

#### Users controller (`users.controller.ts`)

Responsibilities:

1. User listing/detail
2. Admin/staff user creation
3. Role/VIP/notes updates
4. Admin password reset
5. LTV recalculation

Endpoints:

| Method | Path                                    | Auth | Roles | Purpose                 |
| ------ | --------------------------------------- | ---- | ----- | ----------------------- |
| GET    | `/users`                                | JWT  | ADMIN | List users              |
| GET    | `/users/:id`                            | JWT  | ADMIN | Get user                |
| POST   | `/users/admin`                          | JWT  | ADMIN | Create admin/staff user |
| PATCH  | `/users/:id`                            | JWT  | ADMIN | Update user             |
| DELETE | `/users/:id`                            | JWT  | ADMIN | Delete user             |
| POST   | `/users/:id/reset-password`             | JWT  | ADMIN | Reset password          |
| PATCH  | `/users/:id/vip`                        | JWT  | ADMIN | Toggle VIP              |
| PATCH  | `/users/:id/notes`                      | JWT  | ADMIN | Update notes            |
| POST   | `/users/:id/recalculate-lifetime-value` | JWT  | ADMIN | Recalculate LTV         |

Guards (controller-level):

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
```

Tenant scoping:

* All methods receive `@TenantId() tenantId` and pass to service

DTOs:

* `UpdateUserDto` — UNKNOWN
* `AdminResetPasswordDto` — contains `newPassword`
* `CreateAdminDto` — UNKNOWN

---

#### Products controller (`products.controller.ts`) — admin endpoints

Admin endpoints:

| Method | Path                     | Auth | Roles        | Purpose        |
| ------ | ------------------------ | ---- | ------------ | -------------- |
| POST   | `/products`              | JWT  | ADMIN, STAFF | Create product |
| PUT    | `/products/:id`          | JWT  | ADMIN, STAFF | Update product |
| DELETE | `/products/:id`          | JWT  | ADMIN        | Delete product |
| GET    | `/products/admin/export` | JWT  | ADMIN, STAFF | Export CSV     |
| POST   | `/products/admin/import` | JWT  | ADMIN        | Import CSV     |

Guards (per-method):

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)  // or just ADMIN for delete/import
```

Tenant scoping:

* `@TenantId()` used; service calls include tenantId

DTOs:

* `CreateProductDto`, `UpdateProductDto`, `ProductQueryDto` — UNKNOWN

---

#### Appointments controller (`appointments.controller.ts`) — admin endpoints

Admin endpoints:

| Method | Path                | Auth | Roles        | Purpose            |
| ------ | ------------------- | ---- | ------------ | ------------------ |
| GET    | `/appointments`     | JWT  | ADMIN, STAFF | List appointments  |
| GET    | `/appointments/:id` | JWT  | ADMIN, STAFF | Get appointment    |
| PATCH  | `/appointments/:id` | JWT  | ADMIN, STAFF | Update appointment |
| DELETE | `/appointments/:id` | JWT  | ADMIN, STAFF | Delete appointment |

Guards:

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)
```

Query parameters:

* `GET /appointments`: `status`, `startDate`, `endDate`

Unknowns:

* `AppointmentsService` implementation
* DTOs and status enums

---

#### Tickets controller (`tickets.controller.ts`) — admin endpoints

Admin endpoints:

| Method | Path           | Auth | Roles        | Purpose              |
| ------ | -------------- | ---- | ------------ | -------------------- |
| GET    | `/tickets`     | JWT  | ADMIN, STAFF | List tickets         |
| GET    | `/tickets/:id` | JWT  | ADMIN, STAFF | Get ticket           |
| PATCH  | `/tickets/:id` | JWT  | ADMIN, STAFF | Update status        |
| DELETE | `/tickets/:id` | JWT  | ADMIN        | Delete closed ticket |

Guards:

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN, UserRole.STAFF)  // or ADMIN only for delete
```

Query parameters:

* `GET /tickets`: `status` (enum TicketStatus) — values UNKNOWN

DTOs:

* `CreateTicketDto`, `AddMessageDto`, `UpdateTicketDto` — UNKNOWN

---

#### Discounts controller (`discounts.controller.ts`) — admin endpoints

Admin endpoints:

| Method | Path             | Auth | Roles | Purpose         |
| ------ | ---------------- | ---- | ----- | --------------- |
| POST   | `/discounts`     | JWT  | ADMIN | Create discount |
| GET    | `/discounts`     | JWT  | ADMIN | List discounts  |
| GET    | `/discounts/:id` | JWT  | ADMIN | Get discount    |
| PATCH  | `/discounts/:id` | JWT  | ADMIN | Update discount |
| DELETE | `/discounts/:id` | JWT  | ADMIN | Delete discount |

Guards:

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
```

Tenant scoping:

* Uses `@TenantId()` and passes tenantId

DTOs:

* `CreateDiscountDto`, `UpdateDiscountDto`, `ValidateDiscountDto` — UNKNOWN

---

#### Categories controller (`categories.controller.ts`) — admin endpoints

Admin endpoints:

| Method | Path              | Auth | Roles | Purpose         |
| ------ | ----------------- | ---- | ----- | --------------- |
| POST   | `/categories`     | JWT  | ADMIN | Create category |
| PUT    | `/categories/:id` | JWT  | ADMIN | Update category |
| DELETE | `/categories/:id` | JWT  | ADMIN | Delete category |

Guards:

```typescript
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(UserRole.ADMIN)
```

Request bodies (explicit):
Create:

```typescript
{ 
    name: string;
    slug?: string;
    description?: string;
    parentId?: string;
}
```

Update:

```typescript
{
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
}
```

---

#### Repairs controller (`repairs.controller.ts`) — admin endpoints

Admin endpoints (JWT only, no RolesGuard):

* CRUD and import under `/repairs/admin/*` (full list in §5.2)

Authorization & security observation (explicit):

* Uses only `@UseGuards(JwtAuthGuard)`
* No `RolesGuard`
* Any authenticated user (CUSTOMER, STAFF, ADMIN) can access admin endpoints

Tenant scoping observation:

* No `@TenantId()` visible
* Tenant scoping may be in service layer — UNKNOWN

DTOs:

* `CreateDeviceTypeDto`, `CreateBrandDto`, `CreateRepairDeviceDto`, `CreateServiceTypeDto`, `CreateDeviceServiceDto` — described in repairs backend module fragment, but `class-validator` rules are not visible.

---

#### Orders controller (`orders.controller.ts`) — admin endpoints

Admin endpoints (as listed in fragments):

| Method | Path                  | Purpose                  |
| ------ | --------------------- | ------------------------ |
| GET    | `/orders/admin/all`   | Get all orders           |
| GET    | `/orders/:id`         | Get order by ID          |
| PATCH  | `/orders/:id`         | Update order             |
| GET    | `/orders/:id/history` | Get order status history |
| PATCH  | `/orders/bulk/status` | Bulk update status       |
| POST   | `/orders/bulk/labels` | Generate bulk labels     |

**CRITICAL security observation (explicit)**:

* No `@UseGuards()` at controller or method level
* `@ApiBearerAuth()` decorators are documentation-only
* Admin endpoints rely on frontend to send token, but backend doesn't validate

Tenant scoping:

* All endpoints except webhook use `@TenantId() tenantId`
* Success/cancel redirects do not scope to tenant

Unknowns:

* `OrdersService` implementation
* Actual status update authorization is not enforced by guards in visible code

---

#### Additional admin endpoints used by admin frontend but not documented in backend fragments

From admin frontend summary:

* Refunds: `/api/refunds/admin/*` (GET, POST process/reject)
* Audit logs: `/api/audit-logs` (GET)

**UNKNOWN**:

* Backend controllers/modules for refunds and audit logs are not included in provided backend fragments (only frontend usage is known).

---

## 6. Owner Panel Documentation

### 6.1 Owner Authorization Model

* Owner endpoints are guarded by:

```typescript
@Controller('owner')
@UseGuards(JwtAuthGuard, OwnerGuard)
```

* OwnerGuard requirements: `user.role === 'OWNER'` and `user.tenantId === null || undefined`.

### 6.2 Tenant Lifecycle Management

Owner controller tenant lifecycle endpoints:

| Method | Path                          | Purpose          | Logged |
| ------ | ----------------------------- | ---------------- | ------ |
| GET    | `/owner/tenants`              | List all tenants | No     |
| POST   | `/owner/tenants`              | Create tenant    | Yes    |
| GET    | `/owner/tenants/:id`          | Get tenant       | No     |
| PATCH  | `/owner/tenants/:id`          | Update tenant    | Yes    |
| POST   | `/owner/tenants/:id/activate` | Activate tenant  | Yes    |
| POST   | `/owner/tenants/:id/suspend`  | Suspend tenant   | Yes    |
| POST   | `/owner/tenants/:id/archive`  | Archive tenant   | Yes    |

### 6.3 Domain & Cloudflare Automation

Domain endpoints:

| Method | Path                                               | Purpose            | Logged |
| ------ | -------------------------------------------------- | ------------------ | ------ |
| POST   | `/owner/tenants/:id/domains`                       | Add domain         | Yes    |
| POST   | `/owner/tenants/:id/domains/:domainId/verify`      | Verify domain      | Yes    |
| POST   | `/owner/tenants/:id/domains/:domainId/set-primary` | Set primary domain | Yes    |
| DELETE | `/owner/tenants/:id/domains/:domainId`             | Remove domain      | Yes    |

Cloudflare automation endpoints:

| Method | Path                                 | Purpose                   | Logged      |
| ------ | ------------------------------------ | ------------------------- | ----------- |
| POST   | `.../:domainId/cloudflare/setup`     | Create CF zone            | Yes         |
| POST   | `.../:domainId/cloudflare/configure` | Configure DNS when active | Conditional |
| GET    | `.../:domainId/cloudflare/status`    | Get CF status             | No          |
| GET    | `/owner/cloudflare/verify`           | Verify API connection     | No          |

Cloudflare integration (owner-app fragment):

* `setupDomainCloudflare` initiates setup, returning nameservers
* `checkAndConfigureDomain` triggers verification
* `getDomainCloudflareStatus` supports polling for SSL/zone status

**Unknowns**

* Cloudflare API implementation on backend

### 6.4 Feature Flag Governance

Owner endpoints:

| Method | Path                                     | Purpose             | Logged |
| ------ | ---------------------------------------- | ------------------- | ------ |
| GET    | `/owner/tenants/:id/features`            | Get features        | No     |
| GET    | `/owner/tenants/:id/features/summary`    | Get grouped summary | No     |
| PATCH  | `/owner/tenants/:id/features`            | Update features     | Yes    |
| POST   | `/owner/tenants/:id/features/apply-plan` | Apply plan template | Yes    |

Plan templates:

| Plan           | Key flags                                                                            |
| -------------- | ------------------------------------------------------------------------------------ |
| `starter`      | ecommerce=false, repairs=true, tickets=false, maxAdminUsers=1                        |
| `professional` | All main features=true, maxAdminUsers=3                                              |
| `enterprise`   | All features=true, advancedInventory=true, employeeManagement=true, maxAdminUsers=10 |

Auto-seeding behavior:

* When `repairsEnabled` is set to `true` for first time:

  1. Checks if repair catalog exists
  2. If no devices exist, triggers background seeding
  3. Seeding runs non-blocking (background)

### 6.5 Configuration Authority

Config update endpoint:

| Method | Path                        | Purpose              | Logged |
| ------ | --------------------------- | -------------------- | ------ |
| PATCH  | `/owner/tenants/:id/config` | Update tenant config | Yes    |

Safety boundary (explicit):

* UI filters empty strings to `undefined` before sending `UpdateConfigDto`, preventing accidental blanking.

Updatable fields: see §3.1 (Owner Panel `UpdateConfigDto` list).

### 6.6 Impersonation

Impersonation endpoint:

* `POST /owner/impersonate` payload `{ tenantId, userId }`
* Returns `{ handoffCode, redirectUrl, user }`

Flow:

```
1. Owner selects tenant + user in Owner Panel UI
2. POST /owner/impersonate { tenantId, userId }
3. Backend returns { handoffCode, redirectUrl, user }
4. Owner Panel redirects to tenant domain with code
5. Tenant frontend exchanges code for session (see auth fragments)
```

Response type:

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

Safety notes:

* Handoff code is one-time use
* Code validated against tenant on exchange
* Cross-tenant impersonation blocked by exchange endpoint

**UNKNOWN**: How the `handoffCode` is validated on the tenant frontend beyond the existence of `/auth/impersonate/exchange` and described steps.

### 6.7 Seeding Operations

Endpoints:

| Method | Path                               | Purpose                | Logged |
| ------ | ---------------------------------- | ---------------------- | ------ |
| POST   | `/owner/tenants/:id/seed`          | Seed repair catalog    | Yes    |
| POST   | `/owner/tenants/:id/reseed`        | Clear + reseed repairs | Yes    |
| GET    | `/owner/tenants/:id/seed-stats`    | Get seeding stats      | No     |
| POST   | `/owner/tenants/:id/products/seed` | Seed demo products     | Yes    |
| DELETE | `/owner/tenants/:id/products`      | Clear all products     | Yes    |
| GET    | `/owner/products/available-count`  | Get seed product count | No     |

Owner-app capabilities (explicit):

* `seedTenant`: populates repair catalog (brands/devices/services)
* `reseedTenant`: destructive clear + re-seed
* `seedProducts`: inject products from global pool

### 6.8 Audit Logging

Logged actions:

| Action                      | Target Type | When                         |
| --------------------------- | ----------- | ---------------------------- |
| `CREATE_TENANT`             | TENANT      | Tenant created               |
| `UPDATE_TENANT`             | TENANT      | Tenant updated               |
| `ACTIVATE_TENANT`           | TENANT      | Tenant activated             |
| `SUSPEND_TENANT`            | TENANT      | Tenant suspended             |
| `ARCHIVE_TENANT`            | TENANT      | Tenant archived              |
| `ADD_DOMAIN`                | DOMAIN      | Domain added                 |
| `VERIFY_DOMAIN`             | DOMAIN      | Domain verified              |
| `SET_PRIMARY_DOMAIN`        | DOMAIN      | Primary domain set           |
| `REMOVE_DOMAIN`             | DOMAIN      | Domain removed               |
| `CLOUDFLARE_SETUP_DOMAIN`   | DOMAIN      | CF zone created              |
| `CLOUDFLARE_DNS_CONFIGURED` | DOMAIN      | DNS configured (conditional) |
| `UPDATE_CONFIG`             | CONFIG      | Tenant config updated        |
| `UPDATE_FEATURES`           | TENANT      | Features updated             |
| `APPLY_PLAN_TEMPLATE`       | TENANT      | Plan applied                 |
| `CREATE_USER`               | USER        | User created                 |
| `RESET_PASSWORD`            | USER        | Password reset               |
| `SEED_TENANT`               | TENANT      | Repair catalog seeded        |
| `RESEED_TENANT`             | TENANT      | Repair catalog reseeded      |
| `SEED_PRODUCTS`             | TENANT      | Products seeded              |
| `CLEAR_PRODUCTS`            | TENANT      | Products cleared             |

Log payload (explicit):

```typescript
await this.ownerService.logOwnerAction(
    ownerId,
    action,
    targetType,
    targetId,
    details,
    ipAddress,
    userAgent
);
```

Audit endpoints:

| Method | Path                | Purpose              | Logged |
| ------ | ------------------- | -------------------- | ------ |
| GET    | `/owner/audit-logs` | Get owner audit logs | No     |

**UNKNOWN**: Audit log storage schema and query implementation.

### 6.9 Data Authority Matrix

Owner panel data authority summary:

| Area           | Owner Can Read       | Owner Can Write                  |
| -------------- | -------------------- | -------------------------------- |
| Tenant records | All tenants          | Create, update, lifecycle        |
| Tenant domains | All domains          | Add, remove, verify, set primary |
| Tenant config  | All configs          | Update any field                 |
| Feature flags  | All flags            | Update any flag, apply plans     |
| Tenant users   | All users per tenant | Create, reset password           |
| Repair catalog | Stats only           | Seed, reseed, clear              |
| Products       | Count only           | Seed, clear                      |
| Audit logs     | All owner actions    | —                                |
| Platform stats | Aggregate stats      | —                                |

Additional explicit statements:

* Owner panel has full control over `TenantConfig`, `TenantFeatures`, `TenantDomain`.
* Write-only: tenant user password resets (`resetUserPassword`).
* Injection: can insert records into repair and product catalog tables via seed endpoints.

**Truncated source fragment (verbatim end)**

* “Users with `tenantId` values...”

---

## 7. Security Observations

### Missing guards

* `OrdersController` admin endpoints: no guards visible; `@ApiBearerAuth()` is documentation-only.
* Repairs admin endpoints: only `JwtAuthGuard` used; no `RolesGuard` ⇒ any authenticated user can mutate repair catalog.

### Tenant isolation risks

* `RolesGuard` does not verify tenant membership; only checks `user.role`.
* Cross-tenant query prevention depends on service-layer `tenantId` scoping (`where: { tenantId }`).
* No guard-level tenant validation is visible.

### Privilege boundaries

* OWNER access is gated by `OwnerGuard` requiring `role=OWNER` and `tenantId=null`.
* STAFF restrictions (explicitly documented in backend fragments):

  * STAFF can create/update products and export products.
  * STAFF cannot delete products or import products.
  * STAFF can update/delete appointments (no distinction in appointments admin endpoints).
  * STAFF cannot access user management (`UsersController` is ADMIN-only).
* Repairs admin endpoints do not enforce STAFF vs ADMIN vs CUSTOMER distinctions (JWT only).

### Explicitly documented weaknesses

* “Security Note: This controller may be missing authorization guards.” (Orders controller)
* “Any authenticated user (CUSTOMER, STAFF, ADMIN) can access admin endpoints.” (Repairs controller admin endpoints)

---

## 8. Global Invariants

### Platform-wide assumptions and rules explicitly stated

#### Tenant isolation and data access

* Cross-tenant queries must never occur (“Cross-tenant queries” listed under ❌ Never Use).
* Tenant scoping pattern: services should always include `where: { tenantId }`.

#### TypeScript and code quality constraints (AI operating rules)

❌ Never use:

* `any` type
* `// @ts-ignore`
* Hardcoded tenantId
* Direct `fetch()` in components
* Cross-tenant queries

✅ Always use:

* Strict TypeScript
* `@TenantId()` decorator
* Feature flag checks
* Existing hooks
* `class-validator` DTOs

#### Frontend architecture invariants

* “All business logic lives in hooks, UI is purely presentational”
* Booking flow pattern: component should not make direct fetch calls; hooks manage API calls.

#### Frontend core invariants

* `credentials: 'include'` always set for API requests (API client invariant)
* Token is never sent if value is `'cookie-based'`
* Non-OK responses throw `ApiError`
* SSR-safe localStorage access guard

#### Feature flag invariants

* Defaults used while loading; errors degrade gracefully to defaults
* Parent-child gating enforced by `isFeatureEnabled`

#### Admin UI invariant

* “Admin should never see a tab they cannot open” (comment)

#### Skin system constraints (status: design phase — not implemented)

* Skins cannot:

  * Make direct API calls (must use hooks)
  * Modify TenantConfig
  * Create new routes
  * Use `any` type

---

## 9. Known Unknowns

### Frontend

* Storefront component implementations (`components/storefront/*`) not read:

  * Props, tenant dependencies, hooks used are unknown.
* Checkout API (`checkoutApi.ts`) implementation details beyond listed behaviors are unknown.
* Booking flow backend scheduling logic (slot calculation) is unknown.
* Exact mapping/transformation between stored config fields and nested `PublicTenantConfig` is not fully specified.
* Chat widget usage of `contact.whatsappNumber` is listed as a tenant dependency in one fragment; exact usage is not described.

### Backend

* `JwtAuthGuard` implementation details (strategy, claims, user population) are unknown.
* Tenant middleware implementation is partially described, but full code is not provided; any behavior beyond listed steps is unknown.
* Service implementations are unknown:

  * `TenantService`, `TenantFeaturesService`, `UIConfigService`
  * `RepairsService`, `AppointmentsService`, `OrdersService`, `TicketsService`
  * `ProductsService`, `ProductImportService`, `CategoriesService`, `UsersService`, `DiscountsService`
* DTO schemas are unknown where marked:

  * Auth DTOs (`RegisterDto`, `LoginDto`, etc.)
  * Appointment DTOs (`CreateAppointmentDto`, `UpdateAppointmentDto`)
  * Ticket DTOs (`CreateTicketDto`, `AddMessageDto`, `UpdateTicketDto`)
  * Discount DTOs (`CreateDiscountDto`, `UpdateDiscountDto`, `ValidateDiscountDto`)
  * Product DTOs (`CreateProductDto`, `UpdateProductDto`, `ProductQueryDto`)
  * User DTOs (`UpdateUserDto`, `CreateAdminDto`)
* Ticket status enum values are unknown.
* Appointment status enum values are unknown.
* Refunds and audit logs backend controllers are not included; only frontend endpoint usage is known.

### Owner Panel

* Full backend `TenantConfig` storage schema is not provided; owner update fields include `bankName` and `invoiceFooter` whose storage location is unknown.
* Cloudflare backend implementation is opaque.
* Handoff exchange mechanism validation details are unknown beyond endpoint flows.
* Audit log storage/query implementation is unknown.
* Source text includes a truncated fragment ending: “Users with `tenantId` values...”; remainder is unknown.
