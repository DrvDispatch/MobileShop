# TenantConfig Schema

## Overview

TenantConfig stores all tenant-specific settings. It's used by:
- Frontend (public display, theming)
- Backend (invoices, emails, appointments)
- Owner Panel (configuration UI)

---

## Database Schema

```prisma
model TenantConfig {
  id              String   @id @default(uuid())
  tenantId        String   @unique
  tenant          Tenant   @relation(fields: [tenantId], references: [id])
  
  // Branding
  shopName        String
  logoUrl         String?
  primaryColor    String   @default("#7c3aed")
  secondaryColor  String?
  accentColor     String?
  borderRadius    String   @default("0.5rem")
  darkMode        Boolean  @default(false)
  
  // Contact
  email           String?
  phone           String?
  whatsappNumber  String?
  address         Json?    // { line1, line2, city, postalCode, country }
  
  // Locale
  locale          String   @default("nl-BE")
  currency        String   @default("EUR")
  currencySymbol  String   @default("€")
  timezone        String   @default("Europe/Brussels")
  
  // Business
  openingHours    Json?    // { monday: { open, close }, ... }
  timeSlots       Json?    // ["09:00", "10:00", ...]
  closedDays      Int[]    @default([0])  // 0 = Sunday
  
  // Invoice
  companyName     String?
  vatNumber       String?
  bankAccount     String?
  bankName        String?
  invoicePrefix   String   @default("INV")
  invoiceFooter   String?
  website         String?
  
  // Integrations
  googleAnalyticsId String?
  cookiebotId       String?
  
  // SEO
  seoTitle        String?
  seoDescription  String?
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}
```

---

## Field Details

### Branding

| Field | Type | Default | Usage |
|-------|------|---------|-------|
| shopName | string | required | Header, emails, invoices |
| logoUrl | string? | null | Header, invoices |
| primaryColor | string | #7c3aed | CSS --primary-color |
| secondaryColor | string? | null | CSS --secondary-color |
| accentColor | string? | null | CSS --accent-color |
| borderRadius | string | 0.5rem | CSS --radius |
| darkMode | boolean | false | .dark class on html |

### Contact

| Field | Type | Usage |
|-------|------|-------|
| email | string? | Contact page, invoice from |
| phone | string? | Contact page, invoices |
| whatsappNumber | string? | Chat widget link |
| address | JSON? | Contact page, invoices |

**address structure**:
```json
{
  "line1": "Street 123",
  "line2": "Unit 4",
  "city": "Brussels",
  "postalCode": "1000",
  "country": "Belgium"
}
```

### Locale

| Field | Type | Default | Usage |
|-------|------|---------|-------|
| locale | string | nl-BE | Date formatting |
| currency | string | EUR | Price formatting |
| currencySymbol | string | € | Price display |
| timezone | string | Europe/Brussels | Appointments |

### Business

| Field | Type | Usage |
|-------|------|-------|
| openingHours | JSON? | Contact page, booking |
| timeSlots | string[]? | Booking available times |
| closedDays | number[] | Booking unavailable days |

**openingHours structure**:
```json
{
  "monday": { "open": "09:00", "close": "18:00" },
  "tuesday": { "open": "09:00", "close": "18:00" },
  "wednesday": null,
  "thursday": { "open": "09:00", "close": "18:00" },
  "friday": { "open": "09:00", "close": "17:00" },
  "saturday": { "open": "10:00", "close": "15:00" },
  "sunday": null
}
```

**closedDays**: Array of day numbers (0=Sunday, 6=Saturday)

### Invoice

| Field | Type | Usage |
|-------|------|-------|
| companyName | string? | Legal name on invoice |
| vatNumber | string? | VAT ID on invoice |
| bankAccount | string? | Payment details |
| bankName | string? | Bank name |
| invoicePrefix | string | Invoice number prefix |
| invoiceFooter | string? | Footer text on PDF |
| website | string? | Website on invoice |

---

## API Endpoints

### Read (Public)

```
GET /api/tenant/config
```

Returns public-safe subset of TenantConfig.

### Update (Owner)

```
PATCH /api/owner/tenants/:id/config
```

Accepts partial update via `UpdateConfigDto`.

---

## Null Handling

| Scenario | Backend | Frontend |
|----------|---------|----------|
| Field is null | Include in response | Use fallback or hide |
| Update to empty | Set to null | Clear value |

Frontend pattern:
```typescript
const phone = tenant.contact.phone ?? 'Contact us';
```

---

## Related Docs

- [Tenant Model](../platform/tenant-model.md)
- [Extension Rules](./extension-rules.md)
