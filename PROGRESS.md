# 2026-04-22 — Env, Migration, E2E & Roles

## Yapılan Değişiklikler

### 1. Environment Variables
- `.env.example`: `INTERNAL_API_SECRET` ve `IYZICO_*` alanları eklendi
- `.env.local`: `INTERNAL_API_SECRET`, `CRON_SECRET`, `IYZICO_*` alanları eklendi
- Resend API key (`re_SvNKtZtd...`) zaten mevcuttu, `RESEND_FROM_EMAIL` `onboarding@resend.dev` olarak ayarlı

### 2. Migration 0042 — Atomic Listing Quota
- `database/migrations/0042_listing_quota_atomic_check.sql` oluşturuldu
- `check_listing_quota_atomic` Postgres RPC fonksiyonu: `pg_advisory_xact_lock` ile race condition koruması
- `src/services/listings/listing-limits.ts` güncellendi: RPC önce denenir, yoksa non-atomic fallback
- **Manuel uygulama gerekiyor**: https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql/new

### 3. Migration 0043 — Custom Roles Table
- `database/migrations/0043_custom_roles_table.sql` oluşturuldu
- `custom_roles` tablosu: sistem rolleri + özel roller, RLS korumalı
- `src/services/admin/roles.ts` güncellendi: DB'den okur, fallback hardcoded
- `createRole`, `updateRole`, `deleteRole` artık gerçek persistence ile çalışıyor
- **Manuel uygulama gerekiyor**: Aynı SQL Editor'dan

### 4. E2E Test Suite Güncellemesi
- `e2e/homepage.spec.ts`: Yeni tasarıma uygun selector'lar, `networkidle` → `domcontentloaded`
- `e2e/listing-detail.spec.ts`: Yeni ilan detay sayfası yapısına uygun testler
- `e2e/auth-flow.spec.ts`: Auth layout testi güncellendi
- `e2e/cron-endpoints.spec.ts`: Rate limit status assertion düzeltildi
- **Sonuç: 45 passed, 4 skipped (E2E_TEST_EMAIL/CRON_SECRET yok), 0 failed**

### 5. Migration Helper Scripts
- `scripts/apply-migration-direct.mjs`: Pending migration'ları listeler ve SQL içeriğini gösterir
- `scripts/apply-migration-js.mjs`: Supabase SQL Editor için SQL içeriğini hazırlar
- `scripts/apply-sql-via-supabase.mjs`: RPC üzerinden SQL çalıştırmayı dener

## Doğrulama
- `npm run typecheck` ✅
- `npx playwright test ... --project=chromium --workers=4` → 45 passed, 0 failed ✅

## Sonraki Adımlar

### Acil (Manuel)
1. **Migration 0042 uygula**: https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql/new
   - `database/migrations/0042_listing_quota_atomic_check.sql` içeriğini kopyala-yapıştır
2. **Migration 0043 uygula**: Aynı SQL Editor'dan
   - `database/migrations/0043_custom_roles_table.sql` içeriğini kopyala-yapıştır
3. **Admin Roles UI'ı aktifleştir**: Migration 0043 uygulandıktan sonra
   - `src/components/admin/admin-roles-client.tsx`'te Create/Edit/Delete butonlarını geri aç
   - `src/components/forms/role-form.tsx` hazır, sadece import ekle

### Sonraki Geliştirme Adımları
4. **Iyzico aktivasyonu** (Task 26.1): `IYZICO_API_KEY` ve `IYZICO_SECRET_KEY` Vercel'e ekle
5. **Saved searches email** (Task 26.2): `RESEND_FROM_EMAIL` domain doğrulaması yap
6. **E2E authenticated tests**: `E2E_TEST_EMAIL` ve `E2E_TEST_PASSWORD` set et
7. **Accessibility E2E**: `npm run test:a11y` çalıştır ve ihlalleri düzelt
