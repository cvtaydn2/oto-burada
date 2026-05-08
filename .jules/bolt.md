## 2026-05-07 - React useMemo overhead on primitive data
**Learning:** Adding `useMemo` to simple primitive computations like string concatenations or dictionary lookups is an anti-pattern. It introduces unnecessary hook overhead and causes measurable UI stuttering while yielding zero benefits over direct evaluation.
**Action:** Avoid micro-optimizations that use `useMemo` on primitives. Focus on architectural optimizations like missing database indexes, unoptimized `next/image` attributes, or unmemoized expensive calculations.

## 2026-05-07 - Server-Side Rendering Year Rollover Risks
**Learning:** Caching `new Date().getFullYear()` into a module-level constant (`CURRENT_YEAR`) creates a severe Year Rollover bug in long-running SSR environments (Next.js). If the server does not restart after New Year's Eve, age calculations will stay tied to the previous year.
**Action:** Never extract `new Date().getFullYear()` to a static module-level variable unless it's strictly build-time logic (like footer copyrights).

## 2026-05-07 - Database indexing as a measurable win
**Learning:** When front-end React tree logic is mostly sound and debouncing/virtualization is either too complex or already handled, standard PostgreSQL composite and covering indexes (e.g., `(brand, model)` or `status, created_at DESC`) are one of the most effective and simplest "measurable" performance optimizations.
**Action:** Check the `supabase/migrations` folder for lacking `CREATE INDEX` queries that correspond to `query.eq(...)` filters running heavily in the Node application.
