# 🔒 Favorites & Saved Searches Security Fix

## Sorun

`src/services/favorites/favorite-records.ts` ve `src/services/saved-searches/saved-search-records.ts` dosyaları **admin client** kullanıyordu → **RLS bypass** → herhangi bir kullanıcının favorileri/aramaları manipüle edilebilirdi.

### Güvenlik Riski

| Dosya | Fonksiyonlar | Risk |
|-------|--------------|------|
| `favorite-records.ts` | `addDatabaseFavorite()`, `removeDatabaseFavorite()` | Admin client RLS'i bypass ediyor → herhangi bir `user_id` ile favori eklenebilir/silinebilir |
| `saved-search-records.ts` | `createOrUpdateDatabaseSavedSearch()`, `updateDatabaseSavedSearch()`, `deleteDatabaseSavedSearch()` | Admin client RLS'i bypass ediyor → başka kullanıcılar adına arama kaydedilebilir/güncellenebilir/silinebilir |

**Exploit Senaryosu:**

1. Saldırgan `/api/favorites` endpoint'ini reverse engineer eder
2. Route katmanında `userId` kontrolü unutulursa veya bypass edilirse
3. Admin client RLS'i bypass ettiği için başka kullanıcılar adına favori ekleyebilir
4. Aynı şekilde saved searches için de geçerli

**Örnek Exploit:**
```typescript
// Route katmanında userId kontrolü unutulursa:
await addDatabaseFavorite(
  "victim-user-id",  // Başka kullanıcının ID'si
  "listing-id"
);
// ✅ Admin client RLS'i bypass eder, favori eklenir
```

---

## Çözüm

### 1. Server Client Kullanımı

**Admin client → Server client** değişikliği:

```typescript
// ❌ Öncesi (Vulnerable)
const admin = createSupabaseAdminClient();
await admin.from("favorites").insert({ user_id: userId, listing_id: listingId });
// RLS bypass — herhangi bir user_id ile insert yapılabilir

// ✅ Sonrası (Secure)
const supabase = await createSupabaseServerClient();
await supabase.from("favorites").insert({ user_id: userId, listing_id: listingId });
// RLS enforce — sadece auth.uid() = user_id ise insert yapılabilir
```

### 2. RLS Policy Enforcement

Mevcut RLS politikaları zaten güvenli:

```sql
-- Favorites
CREATE POLICY "favorites_manage_own" 
ON public.favorites FOR ALL 
USING ((SELECT auth.uid()) = user_id);

-- Saved Searches
CREATE POLICY "saved_searches_manage_own" 
ON public.saved_searches FOR ALL 
USING ((SELECT auth.uid()) = user_id);
```

**Bu politikalar şu anlama geliyor:**
- Kullanıcı sadece kendi favorilerini/aramalarını görebilir
- Kullanıcı sadece kendi `user_id`'si ile favori/arama ekleyebilir
- Kullanıcı sadece kendi favorilerini/aramalarını güncelleyebilir/silebilir

**Önceden:** Admin client bu politikaları bypass ediyordu  
**Şimdi:** Server client (authenticated role) bu politikaları enforce ediyor

### 3. Değişiklik Özeti

#### `favorite-records.ts`

| Fonksiyon | Değişiklik |
|-----------|------------|
| `getDatabaseFavoriteIds()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |
| `getDatabaseFavoriteCount()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |
| `addDatabaseFavorite()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |
| `removeDatabaseFavorite()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |

#### `saved-search-records.ts`

| Fonksiyon | Değişiklik |
|-----------|------------|
| `getDatabaseSavedSearches()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |
| `getStoredSavedSearchesByUser()` | Değişiklik yok (wrapper) |
| `createOrUpdateDatabaseSavedSearch()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |
| `updateDatabaseSavedSearch()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |
| `deleteDatabaseSavedSearch()` | `createSupabaseAdminClient()` → `createSupabaseServerClient()` |

---

## Test Senaryoları

### Test 1: Normal Kullanıcı (Kendi Favorisi)
```typescript
// User A kendi favorisini ekliyor
const userId = "user-a-id";  // auth.uid() = user-a-id
await addDatabaseFavorite(userId, "listing-123");
```
**Beklenen:** ✅ Favori eklenir (RLS geçer)

### Test 2: Exploit Denemesi (Başka Kullanıcı Adına)
```typescript
// User A, User B adına favori eklemeye çalışıyor
const userId = "user-b-id";  // auth.uid() = user-a-id (farklı!)
await addDatabaseFavorite(userId, "listing-123");
```
**Beklenen:** ❌ RLS policy violation (auth.uid() ≠ user_id)

### Test 3: Saved Search Update (Kendi Araması)
```typescript
// User A kendi aramasını güncelliyor
const userId = "user-a-id";  // auth.uid() = user-a-id
await updateDatabaseSavedSearch(userId, "search-123", { title: "Yeni Başlık" });
```
**Beklenen:** ✅ Arama güncellenir (RLS geçer)

### Test 4: Saved Search Delete (Başka Kullanıcının Araması)
```typescript
// User A, User B'nin aramasını silmeye çalışıyor
const userId = "user-b-id";  // auth.uid() = user-a-id (farklı!)
await deleteDatabaseSavedSearch(userId, "search-456");
```
**Beklenen:** ❌ RLS policy violation (0 satır silinir)

### Test 5: SQL Injection Denemesi
```sql
-- Supabase SQL Editor'da (authenticated role olarak)
INSERT INTO public.favorites (user_id, listing_id)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,  -- Başka kullanıcı
  '11111111-1111-1111-1111-111111111111'::uuid
);
```
**Beklenen:** ❌ RLS policy violation hatası

---

## Güvenlik İyileştirmeleri

### Öncesi (Vulnerable)

```typescript
// ❌ Admin client RLS'i bypass ediyor
const admin = createSupabaseAdminClient();

