# Bugfix Requirements Document

## Introduction

After completing the Backend-Frontend Alignment bugfix (Phase 28.4), architectural standards were documented in AGENTS.md establishing server actions as the primary pattern for client-server communication. However, 9 services still use deprecated patterns that are inconsistent with these standards:

- **5 Class-Based Services**: PaymentService, DopingService, ChatService, ListingService, SupportService
- **4 Client-Service Wrappers**: ProfileService, AuthService, NotificationService, ReportService

This creates architectural inconsistency, increases maintenance burden, and confuses developers who must navigate between modern and legacy patterns. This bugfix will systematically migrate all legacy services to the established server actions pattern, ensuring consistency across the entire codebase.

**Impact**: Improved maintainability, consistent architecture, faster developer onboarding, reduced cognitive load.

**Scope**: All 9 services will be migrated incrementally, prioritizing high-impact services (PaymentService, DopingService) first.

---

## Bug Analysis

### Current Behavior (Defect)

**1. Class-Based Service Pattern**

1.1 WHEN a service uses class-based pattern (e.g., `export class PaymentService`) THEN the system uses object-oriented patterns instead of functional approach

1.2 WHEN a service exports static class methods THEN the system creates unnecessary class abstractions that conflict with server actions pattern

1.3 WHEN PaymentService (`src/services/payments/payment-logic.ts`) is used THEN the system uses class-based pattern despite being renamed in Phase 28.4

1.4 WHEN DopingService (`src/services/payments/doping-logic.ts`) is used THEN the system uses class-based pattern despite being renamed in Phase 28.4

1.5 WHEN ChatService (`src/services/chat/chat-service.ts`) is used THEN the system uses class-based pattern inconsistent with documented standards

1.6 WHEN ListingService (`src/services/listings/listing-service.ts`) is used THEN the system uses class-based pattern inconsistent with documented standards

1.7 WHEN SupportService (`src/services/support/support-service.ts`) is used THEN the system uses class-based pattern inconsistent with documented standards

**2. Client-Service Wrapper Pattern**

1.8 WHEN a service uses client-service wrapper pattern (e.g., `services/*/client-service.ts`) THEN the system creates unnecessary abstraction layer between components and server

1.9 WHEN ProfileService (`src/services/profile/client-service.ts`) is used THEN the system wraps API calls in redundant client-side service layer

1.10 WHEN AuthService (`src/services/auth/client-service.ts`) is used THEN the system wraps API calls in redundant client-side service layer

1.11 WHEN NotificationService (`src/services/notifications/client-service.ts`) is used THEN the system wraps API calls in redundant client-side service layer

1.12 WHEN ReportService (`src/services/reports/client-service.ts`) is used THEN the system wraps API calls in redundant client-side service layer

**3. Naming Inconsistency**

1.13 WHEN services use legacy naming conventions THEN the system has inconsistent file naming across service directories

1.14 WHEN developers navigate the codebase THEN the system presents mixed patterns (some services use `*-actions.ts`, others use `*-service.ts`)

**4. Documentation Mismatch**

1.15 WHEN AGENTS.md documents server actions as the established pattern THEN the system still contains 9 services using deprecated patterns marked as "should not be used in new code"

1.16 WHEN developers reference AGENTS.md for architectural guidance THEN the system implementation contradicts documented standards

---

### Expected Behavior (Correct)

**1. Functional Server Actions Pattern**

2.1 WHEN a service implements business logic THEN the system SHALL use functional exports instead of class-based patterns

2.2 WHEN a service needs to expose API endpoints THEN the system SHALL use server actions with `"use server"` directive

2.3 WHEN PaymentService logic is needed THEN the system SHALL export pure functions from `payment-logic.ts` without class wrappers

2.4 WHEN DopingService logic is needed THEN the system SHALL export pure functions from `doping-logic.ts` without class wrappers

2.5 WHEN ChatService functionality is needed THEN the system SHALL use server actions in appropriate `app/` directory with functional logic

2.6 WHEN ListingService functionality is needed THEN the system SHALL use server actions in appropriate `app/` directory with functional logic

2.7 WHEN SupportService functionality is needed THEN the system SHALL use server actions in appropriate `app/` directory with functional logic

**2. Direct Server Action Calls**

2.8 WHEN components need to interact with backend services THEN the system SHALL call server actions directly without client-service wrappers

