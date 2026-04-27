# TASKS.md

This file defines the execution order, acceptance criteria, and done conditions.

Do not skip ahead unless a dependency is blocked.

---

## Phase 0 — Bootstrap

### Task 0.1 — Initialize project

Create a Next.js App Router project with:

- TypeScript
- Tailwind CSS
- ESLint
- src directory

Install and configure:

- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- Supabase client utilities
- lucide-react

#### Acceptance Criteria

- Project runs locally
- Tailwind works
- Folder structure exists
- App builds successfully

#### Done When

- `npm run build` passes
- `npm run lint` passes

---

### Task 0.2 — Base docs and environment

Create:

- README.md
- AGENTS.md
- TASKS.md
- UI_SYSTEM.md
- `.env.example`
- `schema.sql`

#### Acceptance Criteria

- Repo contains baseline documentation
- README includes setup steps

---

## Phase 1 — Shared Foundations

### Task 1.1 — Define shared types and validators

Create reusable domain types and Zod validators for:

- profile
- listing
- listing image
- favorite
- report
- admin moderation actions
- filters

#### Acceptance Criteria

- Shared types compile cleanly
- Listing create validator enforces required fields
- Validators are reusable on client and server

---

### Task 1.2 — Seed constants and mock data

Create realistic dummy data for:

- brands
- models
- cities
- districts
- example listings
- example admin user
- example normal user

#### Acceptance Criteria

- Public pages can render before backend wiring
- Example listings are realistic for Turkey market

---

## Phase 2 — Public UI

### Task 2.1 — Global layout

Build:

- header
- mobile navigation
- footer
- responsive shell

#### Acceptance Criteria

- Public pages share a coherent layout
- Header includes login and post listing CTA
- Mobile nav is usable

---

### Task 2.2 — Homepage

Build homepage with:

- hero search
- quick filters
- featured listings
- latest listings
- trust section

#### Acceptance Criteria

- Responsive layout
- Listing cards render consistently
- Search UI feels clean and simple

---

### Task 2.3 — Listings page

Build listings search/results page with:

- grid layout
- filter sidebar on desktop
- filter drawer on mobile
- sorting controls
- pagination or load-more

#### Acceptance Criteria

- Filters update visible results
- Empty state exists
- Loading state exists

---

### Task 2.4 — Listing detail page

Build detail page with:

- image gallery
- pricing and metadata
- description
- seller card
- WhatsApp CTA
- report action
- similar listings

#### Acceptance Criteria

- SEO-friendly structure
- Mobile layout is clean
- Trust-oriented information hierarchy

---

## Phase 3 — Auth and Profile

### Task 3.1 — Auth integration

Implement register/login using Supabase Auth.

Primary method:

- email + password

#### Acceptance Criteria

- Users can register
- Users can sign in
- Protected routes redirect correctly

---

### Task 3.2 — Dashboard shell

Build dashboard shell and navigation.

#### Acceptance Criteria

- Authenticated users can access dashboard
- Unauthenticated users cannot

---

### Task 3.3 — Profile page

Build editable profile page.

Fields:

- full name
- phone
- city
- avatar optional

#### Acceptance Criteria

- User can update profile
- Validation and error handling exist

---

### Task 3.4 — Favorites

Implement favorites flow and favorites page.

#### Acceptance Criteria

- User can add/remove favorites
- Favorites persist
- Empty state exists

---

## Phase 4 — Listing Creation

### Task 4.1 — Listing create form

Build listing creation form for cars only.

Required fields:

- title
- brand
- model
- year
- mileage
- fuel_type
- transmission
- price
- city
- district
- description
- images

Rules:

- minimum 3 images
- validation on client and server

#### Acceptance Criteria

- Form works on mobile
- Validation messages are clear
- Submission works end-to-end

---

### Task 4.2 — Image upload

Integrate Supabase Storage.

Rules:

- allowed mime types only
- max size documented and enforced
- upload progress or loading feedback shown

#### Acceptance Criteria

- Images upload successfully
- Image previews work
- Invalid files are rejected

---

### Task 4.3 — My listings page

