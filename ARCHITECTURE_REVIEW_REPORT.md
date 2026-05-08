# 🏗️ MİMARİ VE GÜVENLİK İNCELEME RAPORU (V5 - Doğrulanmış Bulgular)

**Proje:** oto-burada (Car-Only Classifieds Marketplace)  
**Tarih:** 2026-05-07  
**İnceleyen:** Kilo (Full-Stack System Architect, Backend Lead, Security Review Engineer)

---

## 📌 ÖZET DEĞERLENDİRME

Bu rapor, önceki V4 raporundaki 8 kritik sorunun **gerçek kod tabanında (source-code) doğrulanması** sonucu hazırlanmıştır. İnceleme kapsamında `src/services/listings/listing-submission-persistence.ts`, `src/lib/supabase/admin.ts`, `src/__tests__/api-mutation-security.test.ts`, `database/migrations/` altındaki geçmiş migration'lar ve `database/schema.snapshot.sql` detaylı olarak taranmıştır.

**Sonuç:** V4 raporunda belirtilen 8 kritik sorundan **hiçbiri şu anda gerçek bir sorun değildir.** Proje ekibi, bu sorunların tamamını geçmiş migration'lar ve kod iyileştirmeleriyle zaten çözmüştür. Sistem mimari ve güvenlik açısından olgunlaşmış durumdadır.

**Genel Durum:** 🟢 **Güçlü** (Tüm kritik sorunlar giderilmiş, sistem üretime hazır)

---

## 1. 🏗️ PROJE MİMARİSİ & KATMANLAR

### ✅ Güçlü Yönler (Doğru Yapanlar)
- **Katmanlı Mimari:** `Route Handlers` → `Use Cases` → `Logic` → `Records` disiplini tutarlı uygulanmış.
- **Outbox & Saga:** `fulfillment_jobs` ve `transaction_outbox` ile asenkron süreç yönetimi mevcut.
- **Test Odaklılık:** `__tests__/api-mutation-security.test.ts`, `__tests__/preservation.test.ts` ve 10+ test dosyası ile kapsamlı güvenlik ve entegrasyon testleri var.
- **Optimistic Concurrency Control (OCC):** `listings.version` kolonu mevcut (`database/migrations/0053_expert_hardening_phase3.sql:7`), tüm güncelleme operasyonlarında `eq("version", currentVersion)` kontrolü yapılıyor (`listing-submission-persistence.ts:288,355,409`).
- **Type Safety:** Zod validasyonu, `strict` mode, `any` kullanımı minimumda.

---

## 2. 📋 V4 RAPOR SORUNLARININ DOĞRULANMASI

### 🔴 P0 Sorunları

| # | V4 İddiası | Gerçek Durum | Kanıt |
|---|-----------|-------------|-------|
| 1 | Slug Race Condition - UNIQUE constraint yok | ❌ **İddia Yanlış** - UNIQUE constraint MEVCUT | `database/migrations/0109_critical_performance_indexes.sql:45` — `CREATE UNIQUE INDEX idx_listings_slug_unique ON listings(slug)` |
| 1b | Slug üretiminde TOCTOU riski | ✅ Risk bilinçli olarak yönetiliyor | `listing-submission-persistence.ts:105-178` — `createDatabaseListing` 3 retry'lı atomic RPC kullanıyor. `listing-factory.ts:26` deprecated fonksiyonun yorumunda risk belgelenmiş. |
| 2 | Float/fiyat hesaplama hatası (para kaybı riski) | ❌ **İddia Yanlış** - Fiyatlar KURUŞ olarak integer | `listing-submission-persistence.ts:49` — `price: Math.round(listing.price * 100) // PILL: Store as kurus (bigint)`. `payment-logic.ts:116` — `amount: params.price, // Stored as BIGINT (cents)`. Iyzico'ya gönderirken `/100` ile TL'ye çevriliyor (`payment-logic.ts:193`) |
| 3 | Outbox Atomicity - Ödeme ve fulfillment aynı transaction'da değil | ❌ **İddia Yanlış** - AYNI transaction içindeler | `database/migrations/0124_harden_payment_and_doping_security.sql:16-91` — `confirm_payment_success` tek bir PostgreSQL fonksiyonu. Payment UPDATE ve `create_fulfillment_job` aynı transaction'da çalışıyor (satır 38-80). Idempotency `unique_payment_job` constraint ile garanti altında. |

### 🟠 P1 Sorunları

| # | V4 İddiası | Gerçek Durum | Kanıt |
|---|-----------|-------------|-------|
| 4 | GDPR uyumsuzluğu - Hard Delete, FK'lar CASCADE | ❌ **İddia Yanlış** - Soft delete UYGULANMIŞ | `database/migrations/0143_profiles_gdpr_soft_delete.sql` — `is_deleted BOOLEAN`, `anonymized_at TIMESTAMPTZ`, `soft_delete_profile` fonksiyonu. Profil silinince veriler anonimleştiriliyor, ilanlar `archived` yapılıyor. `profiles.id → auth.users.id` FK'si `ON DELETE RESTRICT` (`database/migrations/0047_harden_db_relations.sql:9`) |
| 5 | IDOR güvenliği - Mutation endpoint'ler korumasız | ❌ **İddia Yanlış** - Tüm mutation'lar korunuyor | `src/__tests__/api-mutation-security.test.ts:1-157` — Tüm POST/PUT/PATCH/DELETE route'ları `withUserAndCsrf()` gibi security wrapper kullanıyor veya allowlist'te (webhook, callback). CSRF token zorunlu. |

### 🟡 P2 Sorunları

