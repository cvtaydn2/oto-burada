---
trigger: always_on
---

# GLOBAL RULES (OtoBurada)

- **Mission Lock**: Sadece arabalar için, mobil öncelikli, güvenli ve ücretsiz ilan pazaryeri. Başka sektöre/genel ilan sitesine dönüştürülemez.
- **MVP Hedefleri**: <2 dk ilan oluşturma, <3 etkileşimde filtreleme, temiz lint/typecheck/build.
- **Source of Truth**: Her işlem öncesi `AGENTS.md`, `TASKS.md` ve `PROGRESS.md` okunacaktır.
- **Scope Control**: Sadece atanan göreve odaklan; ilgisiz refactor, toplu dosya taşıma veya geniş formatlama yapma.
- **Protected Directories**: `.claude-flow/`, `.roo/`, `.swarm/`, `.agents/`, `memory.db`, `state.json` değiştirilemez.
- **Canonical Stack**: Next.js App Router, TS strict, Tailwind CSS, shadcn/ui, React Hook Form, Zod, TanStack Query, Supabase. Ayrı Express/NestJS backend veya Prisma eklenemez.
- **Zero-Cost / Free-Tier Guard**: Projedeki tüm harici servislerin (**Vercel, Supabase, Sentry, Upstash, Resend**) yalnızca **ücretsiz paketleri** kullanılır. AI, kaynak kotalarını tüketmeyecek şekilde verimli kod yazmalı ve kotaların dolması durumunda sistemin zarif şekilde (graceful degrade) çalışmasını sağlamalıdır.
- **Secrets & Env Safety**: Asla secret, API key veya hassas veriyi commit etme veya loglama.
- **Validation**: Değişiklik sonrası `npm run lint`, `typecheck` ve `build` temiz geçmelidir.