Create dashboard page for the user's own listings.

Features:

- view listings
- edit draft or pending listing
- archive listing
- see moderation status

#### Acceptance Criteria

- Users only see their own listings
- Status badge is visible

---

## Phase 5 — Admin

### Task 5.1 — Admin gate and role checks

Implement admin-only access.

#### Acceptance Criteria

- Non-admin users cannot access admin pages
- Admin can access moderation dashboard

---

### Task 5.2 — Listing moderation

Build admin page with:

- pending listings table/grid
- approve/reject actions
- review flow

#### Acceptance Criteria

- Admin can approve or reject pending listings
- Status changes persist

---

### Task 5.3 — Reports moderation

Build admin page for reports.

#### Acceptance Criteria

- Admin can review reports
- Admin can update report status

---

## Phase 6 — Search, Filters, SEO

### Task 6.1 — URL-driven filters

Connect filters to URL search params.

#### Acceptance Criteria

- Filter state is shareable by URL
- Refresh preserves state

---

### Task 6.2 — SEO metadata

Implement metadata for:

- homepage
- listings index
- listing detail pages

#### Acceptance Criteria

- Dynamic titles/descriptions exist
- Detail pages expose clean metadata

---

## Phase 7 — Polish

### Task 7.1 — State audit

Audit all pages for:

- [x] loading (skeletons implemented for listings)
- [x] empty (verified)
- [x] error (handled)
- [x] disabled states (verified in wizard)

### Task 7.2 — Accessibility and responsiveness audit

- [x] labels
- [x] keyboard navigation
- [x] focus states
- [x] touch targets
- [x] mobile breakpoints (new vaul drawer)

### Task 7.3 — Performance & Security Hardening

- [x] XSS Sanitization
- [x] CSRF Protection
- [x] Image Optimization & Blur Placeholders

### Task 7.4 — Extended Features (Complete)

- [x] Site-wide Skeleton Loader system
- [x] Detailed Expert Inspection wizard (Engine/Gearbox)
- [x] Bundle size optimization
- [x] Dark Mode (Koyu Tema) Altyapısı ve Toggle

---

## Phase 8 — Advanced Marketplace Features & Scaling

### Task 8.1 — SEO Landing Page Depth

- [x] Create dynamic landing pages for combinations like `[Brand]` in `[City]`
- [x] Implement breadcrumbs and JSON-LD for better crawlability
- [x] Create an XML sitemap generator that includes all approved listings

### Task 8.2 — Admin Operational Excellence

- [x] Multi-step moderation flows with predefined rejection reasons
- [x] Activity tracking for moderator performance
- [x] Bulk notification sending for maintenance or updates

### Task 8.3 — PWA Support & Mobile Polish

- [x] Implement manifest.json and service worker for "Add to Home Screen"
- [x] Offline caching for recently viewed listings
- [x] Native-like transitions between pages
- [x] Service worker (`public/sw.js`) with cache-first strategy for static assets and listing pages
- [x] `useServiceWorker` hook for SW registration with update handling
- [x] `PWAProvider` wrapping app to register SW and request notification permission

### Task 8.4 — Transparency & Market Price Indexing (Complete)

- [x] Resolve all data-layer lint/type inconsistencies

---

## Phase 10 — Performance, Testing & Launch Readiness

### Task 10.1 — Performance Audit & Code Splitting

- [x] Run `npm run build` with `@next/bundle-analyzer`
- [x] Use `next/dynamic` for heavy client components (Charts, Modals)
- [x] Implement `priority` on above-the-fold images

#### Acceptance Criteria

- Initial bundle size reduced by 15%+
- Lighthouse performance score > 90 on mobile

### Task 10.2 — E2E Testing Coverage

- [x] Implement Comprehensive Listing Flow test
- [x] Implement Authentication & Persistence test
- [x] Implement Admin Moderation workflow test

#### Acceptance Criteria

- Critical paths are covered by Playwright
- Tests pass in CI-like local environment

### Task 10.3 — Final Security & RLS Audit

