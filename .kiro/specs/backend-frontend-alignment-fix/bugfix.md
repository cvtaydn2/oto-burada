# Bugfix Requirements Document: Backend-API-Frontend Alignment Issues

## Introduction

The OtoBurada application has accumulated architectural debt across 46 phases of development, resulting in backend-frontend alignment issues that manifest as:
- Database schema mismatches causing fallback queries during build
- Duplicate service layer structures creating confusion and maintenance burden
- Obsolete documentation files (30+ files) cluttering the repository
- Inconsistent service patterns between client-side and server-side code

These issues do not prevent the application from functioning (build succeeds, all pages render), but they create technical debt that impacts:
- Developer onboarding and code discoverability
- Maintenance efficiency and debugging speed
- Future feature development velocity
- Codebase clarity and architectural consistency

## Bug Analysis

### Current Behavior (Defect)

#### 1. Database Schema Mismatches

1.1 WHEN the application builds THEN the system logs "Marketplace schema mismatch detected, attempting legacy fallback" warnings

1.2 WHEN querying listings with seller profiles THEN the system attempts to join `listings` with `public_profiles` view but falls back to legacy schema due to relationship cache misses

1.3 WHEN the listing submission query executes THEN the system uses `profiles:public_profiles!inner!seller_id` syntax that triggers PGRST200 errors

#### 2. Duplicate Service Layer Structures

2.1 WHEN developers need payment services THEN the system has both `src/services/payment/` (server-side with Iyzico integration) and `src/services/payments/` (client-side API wrapper) directories with overlapping responsibilities

2.2 WHEN developers need favorite services THEN the system has both `src/services/favorites/favorite-service.ts` (legacy class-based) and `src/services/favorites/client-service.ts` (modern functional) with identical functionality

2.3 WHEN components import services THEN the system has inconsistent naming patterns (PaymentService exported from both `payment/payment-service.ts` and `payments/client-service.ts`)

2.4 WHEN developers search for service implementations THEN the system has 6 `client-service.ts` files scattered across different service directories without clear naming conventions

#### 3. Obsolete Documentation Clutter

3.1 WHEN developers navigate the repository root THEN the system contains 30+ phase-specific documentation files (PHASE_6_CRITICAL_FIXES_REPORT.md, ARCHITECTURAL-ISSUES-PHASE-39.md, etc.) that are no longer relevant

3.2 WHEN developers look for current documentation THEN the system has multiple overlapping security documentation files (SECURITY.md, SECURITY_COMPREHENSIVE.md, SECURITY_FIXES_2026-04.md, SECURITY_ALERT.md, etc.)

3.3 WHEN developers check fix summaries THEN the system has redundant summary files (ALL_FIXES_COMPLETE_SUMMARY.md, COMPLETE_FIXES_SUMMARY.md, CRITICAL_FIXES_SUMMARY.md, etc.)

#### 4. Inconsistent Service Architecture Patterns

4.1 WHEN client components need to call APIs THEN the system has mixed patterns: some use server actions (`dashboard/favorites/actions.ts`), some use client services (`services/payments/client-service.ts`), and some use legacy service classes (`services/favorites/favorite-service.ts`)

4.2 WHEN server-side code needs business logic THEN the system has services that mix data access, business logic, and API client code without clear separation

### Expected Behavior (Correct)

#### 1. Database Schema Alignment

2.1 WHEN the application builds THEN the system SHALL complete without schema mismatch warnings or fallback queries

2.2 WHEN querying listings with seller profiles THEN the system SHALL use consistent relationship syntax that matches the current database schema

2.3 WHEN the listing submission query executes THEN the system SHALL use the correct view/table references that exist in the schema cache

#### 2. Unified Service Layer Structure

2.4 WHEN developers need payment services THEN the system SHALL have a single, clearly named payment service directory with separated concerns (server-side business logic vs client-side API wrappers)

2.5 WHEN developers need favorite services THEN the system SHALL have one canonical implementation following the established server action pattern

2.6 WHEN components import services THEN the system SHALL have consistent naming conventions that clearly distinguish client-side API wrappers from server-side business logic

2.7 WHEN developers search for service implementations THEN the system SHALL have a clear, documented service architecture pattern with consistent file naming

#### 3. Clean Documentation Structure

2.8 WHEN developers navigate the repository root THEN the system SHALL contain only current, relevant documentation files (AGENTS.md, README.md, TASKS.md, PROGRESS.md, DEPLOYMENT_CHECKLIST.md)

2.9 WHEN developers look for security documentation THEN the system SHALL have a single, consolidated security documentation file

2.10 WHEN developers check implementation history THEN the system SHALL use PROGRESS.md as the single source of truth for historical decisions

#### 4. Consistent Service Architecture

2.11 WHEN client components need to call APIs THEN the system SHALL use server actions as the primary pattern (as established in Phase 28.4)

2.12 WHEN server-side code needs business logic THEN the system SHALL have clear separation: services for data access, domain/usecases for business logic, and actions for API endpoints

### Unchanged Behavior (Regression Prevention)

#### 1. Application Functionality

3.1 WHEN users access any page THEN the system SHALL CONTINUE TO render all pages correctly without errors

3.2 WHEN users perform any action THEN the system SHALL CONTINUE TO execute all business logic correctly

