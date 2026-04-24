# 2026-04-24 — General Review & Stabilization

## [2026-04-24] - Payment Fulfillment, Cron ve Typecheck Stabilizasyonu
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **Payment Callback Fulfillment Lock Fix**: `/api/payments/callback` artık Iyzico doğrulaması yapılmadan `fulfilled_at` yazmıyor. `fulfilled_at` sorumluluğu idempotent `activate_doping` RPC akışına bırakıldı.
  - **Webhook Fulfillment Refactor**: `/api/payments/webhook` başarılı ödeme sonrası doping'i doğrudan uygulamak yerine `fulfillment_jobs` kuyruğuna `doping_apply` işi ekliyor. Böylece fulfillment hataları retry/DLQ mekanizmasına düşebiliyor.
  - **Fulfillment Processor Doping Support**: `/api/cron/process-fulfillment-jobs` içine `doping_apply` job tipi eklendi; mevcut `credit_add` RPC çağrısı doğru `adjust_user_credits_atomic` parametreleriyle hizalandı.
  - **Cron Route Uyumu**: `vercel.json` içindeki eski `/api/cron/process-fulfillments` yolu gerçek route olan `/api/cron/process-fulfillment-jobs` ile değiştirildi.
  - **Supabase Client Stabilizasyonu**: Admin service-role client'ı Supabase JS'in yeni varsayılan `never` tip sorununu üretmeyecek şekilde stabilize edildi; public RLS client typed kalmaya devam ediyor.
  - **Schema Snapshot/Types Sync**: `payments.package_id` ve `payments.webhook_processed_at` alanları snapshot ve generated type dosyasına işlendi.
  - **Typecheck Scope Cleanup**: Geçici `scratch/` klasörü production typecheck kapsamından çıkarıldı.
- **Doğrulama:**
  - `npm run typecheck` ✅
  - `npm run lint` ✅ (mevcut 31 warning devam ediyor, error yok)
  - `npm run build` ✅
- **Kararlar:**
  - Admin service-role işlemlerinde schema drift çok sık olduğu için bu turda admin client esnek bırakıldı; public RLS okuma istemcisi strict type güvenliğini koruyor.
  - Webhook artık ödeme durumunu işlerken fulfilment side-effect'ini inline yapmıyor; retry edilebilir job kuyruk modeli AGENTS.md zero-trust/resilience kuralıyla daha uyumlu.
- **Sıradaki Adım:** Mevcut lint warning listesini ayrı bir cleanup turunda azalt; ardından yeni migration'ları canlı Supabase'e uygula.

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

## [2026-04-24] - Vasıta Kategorileri ve Sahibinden Tarzı Doping Kataloğu
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **Vasıta Alt Kategorileri**: Tek `otomobil` yaklaşımı yerine araba odaklı vasıta kategorileri eklendi: Otomobil, Arazi/SUV/Pick-up, Elektrikli Araç, Minivan/Panelvan, Ticari Araç, Klasik Araç, Hasarlı Araç.
  - **İlan Formu ve Filtreleri**: İlan oluşturma akışına "Vasıta Türü" seçimi eklendi; validator, domain type, URL filtreleri ve Supabase row mapping yeni `category` alanıyla hizalandı.
  - **1/10 Doping Fiyatları**: Vasıta için Sahibinden mantığındaki paketler yaklaşık 1/10 fiyatla tanımlandı: Küçük Fotoğraf 39 TL, Acil Acil 182 TL, Anasayfa Vitrini 760 TL, Kategori Vitrini 230 TL, Üst Sıradayım 660 TL, Detaylı Arama Vitrini 90 TL, Kalın Yazı & Renkli Çerçeve 61 TL, Güncelim 88 TL.
  - **Doping Aktivasyon Mantığı**: `activate_doping` yeni paket tiplerini destekleyecek şekilde güncellendi; Güncelim için 24 saat cooldown eklendi, vitrin/üst sıra/çerçeve etkileri ayrı kolonlara taşındı.
  - **Doping Expiry Mantığı**: `expire_dopings_atomic()` yeni doping kolonlarını temizleyecek şekilde yenilendi; süresi dolan vitrin ve sıralama avantajları kalıcı hale gelmiyor.
  - **Migration ve Snapshot**: `database/migrations/0076_vehicle_doping_catalog_and_categories.sql` oluşturuldu; `database/schema.snapshot.sql`, Supabase tipleri ve seed script yeni katalogla hizalandı.
  - **Legacy Schema Fallback**: Migration uygulanmamış lokal/preview DB'lerde marketplace sorguları eski select ve eski sıralama ile güvenli fallback yapacak şekilde güçlendirildi.
