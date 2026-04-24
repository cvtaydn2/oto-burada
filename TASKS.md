---

# 2) `TASKS.md`

```md
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
