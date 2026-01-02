# ServicePulse Platform Documentation

> **Version**: 2.0 - Complete Reference  
> **Last Updated**: January 2026  
> **Status**: Production-Ready Multi-Tenant SaaS

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack Documentation](#2-tech-stack-documentation)
3. [Backend API Documentation (30 Controllers, 160+ Routes)](#3-backend-api-documentation)
4. [Frontend Core API (36 Admin Hooks + Public Hooks)](#4-frontend-core-api)
5. [TenantConfig Specification](#5-tenantconfig-specification)
6. [Owner Panel Documentation (7 Pages)](#6-owner-panel-documentation)
7. [Skin System Documentation](#7-skin-system-documentation)
8. [Special Feature Playbook](#8-special-feature-playbook)
9. [AI Operating Rules](#9-ai-operating-rules)

---

# 1. Platform Overview

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     PLATFORM OWNER                          │
│              (servicespulse.com - Owner Panel @ :3000)      │
└─────────────────────────┬───────────────────────────────────┘
                          │ Creates & Manages
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Tenant A │    │ Tenant B │    │ Tenant C │
    │ shop.com │    │ fix.nl   │    │ repair.be│
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
┌────────┴───────────────┴───────────────┴────────┐
│           SHARED BACKEND (NestJS @ :3001)       │
│     32 Modules • 30 Controllers • 160+ Routes   │
└────────┬───────────────────────────┬────────────┘
         │                           │
    ┌────▼────┐                 ┌────▼────┐
    │Frontend │                 │  Admin  │
    │  :3002  │                 │  Panel  │
    └─────────┘                 └─────────┘
```

## User Roles

| Role | Access | App |
|------|--------|-----|
| `OWNER` | Platform-wide: tenant CRUD, domains, features, users | Owner Panel (:3000) |
| `ADMIN` | Tenant admin: full CRUD on all tenant data | Admin Panel (/admin) |
| `STAFF` | Limited admin: read + update, no delete | Admin Panel (/admin) |
| `CUSTOMER` | Public site: browse, buy, book, tickets | Frontend (:3002) |

## Tenant Resolution Flow

```
User visits: https://bikerepair.site/repair/book
       │
       ▼ TenantMiddleware
Extracts Host: "bikerepair.site"
       │
       ▼ Database Query
TenantDomain.findFirst({ where: { domain: "bikerepair.site" }})
       │
       ▼ Load Config
Tenant + TenantConfig + TenantFeatures
       │
       ▼ Attach to Request
req.tenantId, req.tenant
       │
       ▼ Controller Uses @TenantId()
All queries scoped by tenantId
```

---

# 2. Tech Stack Documentation

## Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 10.x | API Framework |
| Prisma | 5.x | ORM (PostgreSQL) |
| Socket.io | 4.x | Real-time chat |
| Passport.js | 0.7.x | Authentication |
| PDFKit | 0.15.x | Invoice PDF |
| Nodemailer | 6.x | Email sending |
| Stripe | 15.x | Payments |
| Cloudflare API | - | Domain management |

## Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 14.x | React Framework (App Router) |
| TypeScript | 5.x | Type safety |
| TailwindCSS | 3.x | Styling |
| Zustand | 4.x | Cart state |
| Socket.io-client | 4.x | Real-time chat |
| SWR | 2.x | Data fetching |

## Backend Module Structure (32 Modules)

```
backend/src/modules/
├── analytics/          # Revenue, trends, bestsellers, export
├── appointments/       # Repair booking system
├── audit-logs/         # Activity tracking
├── auth/               # JWT, OAuth, impersonation
├── banners/            # Promotional banners
├── categories/         # Product categories
├── cloudflare/         # Domain automation
├── discounts/          # Coupon codes
├── email/              # Template-based emails
├── export/             # CSV export (orders, products, tax)
├── feedback/           # Rating collection (post-order)
├── gemini/             # AI product content generation
├── inventory/          # Stock movements, low stock
├── invoice/            # PDF generation + email
├── marketing/          # Email campaigns, segments
├── orders/             # Stripe checkout + webhooks
├── owner/              # Platform admin (OWNER only)
├── pages/              # CMS content management
├── products/           # Product catalog
├── refunds/            # Refund processing
├── repairs/            # Device types, brands, services
├── reviews/            # Product + Google reviews
├── settings/           # Tenant settings + shipping zones
├── shipping/           # Shipping zone management
├── sms/                # SMS abstraction
├── stock-notifications/ # Back-in-stock alerts
├── supported-devices/  # Device catalog (booking)
├── tenant/             # Config + features API
├── tickets/            # Support system + Socket.io
├── upload/             # S3/R2 file uploads
├── users/              # Admin user management
└── wishlist/           # User wishlists
```

---

# 3. Backend API Documentation

## Complete Controller Reference (30 Controllers, 160+ Routes)

---

### 1. Analytics Controller
**Base**: `/analytics` | **Auth**: JWT + ADMIN/STAFF | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/revenue` | Daily revenue data for charts |
| GET | `/trends` | Period-over-period comparison |
| GET | `/bestsellers` | Top-selling products |
| GET | `/export` | Export analytics as CSV |

---

### 2. Appointments Controller
**Base**: `/appointments` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/` | None | Create booking (anonymous) |
| POST | `/authenticated` | JWT | Create booking (logged in) |
| GET | `/available-slots` | None | Get available time slots |
| GET | `/` | JWT+ADMIN | List all appointments |
| GET | `/:id` | JWT+ADMIN | Get appointment details |
| PATCH | `/:id` | JWT+ADMIN | Update status |
| DELETE | `/:id` | JWT+ADMIN | Cancel appointment |

**TenantConfig**: `timeSlots`, `closedDays`

---

### 3. Audit Log Controller
**Base**: `/audit-logs` | **Auth**: JWT + ADMIN | **Tenant**: ❌ (via user)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | List logs with filters |
| GET | `/entity` | Get entity history |
| GET | `/export` | Export logs as CSV |

---

### 4. Auth Controller
**Base**: `/auth` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/register` | None | Create account |
| POST | `/login` | None | JWT login |
| POST | `/owner-login` | None | Owner panel login |
| GET | `/me` | JWT | Current user profile |
| POST | `/logout` | JWT | Logout |
| POST | `/forgot-password` | None | Request reset email |
| POST | `/reset-password` | None | Reset with token |
| GET | `/verify-email/:token` | None | Verify email |
| GET | `/google` | None | Google OAuth start |
| GET | `/google/callback` | None | Google OAuth callback |
| POST | `/handoff` | None | Impersonation handoff |

---

### 5. Banners Controller
**Base**: `/banners` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/active` | None | Active banners for display |
| GET | `/` | JWT+ADMIN | All banners |
| GET | `/:id` | JWT+ADMIN | Banner details |
| POST | `/` | JWT+ADMIN | Create banner |
| PATCH | `/:id` | JWT+ADMIN | Update banner |
| DELETE | `/:id` | JWT+ADMIN | Delete banner |

---

### 6. Categories Controller
**Base**: `/categories` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/` | None | List categories |
| GET | `/:idOrSlug` | None | Get by ID or slug |
| POST | `/` | JWT+ADMIN | Create category |
| PUT | `/:id` | JWT+ADMIN | Update category |
| DELETE | `/:id` | JWT+ADMIN | Delete category |

---

### 7. Discounts Controller
**Base**: `/discounts` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/validate` | None | Validate coupon code |
| GET | `/` | JWT+ADMIN | List all discounts |
| GET | `/:id` | JWT+ADMIN | Get discount details |
| POST | `/` | JWT+ADMIN | Create discount |
| PATCH | `/:id` | JWT+ADMIN | Update discount |
| DELETE | `/:id` | JWT+ADMIN | Delete discount |

---

### 8. Export Controller
**Base**: `/export` | **Auth**: JWT + ADMIN/STAFF | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/orders` | Export orders CSV |
| GET | `/products` | Export products CSV |
| GET | `/customers` | Export customers CSV |
| GET | `/refunds` | Export refunds CSV |
| GET | `/reviews` | Export reviews CSV |
| GET | `/btw-aangifte` | Belgian VAT report |
| GET | `/accountant` | Accountant report |
| GET | `/annual-summary` | Annual summary |

---

### 9. Feedback Controller
**Base**: `/feedback` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/:token` | None | Get feedback by token |
| POST | `/:token/rate` | None | Submit rating |
| GET | `/` | None | All ratings (admin) |
| GET | `/stats/average` | None | Average rating stats |

---

### 10. Gemini Controller
**Base**: `/gemini` | **Auth**: JWT + ADMIN/STAFF | **Tenant**: ❌

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/generate` | Generate product content via AI |
| POST | `/analyze` | Analyze device image |
| POST | `/find-images` | Search product images |

---

### 11. Inventory Controller
**Base**: `/inventory` | **Auth**: JWT + ADMIN/STAFF | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/movements` | Stock movements with pagination |
| GET | `/low-stock` | Low stock products |
| GET | `/products` | All products with stock |
| POST | `/adjust` | Adjust stock level |
| GET | `/product/:id/history` | Product inventory history |
| GET | `/summary` | Inventory summary stats |

---

### 12. Invoice Controller
**Base**: `/invoices` | **Auth**: JWT + ADMIN | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/settings` | Get invoice settings |
| PUT | `/settings` | Update invoice settings |
| GET | `/` | List all invoices |
| GET | `/:id` | Get invoice details |
| GET | `/:id/pdf` | Download PDF |
| GET | `/:id/preview` | Preview PDF |
| POST | `/` | Create manual invoice |
| PATCH | `/:id` | Update invoice |
| POST | `/:id/paid` | Mark as paid |
| POST | `/:id/cancel` | Cancel invoice |
| POST | `/:id/email` | Send invoice email |
| GET | `/search/customers` | Search customers |
| GET | `/search/products` | Search products |
| GET | `/search/repairs` | Search repairs |

**TenantConfig**: `companyName`, `vatNumber`, `bankAccount`, `bankName`, `invoicePrefix`, `invoiceFooter`, `website`, `logoUrl`, `address`

---

### 13. Marketing Controller
**Base**: `/marketing` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/segments` | None | Available segments |
| GET | `/users` | None | Users in segment |
| POST | `/send` | None | Send marketing email |
| POST | `/unsubscribe` | None | Unsubscribe email |
| GET | `/unsubscribe/check` | None | Check if unsubscribed |
| POST | `/subscribe` | None | Subscribe to newsletter |

---

### 14. Orders Controller
**Base**: `/orders` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/checkout` | None | Create Stripe checkout |
| POST | `/webhook` | Stripe | Handle Stripe events |
| GET | `/session` | None | Get order by session ID |
| GET | `/` | JWT+ADMIN | List all orders |
| GET | `/:id` | JWT+ADMIN | Get order details |
| PATCH | `/:id` | JWT+ADMIN | Update order status |
| POST | `/:id/labels` | JWT+ADMIN | Generate shipping labels |
| POST | `/bulk-status` | JWT+ADMIN | Bulk status update |

---

### 15. Owner Controller
**Base**: `/owner` | **Auth**: JWT + OWNER | **Tenant**: N/A (Platform)

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/tenants` | List all tenants |
| POST | `/tenants` | Create new tenant |
| GET | `/tenants/:id` | Get tenant details |
| PATCH | `/tenants/:id/config` | Update tenant config |
| POST | `/tenants/:id/activate` | Activate tenant |
| POST | `/tenants/:id/suspend` | Suspend tenant |
| GET | `/tenants/:id/domains` | List tenant domains |
| POST | `/tenants/:id/domains` | Add domain |
| DELETE | `/tenants/:id/domains/:domainId` | Remove domain |
| POST | `/tenants/:id/domains/:domainId/verify` | Verify domain |
| GET | `/tenants/:id/features` | Get feature flags |
| PATCH | `/tenants/:id/features` | Update feature flags |
| GET | `/tenants/:id/users` | List tenant users |
| POST | `/impersonate` | Impersonate user |
| GET | `/stats` | Platform-wide stats |
| GET | `/audit-logs` | Platform audit logs |

---

### 16. Pages Controller (Public)
**Base**: `/tenant` | **Auth**: None | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/homepage` | Get homepage content |
| GET | `/pages/:slug` | Get page by slug |

---

### 17. Owner Pages Controller (CMS)
**Base**: `/owner/tenants/:tenantId` | **Auth**: JWT + OWNER | **Tenant**: Via param

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/homepage` | Get tenant homepage |
| PATCH | `/homepage` | Update homepage |
| GET | `/pages` | List all pages |
| GET | `/pages/:pageId` | Get page details |
| POST | `/pages` | Create page |
| PATCH | `/pages/:pageId` | Update page |
| POST | `/pages/:pageId/publish` | Publish page |
| POST | `/pages/:pageId/unpublish` | Unpublish page |
| DELETE | `/pages/:pageId` | Delete page |
| POST | `/pages/seed` | Seed default pages |

---

### 18. Products Controller
**Base**: `/products` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/` | None | List products with filters |
| GET | `/featured` | None | Featured products |
| GET | `/brands` | None | All brands |
| GET | `/:id/related` | None | Related products |
| GET | `/:idOrSlug` | None | Product by ID or slug |
| POST | `/` | JWT+ADMIN | Create product |
| PUT | `/:id` | JWT+ADMIN | Update product |
| DELETE | `/:id` | JWT+ADMIN | Delete product |
| GET | `/admin/export` | JWT+ADMIN | Export to CSV |
| POST | `/admin/import` | JWT+ADMIN | Import from CSV |

---

### 19. Refunds Controller
**Base**: `/refunds` | **Auth**: JWT + ADMIN/STAFF | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/` | Create refund request |
| POST | `/:id/process` | Process via Stripe |
| POST | `/:id/cancel` | Cancel refund |
| GET | `/` | List all refunds |
| GET | `/stats` | Refund statistics |
| GET | `/:id` | Get refund details |
| PATCH | `/:id` | Update refund |

---

### 20. Repairs Controller
**Base**: `/repairs` | **Auth**: Mixed | **Tenant**: ❌ (Global catalog)

**Public Endpoints:**
| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/device-types` | All device types |
| GET | `/device-types/:slug` | Device type with brands |
| GET | `/brands` | Brands (optionally by device type) |
| GET | `/brands/:slug` | Brand with devices |
| GET | `/devices` | Devices (optionally by brand) |
| GET | `/devices/:slug` | Device with services |
| GET | `/services/:deviceSlug` | Services for device |
| GET | `/service-types` | All service types |

**Admin Endpoints (JWT):**
| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/admin/device-types` | Create device type |
| PUT | `/admin/device-types/:id` | Update device type |
| DELETE | `/admin/device-types/:id` | Delete device type |
| POST | `/admin/brands` | Create brand |
| PUT | `/admin/brands/:id` | Update brand |
| DELETE | `/admin/brands/:id` | Delete brand |
| POST | `/admin/devices` | Create device |
| PUT | `/admin/devices/:id` | Update device |
| DELETE | `/admin/devices/:id` | Delete device |
| POST | `/admin/service-types` | Create service type |
| PUT | `/admin/service-types/:id` | Update service type |
| DELETE | `/admin/service-types/:id` | Delete service type |
| POST | `/admin/device-services` | Create device service |
| PUT | `/admin/device-services/:id` | Update device service |
| DELETE | `/admin/device-services/:id` | Delete device service |
| POST | `/admin/import` | Import from JSON |

---

### 21. Reviews Controller
**Base**: `/api/reviews` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/product/:productId` | None | Product reviews |
| POST | `/` | None | Submit review |
| GET | `/admin` | JWT+ADMIN | All reviews |
| GET | `/admin/pending-count` | JWT+ADMIN | Pending count |
| PATCH | `/admin/:id/moderate` | JWT+ADMIN | Moderate review |
| DELETE | `/admin/:id` | JWT+ADMIN | Delete review |
| GET | `/google/status` | JWT+ADMIN | Google sync status |
| GET | `/google` | JWT+ADMIN | Google reviews |
| POST | `/google/sync` | JWT+ADMIN | Sync Google reviews |
| PATCH | `/google/:id/visibility` | JWT+ADMIN | Toggle visibility |

---

### 22. Settings Controller
**Base**: `/settings` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/public` | None | Public settings |
| GET | `/shipping` | None | Shipping zones |
| GET | `/shipping/country` | None | Shipping for country |
| GET | `/` | JWT+ADMIN | All settings |
| GET | `/:key` | JWT+ADMIN | Get setting |
| PUT | `/:key` | JWT+ADMIN | Update setting |
| POST | `/` | JWT+ADMIN | Create setting |
| DELETE | `/:key` | JWT+ADMIN | Delete setting |
| GET | `/admin/shipping` | JWT+ADMIN | All shipping zones |
| POST | `/admin/shipping` | JWT+ADMIN | Create shipping zone |
| PUT | `/admin/shipping/:id` | JWT+ADMIN | Update shipping zone |
| DELETE | `/admin/shipping/:id` | JWT+ADMIN | Delete shipping zone |

---

### 23. Shipping Controller
**Base**: `/shipping` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/zones` | None | All shipping zones |
| GET | `/zones/:id` | None | Zone details |
| POST | `/zones` | JWT+ADMIN | Create zone |
| PUT | `/zones/:id` | JWT+ADMIN | Update zone |
| DELETE | `/zones/:id` | JWT+ADMIN | Delete zone |
| GET | `/calculate` | None | Calculate shipping rate |

---

### 24. Stock Notifications Controller
**Base**: `/api/stock-notifications` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/subscribe` | None | Subscribe to stock alert |
| POST | `/unsubscribe` | None | Unsubscribe |
| GET | `/check/:productId` | None | Check subscription |
| GET | `/admin` | JWT+ADMIN | All subscriptions |
| GET | `/admin/waiting-counts` | JWT+ADMIN | Waiting counts |

---

### 25. Supported Devices Controller
**Base**: `/devices` | **Auth**: Mixed | **Tenant**: ❌ (Global)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/` | None | All devices grouped |
| GET | `/brands` | None | All brands |
| GET | `/brand/:brand` | None | Devices by brand |
| GET | `/admin/all` | JWT+ADMIN | Flat list for admin |
| POST | `/` | JWT+ADMIN | Create device |
| PATCH | `/:id` | JWT+ADMIN | Update device |
| DELETE | `/:id` | JWT+ADMIN | Delete device |
| POST | `/import` | JWT+ADMIN | Import from JSON |

---

### 26. Tenant Controller
**Base**: `/tenant` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/config` | None | Public tenant config |
| GET | `/features` | None | Feature flags |
| GET | `/context` | None | Tenant context |
| GET | `/ui-config` | None | UI labels and CMS |
| GET | `/admin/config` | JWT+OWNER | Full config |
| PATCH | `/admin/config` | JWT+OWNER | Update config |
| PATCH | `/admin/features` | JWT+OWNER | Update features |

---

### 27. Tickets Controller
**Base**: `/tickets` | **Auth**: Mixed | **Tenant**: ✅

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/` | None | Create ticket |
| GET | `/session/:sessionId` | None | Tickets by session |
| POST | `/:id/messages` | None | Add message |
| GET | `/` | JWT+ADMIN | All tickets |
| GET | `/:id` | JWT+ADMIN | Ticket details |
| PATCH | `/:id` | JWT+ADMIN | Update ticket |
| DELETE | `/:id` | JWT+ADMIN | Delete ticket |

---

### 28. Upload Controller
**Base**: `/upload` | **Auth**: Mixed | **Tenant**: N/A

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/` | None | Upload public (tickets) |
| POST | `/image` | JWT | Upload single image |
| POST | `/images` | JWT | Upload multiple images |
| DELETE | `/:key` | JWT | Delete image |
| GET | `/assets` | JWT | List uploaded images |

---

### 29. Users Controller
**Base**: `/users` | **Auth**: JWT + ADMIN | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | List all users |
| GET | `/:id` | User details with orders |
| POST | `/admin` | Create admin/staff user |
| PATCH | `/:id` | Update user |
| DELETE | `/:id` | Delete user |
| POST | `/:id/reset-password` | Admin reset password |
| PATCH | `/:id/vip` | Toggle VIP status |
| PATCH | `/:id/notes` | Update admin notes |
| POST | `/:id/recalculate-lifetime-value` | Recalculate LTV |

---

### 30. Wishlist Controller
**Base**: `/api/wishlist` | **Auth**: JWT | **Tenant**: ✅

| Method | Route | Purpose |
|--------|-------|---------|
| GET | `/` | Get user's wishlist |
| GET | `/count` | Wishlist item count |
| GET | `/check/:productId` | Check if in wishlist |
| POST | `/:productId` | Add to wishlist |
| DELETE | `/:productId` | Remove from wishlist |
| DELETE | `/` | Clear wishlist |

---

# 4. Frontend Core API

## Admin Hooks (36 Hooks)

### Base Hooks
| Hook | Purpose |
|------|---------|
| `useAdmin.ts` | Admin authentication + navigation |
| `useAdminCRUD.ts` | Generic CRUD operations |
| `useAdminDataFetching.ts` | Data fetching with loading states |
| `useAdminPagination.ts` | Pagination logic |
| `useAdminSearch.ts` | Search/filter logic |
| `useAdminTable.ts` | Table state management |

### Domain-Specific Hooks
| Hook | Purpose |
|------|---------|
| `appointments/useAppointmentsAdmin.ts` | Appointment management |
| `audit-logs/useAuditLogs.ts` | Audit log viewing |
| `banners/useBanners.ts` | Banner CRUD |
| `dashboard/useDashboard.ts` | Dashboard stats |
| `devices/useDevices.ts` | Device catalog management |
| `discounts/useDiscounts.ts` | Discount code CRUD |
| `export/useExport.ts` | Data export operations |
| `gallery/useGallery.ts` | Asset library management |
| `inventory/useInventory.ts` | Stock management |
| `marketing/useMarketing.ts` | Campaign management |
| `orders/useOrders.ts` | Order list management |
| `orders/useOrderDetail.ts` | Single order view |
| `products/useProducts.ts` | Product list management |
| `products/useProductCreate.ts` | Product creation form |
| `products/useProductEdit.ts` | Product editing form |
| `products/useProductAI.ts` | AI content generation |
| `refunds/useRefunds.ts` | Refund processing |
| `repairs/useRepairs.ts` | Repair service management |
| `repairs/useRepairsCatalog.ts` | Repair catalog CRUD |
| `settings/useSettings.ts` | Settings management |
| `settings/useSettingsForm.ts` | Settings form state |
| `shipping/useShipping.ts` | Shipping zone CRUD |
| `tickets/useTickets.ts` | Ticket management |
| `tickets/useTicketsAdmin.ts` | Admin ticket view |
| `users/useUsers.ts` | User management |

### Invoice Hooks
| Hook | Purpose |
|------|---------|
| `invoice/useInvoice.ts` | Invoice operations |
| `invoice/useInvoiceCreate.ts` | Invoice creation form |
| `invoice/useInvoiceList.ts` | Invoice list + filters |
| `invoice/useInvoiceSettings.ts` | Invoice settings form |
| `invoice/useRepairPicker.ts` | Repair selection for invoices |

---

## Public Hooks

### TenantProvider
```typescript
// Access tenant config anywhere
const tenant = useTenant();
const { shopName, primaryColor, logoUrl } = tenant.branding;
const { whatsappNumber, email, phone } = tenant.contact;
const { openingHours, timeSlots, closedDays } = tenant.business;
```

### useBookingFlow
Repair booking wizard state machine:
- Step navigation (0-5)
- Device type → Brand → Device → Service → Date → Customer
- Time slot availability (uses `timeSlots`, `closedDays`)
- Form submission

### useCheckout
E-commerce checkout:
- Cart state via Zustand
- Coupon validation
- Stripe checkout session creation
- Total calculation with shipping

### useChatWidget
Support chat:
- Socket.io connection
- Ticket CRUD
- Real-time messages
- File attachments

---

# 5. TenantConfig Specification

## Complete Field Reference

| Field | Type | Default | Owner Panel | Backend Usage | Frontend Usage |
|-------|------|---------|-------------|---------------|----------------|
| `shopName` | String | Required | ✅ | Email, Invoice | Header, Footer, Title |
| `logoUrl` | String? | null | ✅ | Invoice PDF | Header |
| `faviconUrl` | String? | null | ✅ | - | Meta tags |
| `primaryColor` | String | `#7c3aed` | ✅ | - | CSS `--primary-color` |
| `secondaryColor` | String? | null | ✅ | - | CSS `--secondary-color` |
| `accentColor` | String? | null | ✅ | - | CSS `--accent-color` |
| `borderRadius` | String | `0.625rem` | ✅ | - | CSS `--radius` |
| `darkMode` | Boolean | false | ✅ | - | Body `.dark` class |
| `email` | String? | null | ✅ | Email, Invoice | Contact page |
| `phone` | String? | null | ✅ | Invoice | Contact page |
| `whatsappNumber` | String? | null | ✅ | - | Chat widget |
| `address` | Json? | null | ✅ | Invoice | Contact, Footer |
| `locale` | String | `nl` | ✅ | - | i18n |
| `currency` | String | `EUR` | ✅ | Orders, Invoice | Prices |
| `currencySymbol` | String | `€` | ❌ | - | Prices |
| `timezone` | String | `Europe/Brussels` | ✅ | Appointments | - |
| `openingHours` | Json? | null | ✅ | - | Contact page |
| `timeSlots` | Json? | null | ✅ | Appointments | Booking widget |
| `closedDays` | Int[] | `[0]` | ✅ | Appointments | Booking widget |
| `companyName` | String? | null | ✅ | Invoice | Invoice PDF |
| `vatNumber` | String? | null | ✅ | Invoice | Invoice PDF |
| `bankAccount` | String? | null | ✅ | Invoice | Invoice PDF |
| `bankName` | String? | null | ✅ | Invoice | Invoice PDF |
| `invoicePrefix` | String | `INV` | ✅ | Invoice | Invoice numbers |
| `invoiceFooter` | String? | null | ✅ | Invoice | Invoice PDF |
| `website` | String? | null | ✅ | Invoice | Invoice PDF |
| `googleAnalyticsId` | String? | null | ❌ | - | Analytics |
| `cookiebotId` | String? | null | ❌ | - | Cookie consent |
| `seoTitle` | String? | null | ❌ | - | Meta tags |
| `seoDescription` | String? | null | ❌ | - | Meta tags |
| `features` | Json? | All enabled | ✅ | All modules | Feature gates |

---

# 6. Owner Panel Documentation

## Pages (7 Routes)

| Route | Purpose |
|-------|---------|
| `/tenants` | List all tenants with status, domains |
| `/tenants/[tenantId]` | Tenant overview: stats, status, quick actions |
| `/tenants/[tenantId]/config` | Full configuration editing |
| `/tenants/[tenantId]/domains` | Domain management + Cloudflare automation |
| `/tenants/[tenantId]/features` | Feature flag toggles |
| `/tenants/[tenantId]/audit` | Audit log viewing |
| `/tenants/[tenantId]/users` | Tenant user management |
| `/tenants/[tenantId]/cms` | Homepage + page editing |

## Owner API Client Methods

```typescript
ownerApi = {
    // Auth
    login(email, password): Promise<{ user, token }>
    logout(): Promise<void>
    getMe(): Promise<User>
    
    // Tenants
    getTenants(): Promise<Tenant[]>
    createTenant(data): Promise<Tenant>
    getTenant(id): Promise<Tenant>
    updateConfig(id, config): Promise<TenantConfig>
    activateTenant(id): Promise<void>
    suspendTenant(id): Promise<void>
    
    // Domains
    getDomains(tenantId): Promise<Domain[]>
    addDomain(tenantId, domain): Promise<Domain>
    verifyDomain(tenantId, domainId): Promise<Domain>
    removeDomain(tenantId, domainId): Promise<void>
    
    // Cloudflare
    cloudflareSetup(tenantId, domainId): Promise<void>
    
    // Features
    getFeatures(tenantId): Promise<TenantFeatures>
    updateFeatures(tenantId, features): Promise<TenantFeatures>
    
    // Impersonation
    impersonate(tenantId, userId): Promise<{ handoffCode, redirectUrl }>
    
    // CMS
    getHomepage(tenantId): Promise<Homepage>
    updateHomepage(tenantId, data): Promise<Homepage>
    getPages(tenantId): Promise<Page[]>
    createPage(tenantId, data): Promise<Page>
    updatePage(tenantId, pageId, data): Promise<Page>
    publishPage(tenantId, pageId): Promise<Page>
    deletePage(tenantId, pageId): Promise<void>
    
    // Users
    getUsers(tenantId): Promise<User[]>
    
    // Stats
    getStats(): Promise<PlatformStats>
    
    // Audit Logs
    getAuditLogs(filters): Promise<AuditLog[]>
}
```

---

# 7. Skin System Documentation

> **Status**: Design Phase - Not Yet Implemented

## Concept
Skins allow different visual themes while sharing the same business logic hooks.

```
frontend/src/skins/
├── default/
│   ├── skin.config.ts
│   ├── pages/
│   └── components/
├── minimal/
└── luxury/
```

## Rules
- ✅ Use hooks for all data/logic
- ✅ Import from `@/lib/*`
- ❌ No direct `fetch()` calls
- ❌ No `any` types
- ❌ No TenantConfig modification

---

# 8. Special Feature Playbook

## When to Add Feature Flags

```
New Feature Request
       │
       ▼
Is it optional per tenant?
       │
  ┌────┴────┐
  │ YES     │ NO
  ▼         ▼
Add to      Add to
TenantFeature  TenantConfig
       │         │
       ▼         ▼
Add guard    Add field to
in service   Owner Panel form
```

**Add TenantFeature when:**
- Optional functionality
- Pricing tier feature
- Beta rollout
- Resource-intensive

**Add TenantConfig when:**
- Branding/customization
- Business settings
- Integration IDs

## Feature Flags Available

| Flag | Purpose |
|------|---------|
| `ecommerceEnabled` | Product catalog + checkout |
| `repairsEnabled` | Repair booking flow |
| `ticketsEnabled` | Support tickets |
| `liveChatWidget` | Chat widget visibility |
| `marketingEnabled` | Email campaigns |
| `reviewsEnabled` | Product reviews |
| `wishlistEnabled` | Wishlist feature |
| `stockNotificationsEnabled` | Back-in-stock alerts |
| `invoicingEnabled` | Manual invoice creation |
| `exportEnabled` | Data export |
| `analyticsEnabled` | Analytics dashboard |
| `couponsEnabled` | Discount codes |

---

# 9. AI Operating Rules

## Critical Rules

### ❌ NEVER
```typescript
// Never use any
const data: any = response; // ❌

// Never ignore types
// @ts-ignore // ❌

// Never hardcode tenantId
{ tenantId: "550e8400-e29b-41d4-a716-446655440000" } // ❌

// Never fetch in components
export function Component() {
    useEffect(() => { fetch('/api/...') }, []); // ❌
}

// Never cross-tenant queries
prisma.order.findMany(); // ❌ Missing { where: { tenantId } }
```

### ✅ ALWAYS
```typescript
// Always use strict types
const data: OrderResponse = response;

// Always use @TenantId decorator
@Get()
findAll(@TenantId() tenantId: string) {
    return this.service.findAll(tenantId);
}

// Always filter by tenantId
prisma.order.findMany({
    where: { tenantId }  // ✅
});

// Always use hooks in components
export function Component() {
    const { data } = useOrders(); // ✅
}

// Always check feature flags
if (!features.ecommerceEnabled) {
    throw new ForbiddenException();
}

// Always use class-validator
@IsString()
@IsNotEmpty()
shopName: string;
```

## Code Pattern Reference

| Need | Copy From |
|------|-----------|
| New Controller | `products.controller.ts` |
| New Service | `products.service.ts` |
| New Hook | `useOrders.ts` |
| DTO Validation | `CreateProductDto` |
| Feature Flag | `TenantFeaturesService` |
| PDF Generation | `invoice.service.ts` |
| Email Sending | `email.service.ts` |
| Guard Pattern | `RolesGuard` |
| Tenant Middleware | `tenant.middleware.ts` |

## When Unsure → STOP AND ASK

```
Before writing code:
1. Is there an existing pattern? → Search codebase
2. Does this break tenant isolation? → Check queries
3. Am I using strict types? → Verify with TypeScript
4. Is this documented? → Check documentation.md
5. Will this work for all tenants? → Test edge cases

If unsure on ANY → ASK THE USER
```

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVICEPULSE QUICK REF                   │
├─────────────────────────────────────────────────────────────┤
│ PORTS:                                                      │
│   Backend API:    localhost:3001                            │
│   Owner Panel:    localhost:3000                            │
│   Frontend:       localhost:3002                            │
├─────────────────────────────────────────────────────────────┤
│ KEY FILES:                                                  │
│   Schema:         backend/prisma/schema.prisma              │
│   Tenant Config:  frontend/src/lib/TenantProvider.tsx       │
│   Owner API:      owner-app/src/lib/owner-api.ts            │
│   Admin API:      frontend/src/lib/admin/adminApi.ts        │
├─────────────────────────────────────────────────────────────┤
│ OWNER CREDENTIALS (dev):                                    │
│   Email:    owner@servicespulse.com                         │
│   Password: OwnerPass123!                                   │
├─────────────────────────────────────────────────────────────┤
│ MODULE COUNT:                                               │
│   Backend Modules:     32                                   │
│   Backend Controllers: 30                                   │
│   Backend Routes:      160+                                 │
│   Frontend Admin Hooks: 36                                  │
│   Owner Panel Pages:   7                                    │
├─────────────────────────────────────────────────────────────┤
│ ADD NEW FEATURE:                                            │
│   1. Add to Prisma schema                                   │
│   2. Run: npx prisma migrate dev                            │
│   3. Add to UpdateConfigDto                                 │
│   4. Add to Owner Panel form                                │
│   5. Add to PublicTenantConfig if needed                    │
│   6. Document in this file                                  │
└─────────────────────────────────────────────────────────────┘
```

---

*End of Comprehensive Platform Documentation v2.0*
