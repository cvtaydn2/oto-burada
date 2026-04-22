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

---

## Database Rules

- Use `database/schema.snapshot.sql` as the single source of truth for the full schema.
- For NEW changes, create a new migration in `database/migrations/` using the `00XX_name.sql` pattern.
- Always track applied migrations using `npm run db:migrate`.
- Keep the baseline clean in `database/schema.base.sql`.
- Use RLS (Row Level Security) for all tables; never bypass RLS in client components.
- Use `(SELECT auth.uid())` instead of just `auth.uid()` in policies for better performance.
- Always set `search_path = public` for `SECURITY DEFINER` functions.

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

---

## Brand Voice & Copy Rules

### Tone
- Clear, direct, calm, helpful
- Avoid corporate language, exaggerated claims, complicated sentences

### Copy Style
- Short sentences, simple Turkish, no jargon, no unnecessary adjectives
- Bad: "En gelişmiş ve üstün araba platformu deneyimini sunuyoruz"
- Good: "Arabanı kolayca sat. Güvenle satın al."

### Key Messages
- "Ücretsiz ilan ver"
- "Sade ve güvenli platform"
- "Arabanı kolayca sat. Doğru arabayı hızlıca bul."

### CTA Style
- Primary: "İlan Ver"
- Secondary: "İlanları İncele"
- Detail: "WhatsApp ile İletişime Geç"

### Trust Language
- "Doğrulanmış satıcı", "İlan inceleniyor", "Şüpheli ilanı bildir"

### Error Messages
- Bad: "An error occurred"
- Good: "Bir hata oluştu. Lütfen tekrar dene."

### Empty States
- Favorites: "Henüz favori ilan eklemedin."
- Listings: "Aradığın kriterlere uygun ilan bulunamadı."

### Seed Data Note
- Seed script (`npm run db:seed-references`) tamamlandı. Gerçek Supabase DB'ye çalıştırıldı.
- Minimum 50 ilan, 10 marka, 3+ şehir hedefi karşılandı.
```