2.9 WHEN ProfileService functionality is needed THEN the system SHALL use server actions directly, removing `client-service.ts`

2.10 WHEN AuthService functionality is needed THEN the system SHALL use server actions directly, removing `client-service.ts`

2.11 WHEN NotificationService functionality is needed THEN the system SHALL use server actions directly, removing `client-service.ts`

2.12 WHEN ReportService functionality is needed THEN the system SHALL use server actions directly, removing `client-service.ts`

**3. Consistent Naming Convention**

2.13 WHEN services follow the established pattern THEN the system SHALL use consistent naming: `*-actions.ts`, `*-logic.ts`, `*-records.ts`, `*-client.ts`

2.14 WHEN developers navigate service directories THEN the system SHALL present uniform structure across all services

**4. Documentation Alignment**

2.15 WHEN AGENTS.md documents architectural standards THEN the system SHALL implement those standards consistently across all services

2.16 WHEN developers reference architectural documentation THEN the system SHALL match documented patterns without exceptions

---

### Unchanged Behavior (Regression Prevention)

**1. Functional Equivalence**

3.1 WHEN migrating class-based services to functional pattern THEN the system SHALL CONTINUE TO provide identical functionality with same inputs and outputs

3.2 WHEN migrating client-service wrappers to server actions THEN the system SHALL CONTINUE TO provide identical API contracts to consuming components

3.3 WHEN refactoring service structure THEN the system SHALL CONTINUE TO pass all existing tests without modification

**2. Authentication & Authorization**

3.4 WHEN server actions handle authenticated requests THEN the system SHALL CONTINUE TO enforce authentication checks as before

3.5 WHEN server actions handle authorized requests THEN the system SHALL CONTINUE TO enforce authorization rules as before

3.6 WHEN RLS policies protect data access THEN the system SHALL CONTINUE TO respect RLS policies without bypassing them

**3. Error Handling**

3.7 WHEN services encounter errors THEN the system SHALL CONTINUE TO return error responses in the same format

3.8 WHEN validation fails THEN the system SHALL CONTINUE TO return validation errors with same structure

3.9 WHEN external API calls fail THEN the system SHALL CONTINUE TO handle failures gracefully as before

**4. External Integrations**

3.10 WHEN PaymentService integrates with Iyzico THEN the system SHALL CONTINUE TO use `iyzico-client.ts` without changes

3.11 WHEN services integrate with third-party APIs THEN the system SHALL CONTINUE TO use existing `*-client.ts` files unchanged

3.12 WHEN external API clients are used THEN the system SHALL CONTINUE TO maintain same integration patterns

**5. Data Access Layer**

3.13 WHEN services query the database THEN the system SHALL CONTINUE TO use existing `*-records.ts` files for data access

3.14 WHEN services perform CRUD operations THEN the system SHALL CONTINUE TO execute same database queries

3.15 WHEN services use Supabase client THEN the system SHALL CONTINUE TO respect RLS policies and use proper client instances

**6. Business Logic**

3.16 WHEN calculating doping prices THEN the system SHALL CONTINUE TO use same calculation logic

3.17 WHEN validating payment data THEN the system SHALL CONTINUE TO use same validation rules

3.18 WHEN processing business workflows THEN the system SHALL CONTINUE TO execute same business logic

**7. Component Integration**

3.19 WHEN components import service functions THEN the system SHALL CONTINUE TO provide same function signatures (only import paths change)

3.20 WHEN components call service methods THEN the system SHALL CONTINUE TO receive same response structures

3.21 WHEN components handle service responses THEN the system SHALL CONTINUE TO process responses identically

**8. Performance**

3.22 WHEN services execute queries THEN the system SHALL CONTINUE TO maintain same or better performance characteristics

3.23 WHEN services handle concurrent requests THEN the system SHALL CONTINUE TO scale identically

3.24 WHEN services use caching THEN the system SHALL CONTINUE TO cache data with same strategies

**9. Type Safety**

3.25 WHEN services use TypeScript types THEN the system SHALL CONTINUE TO provide same type safety guarantees

3.26 WHEN services validate with Zod schemas THEN the system SHALL CONTINUE TO use same validation schemas

3.27 WHEN components consume service types THEN the system SHALL CONTINUE TO have full type inference

**10. Build & Deployment**

3.28 WHEN the application builds THEN the system SHALL CONTINUE TO build successfully with zero TypeScript errors

3.29 WHEN the application lints THEN the system SHALL CONTINUE TO pass ESLint checks with zero errors

