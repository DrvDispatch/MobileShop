# TenantProvider

## Overview

The TenantProvider fetches and provides tenant configuration to the entire application. It:
- Loads tenant config from `/api/tenant/config`
- Applies theme CSS variables
- Sets document title
- Provides context for `useTenant()` hook

---

## Location

```
frontend/src/lib/TenantProvider.tsx
```

---

## Hooks

### useTenant()

```typescript
function useTenant(): PublicTenantConfig
```

Returns the full tenant configuration. **Throws** if called outside TenantProvider.

```typescript
function MyComponent() {
  const tenant = useTenant();
  
  return <h1>{tenant.branding.shopName}</h1>;
}
```

### useTenantOptional()

```typescript
function useTenantOptional(): PublicTenantConfig | null
```

Returns config or `null` if not loaded. **Never throws**.

```typescript
function OptionalComponent() {
  const tenant = useTenantOptional();
  
  if (!tenant) return null;
  
  return <span>{tenant.branding.shopName}</span>;
}
```

---

## PublicTenantConfig Type

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
  address: Address | null;
}

interface TenantLocale {
  locale: string;
  currency: string;
  currencySymbol: string;
}

interface TenantBusiness {
  openingHours: OpeningHours | null;
  timeSlots: string[] | null;
  closedDays: number[] | null;
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

---

## CSS Variables Set

The provider applies theme CSS variables to `document.documentElement`:

| CSS Variable | Source |
|--------------|--------|
| `--primary-color` | `branding.primaryColor` |
| `--brand-color` | `branding.primaryColor` |
| `--secondary-color` | `branding.secondaryColor` |
| `--accent-color` | `branding.accentColor` |
| `--radius` | `branding.borderRadius` |

Also adds/removes `.dark` class based on `branding.darkMode`.

---

## Loading States

| State | UI |
|-------|-----|
| Loading | Spinner (TenantLoadingSkeleton) |
| Error | Error message with retry button |
| Success | Children render |

Children **never** render until config is loaded successfully.

---

## API Endpoint

```
GET /api/tenant/config
```

Backend resolves tenant from Host header and returns `PublicTenantConfig`.

---

## Usage in App

```typescript
// app/layout.tsx

import { TenantProvider } from '@/lib/TenantProvider';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
```

---

## Related Docs

- [Tenant Model](../platform/tenant-model.md)
- [Data Flow](../platform/data-flow.md)
