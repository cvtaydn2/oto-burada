---
trigger: always_on
---

# TESTING & STABILITY RULES (OtoBurada)

- **Quality Gates**: Kod göndermeden önce `npm run lint`, `npm run typecheck` ve `npm run build` temiz geçmelidir.
- **Test Önceliği**: Auth, İlan Oluşturma, Ödemeler/Doping, RLS ve Webhook'lar en yüksek önceliklidir.
- **Unit Tests**: `src/domain/` ve `*-logic.ts` içindeki pure business kuralları (status machine, trust score vb.) test edilmelidir.
- **Done Definition**: Lint/typecheck hatası olmayan, build'i geçiş yapan, acceptance kriterlerini karşılayan ve dokümantasyonu güncel işler "Done" sayılır.
