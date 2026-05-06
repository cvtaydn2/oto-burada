# 🏗️ MİMARİ VE GÜVENLİK İNCELEME RAPORU
**Proje:** oto-burada (Car-Only Classifieds Marketplace)  
**Tarih:** 2026-05-07  
**İnceleyen:** Kilo (Full-Stack System Architect, Backend Lead, Security Review Engineer)

---

## 📌 ÖZET
Proje **Next.js App Router**, **TypeScript strict**, **Supabase RLS**, **Outbox Pattern** ve **Redis Rate Limit** ile çok sağlam bir altyapıya sahip. Ancak **race condition**, **GDPR uyumluluğu**, **optimistic locking** ve **IDOR** gibi kritik riskler tespit edildi.

**Genel Durum:** ⚠️ **İyi** (Ancak düzeltilmesi gereken 8 kritik sorun var)

---

## 1. 🏗️ PROJE MİMARİSİ & KATMANLAR (Architecture Map)

### ✅ Güçlü Yönler
- **Next.js App Router** ile net katman ayrımı: `(public)` (SSR/ISR) ↔ `(auth)` ↔ `admin`
- **Katmanlı mimari:**
  - `app/api/*` (Route Handlers / Server Actions)
  - `domain/usecases/*` (orchestrasyon / saga)
  - `services/*/actions.ts` (server actions, `"use server"`)
  - `services/*/logic.ts` (pure business logic)
  - `services/*/records.ts` (DB erişimi, RLS)
  - `lib/supabase/*` (infra: server, admin, browser clients)
- **Outbox & Saga:** `transaction_outbox` ve `fulfillment_jobs` ile distributed transaction çözümü
- **Cache-Control:** `s-maxage=30, stale-while-revalidate=60` (CDN + ISR)
- **Redis Rate Limit:** Dağıtık sistemde tutarlı kısıtlama
- **Type Safety:** Her yerde Zod validasyonu, `any` yok

### ⚠️ MİMARİ ÇATLAKLARI
1. **Slug Üretiminde Race Condition**  
   `src/domain/logic/listing-factory.ts:26` "race condition" uyarısı mevcut. Unique constraint var ancak uygulama seviyesindeki check-insert arası fark (TOCTOU) riski.

2. **Katman Sorumluluk Aşımı**  
   `listing-submission-persistence.ts` hem validation hem repo işini yapıyor. Single Responsibility Principle (SRP) ihlali riski.

3. **Admin Client RLS Bypass Riski**  
   `lib/supabase/admin.ts` service_role kullanıyor. Eğer bu client yanlışlıkla client-component tarafından import edilirse RLS tamamen atlanır.

---

## 2. 🔄 VERİ AKIŞI & İŞ AKIŞI (Data & Business Flow)

### Listing Oluşturma Akışı (Create Listing Flow)
```
1. UI (Form) 
   → POST /api/listings/mine (Server Action)
   → validateRequestBody(Zod: listingCreateSchema)
   → executeListingCreation (usecase)
     → checkListingLimit (kota)
     → runListingTrustGuards (spam/fraud)
     → performAsyncModeration (AI - opsiyonel)
     → buildListingRecord (domain factory: fiyat, tramer, slug)
     → createDatabaseListing (DB insert + outbox)
   → 201 Created (Location header)
```

### ⚠️ LOGİK HATALARI
- **Tramer Hesaplaması Belirsiz:** `tramer_amount` alanının **TL** mi **%** mi olduğu yorumda net değil. Fiyatlandırma tutarsızlığı riski.
- **Yuvarlama Problemi:** Kuruş bazlı (integer) hesaplama genel olarak doğru ancak bazı eski kesirli (float) geçişlerde hata riski.
- **Outbox Transaction Senkronizasyonu:** Ödeme başarılı ama `fulfillment_jobs` (outbox) insert fail olursa saga bozulur. **Aynı transaction içinde** yapılmalı.
- **Slug Değişikliği Kayıpları:** Listing güncellenirken eski slug geçmişi kaybolabilir. Tarihçe (history) yok.

---

## 3. 🔐 GÜVENLİK & YETKİ YÖNETİMİ (Security & Auth)

### ✅ Güçlü Yönler
- **Row Level Security (RLS)** her tabloda aktif: `USING (auth.uid() = user_id)`
- **CSRF Koruması:** `withUserAndCsrfToken` middleware
- **Mass Assignment Koruması:** Zod schema’larında `.strict()`
- **PII Şifreleme:** `encryptIdentityNumber` / `decryptIdentityNumber` ile kimlik numarası saklanıyor
- **Rate Limiting:** 120 req/dakika (search), Redis tabanlı

