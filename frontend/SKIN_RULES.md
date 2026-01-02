# Skin System Rules

> **Purpose**: Define strict boundaries between presentation (skins) and logic (core)

## Core Philosophy

Skins are **purely presentational**. All data access, state, and behavior must flow through existing typed hooks and providers.

---

## Import Restrictions

### ❌ Skins May NOT Import

| Module | Reason |
|--------|--------|
| `core/api` or `lib/api` | All data fetching through core hooks |
| Backend DTOs | Receive typed props from hooks |
| Prisma types | Never access database types directly |
| `fetch` / `axios` | No direct HTTP calls |
| `@TenantId()` decorator | Tenant context via props only |
| `useFeatures()` directly | Feature flags passed as props |

### ✅ Skins May Import

| Module | Example |
|--------|---------|
| React | Standard React imports |
| Component libraries | Tailwind, Radix UI, etc. |
| Skin-local components | `../components/Button` |
| Core types (interfaces only) | `@/core/types/view-models` |
| Utility functions (pure) | `classNames`, `formatDate` |

---

## Power Boundaries

### What a Skin MAY Do ✅

- Render any layout or HTML structure
- Use any CSS framework or styling approach
- Ignore headers, footers, or pages entirely
- Be minimal, maximal, ugly, beautiful, weird
- Create custom animations and interactions
- Reorganize content in any way

### What a Skin MUST NOT Do ❌

- Fetch data (`fetch`, `axios`, etc.)
- Call backend APIs
- Use Prisma types
- Read `tenantId` directly
- Read feature flags directly (receive as props)
- Encode tenant-specific logic
- Contain business rules
- Mutate global state

---

## The Golden Invariant

> **If a skin needs logic → the core is missing an abstraction.**

When a skin requires capabilities not available through view-model props:

1. **DO NOT** add the logic to the skin
2. **DO** extend the core layer with a generic abstraction
3. **THEN** receive the new capability as a prop

---

## File Structure Convention

```
frontend/src/
├── core/                    # ALL logic lives here
│   ├── api/                 # @core-only - API clients
│   ├── hooks/               # @core-only - Business logic
│   ├── providers/           # @core-only - Context providers
│   └── types/               # View-model interfaces (importable)
│
├── skins/                   # ALL presentation lives here
│   ├── default/             # Default ServicePulse theme
│   │   ├── skin.config.ts
│   │   ├── components/
│   │   ├── layouts/
│   │   └── pages/
│   └── [client-name]/       # Client-specific skins
│
└── app/                     # Thin route adapters
```

---

## Enforcement

Files marked with `@core-only` at the top are part of the core layer and must not be imported by skins.

Example marker:
```typescript
/**
 * @core-only
 * 
 * This module is part of the CORE layer.
 * Skins must NOT import from this file directly.
 */
```

---

## Technical Debt Policy

Any skin-specific workaround that violates these rules is considered **technical debt** and must be:

1. Documented in `docs/skins/debt-log.md`
2. Scheduled for proper core abstraction
3. Reviewed before adding more workarounds

---

*Last Updated: January 2026*
