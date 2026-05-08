---
trigger: always_on
---

# FRONTEND AI CONSTITUTION (OtoBurada)

- **Architecture**: `src/features/[feature_name]/` kullanımı zorunludur. `src/components/`, `src/hooks/`, `src/lib/` ve `src/services/` gibi global dizinler resmi ve izinlidir; yasaklanamaz.
- **Separation of Concerns**: UI, State, Business, API ve Validation katmanlarını ayır. Monolitir bileşenler yazma (<250 satır).
- **TypeScript**: `any` yasaktır. Tüm props tiplendirilmeli, ortak tipler `src/types/` içinde toplanmalıdır.
- **State Management**: Server state için TanStack Query kullan. Derived state için local state tutma, hesapla.
- **API & Server Actions**: Client component'te doğrudan karmaşık fetch/useEffect yazma. `"use server"` actions, `*-records.ts` (data access) ve `*-logic.ts` (iş mantığı) modelini izle.
- **Performance & Quota Optimization**: İstemci tarafında gereksiz veritabanı sorgularından (Supabase api/read limit) kaçınmak için akıllı caching ve debounce mekanizmaları kullan. Sentry free-tier kotasını korumak için önemsiz hataları (örneğin network timeouts, user cancel vb.) Sentry'e gönderme, filtrele.
- **Forms**: React Hook Form ve Zod şemaları ile uncontrolled form yapısı kullan. Loading, disabled ve inline validation UX'ini sağla.
- **UI/UX Consistency**: Tüm bileşenler ortak tasarım dilini (spacing, typography, colors, radius) kullanmalıdır.
- **Accessibility**: Semantic HTML, klavye erişilebilirliği ve aria-label'lar zorunludur. Mouse-only UI yasaktır.