- [x] Ensure Service Role keys are NOT exposed in client bundles
- [x] Verify all tables have RLS enabled
- [x] Test edge cases for "Profile" and "Listing" ownership

#### Acceptance Criteria

- No RLS gaps found
- Security policies align with AGENTS.md mission

---

## Phase 25 — Marketplace Hardening & Core Depth

### Task 25.2 — Real-time In-App Chat (POST-MVP / SECONDARY)

_Note: WhatsApp remains the primary contact method as per AGENTS.md._
If prioritized in future:

- Create `chats` and `messages` services.
- Integrate dashboard messages UI with realtime subscription.
- Add "Message Seller" button (secondary to WhatsApp) to listing detail page.
- Implement unread message indicators.

#### Acceptance Criteria

- Users can start chats only if WhatsApp is unavailable or as secondary.
- Messages are sent and received in real-time.
- Only participants can access their chats (RLS).

### Task 25.3 — Price History & Market Analysis

Track price changes and show detailed market valuation.

- Implement `listing_price_history` tracking (trigger/service).
- Build price history chart component for listing detail pages.
- Refine Market Value algorithm to include damage status and paint/replaced parts impact.
- Display "Transparency Report" for market valuation in the UI.

#### Acceptance Criteria

- Price changes are logged automatically.
- Charts show history clearly.
- Market value estimations reflect car condition precisely.

### Task 25.4 — Filter Polish & Data Scaling

Fix UI bugs and populate the marketplace with high-quality data.

- Fix `RangeSlider` z-index and reactivity issues.
- Expand `seed-supabase-demo.mjs` with 20+ diverse car listings.
- Include realistic damage reports and price histories in seed data.

#### Acceptance Criteria

- Slider handles work smoothly without overlapping issues.
- Marketplace feels "lived-in" with diverse inventory.

---

## Phase 27 — Build Stabilization & Data Resilience

### Task 27.1 — Analytics & Data Fetching Hardening

Resolve build-time type errors and runtime 404 issues in listing retrieval.

- [x] Refactor Admin Analytics service and client for type safety.
- [x] Fix Supabase join syntax in `listingSelect`.
- [x] Implement aggressive fallback logic for data fetching.

#### Acceptance Criteria

- `npm run build` passes without errors.
- Listing detail pages load reliably even during schema drift.
- Admin analytics dashboard accurately reflects current and historical KPIs.

---

## Phase 26 — Post-MVP Monetization & Automation (Completed)

### Task 26.1 — Iyzico Payment Activation

Activate the existing Iyzico skeleton for real transactions.

- [x] Set `IYZICO_API_KEY` and `IYZICO_SECRET_KEY` in Vercel.
- [x] Deploy `add-payments-webhook-support.sql` to seed plans and enable webhooks.
- [x] Connect `listing-doping-panel` to the real checkout flow.
- [x] Implement `balance_credits` display in dashboard.
- [x] Implement mandatory identity verification for billing compliance.

#### Acceptance Criteria

- [x] Users can purchase doping/highlighting plans.
- [x] Payments are processed via Iyzico 3DS flow.
- [x] Listing status updates automatically after successful payment.

### Task 26.2 — Saved Searches & Email Alerts

Automate "Search Result" notifications.

- [x] Activate `RESEND_API_KEY`.
- [x] Connect the built-in Cron job (`/api/saved-searches/notify`) to Resend.
- [x] Ensure email templates are localized in Turkish.
- [x] Add "Save Search" UI to marketplace.

#### Acceptance Criteria

- [x] Users receive emails when new listings match their saved searches.
- [x] Unsubscribe links work correctly.

---

## Phase 28 — Hardening & Architectural Maturity

### Task 28.1 — Domain Unit Testing (Complete)

- [x] Implement unit tests for `archiveListingUseCase`
- [x] Implement unit tests for `bumpListingUseCase`
- [x] Implement unit tests for `ListingStatusMachine`
- [x] Implement unit tests for `TrustScoreCalculator`

### Task 28.2 — Centralized Error Handling (Complete)

- [x] Create `AppErrorBoundary` with support for `AppError` codes
- [x] Integrate boundary into `app/error.tsx` (Global)
- [x] Integrate boundary into `AdminListingsModeration` (Feature)

