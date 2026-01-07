# UI Configuration

## Overview

UIConfig provides tenant-specific labels, formatting, and content. It enables:
- Multi-language support (currently Dutch)
- Vertical-specific terminology
- Customizable UI text

---

## Verticals

| Vertical | Description |
|----------|-------------|
| `REPAIR_SHOP` | Device repair (default) |
| `BARBER` | Barbershop/salon |
| `CAR_WASH` | Car wash service |
| `BIKE_REPAIR` | Bicycle repair |
| `GENERAL_SERVICE` | Generic service business |

Each vertical has different default labels and terminology.

---

## UIConfig Structure

```typescript
interface UIConfig {
  vertical: TenantVertical;
  marquee: MarqueeItem[];
  footer: FooterConfig;
  formatting: FormattingConfig;
  labels: UILabels;
}
```

### Marquee Items

Scrolling announcement bar items:

```typescript
interface MarqueeItem {
  icon: 'location' | 'star' | 'wrench' | 'clock' | 'shield' | 'package';
  text: string;
}
```

### Footer Config

```typescript
interface FooterConfig {
  tagline: string;
  newsletterTitle: string;
  newsletterSubtitle: string;
  googleReviewUrl: string | null;
  googleReviewRating: string | null;
}
```

### Formatting Config

```typescript
interface FormattingConfig {
  dateLocale: string;   // e.g., "nl-BE"
  dateFormat: string;   // e.g., "dd MMMM yyyy"
}
```

---

## Label Categories

| Category | Purpose | Fields |
|----------|---------|--------|
| `checkout` | Checkout page text | couponPlaceholder, couponApplied, etc. |
| `booking` | Booking wizard text | 8 nested groups |
| `reviews` | Review system text | 12 fields |
| `nav` | Navigation labels | home, repairs, phones, etc. |
| `auth` | Auth button labels | login, register, logout, etc. |
| `footer` | Footer labels | contact, quickLinks, newsletter, etc. |
| `loading` | Loading states | loading, error, retry |

---

## Frontend Usage

### Hook

```typescript
import { useUIConfig } from '@/lib/useUIConfig';

function MyComponent() {
  const { uiConfig, isLoading, error } = useUIConfig();
  
  return <h1>{uiConfig.labels.nav.home}</h1>;
}
```

### Interpolation

Template strings support variable substitution:

```typescript
import { interpolate } from '@/lib/useUIConfig';

const message = interpolate(
  "Bedankt {name}! We sturen bevestiging naar {email}",
  { name: "Jan", email: "jan@example.com" }
);
// → "Bedankt Jan! We sturen bevestiging naar jan@example.com"
```

---

## Default Values

If no tenant UIConfig exists, `DEFAULT_UI_CONFIG` is used:
- Vertical: `REPAIR_SHOP`
- Locale: `nl-BE`
- All labels in Dutch

---

## API Endpoint

```
GET /api/tenant/ui-config
```

Returns `UIConfig` for current tenant (from Host header).

---

## Related Docs

- [Tenant Model](./tenant-model.md)
- [Feature Flags](./feature-flags.md)
