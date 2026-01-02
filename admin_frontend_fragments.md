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