### Task 28.3 — RLS Integration Testing (Complete)

- [x] Create integration test infrastructure for Supabase
- [x] Verify RLS policies for Anonymous read/write
- [x] Verify RLS policies for Draft listings privacy

### Task 28.4 — Server Actions Migration (Complete)

- [x] Consolidate listing actions into `app/dashboard/listings/actions.ts`
- [x] Consolidate favorite actions into `app/dashboard/favorites/actions.ts`
- [x] Remove legacy `listing-actions.ts` service

---

## Phase 29 — Production Security & Performance Hardening (Complete)

### Task 29.1 — Supabase Client Resilience
- [x] Harden public client singleton with lazy initialization and max-age expiration.
- [x] Prevent stale connections in serverless (Vercel) environments.

### Task 29.2 — Query Efficiency & Marketplace Integrity
- [x] Optimize COUNT queries to use Supabase head/count (Exact) instead of fetching all IDs.
- [x] Enforce strict separation of public/admin clients to prevent accidental RLS bypass.
- [x] Implement keyset (cursor-based) pagination support in query builder.

### Task 29.3 — Atomic Domain Operations
- [x] Refactor doping expiry into a single atomic PL/pgSQL RPC function.
- [x] Eliminate race conditions in cron-based status updates.

### Task 29.4 — Security Utilities Hardening
- [x] Harden CSRF `isValidRequestOrigin` to explicitly reject "null" origins.
- [x] Add in-memory fallback to distributed rate limiting for infrastructure outages.
- [x] Implement robust `ErrorBoundary` with localization and retry support.

---

---

## Phase 30 — Infrastructure Hardening & Messaging Maturity (Complete)

### Phase 30: Architectural Hardening & Messaging Maturity ✅
- [x] Refactor Monolithic ApiClient into Domain Services
- [x] Fix Admin/Browser Client Singleton Stale Key Risks
- [x] Implement Atomic Chat Operations (RPC)
- [x] Resolve 401 Redirect Loop Guard in ApiClient
- [x] Optimize In-Memory Rate Limit Cleanup (Memory Leak Prevention)
- [x] Remove Runtime Dynamic Imports in Listing Submission Flow
- [x] Add Archive/Unarchive Messaging Logic
- [x] Final Production Build Validation
- [x] Enhance MessageBubble with delivery/read status and timestamps.

---

---

## Phase 31 — Final Architectural & Security Resolution

### Task 31.1 — Critical Bug Resolution
- [x] Fix Root Layout structural integrity (missing tags).
- [x] Resolve stale state management in `loginAction`/`registerAction`.
- [x] Fix memory leak in `inMemoryStore` rate limiter.
- [x] Consolidate CSRF protection into a single source of truth.

### Task 31.2 — Validator Modularization
- [x] Split monolithic `listing.ts` validator into a modular directory structure.

### Task 31.3 — Library & Utility Refactoring
- [x] Refactor `src/lib/utils/` "dump" into structured domain directories (`api`, `datetime`, `env`, etc.).
- [x] Clean up deprecated filtering code in `ListingFiltersService`.

### Task 31.4 — PWA & Metadata Polish
- [x] Fix hydration warnings and ensure mobile-first viewport settings.

---

## Phase 32 — Critical Security & Transactional Integrity

### Task 32.1 — Security & RLS Hardening
- [x] Replace Admin Client with Server Client in user-facing `getStoredUserListings`.
- [x] Implement Rate Limit development parity (higher thresholds vs total bypass).
- [x] Strengthen middleware JWT validation using `supabase.auth.getUser()`.

### Task 32.2 — Transactional Integrity & Resilience
- [x] Implement atomic `process_payment_webhook` RPC to prevent partial failures.
- [x] Update payment webhook handler to use centralized atomic logic.
- [x] Implement proactive admin client reset mechanism for key rotation recovery.

### Task 32.3 — Maintainability & Discoverability
- [x] Consolidate utilities into domain directories.
- [x] Implement barrel exports in `src/lib/index.ts` for better discoverability.