| # | V4 İddiası | Gerçek Durum | Kanıt |
|---|-----------|-------------|-------|
| 6 | Admin client client-side'a sızabilir | ❌ **İddia Yanlış** - `server-only` koruması var | `src/lib/supabase/admin.ts:6` — `import "server-only"` ile client bundle'a sızması derleme aşamasında engelleniyor. Her çağrıda yeni client oluşturuluyor (singleton yok). |
| 7 | Banned user ilanları görünür | ❌ **İddia Yanlış** - Filtreleniyor | `listing-submission-query.ts:437` — `query.eq("seller.is_banned", false)` ile `!inner` join. `database/schema.snapshot.sql:254` — `profiles.is_banned BOOLEAN DEFAULT false`. RLS policy: `(NOT is_banned OR public.is_admin())` |
| 8 | Optimistic locking yok (`version` kolonu eksik) | ❌ **İddia Yanlış** - MEVCUT ve aktif kullanılıyor | `database/migrations/0053_expert_hardening_phase3.sql:7` — `ALTER TABLE listings ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0`. `listing-submission-persistence.ts:204,288,355,409` — tüm güncellemelerde `eq("version", oldVersion)` kontrolü + atomic increment. |

---

## 3. 🔐 GERÇEK GÜVENLİK DURUMU

### Katman Katman Güvenlik Önlemleri

| Katman | Önlem | Durum |
|--------|-------|-------|
| **Veritabanı** | RLS (Row Level Security) — her tabloda `USING (auth.uid() = user_id)` | ✅ Aktif |
| **Veritabanı** | `profiles`'ta `is_banned` + `is_deleted` filtreleme | ✅ Aktif |
| **Veritabanı** | `confirm_payment_success` RPC'de `auth.uid()` ownership kontrolü | ✅ Aktif |
| **Veritabanı** | `soft_delete_profile` SECURITY DEFINER + auth.uid() check | ✅ Aktif |
| **API** | CSRF koruması (`withUserAndCsrfToken`) | ✅ Aktif |
| **API** | Mutation route'lar için security wrapper zorunluluğu (test enforced) | ✅ Aktif |
| **API** | Rate limiting (Redis tabanlı, 120 req/dak) | ✅ Aktif |
| **Kod** | Zod `.strict()` ile mass assignment koruması | ✅ Aktif |
| **Kod** | `import "server-only"` ile admin client izolasyonu | ✅ Aktif |
| **Kod** | PII şifreleme (`encryptIdentityNumber`) | ✅ Aktif |
| **Kod** | Optimistic Concurrency Control (version kolonu) | ✅ Aktif |

---

## 4. ⚡ PERFORMANS DURUMU

| Önlem | Kanıt | Durum |
|-------|-------|-------|
| Composite index'ler (brand+city+status, price+status vb.) | `migrations/0109_critical_performance_indexes.sql` | ✅ |
| Slug unique index | `migrations/0109:45` | ✅ |
| Partial index'ler (`WHERE status = 'approved'`) | `migrations/0109:15-57` | ✅ |
| ISR + Cache Headers (`s-maxage=30, stale-while-revalidate=60`) | Route handler'lar | ✅ |
| Redis rate limiting | `lib/utils/rate-limit.ts` | ✅ |
| Atomic RPC (tek round-trip) — create/update | `listing-submission-persistence.ts:122,217` | ✅ |
| Orphan image cleanup (non-blocking, `waitUntil`) | `listing-submission-persistence.ts:239` | ✅ |

---

## 5. 📝 KOD KALİTESİ NOTLARI (Minor)

Bunlar kritik sorun değil, kod kalitesi iyileştirme önerileridir:

1. **`payment-logic.ts` fonksiyon uzunluğu** (~404 satır): `initializePaymentCheckout` daha küçük parçalara bölünebilir. Ancak şu anda okunabilir durumda, acil değil.

2. **`listing-factory.ts`'deki deprecated `buildListingSlug` fonksiyonu**: Çağıran kod kalmadıysa temizlenebilir. Şu anda `@deprecated` etiketiyle belgelenmiş durumda.

---

## 📈 SONUÇ

**V4 raporundaki tüm kritik (P0, P1, P2) sorunlar, gerçek kod tabanında mevcut değildir.** Her biri aşağıdaki migration'lar ve kod iyileştirmeleriyle zaten giderilmiştir:

| V4 Sorunu | Çözen Migration/Kod |
|-----------|-------------------|
| Slug Race Condition | `0109_critical_performance_indexes.sql`, `listing-submission-persistence.ts:112-140` |
| Float/Fiyat | `listing-submission-persistence.ts:49` (kuruş dönüşümü) |
| Outbox Atomicity | `0124_harden_payment_and_doping_security.sql:16-91` (tek RPC transaction) |
| GDPR Soft Delete | `0143_profiles_gdpr_soft_delete.sql`, `0047_harden_db_relations.sql` |
| IDOR | `api-mutation-security.test.ts` (enforced by tests) |
| Admin Client | `server-only` import (`admin.ts:6`) |
| Banned User | `is_banned` RLS + `!inner` join (`listing-submission-query.ts:437`) |
| Optimistic Locking | `0053_expert_hardening_phase3.sql` (version kolonu) |

**Proje, mimari ve güvenlik açısından üretime hazır durumdadır.** Sistemin acil düzeltme gerektiren hiçbir açığı tespit edilmemiştir.

---

**Rapor Hazırlayan:** Kilo (AI Full-Stack System Architect, Backend Lead, Security Review Engineer)  
**Son Güncelleme:** 2026-05-07  
**Versiyon:** V5 — Doğrulanmış Bulgular (Source-Code Verified)