### ⚠️ GÜVENLİK AÇIKLIKLARI
1. **IDOR Riski (Insecure Direct Object Reference)**  
   URL parametreli endpoint’lerde (`/api/favorites/[listingId]`, `/api/listings/[slug]`) sadece RLS’e güvenilmemeli. Ek **ownership check** (manuel) yapılmadıysa başkasının verisi silinebilir.

2. **Admin Client Yanlış Kullanımı**  
   `lib/supabase/admin.ts` (service_role) sadece **server-side** (Route Handlers, Server Actions) kullanılmalı. Client component’te kullanılırsa RLS bypass.

3. **XSS via Arama Parametreleri**  
   `parseListingFiltersFromSearchParams` içerisinde gelen `brand`, `city` gibi değerler raw SQL’e ekleniyor (SQLi yok ama XSS riski var). Çıktıda encode edilmeli.

4. **GDPR Uyumluluk Sorunu (Hard Delete)**  
   `profiles` silinince (`ON DELETE CASCADE`) tüm `listings`, `favorites`, `payments` da siliniyor. GDPR “anonymization” gerektirir.

---

## 4. ⚡ PERFORMANS & ÖLÇEKSELENEBİLİRLİK (Performance)

### ✅ Güçlü Yönler
- **Cache Header:** `public, s-maxage=30, stale-while-revalidate=60`
- **N+1 Engellenmiş:** `getFilteredMarketplaceListings` içinde JOIN’lar var
- **Redis Rate Limit:** Tutarlı dağıtık limit
- **Partial Prerendering:** ISR ile statik sayfalar

### ⚠️ PERFORMANS KAYIPLARI
1. **Arama Filtrelerinde N+1 Riski:**  
   `listing-filters.ts` içinde çoklu filtre (marka, şehir, yakıt) ayrı query’ler olabilir. Tek sorguda `IN (...)` veya JOIN yapılmalı.

2. **Benzer İlanlar Cache’lenmiyor:**  
   Similar listings için Redis cache yok. Her seferinde sorgu çalışıyor.

3. **Büyük JSONB Filtreleme:**  
   `damage_status_json` (JSONB) üzerinde filtre varsa index kullanılmayabilir.

4. **Sort Order Race Condition:**  
   `listing_images` tablosunda `sort_order` eş zamanlı güncellenirse kutuplaşma (race) oluşur. Advisory lock veya atomic update (`WHERE sort_order = X`) yok.

5. **Sınırsız Arama:**  
   `year=1900..2100` gibi sınırsız aramalar için `LIMIT` veya clamp yok.

---

## 5. 🧼 KOD KALİTESİ & CLEAN CODE (Code Quality)

### ✅ Güçlü Yönler
- **Pure Functions:** `*-logic.ts` dosyalarında class yok, sadece fonksiyonlar
- **Type Safety:** `strict` mode açık, `any` yok
- **Error Handling:** Standart `Result<T, E>` tipi (`lib/api/result.ts`)
- **Test Coverage:** `__tests__` altında `preservation.test.ts` ile integration testler

### ⚠️ KALİTE EKSİKLERİ
1. **Fonksiyon Uzunluğu:**  
   `payment-logic.ts` içinde `initializePaymentCheckout` ~400 satır. Alt fonksiyonlara bölünmeli.

2. **Duplicate Logic:**  
   - Slug üretimi hem `listing-factory.ts` hem `listing-submission-helpers.ts` içinde var.
   - Tramer hesaplama mantığı `doping-logic.ts` ve `pricing-engine.ts` arasında tutarsız.

3. **Optimistic Locking Yok:**  
   `listings` tablosunda `version` alanı yok. İki request aynı kaydı güncellerse biri ezilir (kayıp).

4. **Try/Catch Eksikliği:**  
   Bazı `app/api/*/route.ts` dosyalarında `try/catch` yok. 500 dönüyor, hata detayı loglanıyor ama UX kopuyor.

---

## 6. 🔗 İLİŞKİ HARİTASI & EN KRİTİK ÇATLAKLAR

| Tablo | Bağlılık | Yetkilendirme | Kritik Risk |
|-------|----------|---------------|-------------|
| `listings` | `profiles(seller_id)` | RLS (seller_id = auth.uid()) | Banlı kullanıcının ilanı görünür |
| `favorites` | `profiles(user_id)` + `listings` | Composite PK, RLS | IDOR (başkasının favorisi silinebilir) |
| `chats` | `profiles` (buyer/seller) | RLS | Dangling FK (ilani silinince chat kalıyor) |
| `payments` | `listings(id)` | RLS | Hard delete ile kaybolan ödeme |
| `doping_purchases` | `listings`, `doping_packages` | RLS | Süresi bitmiş ama görünen doping |
| `outbox` | Tüm iş akışları | Transaction içinde | Sonsuz retry loop riski |
| `profiles` | `auth.users` | RLS | Hard delete (anonymize yok) |

---

