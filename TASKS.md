
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
- loading
- empty
- error
- disabled states

#### Acceptance Criteria
- Every major async view has all major states covered

---

### Task 7.2 — Accessibility and responsiveness audit
Review:
- labels
- keyboard navigation
- focus states
- touch targets
- mobile breakpoints

#### Acceptance Criteria
- Core flows are usable on mobile and keyboard

---

### Task 7.3 — Final cleanup
Remove dead code, polish docs, ensure naming consistency.

#### Acceptance Criteria
- No obvious placeholder text
- README is accurate
- `.env.example` is accurate
- `schema.sql` reflects implementation intent

---

## Final Definition of Done
The MVP is complete when:
- user can register and sign in
- user can create a car listing with images
- listings can be browsed and filtered
- listing details are viewable with WhatsApp CTA
- users can favorite listings
- users can report listings
- admin can moderate pending and reported listings
- app is responsive
- app lints, typechecks, and builds
- documentation is aligned with code