- **Doğrulama:**
  - `npm run typecheck` ✅
  - `npm run lint` ✅ (repo genelinde mevcut 27 warning devam ediyor, yeni error yok)
  - `npm run build` ✅ (lokal DB migration uygulanmadığı için beklenen schema fallback warning'i görüldü)
  - `npm run test:unit -- listing-card-insights listing-moderation` ✅ (sandbox `spawn EPERM` nedeniyle onaylı şekilde sandbox dışında çalıştırıldı)
- **Kararlar:**
  - AGENTS.md'deki "car-only" kuralı nedeniyle motosiklet, deniz aracı, hava aracı gibi Sahibinden Vasıta alt kırılımları eklenmedi; kategori ağacı araba odaklı tutuldu.
  - 2/4 haftalık indirimler bu turda fiyat kataloğuna eklenmedi; mevcut ödeme akışı 7 günlük paket ve tek kullanımlık Güncelim üzerinden ilerliyor.
- **Sıradaki Adım:** `npm run db:migrate` ile 0076 migration'ını gerçek Supabase DB'ye uygula ve ardından `npm run db:seed-references` / doping seed kontrolünü çalıştır.

## [2026-04-24] - Rate Limit, Trust Guard ve Storage Ownership Hardening
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **Rate Limit Bypass Header Kaldırıldı**: `src/lib/middleware/rate-limit.ts` içinden `x-rate-limit-bypass` / `RATE_LIMIT_BYPASS_KEY` tabanlı tam bypass kaldırıldı; yalnızca IP allowlist ve development ortamı bırakıldı.
  - **Distributed Rate Limit Fail-Open + Circuit Breaker**: `src/lib/utils/distributed-rate-limit.ts` içine 30 saniyelik Redis circuit breaker ve lokal in-memory fallback eklendi; Upstash eksikliği veya bağlantı hatası artık tüm trafiği 429 ile kilitlemiyor.
  - **Admin Client API Netleştirildi**: `src/lib/supabase/admin.ts` içinde module-level singleton korunarak `getSupabaseAdminClient()` alias'ı eklendi; A-01 bulgusunun mevcut kod bazında zaten düzeltilmiş olduğu netleştirildi.
  - **Trust Guard Auto-Ban Kaldırıldı**: `src/services/listings/listing-submission-moderation.ts` içinde eşik aşımında `is_banned=true` yerine metadata bazlı manual review işaretleme, structured security log ve kullanıcı bildirimi akışı getirildi.
  - **Image Delete Legacy Fallback Kapatıldı**: `src/app/api/listings/images/route.ts` içindeki registry başarısızsa path prefix ile sahiplik kabul eden legacy silme yolu tamamen kaldırıldı.
  - **Trust Guard Indexleri Eklendi**: `database/migrations/0074_trust_guard_and_rate_limit_hardening.sql` oluşturuldu; `vin` ve `license_plate` için trust guard'ın taradığı aktif statülere uygun partial index'ler hem migration'a hem `database/schema.snapshot.sql` dosyasına eklendi.
- **Doğrulama:**
  - Değişen dosyalarda `npx eslint src/lib/supabase/admin.ts src/lib/middleware/rate-limit.ts src/lib/utils/distributed-rate-limit.ts src/app/api/listings/images/route.ts src/services/listings/listing-submission-moderation.ts` ✅
  - `npm run lint` ✅ (repo genelinde mevcut warning'ler devam ediyor, yeni error yok)
  - `npm run typecheck` ⚠️ Başarısız, ancak hata kümesi bu patch'ten bağımsız mevcut Supabase tip üretimi / `never` tip kırıkları ve bazı `scratch/` dosyaları kaynaklı.
- **Kararlar:**
  - A-01 bulgusu mevcut kod bazında doğrulanmadı; admin client zaten singleton idi. İsimlendirme netliği için `getSupabaseAdminClient()` alias'ı eklendi.
  - D-01 bulgusu kısmen doğrulandı; `vin` için eski index trust guard'ın kullandığı tüm statüleri kapsamıyordu, `license_plate` için eşleşen partial index yoktu.
- **Sıradaki Adım:** Genel `npm run typecheck` kırıklarını ayrı bir stabilizasyon işi olarak temizle ve yeni migration'ı uygulayarak indeksleri canlı ortamla hizala.

## [2026-04-24] - CSRF, Query Limit ve Payment Cleanup Hardening
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **CSRF Origin Zorunluluğu**: `src/lib/security/index.ts` içindeki fallback `x-requested-with` kabulü kaldırıldı; artık mutation isteklerinde `Origin` header zorunlu.
  - **Client Header Cleanup**: `src/services/api-client.ts` içinden artık güvenlik anlamı taşımayan `X-Requested-With` header'ı kaldırıldı.
  - **My Listings Limit Clamp**: `src/app/api/listings/route.ts` içinde `view=my` akışında `limit` parametresi `1..100` aralığına sıkıştırıldı.
  - **Listing Quota Fallback Query Reduction**: `src/services/listings/listing-limits.ts` içindeki fallback akış 3 ayrı count yerine tek `created_at` sorgusuna indirildi.
  - **Async Moderation Cache**: `src/services/listings/listing-submission-moderation.ts` içinde brand+model+year bazlı 5 dakikalık `withNextCache()` cache eklendi; tekrarlanan 100 kayıtlık analiz sorguları azaltıldı.
  - **Payment Init Failure Handling**: `src/services/payment/payment-service.ts` içinde Iyzico init timeout/error durumlarında `pending` ödeme kaydı `failure` + `processed_at` ile işaretleniyor.
  - **Stale Payment Cleanup Cron**: `src/app/api/cron/cleanup-stale-payments/route.ts` oluşturuldu; 24 saatten eski `pending/processing` ve `fulfilled_at IS NULL` ödemeleri kapatan job eklendi. `vercel.json` ile günlük cron kaydı yapıldı ve buna uygun index migration'ı `database/migrations/0075_stale_payment_cleanup_index.sql` eklendi.
- **Doğrulama:**
  - `npx eslint src/lib/security/index.ts src/services/api-client.ts src/app/api/listings/route.ts src/services/listings/listing-limits.ts src/services/listings/listing-submission-moderation.ts src/services/payment/payment-service.ts src/app/api/cron/cleanup-stale-payments/route.ts` ✅
  - `Get-ChildItem src -Recurse -Include *.ts,*.tsx | Select-String -Pattern 'x-requested-with'` ✅ sonuç yok
- **Kararlar:**
  - CSRF için yeni custom token sistemi bu turda eklenmedi; mevcut mimaride en düşük riskli düzeltme mutation'larda `Origin` zorunluluğu oldu.
  - Quota optimizasyonu için yeni DB RPC yerine düşük-riskli tek sorgu fallback tercih edildi.
- **Sıradaki Adım:** Yeni cron route'unun production'da gerçekten tetiklendiğini doğrula; ayrıca `vercel.json` içindeki mevcut `/api/cron/process-fulfillments` yolu ile gerçek route adı arasındaki uyumsuzluğu ayrı bir işte düzelt.

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
- **Sıradaki Adım:** Cloudflare Turnstile ve CSP entegrasyonu (Tamamlandı).

## [2026-04-24] - Production Security Final Hardening
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **Fail-Closed Rate Limiting**: `distributed-rate-limit.ts` güncellendi; üretim ortamında Redis yapılandırması eksikse sistem artık trafiği reddederek ("Fail-Closed") güvenliği önceliklendiriyor.
  - **Bot Protection (Turnstile)**: İlan oluşturma formuna Cloudflare Turnstile entegre edildi. `BotProtection` bileşeni ve server-side `verifyBotToken` mantığı ile bot spamları engellendi.
  - **Phone Reveal Privacy**: Telefon numaraları public ilanlarda artık maskeli (`maskPhoneNumber`) olarak servis ediliyor. Gerçek numara, yeni eklenen `revealListingPhone` server action'ı üzerinden, kullanıcı başına saatlik 15 reveal limiti ile güvenli şekilde gösteriliyor.
  - **Strict Security Headers**: `next.config.ts` üzerinden Content Security Policy (CSP), HSTS, X-Frame-Options ve Referrer-Policy başlıkları en yüksek güvenlik seviyesine getirildi.
  - **UI/UX Error Handling**: Numarayı gösterirken oluşan hatalar ve rate limit engellemeleri için `sonner` ile kullanıcıya bilgilendirici mesajlar sağlandı.
- **Doğrulama:**
  - `npm run build` ✅
  - `npm run typecheck` ✅
- **Sıradaki Adım:** API Kontrat Standardizasyonu ve CSRF Sertleştirme (Tamamlandı).

## [2026-04-24] - API Contract & Security Hardening
- **Durum:** ✅ TAMAMLANDI
- **Yapılanlar:**
  - **API Contract Standardization**: `details` alanı üzerinden tam uyum sağlandı.
  - **ErrorCode Synchronization**: Tüm hata kodları senkronize edildi.
  - **CSRF Defense-in-Depth**: `X-Requested-With` header'ı standartlaştırıldı.
  - **RESTful Pattern Adoption**: Favori kaldırma işlemi URL parametreli hale getirildi.
  - **Pagination Infrastructure**: `getMyListings` servisine sayfalama desteği eklendi.
  - **Auth & Session Sync**: Sign-out ve Profile API'leri oluşturuldu; global 401 redirect eklendi.
- **Doğrulama:**
  - `npm run build` ✅
  - `npm run typecheck` ✅
- **Sıradaki Adım:** Marketplace UX iyileştirmeleri.