## 🚨 ACİL DÜZELTME LİSTESİ (Critical Fixes)

### 1️⃣ [CRITICAL] Race Condition: Slug Unique Constraint
- **Problem:** `listing-factory.ts` (satır 26) "race condition" uyarısı.
- **Çözüm:** 
  - `listings.slug` kolonuna `UNIQUE CONSTRAINT` ekle.
  - Application seviyesinde **retry** (advisory lock) veya `ON CONFLICT DO NOTHING` + döngü yap.
  - Alternatif: `uuid` + `slug` ikilisi kullan, slug sadece okunabilir URL amaçlı.

### 2️⃣ [CRITICAL] RLS Bypass: Admin Client Kullanımı
- **Problem:** `lib/supabase/admin.ts` (service_role) client-component tarafından kullanılırsa RLS atlanır.
- **Çözüm:** 
  - Bu client **sadece server-side** (Route Handlers, Server Actions) kullanılmalı.
  - Lint kuralı ekle (ESLint) veya runtime kontrol (`if (typeof window !== "undefined")` throw).

### 3️⃣ [HIGH] GDPR Uyumsuzluğu: Hard Delete
- **Problem:** `profiles` silinince tüm ilişkiler `CASCADE` ile siliniyor.
- **Çözüm:** 
  - `profiles` tablosuna `anonymized_at TIMESTAMP` ve `is_deleted BOOLEAN DEFAULT false` ekle.
  - FK'ları `ON DELETE RESTRICT` yap.
  - Silme işlemi UPDATE (soft delete) ile yap, verileri anonimleştir (`email = "deleted@anon.oto"`, `phone = null`, `name = "Deleted User"`).

### 4️⃣ [HIGH] Optimistic Locking Eksikliği
- **Problem:** `listings` tablosunda `version` yok. İki request aynı kaydı güncellerse biri ezilir.
- **Çözüm:** 
  - `version INT DEFAULT 0` kolonu ekle.
  - Güncellemelerde `WHERE id = X AND version = Y` şartı koy.
  - Başarılı update sonrası `version = version + 1` yap.

### 5️⃣ [HIGH] Tramer / Fiyat Karmaşası
- **Problem:** `tramer_amount` ve `doping` fiyatlarında `decimal` vs `integer` tutarsızlığı.
- **Çözüm:** 
  - Tüm fiyat/tramer alanlarını **kuruş (INT)** olarak sakla (DB ve API).
  - Ekran (UI) katmanında formatla (TL/kuruş).
  - `payment-logic.ts` içinde float hesaplama varsa tam sayıya (kuruş) çevir.

### 6️⃣ [MEDIUM] IDOR Koruması (Defense in Depth)
- **Problem:** URL parametreli endpoint’lerde sadece RLS’e güvenilmiyor.
- **Çözüm:** 
  - `lib/security/ownership.ts` gibi bir util yaz.
  - Her server action / route handler başında `checkOwnership(userId, resourceId)` çağır.
  - Örnek: `DELETE /api/favorites/[id]` → `SELECT user_id FROM favorites WHERE id = $1` ve `auth.uid()` ile karşılaştır.

### 7️⃣ [MEDIUM] Outbox Transaction Senkronizasyonu
- **Problem:** Ödeme başarılı ama `fulfillment_jobs` (outbox) insert fail olursa saga bozulur.
- **Çözüm:** 
  - Ödeme insert'i ve outbox insert'i **aynı transaction** içinde yapılmalı.
  - `payment-logic.ts` ve `doping-logic.ts` içinde `BEGIN; ... COMMIT;` blokları ekle.

### 8️⃣ [LOW] Duplicate Slug Logic
- **Problem:** `buildListingSlug` (factory) ve `listing-submission-helpers.ts` içinde aynı kod.
- **Çözüm:** 
  - Tek bir `generateUniqueSlug` fonksiyonuna koy.
  - Diğerleri import etsin (DRY).

---

## 📈 ÖNERİLER (Roadmap)

1. **Kısa Vadede (Bu Sprint):**  
   - [ ] Slug UNIQUE constraint + retry mekanizması (#1)
   - [ ] Admin client RLS bypass kontrolü (#2)
   - [ ] Optimistic locking (#4)

2. **Orta Vadede (Next Sprint):**  
   - [ ] GDPR soft delete (#3)
   - [ ] Tramer/fiyat kuruşlaştırma (#5)
   - [ ] IDOR defense in depth (#6)

3. **Uzun Vadede (Refactor):**  
   - [ ] `payment-logic.ts` bölme (#7 - performans)
   - [ ] Outbox transaction atomicity (#7 - reliability)
   - [ ] Duplicate slug logic temizliği (#8)

---

**Rapor Hazırlayan:** Kilo (AI Full-Stack System Architect)  
**Son Güncelleme:** 2026-05-07