3.30 WHEN the application deploys THEN the system SHALL CONTINUE TO deploy successfully without runtime errors

---

## Bug Condition Derivation

### Bug Condition Function

```pascal
FUNCTION isBugCondition(ServiceFile)
  INPUT: ServiceFile of type { path: string, content: string }
  OUTPUT: boolean
  
  // Returns true when service uses deprecated patterns
  RETURN (
    // Class-based service pattern
    (ServiceFile.content CONTAINS "export class" AND 
     ServiceFile.content CONTAINS "Service" AND
     ServiceFile.path MATCHES "src/services/*/") OR
    
    // Client-service wrapper pattern
    (ServiceFile.path MATCHES "src/services/*/client-service.ts")
  )
END FUNCTION
```

### Specific Bug Conditions

**Class-Based Services (C1)**:
```pascal
FUNCTION isClassBasedService(ServiceFile)
  INPUT: ServiceFile of type { path: string, content: string }
  OUTPUT: boolean
  
  RETURN (
    ServiceFile.path IN [
      "src/services/payments/payment-logic.ts",
      "src/services/payments/doping-logic.ts",
      "src/services/chat/chat-service.ts",
      "src/services/listings/listing-service.ts",
      "src/services/support/support-service.ts"
    ] AND
    ServiceFile.content CONTAINS "export class"
  )
END FUNCTION
```

**Client-Service Wrappers (C2)**:
```pascal
FUNCTION isClientServiceWrapper(ServiceFile)
  INPUT: ServiceFile of type { path: string }
  OUTPUT: boolean
  
  RETURN ServiceFile.path IN [
    "src/services/profile/client-service.ts",
    "src/services/auth/client-service.ts",
    "src/services/notifications/client-service.ts",
    "src/services/reports/client-service.ts"
  ]
END FUNCTION
```

### Property Specification: Fix Checking

```pascal
// Property 1: Class-Based Services Migrated to Functional Pattern
FOR ALL ServiceFile WHERE isClassBasedService(ServiceFile) DO
  migratedService ← migrateToFunctional(ServiceFile)
  
  ASSERT migratedService.usesExportedFunctions = true
  ASSERT migratedService.usesClassPattern = false
  ASSERT migratedService.hasServerActions = true
  ASSERT migratedService.followsNamingConvention = true
  ASSERT functionalEquivalence(ServiceFile, migratedService) = true
END FOR

// Property 2: Client-Service Wrappers Removed
FOR ALL ServiceFile WHERE isClientServiceWrapper(ServiceFile) DO
  migratedService ← removeClientWrapper(ServiceFile)
  
  ASSERT migratedService.fileDeleted = true
  ASSERT migratedService.componentsUseServerActions = true
  ASSERT migratedService.noAbstractionLayer = true
  ASSERT functionalEquivalence(ServiceFile, migratedService) = true
END FOR

// Property 3: Naming Convention Consistency
FOR ALL ServiceFile WHERE isBugCondition(ServiceFile) DO
  migratedService ← applyNamingConvention(ServiceFile)
  
  ASSERT migratedService.hasActionsFile = true
  ASSERT migratedService.hasLogicFile = true
  ASSERT migratedService.hasRecordsFile = (needsDataAccess ? true : optional)
  ASSERT migratedService.hasClientFile = (needsExternalAPI ? true : optional)
END FOR

// Property 4: Documentation Alignment
FOR ALL ServiceFile WHERE isBugCondition(ServiceFile) DO
  migratedService ← migrateService(ServiceFile)
  
  ASSERT matchesAGENTSmd(migratedService) = true
  ASSERT matchesSERVICE_ARCHITECTUREmd(migratedService) = true
  ASSERT noDeprecatedPatterns(migratedService) = true
END FOR
```

### Preservation Property

```pascal
// Property: Preservation Checking
FOR ALL ServiceFile WHERE NOT isBugCondition(ServiceFile) DO
  // Services already using server actions pattern
  ASSERT F(ServiceFile) = F'(ServiceFile)
  ASSERT ServiceFile.structure = unchanged
  ASSERT ServiceFile.functionality = unchanged
END FOR

// Functional Equivalence for Migrated Services
FOR ALL ServiceFile WHERE isBugCondition(ServiceFile) DO
  migratedService ← migrateService(ServiceFile)
  
  // Same functionality, different structure
  ASSERT functionalEquivalence(F(ServiceFile), F'(migratedService)) = true
  ASSERT allTestsPass(migratedService) = true
  ASSERT noBreakingChanges(migratedService) = true
END FOR
```

