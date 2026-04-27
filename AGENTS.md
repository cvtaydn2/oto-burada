# AGENTS.md

## Mission

Build a mobile-first, production-lean MVP for a **car-only classifieds marketplace** where users can publish listings for free.

The product must feel:

- simpler than generic classifieds websites
- safer and more trustworthy
- fast on mobile
- easy to maintain and extend

Primary success criteria:

1. A user can create a listing in under 2 minutes.
2. A user can filter and reach a relevant car listing in under 3 interactions.
3. The codebase is understandable for a new developer.
4. The app builds, lints, and typechecks cleanly.

## Documentation Hierarchy (Source of Truth)

1. **AGENTS.md**: The "Compass". Vision, non-negotiable rules, and architectural standards.
2. **README.md**: The "Entry Point". Quick start, setup, and high-level tech overview.
3. **TASKS.md**: The "Backlog". Execution order and detailed acceptance criteria.
4. **PROGRESS.md**: The "Log". Implementation history, specific decisions, and immediate next steps.

---

## Workflow Rules

- Work strictly in `TASKS.md` order.
- Before starting any new development, read `PROGRESS.md` to avoid repeating completed work.
- Update `PROGRESS.md` after each completed task with status, decisions, validations, and next step.
- Keep documentation aligned with the current implementation state.
- In case of contradiction, **AGENTS.md** always takes precedence.

---

## Non-negotiable Product Rules

- This marketplace is **only for cars**.
- Individual listings are free.
- **Monetization Model (Freemium + Doping)**:
  - **Layer 1: Doping/Boosts**: Affordable visibility boosts (Homepage, Top Rank, Urgent) priced at ~1/10 of market incumbents to encourage high conversion.
  - **Layer 2: Corporate Plans**: Subscription tiers for professional sellers (Galleries/Fleets) with higher listing limits and bundled doping.
  - **Layer 3: Premium Services**: Value-add services like Expertise appointments, Vehicle History Reports, and AI-assisted listing creation.
  - **Layer 4: Ecosystem Revenue**: Credits, ad space for automotive sectors (insurance, tires), and anonymized market data.
- The MVP should prioritize speed, clarity, trust, and usability.
- Avoid unnecessary complexity.
- Admin moderation is mandatory.
- Mobile-first UX is mandatory.
- SEO-friendly public listing pages are mandatory.
- The initial user-to-seller contact method is **WhatsApp CTA**, not internal chat.
- **In-App Chat**: While basic infrastructure might exist for future scaling, it is **Secondary** and should not be prioritized or featured as a main USP for the MVP.
- **Out of Scope (MVP)**: EİDS (E-Devlet), SMS OTP, and Phone Verification are strictly out of scope to maintain simplicity and speed.

---

## Final Tech Stack

- Next.js (App Router)
- TypeScript (strict)
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- Supabase Auth
- Supabase Postgres
- Supabase Storage
- Supabase Row Level Security

---

## Architecture Rules

- Use a single full-stack Next.js codebase.
- Use server components by default.
- Use client components only when interactivity is needed.
- Use route handlers or server actions for mutations.
- Use Supabase as the primary backend platform.
- Keep the architecture simple and maintainable.
- Do not introduce microservices.
- Do not introduce a separate Express/Nest backend for MVP.

### Resilience & Performance (God-Tier Pills)

- **Zero-Trust Connection**: Never wait for external network requests (Iyzico, Email) inside a DB transaction. Use `fulfillment_jobs` or outbox pattern.
- **Fail-Closed Security**: If a critical check (like Iyzico signature verification) fails, halt the process immediately.
- **Parametric Indexing**: Keep all foreign keys indexed. Avoid `SELECT *` in hot paths.
- **Modular Fulfillment**: Decouple payment from fulfillment logic via idempotent jobs.
- **Market Integrity**: Banned users' listings must be filtered at the database level using `!inner` joins for performance and accuracy.
- **Side Effects via Jobs**: Ödeme, e-posta, push bildirim — hiçbiri DB transaction içinde yapılmaz. Job kuyruğu üzerinden idempotent çalışır.
- **AI Fallback**: OpenAI rate limit veya timeout durumunda form normal akışla devam eder. AI opsiyonel katman, kritik yol değil.
- **UI via Bottom Sheet**: Yeni özellikler ayrı sayfa açmak yerine Vaul drawer içinde başlar. Ana sayfa kalabalığı korunmaz.

---

## Database Rules

- Use `database/schema.snapshot.sql` as the single source of truth for the full schema.
- For NEW changes, create a new migration in `database/migrations/` using the `00XX_name.sql` pattern.
- Always track applied migrations using `npm run db:migrate`.
- Keep the baseline clean in `database/schema.base.sql`.
- Use RLS (Row Level Security) for all tables; never bypass RLS in client components.
- Use `(SELECT auth.uid())` instead of just `auth.uid()` in policies for better performance.
- Always set `search_path = public` for `SECURITY DEFINER` functions.
- **RLS First**: Her yeni tablo için migration'da policy'ler birlikte yazılır. Schema ve güvenlik ayrılmaz.
- **Service Role Yasak**: Client bileşenler `service_role` key kullanmaz. RLS her zaman `auth.uid()` üzerinden çalışır.
- **Denormalized Aggregates**: `review_avg`, `reservation_count` gibi aggregateler trigger ile `profiles`'a yazılır. N+1 sorgu olmaz.

---