---

## Phase 33 — Competitor Advantage & Trust Hardening ✅
- [x] **Task 33.1: Fraud Warning System**
  - [x] Create `fraud-warning-banner.tsx` for listing details.
  - [x] Warning about fake payment links/WhatsApp scams.
- [x] **Task 33.2: Listing Edit Flow Hardening**
  - [x] Lock car identity fields (Brand, Model, Year, Plate, Photos) once approved.
  - [x] Only allow editing Price and Description for approved listings.
- [x] **Task 33.3: WhatsApp Live Support**
  - [x] Add floating `whatsapp-support.tsx` for marketplace visitors.
- [x] **Task 33.4: Listing Questions System**
  - [x] Public Q&A section on listing pages.
  - [x] Sellers can answer questions directly.
- [x] **Task 33.5: Smart Price Widget**
  - [x] Visual price meter (Min/Avg/Max) on listing details.
- [x] **Task 33.6: Phone Privacy Badge**
  - [x] Reassurance badges about phone number protection.
- [x] **Task 33.7: Trust Badges**
  - [x] "Verified Seller", "Old Member", "High Rating" badges.

---

## Phase 34 — Sustainable Monetization & Professional Tiers

### Task 34.1 — Subscription Tiers Logic

Implement the tiered subscription model for professional sellers.

- Define `Individual`, `Pro`, and `Corporate Fleet` limits in code.
- Implement `user_type` based listing quotas (3 vs 50 vs 200).
- Add "Pro" badge to profiles and listings for subscribers.

#### Acceptance Criteria
- Users with 'Pro' plan can post more than 3 listings.
- Quota enforcement works correctly in `checkListingLimit`.

### Task 34.2 — User Credits & Wallet UI

Enable users to top up balance for faster doping purchases.

- Create `src/components/dashboard/wallet-card.tsx`.
- Implement credit purchase flow via Iyzico.
- Use credits as a priority payment method for doping.

#### Acceptance Criteria
- User can see their balance in the dashboard.
- Credits are deducted correctly when purchasing doping.

### Task 34.3 — AI Listing Assistant (Layer 3)

Use AI to help users write professional car descriptions.

- Integrate OpenAI/Gemini to generate descriptions from car specs.
- Add "AI ile Yaz" button to the listing creation form.
- Monetize as a one-time service (e.g., 99 TL).

#### Acceptance Criteria
- AI generates relevant descriptions based on car brand, model, and condition.

### Task 34.4 — Marketplace Analytics (Layer 4)

Provide deeper market insights for professional sellers.

- Build a "Market Analytics" dashboard for Pro users.
- Show demand trends for specific brands/models.
- Exportable market reports.


---

## Phase 44 — Production Stability & Zero-Error Build (Complete)

### Task 44.1 — Build Pipeline Hardening
- [x] Resolve all 38 ESLint errors and 15+ TypeCheck errors.
- [x] Achieve a clean `npm run build` with no warnings.
- [x] Fix `server-only` leakage in admin service layer (BUILD-02).

### Task 44.2 — Migration Audit & Sequence Normalization
- [x] Renumber migrations (0106-0110 -> 0101-0113) to fix collisions.
- [x] Verify index coverage for marketplace performance.
- [x] Remove redundant documentation and draft SQL files.

### Task 44.3 — UI/UX & Security Infrastructure
- [x] Fix `AppErrorBoundary` navigation warnings (UI-01).
- [x] Harden API Client error handling and JSON parsing (API-01).
- [x] Document and fix IPv6 normalization logic (SEC-01).

---

## Final Definition of Done

The MVP is complete when:

- [x] user can register and sign in
- [x] user can create a car listing with images
- [x] listings can be browsed and filtered
- [x] listing details are viewable with WhatsApp CTA
- [x] users can favorite listings
- [x] users can report listings
- [x] admin can moderate pending and reported listings
- [x] app is responsive
- [x] app lints, typechecks, and builds
- [x] documentation is aligned with code
- [x] payment system is hardened and compliant
- [x] marketplace integrity is secured (banned user filtering)
