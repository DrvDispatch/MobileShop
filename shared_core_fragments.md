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