## Code Quality Rules

- Use TypeScript strict mode.
- Keep components small and reusable.
- Do not put business logic inside presentational UI components.
- Centralize validation schemas in a dedicated validators layer.
- Centralize shared types.
- Use descriptive naming.
- Never leave dead code or unused imports.
- Handle loading, empty, and error states explicitly.
- Do not silently swallow errors.
- Prefer readable code over clever abstractions.

---

## Folder Structure

Use this structure unless there is a strong reason to improve it:

```txt
src/
  app/
    (public)/       # Public routes (marketplace, listings, static)
    dashboard/      # Authenticated user dashboard
    admin/          # Moderation and administrative tools
    api/            # Route handlers
  components/
    ui/             # Base shadcn components
    shared/         # Reusable cross-feature components
    listings/       # Listing-specific UI
    forms/          # Shared form elements
    layout/         # Navigation and shell
    reservations/   # (Reserved for future)
    reviews/        # (Reserved for future)
  domain/           # Pure business logic and use cases
    logic/
    usecases/
  features/         # High-level functional modules (Container/Logic/UI)
    admin-moderation/
    listing-creation/
    marketplace/
  hooks/            # Reusable React hooks
  types/            # Global TypeScript definitions
  lib/              # Shared infrastructure and utilities
    supabase/
    auth/
    security/
    utils/
    validators/
  services/         # Domain-specific API and data layer services
    listings/
    favorites/
    profile/
    reservations/
    exchange/
    expertiz/
    admin/
    payment/
```

---

## Service Architecture

**Established Pattern (Phase 28.4)**: Server Actions as the primary pattern for client-server communication.

### Service Layer Structure

The service layer follows a consistent naming convention and separation of concerns:

- **`*-actions.ts`** - Server actions (API endpoints)
  - Use `"use server"` directive
  - Handle authentication and authorization
  - Orchestrate business logic
  - Return serializable data
  - Example: `src/app/api/payments/actions.ts`, `src/app/dashboard/favorites/actions.ts`

- **`*-records.ts`** - Data access layer (database queries)
  - Direct Supabase client interactions
  - CRUD operations
  - Query builders
  - RLS-compliant queries
  - Example: `src/services/favorites/favorite-records.ts`

- **`*-logic.ts`** - Business logic (pure functions)
  - Domain-specific calculations
  - Business rules
  - Validation logic
  - Stateless transformations
  - Example: `src/services/payments/payment-logic.ts`, `src/services/payments/doping-logic.ts`

- **`*-client.ts`** - External API clients
  - Third-party service integrations
  - API wrappers (Iyzico, OpenAI, Resend, etc.)
  - HTTP clients
  - Example: `src/services/payments/iyzico-client.ts`

### Domain Layer Structure

For complex business workflows and orchestration:

- **`domain/usecases/*.ts`** - Business use cases (orchestration)
  - Multi-step workflows
  - Cross-service coordination
  - Transaction management
  - Example: `src/domain/usecases/payment-initiate.ts`

- **`domain/logic/*.ts`** - Pure business logic
  - Calculations
  - Validations
  - Business rules
  - Domain models

### Deprecated Patterns

The following patterns are **deprecated** and should not be used in new code:

- ❌ **Class-based services** (e.g., `export class FavoriteService`)
  - Legacy pattern from earlier phases
  - Replaced by functional approach with server actions
  - Existing instances: `PaymentService`, `DopingService`, `ListingService`, `ChatService`, `SupportService`

- ❌ **Client-side API wrappers** (e.g., `services/*/client-service.ts`)
  - Deprecated in favor of server actions
  - Creates unnecessary abstraction layer
  - Existing instances: `profile/client-service.ts`, `reports/client-service.ts`, `auth/client-service.ts`, `notifications/client-service.ts`

### Migration Path from Legacy Patterns

When refactoring legacy code:

1. **Identify the pattern**: Class-based service or client-service wrapper
2. **Extract business logic**: Move to `*-logic.ts` files
3. **Create server actions**: Move API endpoints to `*-actions.ts` with `"use server"`
4. **Update imports**: Replace old imports with new server action imports
5. **Remove legacy files**: Delete old class-based or client-service files
6. **Update tests**: Ensure all tests pass with new structure

**Example Migration** (Payment Service - Phase 28.4):
- ✅ Renamed `src/services/payment/` → `src/services/payments/`
- ✅ Renamed `payment-service.ts` → `payment-logic.ts`
- ✅ Renamed `doping-service.ts` → `doping-logic.ts`
- ✅ Deleted `client-service.ts`
- ✅ Components now use direct API calls or server actions

**Example Migration** (Favorites Service - Phase 28.4):
- ✅ Deleted `favorite-service.ts` (legacy class-based)
- ✅ Deleted `client-service.ts` (redundant wrapper)
- ✅ Kept `favorite-records.ts` (data access layer)
- ✅ Components use `src/app/dashboard/favorites/actions.ts`

### Best Practices

1. **Server Actions First**: Always prefer server actions for new features
2. **Functional Over Classes**: Use pure functions instead of class methods
3. **Separation of Concerns**: Keep data access, business logic, and API endpoints separate
4. **Naming Consistency**: Follow the `*-actions.ts`, `*-records.ts`, `*-logic.ts` convention
5. **RLS Compliance**: Never bypass RLS with service role keys in client code
6. **Type Safety**: Use Zod schemas for validation and TypeScript for type safety

---
