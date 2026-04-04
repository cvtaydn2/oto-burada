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

---

## Non-negotiable Product Rules
- This marketplace is **only for cars**.
- Individual listings are free.
- The MVP should prioritize speed, clarity, trust, and usability.
- Avoid unnecessary complexity.
- Admin moderation is mandatory.
- Mobile-first UX is mandatory.
- SEO-friendly public listing pages are mandatory.
- The initial user-to-seller contact method is **WhatsApp CTA**, not internal chat.

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
    (public)/
      page.tsx
      listings/
      listing/[slug]/
      login/
      register/
    dashboard/
    admin/
    api/
  components/
    ui/
    shared/
    listings/
    forms/
    layout/
  lib/
    supabase/
    auth/
    utils/
    constants/
    validators/
  services/
    listings/
    favorites/
    reports/
    profile/
    admin/
  hooks/
  types/
  data/