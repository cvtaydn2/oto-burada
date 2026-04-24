# 2026-04-24 — Phase 0: Bug Fix & Cleanup (Complete)

## [2026-04-24] - Bug Fix & Cleanup Sweep
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **SupabaseProvider Context.Provider Fix**: Zaten düzeltilmiş durumda; `Context.Provider` doğru şekilde `value={{supabase}}` ile kullanılıyor.
  - **use-listing-actions → Domain Use Case Wiring**: Hook refaktör edildi; `archiveListingUseCase()` ve `bumpListingUseCase()` domain use case'lerine bağlandı. Status machine validation ve 24-saat cooldown kontrolü artık hook seviyesinde aktif.
  - **recharts + leaflet Bundle Cleanup**: Bu paketler zaten package.json'da yok; daha önce temizlenmiş. Bileşenler lean placeholder versiyonlarını kullanıyor.
- **Doğrulama:**
  - `npm run typecheck` ✅
  - `npm run lint` ✅
  - `npm run build` ✅
- **Sıradaki Adım:** Phase 3 deployment (migration + seed).

# 2026-04-24 — Phase 3: Doping Infrastructure & Featured Carousel

## [2026-04-24] - Doping Activation & Gallery Carousel Implementation
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **Task 3.1 - Doping Paketleri Seed Data**: `scripts/seed-doping-packages.mjs` güncellendi; 5 doping paketi (on_planda, acil, renkli_cerceve, galeri, bump) tam açıklamalarıyla eklendi.
  - **Task 3.2 - Doping Aktifleştirme Logic**: `database/migrations/0069_doping_activation_functions.sql` oluşturuldu; `activate_doping()` RPC fonksiyonu, `get_active_dopings_for_listing()` helper fonksiyonu ve pg_cron tabanlı otomatik expiry job'u eklendi.
  - **Task 3.2 - Cron Endpoint**: `src/app/api/cron/expire-dopings/route.ts` oluşturuldu; uygulama seviyesinde doping expiry fallback ve audit trail sağlandı.
  - **Task 3.2 - Domain Logic**: `src/domain/logic/doping-status-machine.ts` oluşturuldu; doping state transitions, validation ve UI helper fonksiyonları eklendi.
  - **Task 3.3 - Listing Doping Flag Güncelleme**: `DopingService.applyDoping()` metodu RPC tabanlı aktivasyona refaktör edildi; `ListingService.applyDoping()` API client metodu eklendi.
  - **Task 3.4 - Featured Carousel**: `src/components/listings/featured-carousel.tsx` oluşturuldu; Embla Carousel tabanlı, mobil-first, gallery-priority ilanları gösteren premium carousel bileşeni eklendi.
- **Doğrulama:**
  - `npm run typecheck` ✅
  - `npm run build` ✅
- **Sıradaki Adım:** Migration'ı Supabase'e uygula.

# 2026-04-24 — Production Security & Architectural Hardening

## [2026-04-24] - Critical Performance & Security Remediation
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **COUNT Query Optimization**: `listing-submission-query.ts` içindeki devasa ID çekme hatası düzeltildi; `count: 'exact', head: true` ile veritabanı seviyesinde sayım sağlandı.
  - **Client Singleton Hardening**: `public-server.ts` ve `client.ts` içindeki Supabase istemcileri lazy initialization ve 5 dakikalık max-age ile güçlendirildi (serverless stale connection önleme).
  - **Marketplace Privacy**: `getPublicFilteredDatabaseListings` ayrıştırıldı; artık sadece RLS-aware public client kullanıyor. Admin client kullanımı `@deprecated` olarak işaretlendi.
  - **Atomic Doping Expiry**: 4 ayrı sorgu ile çalışan cron mantığı, `expire_dopings_atomic()` PL/pgSQL fonksiyonu ile tek bir işleme (transaction) indirgendi.
  - **CSRF Hardening**: `isValidRequestOrigin` fonksiyonu `"null"` origin'leri (sandboxed iframe) reddedecek şekilde sıkılaştırıldı.
  - **Rate Limit Resilience**: `checkGlobalRateLimit` fonksiyonuna Upstash Redis arızası durumunda devreye giren lokal in-memory fallback eklendi.
  - **UI Stability**: `ErrorBoundary` bileşeni ile render hataları için "fail-safe" mekanizması kuruldu.
  - **Deep Pagination**: Sorgu motoruna keyset pagination (cursor-based) desteği eklendi.
- **Doğrulama:**
  - `npm run build` ✅
  - `npm run typecheck` ✅
  - `npm run lint` ✅
- **Sıradaki Adım:** KVKK/GDPR uyumluluk metinlerinin ve çerez onay banner'ının eklenmesi.