3.3 WHEN the application builds THEN the system SHALL CONTINUE TO build successfully without compilation errors

#### 2. Data Integrity

3.4 WHEN queries execute THEN the system SHALL CONTINUE TO return correct data with proper RLS enforcement

3.5 WHEN payments process THEN the system SHALL CONTINUE TO handle Iyzico integration correctly

3.6 WHEN favorites are toggled THEN the system SHALL CONTINUE TO persist changes correctly

#### 3. Security and Performance

3.7 WHEN authentication checks run THEN the system SHALL CONTINUE TO enforce all security policies

3.8 WHEN rate limiting applies THEN the system SHALL CONTINUE TO protect against abuse

3.9 WHEN caching strategies execute THEN the system SHALL CONTINUE TO optimize performance

## Bug Condition Analysis

### Bug Condition Function

```pascal
FUNCTION isBugCondition(X)
  INPUT: X of type CodebaseElement
  OUTPUT: boolean
  
  RETURN (
    // Schema mismatch condition
    (X.type = "DatabaseQuery" AND X.usesLegacyFallback = true) OR
    
    // Duplicate service condition
    (X.type = "ServiceDirectory" AND 
     EXISTS(Y WHERE Y.type = "ServiceDirectory" AND 
            Y.domain = X.domain AND 
            Y.path ≠ X.path)) OR
    
    // Obsolete documentation condition
    (X.type = "DocumentationFile" AND 
     X.isPhaseSpecific = true AND 
     X.phase < CurrentPhase) OR
    
    // Inconsistent pattern condition
    (X.type = "ServiceImplementation" AND
     NOT MATCHES(X.pattern, EstablishedPattern))
  )
END FUNCTION
```

### Property Specification: Fix Checking

```pascal
// Property: Schema Alignment
FOR ALL X WHERE isBugCondition(X) AND X.type = "DatabaseQuery" DO
  result ← executeQuery'(X)
  ASSERT no_schema_mismatch_warning(result) AND 
         no_legacy_fallback(result)
END FOR

// Property: Service Consolidation
FOR ALL X WHERE isBugCondition(X) AND X.type = "ServiceDirectory" DO
  services ← getServicesByDomain(X.domain)
  ASSERT COUNT(services) = 1 AND
         has_clear_separation_of_concerns(services[0])
END FOR

// Property: Documentation Cleanup
FOR ALL X WHERE isBugCondition(X) AND X.type = "DocumentationFile" DO
  ASSERT NOT EXISTS(X) OR X.isCurrentlyRelevant = true
END FOR

// Property: Pattern Consistency
FOR ALL X WHERE isBugCondition(X) AND X.type = "ServiceImplementation" DO
  ASSERT MATCHES(X.pattern, EstablishedPattern) AND
         has_clear_documentation(X.pattern)
END FOR
```

### Preservation Property

```pascal
// Property: Preservation Checking
FOR ALL X WHERE NOT isBugCondition(X) DO
  ASSERT F(X) = F'(X)
END FOR

// Specifically:
// - All working pages continue to work
// - All business logic continues to execute correctly
// - All security policies continue to be enforced
// - All performance optimizations continue to function
```

## Concrete Examples

### Example 1: Schema Mismatch

**Buggy Input:**
```typescript
// src/services/listings/listing-submission-query.ts
const query = `
  profiles:public_profiles!inner!seller_id (
    id, full_name, avatar_url
  )
`;
```

**Current Behavior:** Triggers PGRST200 error, falls back to legacy schema

**Expected Behavior:** Uses correct relationship syntax that matches schema cache

### Example 2: Duplicate Services

**Buggy Input:**
```typescript
// Component tries to import PaymentService
import { PaymentService } from "@/services/payment/payment-service"; // Server-side
// OR
import { PaymentService } from "@/services/payments/client-service"; // Client-side
```

**Current Behavior:** Two different implementations with same name, confusion about which to use

**Expected Behavior:** Clear naming convention (e.g., `PaymentBusinessLogic` vs `PaymentApiClient`) or consolidated into server actions

### Example 3: Obsolete Documentation

**Buggy Input:**
```
Repository root contains:
- PHASE_6_CRITICAL_FIXES_REPORT.md
- PHASE_7_SECURITY_HARDENING_REPORT.md
- ARCHITECTURAL-ISSUES-PHASE-39.md
- LOGIC-ISSUES-PHASE-40.md
- PERFORMANCE-ISSUES-PHASE-42.md
... (30+ files)
```

**Current Behavior:** Cluttered repository, unclear which docs are current

**Expected Behavior:** Only current docs in root, historical details in PROGRESS.md or archived

## Impact Assessment

### Severity: Medium
- Application functions correctly (no user-facing bugs)
- Build succeeds (no blocking issues)
- Technical debt impacts developer experience and future velocity

### Affected Areas:
1. **Developer Experience**: Confusion about service patterns, difficulty finding correct implementations
2. **Maintenance**: Extra effort to understand which code is current vs legacy
3. **Onboarding**: New developers face steep learning curve due to inconsistent patterns
4. **Future Development**: Architectural inconsistencies slow down new feature development

### Risk of Not Fixing:
- Continued accumulation of technical debt
- Increased likelihood of bugs when modifying service layer
- Slower feature development velocity
- Difficulty maintaining code quality standards
