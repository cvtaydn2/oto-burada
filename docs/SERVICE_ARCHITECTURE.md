# Service Architecture Migration Guide

This document provides detailed guidance on migrating from legacy service patterns to the modern server action pattern established in Phase 28.4.

## Table of Contents

- [Overview](#overview)
- [Modern Pattern: Server Actions](#modern-pattern-server-actions)
- [Legacy Patterns](#legacy-patterns)
- [Migration Examples](#migration-examples)
- [Naming Conventions](#naming-conventions)
- [Migrated Services](#migrated-services)

## Overview

The OtoBurada codebase has evolved through 46 development phases, resulting in some architectural inconsistencies. This guide documents the **established pattern** (Server Actions) and provides migration paths from legacy patterns.

**Goal**: Achieve consistency across all services using the server action pattern with functional programming principles.

## Modern Pattern: Server Actions

### Structure

```
src/
  app/
    api/
      [feature]/
        actions.ts          # Server actions (API endpoints)
    dashboard/
      [feature]/
        actions.ts          # Server actions (authenticated routes)
  services/
    [feature]/
      [feature]-records.ts  # Data access layer
      [feature]-logic.ts    # Business logic
      [feature]-client.ts   # External API clients (optional)
```

### Example: Server Action

```typescript
// src/app/api/payments/actions.ts
"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PaymentService } from "@/services/payments/payment-logic";

export async function initializePayment(listingId: string, packageType: string) {
  const supabase = await createSupabaseServerClient();
  
  // Authentication check
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { success: false, error: "Unauthorized" };
  }
  
  // Business logic
  const result = await PaymentService.initializeCheckout({
    userId: user.id,
    listingId,
    packageType
  });
  
  return result;
}
```

### Key Characteristics

1. **`"use server"` directive** at the top of the file
2. **Functional approach** - no classes
3. **Authentication** handled in server actions
4. **Serializable return values** (no functions, classes, or symbols)
5. **Type-safe** with TypeScript and Zod validation

## Legacy Patterns

### Pattern 1: Class-Based Services

**Problem**: Uses object-oriented patterns instead of functional approach.

```typescript
// ❌ Legacy Pattern
export class PaymentService {
  static async initializeCheckout(params: PaymentParams) {
    // ...
  }
}
```

**Solution**: Convert to functional exports.

```typescript
// ✅ Modern Pattern
export async function initializeCheckout(params: PaymentParams) {
  // ...
}
```

### Pattern 2: Client-Service Wrappers

**Problem**: Unnecessary abstraction layer between components and server.

```typescript
// ❌ Legacy Pattern (client-service.ts)
import { ApiClient } from "@/lib/api-client";

export async function toggleFavorite(listingId: string) {
  return ApiClient.request("/api/favorites", {
    method: "POST",
    data: { listingId }
  });
}
```

**Solution**: Use server actions directly.

```typescript
// ✅ Modern Pattern (actions.ts)
"use server";

export async function toggleFavorite(listingId: string) {
  const supabase = await createSupabaseServerClient();
  // Direct implementation
}
```

## Migration Examples

### Example 1: Payment Service Migration

**Before (Phase 27)**:
```
src/services/payment/
  ├── payment-service.ts    # Class-based service
  ├── doping-service.ts     # Class-based service
  ├── client-service.ts     # Client wrapper
  └── iyzico-client.ts      # External API client
```

**After (Phase 28.4)**:
```
src/services/payments/
  ├── payment-logic.ts      # Business logic (functional)
  ├── doping-logic.ts       # Business logic (functional)
  └── iyzico-client.ts      # External API client (unchanged)

src/app/api/payments/
  ├── initialize/
  │   └── route.ts          # Server action
  └── callback/
      └── route.ts          # Server action
```

**Changes**:
1. Renamed directory: `payment/` → `payments/`
2. Renamed files: `*-service.ts` → `*-logic.ts`
3. Deleted `client-service.ts`
4. Components now call API routes directly

### Example 2: Favorites Service Migration

**Before (Phase 27)**:
```
src/services/favorites/
  ├── favorite-service.ts   # Legacy class-based
  ├── client-service.ts     # Modern but redundant
  ├── favorite-records.ts   # Data access layer
  └── favorites-storage.ts  # Local storage utilities
```

**After (Phase 28.4)**:
```
src/services/favorites/
  ├── favorite-records.ts   # Data access layer (kept)
  └── favorites-storage.ts  # Local storage utilities (kept)

src/app/dashboard/favorites/
  └── actions.ts            # Server actions
```

**Changes**:
1. Deleted `favorite-service.ts` (legacy)
2. Deleted `client-service.ts` (redundant)
3. Kept data access and utility files
4. Components use `actions.ts` server actions

## Naming Conventions

### File Naming

| Pattern | Purpose | Example |
|---------|---------|---------|
| `*-actions.ts` | Server actions (API endpoints) | `payment-actions.ts` |
| `*-records.ts` | Data access layer (DB queries) | `favorite-records.ts` |
| `*-logic.ts` | Business logic (pure functions) | `payment-logic.ts` |
| `*-client.ts` | External API clients | `iyzico-client.ts` |
| `*-storage.ts` | Local/session storage utilities | `favorites-storage.ts` |

### Function Naming

- **Server Actions**: Use verb-noun format
  - `initializePayment`, `toggleFavorite`, `createListing`
- **Business Logic**: Use descriptive names
  - `calculateDopingPrice`, `validateListingData`
- **Data Access**: Use CRUD verbs
  - `getFavorites`, `createFavorite`, `deleteFavorite`

## Migrated Services

### ✅ Completed Migrations (Phase 28.4)

1. **Payment Service**
   - Status: ✅ Migrated
   - Pattern: Server actions + functional logic
   - Location: `src/services/payments/`, `src/app/api/payments/`

2. **Favorites Service**
   - Status: ✅ Migrated
   - Pattern: Server actions + data access layer
   - Location: `src/services/favorites/`, `src/app/dashboard/favorites/`

### ⚠️ Pending Migrations

The following services still use legacy patterns and should be migrated:

1. **Listing Service** (`src/services/listings/listing-service.ts`)
   - Pattern: Class-based service
   - Priority: Medium
   - Estimated effort: 2-3 hours

2. **Chat Service** (`src/services/chat/chat-service.ts`)
   - Pattern: Class-based service
   - Priority: Low (feature is secondary for MVP)
   - Estimated effort: 2-3 hours

3. **Support Service** (`src/services/support/support-service.ts`)
   - Pattern: Class-based service
   - Priority: Medium
   - Estimated effort: 1-2 hours

4. **Client Service Files**
   - `src/services/profile/client-service.ts`
   - `src/services/reports/client-service.ts`
   - `src/services/auth/client-service.ts`
   - `src/services/notifications/client-service.ts`
   - Priority: Low (can be migrated incrementally)
   - Estimated effort: 1 hour each

## Migration Checklist

When migrating a service, follow this checklist:

- [ ] Identify all files in the service directory
- [ ] Extract business logic to `*-logic.ts` files
- [ ] Create server actions in appropriate `app/` directory
- [ ] Update all component imports
- [ ] Write/update tests for new structure
- [ ] Delete legacy files (class-based services, client-service wrappers)
- [ ] Update documentation (this file and AGENTS.md)
- [ ] Run full test suite to ensure no regressions
- [ ] Commit changes with descriptive message

## Best Practices

1. **Start with tests**: Write tests for existing behavior before migrating
2. **Migrate incrementally**: One service at a time
3. **Preserve behavior**: Ensure no user-facing changes
4. **Update documentation**: Keep AGENTS.md and this file in sync
5. **Review with team**: Get code review before merging
6. **Monitor production**: Watch for errors after deployment

## Questions?

For questions or clarifications about service architecture:
1. Check AGENTS.md for high-level architectural standards
2. Review this document for migration patterns
3. Look at migrated services (payments, favorites) as examples
4. Consult with the team lead

---

**Last Updated**: Phase 46 (Backend-API-Frontend Alignment Fix)
