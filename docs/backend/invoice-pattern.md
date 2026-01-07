# Invoice Pattern

## Overview

ServicePulse generates PDF invoices using PDFKit. Invoices are:
- Branded with tenant logo and colors
- Include all legal requirements (VAT, address)
- Sent via email
- Stored for download

---

## Invoice Service Location

```
backend/src/modules/invoice/invoice.service.ts
```

---

## Generation Flow

```
1. Create Invoice Record
   │ POST /invoices
   │ Stores: customer, items, totals
   ▼
2. Generate PDF
   │ GET /invoices/:id/pdf
   │ Loads TenantConfig for branding
   │ Uses PDFKit to build document
   ▼
3. Send Email (optional)
   │ POST /invoices/:id/email
   │ Attaches PDF, sends via Nodemailer
   ▼
4. Download/View
   │ GET /invoices/:id/pdf
   │ Returns PDF buffer
```

---

## TenantConfig Fields Used

| Field | Usage |
|-------|-------|
| shopName | Company name if companyName not set |
| logoUrl | Logo in PDF header |
| companyName | Legal company name |
| vatNumber | VAT ID on invoice |
| address | Company address block |
| bankAccount | Payment details |
| bankName | Bank name |
| invoicePrefix | Invoice number prefix (e.g., INV-2024-001) |
| invoiceFooter | Footer text |
| website | Website URL |
| email | Contact email |
| phone | Contact phone |

---

## PDF Structure

```
┌─────────────────────────────────────────────────┐
│ [Logo]                          Invoice #INV-001│
│ Company Name                    Date: 2024-01-15│
│ VAT: BE0123456789                               │
│ Street 123, 1000 Brussels                       │
│ email@company.com | +32 123 456 789             │
├─────────────────────────────────────────────────┤
│ Bill To:                                        │
│ Customer Name                                   │
│ Customer Address                                │
├─────────────────────────────────────────────────┤
│ Item          Qty    Unit Price    Total        │
│ ─────────────────────────────────────────────── │
│ Product A     2      €50.00        €100.00      │
│ Product B     1      €75.00        €75.00       │
├─────────────────────────────────────────────────┤
│                          Subtotal: €175.00      │
│                          VAT 21%:  €36.75       │
│                          Total:    €211.75      │
├─────────────────────────────────────────────────┤
│ Payment Details:                                │
│ Bank: ING Belgium                               │
│ IBAN: BE12 3456 7890 1234                       │
├─────────────────────────────────────────────────┤
│ [Footer Text]                                   │
│ www.company.com                                 │
└─────────────────────────────────────────────────┘
```

---

## API Endpoints

### Create Invoice (Admin)

```
POST /invoices
Body: {
  type: 'MANUAL' | 'ORDER',
  customer: { name, email, address },
  items: [{ description, quantity, unitPrice }],
  notes?: string
}
```

### Get PDF (Admin)

```
GET /invoices/:id/pdf
Returns: application/pdf buffer
```

### Send Email (Admin)

```
POST /invoices/:id/email
Sends PDF attachment to customer email
```

---

## Invoice Types

| Type | Created By |
|------|------------|
| `ORDER` | Automatically after order payment |
| `MANUAL` | Admin creates manually |
| `REPAIR` | After repair completion |

---

## Number Generation

Invoice numbers follow pattern: `{prefix}-{year}-{sequence}`

Example: `INV-2024-00042`

The prefix comes from `TenantConfig.invoicePrefix`.

---

## Code Pattern

```typescript
async generatePdf(invoiceId: string): Promise<Buffer> {
  const invoice = await this.findOne(invoiceId);
  const config = await this.getTenantConfig(invoice.tenantId);
  
  const doc = new PDFDocument();
  
  // Header with logo
  if (config.logoUrl) {
    doc.image(await this.fetchLogo(config.logoUrl), 50, 50);
  }
  
  // Company info
  doc.text(config.companyName || config.shopName);
  doc.text(`VAT: ${config.vatNumber || 'N/A'}`);
  // ... etc
  
  // Items table
  for (const item of invoice.items) {
    doc.text(`${item.description} x${item.quantity}`);
  }
  
  // Totals
  doc.text(`Total: ${this.formatCurrency(invoice.total)}`);
  
  doc.end();
  return doc.outputBuffer();
}
```

---

## Related Docs

- [TenantConfig Schema](./tenant-config.md)
- [API Overview](./api-overview.md)
