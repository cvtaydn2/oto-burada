# 2026-04-22 — Marketplace Integrity & Payment Hardening

## Yapılan Değişiklikler

### 1. Iyzico Compliance & Identity Verification
- **Identity Number (TCKN)**: 11-haneli TC Kimlik Numarası doğrulaması hem frontend (`CheckoutClient`) hem de backend (`purchase-plan` API) seviyelerinde zorunlu hale getirildi.
- **Profile Schema Update**: `identity_number` alanı `profiles` tablosuna ve domain tiplerine eklendi.
- **Checkout UX**: Ödeme asılı kalma sorunu giderildi; `paymentUrl` alındığında otomatik redirect mekanizması eklendi.

### 2. Marketplace Accuracy & Performance
- **Listing Query Fix**: Banned (yasaklı) kullanıcıların ilanlarının sayımında (count) ve listelenmesinde yaşanan tutarsızlık, `.select("..., profiles!inner!seller_id(...)")` kullanılarak giderildi. Bu sayede hem performans artırıldı hem de count doğruluğu sağlandı.
- **Admin Visibility**: Admin dashboard üzerinde kullanıcı detaylarında TC Kimlik Numarası görüntülenebilir hale getirildi.

### 3. Build & Type Safety
- **npm run lint**: ✅ (Sadece önemsiz uyarılar kaldı)
- **npm run typecheck**: ✅ (Tüm domain tipleri ve API'ler senkronize)

## Doğrulama
- Iyzico Sandbox Redirect Flow ✅
- Banned User Filter Accuracy ✅
- Identity Number Persistence ✅
- Admin User Detail View ✅

---

# 2026-04-22 — Architectural Hardening & SEO Expansion

## Yapılan Değişiklikler

### 1. Security Hardening (Migration 0062)
- `database/migrations/0062_security_advisor_fixes.sql` uygulandı.
- **Search Path Protection**: `SECURITY DEFINER` fonksiyonları için `SET search_path = public` eklendi.
- **RLS Cleanup**: `_migrations`, `user_quotas`, `fulfillment_jobs`, `transaction_outbox`, `realized_sales` tabloları için `service_role_only` politikaları eklendi.
- **Extensions Isolation**: `unaccent` eklentisi `extensions` şemasına taşındı.

### 2. Mimari İyileştirme (Admin Dashboard Refactor)
- `src/app/admin/page.tsx` mega-bileşeni parçalandı:
  - `AdminMetricsSection`, `AdminAnalyticsSection`, `AdminRecentActionsSection`, `QuickSystemStat` bileşenleri oluşturuldu.
- **Sonuç**: Kod okunabilirliği ve bakım kolaylığı artırıldı.

### 3. SEO ve Performans
- **PPR (Partial Prerendering)**: `next.config.ts` üzerinden `ppr: "incremental"` aktifleştirildi.
- **Sitemap Genişletme**: `get_active_brand_city_combinations` RPC'si ile Marka + Şehir sitemap desteği eklendi.

### 4. Performance & Security Polish (Migration 0063)
- **Missing Indexes**: Unindexed foreign keys (`custom_roles`, `doping_applications`, `favorites`, `listing_views`, `payments`, etc.) indexed.
- **RLS Hardening**: Added `service_role_only` policies for internal cache and log tables.
- **Index Cleanup**: Duplicate `listings_search_vector_gin_idx` removed.

### 5. SEO Bug Fixes & Hardening
- **Sitemap**: Fixed `brand_city_combinations` RPC result handling.
- **Structured Data**: Fixed incorrect URL generation for listing items in landing page JSON-LD.
- **Canonical URLs**: Verified consistency across dynamic brand/city routes.

## Doğrulama
- Supabase Security & Performance Migration ✅
- Sitemap XML Validation ✅
- Structured Data URL Integrity ✅
- Admin Roles Persistence Layer ✅

---

# 2026-04-22 — Env, Migration, E2E & Roles

## Yapılan Değişiklikler

### 1. Environment Variables
- `.env.example`: `INTERNAL_API_SECRET` ve `IYZICO_*` alanları eklendi
- `.env.local`: `INTERNAL_API_SECRET`, `CRON_SECRET`, `IYZICO_*` alanları eklendi

### 2. Migration 0042 — Atomic Listing Quota
- `database/migrations/0042_listing_quota_atomic_check.sql` oluşturuldu
- `check_listing_quota_atomic` Postgres RPC fonksiyonu eklendi.

### 3. Migration 0043 — Custom Roles Table
- `database/migrations/0043_custom_roles_table.sql` oluşturuldu
- `custom_roles` tablosu eklendi.

### 4. E2E Test Suite Güncellemesi
- **Sonuç: 45 passed, 4 skipped, 0 failed**

---

# 2026-04-22 — Payment & Automation Activation

## Yapılan Değişiklikler

### 1. Iyzico Payment Activation (Task 26.1)
- **Sandbox Configuration**: `IYZICO_API_KEY`, `IYZICO_SECRET_KEY` ve `IYZICO_BASE_URL` `.env.local` dosyasına eklendi.
- **Identity Number Hardening**: Doping API'si Iyzico için zorunlu olan TC Kimlik Numarası (`identityNumber`) alanını içerecek şekilde güncellendi (`profile.tax_id` veya sandbox fallback).
- **Fulfillment**: `apply_listing_doping` RPC ve idempotent fulfillment worker doğrulandı.

### 2. Saved Searches & Email Alerts (Task 26.2)
- **Resend Integration**: `RESEND_API_KEY` doğrulandı, `email-service.ts` Resend istemcisi ile bağlandı.
- **Notification Cron**: `/api/saved-searches/notify` endpoint'i ve arkaplan mail gönderim mantığı doğrulandı.
- **UI Integration**: Marketplace (`/listings`) sayfasına kompakt "Aramayı Kaydet" butonu eklendi.
- **Localization**: Tüm email şablonları Türkçe ve profesyonel hale getirildi.

## Doğrulama
- Iyzico Checkout Form Initialization ✅
- Saved Search Email Notification Flow ✅
- Profile Balance Display in Dashboard ✅