### Key Definitions

- **F**: Original service implementation (class-based or client-wrapper)
- **F'**: Migrated service implementation (server actions + functional)
- **functionalEquivalence(F, F')**: Returns true when F and F' produce identical outputs for all inputs
- **migrateToFunctional**: Converts class-based service to functional exports
- **removeClientWrapper**: Removes client-service wrapper and updates component imports
- **applyNamingConvention**: Renames files to follow `*-actions.ts`, `*-logic.ts` pattern

---

## Migration Priority

### High Priority (Week 1)
1. **PaymentService** - Critical payment flow, high usage
2. **DopingService** - Critical monetization flow, high usage

### Medium Priority (Week 2)
3. **ListingService** - Core marketplace functionality
4. **ChatService** - Secondary feature but used
5. **ProfileService** - User profile management
6. **AuthService** - Authentication flows

### Low Priority (Week 3)
7. **SupportService** - Admin/support functionality
8. **NotificationService** - Background notifications
9. **ReportService** - Reporting functionality

---

## Success Criteria

### Functional Requirements
- ✅ All 9 services migrated to server actions pattern
- ✅ Zero class-based services remain
- ✅ Zero client-service wrappers remain
- ✅ All services follow naming convention: `*-actions.ts`, `*-logic.ts`, `*-records.ts`, `*-client.ts`

### Quality Requirements
- ✅ All existing tests pass without modification
- ✅ Zero TypeScript errors
- ✅ Zero ESLint errors
- ✅ Build succeeds with all pages generated
- ✅ No breaking changes to component APIs

### Documentation Requirements
- ✅ AGENTS.md reflects actual implementation (no deprecated patterns in use)
- ✅ SERVICE_ARCHITECTURE.md updated with migration completion status
- ✅ COMPREHENSIVE_CODE_QUALITY_ANALYSIS.md updated to reflect zero legacy patterns

### Performance Requirements
- ✅ No performance regressions
- ✅ Same or better response times
- ✅ Same or better database query performance

---

## Counterexamples

### Example 1: PaymentService Class-Based Pattern

**Current (Buggy)**:
```typescript
// src/services/payments/payment-logic.ts
export class PaymentService {
  static async initializeCheckout(params: PaymentParams) {
    // Business logic
  }
}

// Component usage
import { PaymentService } from "@/services/payments/payment-logic";
const result = await PaymentService.initializeCheckout(params);
```

**Expected (Fixed)**:
```typescript
// src/services/payments/payment-logic.ts
export async function calculatePaymentAmount(params: PaymentParams) {
  // Pure business logic
}

// src/app/api/payments/initialize/route.ts
"use server";
import { calculatePaymentAmount } from "@/services/payments/payment-logic";

export async function initializeCheckout(params: PaymentParams) {
  // Server action with auth
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };
  
  const amount = calculatePaymentAmount(params);
  // ... rest of logic
}

// Component usage
import { initializeCheckout } from "@/app/api/payments/initialize/route";
const result = await initializeCheckout(params);
```

### Example 2: ProfileService Client-Wrapper Pattern

**Current (Buggy)**:
```typescript
// src/services/profile/client-service.ts
export async function updateProfile(data: ProfileData) {
  return ApiClient.request("/api/profile", {
    method: "PUT",
    data
  });
}

// Component usage
import { updateProfile } from "@/services/profile/client-service";
const result = await updateProfile(data);
```

**Expected (Fixed)**:
```typescript
// src/app/dashboard/profile/actions.ts
"use server";

export async function updateProfile(data: ProfileData) {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: "Unauthorized" };
  
  // Direct implementation
  const { error } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", user.id);
    
  return { success: !error, error };
}

// Component usage
import { updateProfile } from "@/app/dashboard/profile/actions";
const result = await updateProfile(data);

// Delete: src/services/profile/client-service.ts
```

---

## References

- **AGENTS.md**: Service Architecture section (lines 200-350)
- **docs/SERVICE_ARCHITECTURE.md**: Complete migration guide
- **COMPREHENSIVE_CODE_QUALITY_ANALYSIS.md**: Category 1 - Legacy Service Patterns
- **Phase 28.4**: Backend-Frontend Alignment bugfix (established server actions pattern)