// Herhangi bir user_id ile favori eklenebilir
await admin.from("favorites").insert({
  user_id: "victim-id",  // Manipüle edilebilir
  listing_id: "listing-id"
});

// Herhangi bir user_id'nin araması silinebilir
await admin.from("saved_searches")
  .delete()
  .eq("id", "search-id")
  .eq("user_id", "victim-id");  // Manipüle edilebilir
```

### Sonrası (Secure)

```typescript
// ✅ Server client RLS'i enforce ediyor
const supabase = await createSupabaseServerClient();

// Sadece auth.uid() = user_id ise favori eklenebilir
await supabase.from("favorites").insert({
  user_id: userId,  // RLS kontrol eder: auth.uid() = userId mi?
  listing_id: "listing-id"
});

// Sadece auth.uid() = user_id ise arama silinebilir
await supabase.from("saved_searches")
  .delete()
  .eq("id", "search-id")
  .eq("user_id", userId);  // RLS kontrol eder: auth.uid() = userId mi?
```

---

## Deployment

### Adım 1: Code Review
```bash
# Admin client kullanımını kontrol et
grep -r "createSupabaseAdminClient" src/services/favorites/
grep -r "createSupabaseAdminClient" src/services/saved-searches/
```
**Beklenen:** Hiçbir sonuç (artık admin client kullanılmıyor)

### Adım 2: Test
```bash
npm run test  # Unit testler
npm run test:e2e  # E2E testler
```

### Adım 3: Deploy
```bash
git add .
git commit -m "fix: enforce RLS for favorites and saved searches"
git push origin main
```

**Not:** Migration gerekmez — RLS politikaları zaten mevcut.

---

## Diğer Servislerde Kontrol Edilmesi Gerekenler

Aynı pattern'i kontrol et:

```bash
# Admin client kullanımını bul
grep -r "createSupabaseAdminClient" src/services/

# Şüpheli write işlemlerini kontrol et
grep -r "admin.from.*insert\|admin.from.*update\|admin.from.*delete" src/services/
```

**Kontrol edilecek servisler:**
- ✅ `src/services/support/ticket-service.ts` — Düzeltildi (RPC kullanıyor)
- ✅ `src/services/favorites/favorite-records.ts` — Düzeltildi (server client)
- ✅ `src/services/saved-searches/saved-search-records.ts` — Düzeltildi (server client)
- ⚠️ `src/services/listings/` — Kontrol edilmeli
- ⚠️ `src/services/reports/` — Kontrol edilmeli
- ⚠️ `src/services/messages/` — Kontrol edilmeli

---

## Admin Client Kullanım Kuralları

### ✅ Admin Client Kullanılabilir
- **Read-only admin operations** (dashboard, analytics)
- **System-level operations** (cron jobs, background tasks)
- **Email/notification helpers** (getUserEmailAndName)

### ❌ Admin Client Kullanılmamalı
- **User-scoped write operations** (favorites, saved searches, messages)
- **Public endpoints** (contact form, registration)
- **User-initiated actions** (create listing, add favorite, send message)

### Kural
> **User-scoped write işlemleri için admin client kullanma.**  
> **Server client (authenticated role) kullan, RLS'i enforce et.**

---

## Özet

| Metrik | Öncesi | Sonrası |
|--------|--------|---------|
| RLS Bypass (Favorites) | ✅ Var | ❌ Yok |
| RLS Bypass (Saved Searches) | ✅ Var | ❌ Yok |
| Admin Client (User Operations) | 9 fonksiyon | 0 fonksiyon |
| Server Client (RLS Enforced) | 0 fonksiyon | 9 fonksiyon |
| Exploit Risk | Yüksek | Düşük |

**Sonuç:** Favorites ve saved searches işlemleri artık RLS politikalarından geçiyor. Admin client sadece admin-only read operasyonlarında kullanılıyor. ✅
