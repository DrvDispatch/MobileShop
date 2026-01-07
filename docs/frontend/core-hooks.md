# Core Hooks

## Overview

Core hooks live in `frontend/src/core/hooks/` and provide page-level View Models. Each hook:
- Aggregates data from stores, contexts, and APIs
- Transforms raw data into page-ready format
- Exposes actions as callbacks
- Returns a typed VM interface

---

## Page VMs

### useHomePageVM

**Location**: `core/hooks/pages/useHomePageVM.ts`

```typescript
interface HomePageVM {
  // Currently minimal - expand as needed
}
```

### useCartPageVM

**Location**: `core/hooks/pages/useCartPageVM.ts`

```typescript
interface CartPageVM {
  items: CartItem[];
  subtotal: number;
  isEmpty: boolean;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}
```

**Sources**: `useCartStore()`

### useCheckoutPageVM

**Location**: `core/hooks/pages/useCheckoutPageVM.ts`

```typescript
interface CheckoutPageVM {
  // Cart
  items: CartItem[];
  isEmpty: boolean;
  
  // Form
  formData: CheckoutFormState;
  setFormData: Dispatch<SetStateAction<CheckoutFormState>>;
  phonePrefix: string;
  setPhonePrefix: Dispatch<SetStateAction<string>>;
  
  // Coupon
  couponCode: string;
  setCouponCode: Dispatch<SetStateAction<string>>;
  appliedDiscount: DiscountValidation | null;
  couponError: string | null;
  couponLoading: boolean;
  validateCouponCode: () => Promise<void>;
  removeCoupon: () => void;
  
  // Totals
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  
  // Submit
  isLoading: boolean;
  error: string | null;
  submit: () => Promise<void>;
  
  // Config
  countryCodes: string[];
  labels: CheckoutLabels;
}
```

**Sources**: `useCheckout()`, `useUIConfig()`

### useCheckoutSuccessPageVM

**Location**: `core/hooks/pages/useCheckoutSuccessPageVM.ts`

```typescript
interface CheckoutSuccessPageVM {
  order: Order | null;
  isLoading: boolean;
  isResolving: boolean;
  error: string | null;
}
```

**Sources**: `useSearchParams()`, API calls

### useContactPageVM

**Location**: `core/hooks/pages/useContactPageVM.ts`

```typescript
interface ContactPageVM {
  shopName: string;
  email: string;
  phone: string;
  whatsappNumber: string | null;
  whatsappLink: string | null;
  address: AddressShape;
  googleMapsLink: string;
  openingHours: OpeningHoursShape | null;
  openChatWidget: () => void;
}
```

**Sources**: `useTenant()`, chat modal state

### useSupportPageVM

**Location**: `core/hooks/pages/useSupportPageVM.ts`

```typescript
interface SupportPageVM {
  shopPhone: string;
  shopEmail: string;
  formattedAddress: string;
  openingHours: OpeningHoursShape | null;
  formatHoursForCard: (day: string) => string | null;
}
```

**Sources**: `useTenant()`

### usePhonesPageVM

**Location**: `core/hooks/pages/usePhonesPageVM.ts`

```typescript
interface PhonesPageVM {
  // Products
  products: Product[];
  allProducts: Product[];
  isLoading: boolean;
  
  // Pagination
  currentPage: number;
  totalPages: number;
  setCurrentPage: Dispatch<SetStateAction<number>>;
  
  // Search/Filter
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  toggleFilter: (key: string, value: string) => void;
  clearFilters: () => void;
  
  // Sort
  sortBy: string;
  setSortBy: Dispatch<SetStateAction<string>>;
  
  // UI
  showFilters: boolean;
  setShowFilters: Dispatch<SetStateAction<boolean>>;
  expandedFilters: string[];
  toggleFilterSection: (id: string) => void;
  
  // Constants
  BRANDS: string[];
  CONDITIONS: string[];
  STORAGE_OPTIONS: string[];
  BATTERY_OPTIONS: string[];
  SORT_OPTIONS: SortOption[];
}
```

**Sources**: `useProductList()`, URL params

### useBookingPageVM

**Location**: `core/hooks/pages/useBookingPageVM.ts`

```typescript
interface BookingPageVM {
  // Step state
  step: BookingStep;
  
  // Selections
  deviceType: DeviceType | null;
  brand: Brand | null;
  device: Device | null;
  repair: RepairSelection | null;
  selectedDate: Date | null;
  selectedSlot: string;
  customerData: CustomerData;
  
  // Available options
  deviceTypes: DeviceType[];
  brands: Brand[];
  devices: Device[];
  repairs: RepairService[];
  availableDates: Date[];
  availableSlots: string[];
  
  // Actions
  selectDeviceType: (dt: DeviceType) => void;
  selectBrand: (b: Brand) => void;
  selectDevice: (d: Device) => void;
  selectRepair: (r: RepairService) => void;
  selectDate: (d: Date) => void;
  selectSlot: (slot: string) => void;
  updateCustomerData: (data: Partial<CustomerData>) => void;
  navigateToStep: (step: BookingStep) => void;
  goBack: () => void;
  goNext: () => void;
  submit: () => Promise<void>;
  reset: () => void;
  
  // State
  isLoading: boolean;
  isSubmitting: boolean;
  isSuccess: boolean;
  error: string | null;
  
  // Labels
  bookingLabels: BookingLabels;
  formatting: FormattingConfig;
}
```

**Sources**: `useBookingFlow()`, `useUIConfig()`

---

## Layout VMs

See [Layout VMs](./layout-vms.md) for `usePublicLayoutVM`.

---

## Export Pattern

All page VMs are exported from a single index:

```typescript
// core/hooks/pages/index.ts

export { useHomePageVM } from './useHomePageVM';
export type { HomePageVM } from './useHomePageVM';

export { useCartPageVM } from './useCartPageVM';
export type { CartPageVM } from './useCartPageVM';

// ... etc
```

---

## Adding a New Page VM

1. Create `useXxxPageVM.ts` in `core/hooks/pages/`
2. Define `XxxPageVM` interface
3. Implement hook that returns the VM
4. Export from `core/hooks/pages/index.ts`
5. Add page type to `SkinDefinition`
6. Create skin page that accepts VM

---

## Related Docs

- [Data Flow](../platform/data-flow.md)
- [Layout VMs](./layout-vms.md)
