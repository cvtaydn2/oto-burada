# FAZ 2: GUVENLIK & YETKILENDIRME DENETIMI

**Proje:** oto-burada (Car-Only Classifieds Marketplace)
**Tarih:** 2026-05-07
**Denetciler:** Kilo (Senior Software Architect & Security Auditor)
**Kapsam:** Auth katmani, RLS politikaları, CSRF korumasi, rate limiting, ownership dogrulama, Supabase entegrasyonu, middleware

---

## 1. KIMLIK DOGRULAMA (Auth) MIMARISI

### 1.1 Supabase Auth Entegrasyon Mimarisi

| Bilesen | Dosya | Durum | Degerlendirme |
|---------|-------|-------|---------------|
| Sunucu Istemcisi | `src/lib/supabase/server.ts` | Kullanimda | `createServerClient` + `SUPABASE_ANON_KEY` + RLS |
| Tarayici Istemcisi | `src/lib/supabase/client.ts` | Kullanimda | `createBrowserClient` ile tarayici disi gercev |
| Middleware | `src/lib/supabase/middleware.ts` | Guncellenmis | `@supabase/ssr` v2 uyumlu |
| Auth Provider | `src/lib/auth/provider.tsx` | Kullanimda | SessionProvider ile React context |
| Auth Actions | `src/lib/auth/actions.ts` | Kullanimda | Sunucu eylemlerinde `getUser()` dogrulamali |

### 1.2 KRITIK BULGU: `getUser()` vs `getSession()` Dogru Kullanimi

```ts
// DOGRU KALIP (Proje genelinde izleniyor):
const { data: { user }, error } = await supabase.auth.getUser();
if (!user) throw new AuthError("Unauthorized");

// YANLIS KALIP (Bulunmadi - onlem alinmis):
const { data: { session } } = await supabase.auth.getSession();
// Session manipulasyonu mumkun guvenli olmayan JWT donusumu
```

Proje genelinde `getUser()` dogru sekilde kullaniliyor. Bu, AGENTS.md'de istenmekte olan guvenlik seviyesine uygun.

---

## 2. YETKILENDIRME (Authorization) KATMANI

### 2.1 Mulkiyet Dogrulama Araci (`src/lib/security/ownership.ts`)

| Fonksiyon | Amac | Gercev |
|-----------|------|--------|
| `isOwner(resource, userId)` | Kaynak sahipligini dogrular | Coklu `ownerField` denemesi (`seller_id`, `user_id`, `id`) |
| `assertOwnership(resource, userId)` | Sahipliği dogrular veya hata firlatir | Guvenlik iddia (assertion) patterni |

### 2.2 Sunucu Eylemlerinde Yetkilendirme Ornegi

```ts
// src/app/api/payments/actions.ts (ornek kalip izlenen):
"use server"
export async function createPaymentIntent(...) {
  const { user } = await requireAuth();          // 1. Kimlik dogrulama
  const isOwner = await verifyListingOwnership(listingId, user.id); // 2. Yetkilendirme
  if (!isOwner) throw new AuthorizationError();
  // ... islem
}
```

Tum sunucu eylemlerinde `requireAuth()` + `verify*Ownership()` ikili dogrulama izleniyor.

---

## 3. CSRF KORUMASI (`src/lib/security/csrf.ts`)

CSRF implementasyonu **production duzeyinde** kalitede.

| Ozellik | Implementasyon | Degerlendirme |
|---------|---------------|---------------|
| Token Uzunlugu | 32 byte (256-bit) | Guclu |
| Hash Algoritmasi | SHA-256 | Guclu |
| Cookie Ozellikleri | HttpOnly, Secure, SameSite=Strict | Maksimum koruma |
| Karsilastirma | constantTimeCompare | Zamanlama saldirisi korumasi |
| Webhook Hariç Tutma | `/api/payments/webhook` | Dogru |
| Iyzico Entegrasyonu | `x-iyzi-signature` kontrolu | Dogru |

---

## 4. RLS POLITIKALARI VE GUVENLIK

Schema snapshot'taki tum 35 tabloda **RLS aktif**. Kritik politikalar:

| Tablo | Kritik Politika | Dogruluk |
|-------|-----------------|----------|
| `listings` | `listings_select_visible` — `approved` veya sahibi veya admin | Dogru |
| `chats` | `chats_insert_buyer_only` — sadece alici, ilan `approved` | Dogru |
| `messages` | `messages_insert_sender` — sadece katilimci | Dogru |
| `payments` | `payments_select_own_or_admin` — sadece kendi odemesi | Dogru |
| `profiles` | `profiles_select_self_or_admin_or_chat` — chat ortagi gorunurluk | Ic kontrol |

---

## 5. SUPABASE ANAHTAR BELirteci YONETIMI

| Belirtec | Konum | Kullanim | Degerlendirme |
|----------|-------|---------|---------------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `src/lib/supabase/server.ts`, `src/lib/supabase/client.ts` | RLS uygulamali tum sorgular | Dogru |
| `SUPABASE_SERVICE_ROLE_KEY` | `src/lib/supabase/admin.ts` | Sadece admin/sunucu islemleri | Dogru (server-only) |
| `server-only` | `src/lib/supabase/admin.ts` ilk satir | Istemci tarafinda ithalata engel | Dogru |

---

## 6. GUVENLIK BULGULARI

### 🔴 P0: Kritik

| ID | Sorun | Konum | Etki |
|----|-------|-------|------|
| SEC-P0-01 | **Rate limiting tamamen eksik** — Tum mutasyon endpointleri korunmasiz | Tum `route.ts`, tum `*-actions.ts` | DDoS, brute-force, flooding riski yuksek |
| SEC-P0-02 | `@supabase/auth-helpers-nextjs` paketi **deprecated** | `src/lib/auth/middleware.ts` (eski) | Guncel olmayan paket guvenlik acigi riski |

> Not: `src/lib/supabase/middleware.ts` guncel `@supabase/ssr` v2 kullaniyor. `src/lib/auth/middleware.ts` ise potansiyel olarak eski pakete baglidir.

### 🟠 P1: Yuksek

| ID | Sorun | Konum |
|----|-------|-------|
| SEC-P1-01 | `rate-limiter.ts` dosyasi **yok** — Leftover referanslar mevcut olabilir | `src/lib/security/rate-limiter.ts` |
| SEC-P1-02 | `input-sanitizer.ts` dosyasi **yok** — XSS korumasi `DOMPurify` icermeyen bos bir module'a bagli olabilir | `src/lib/security/input-sanitizer.ts` |
| SEC-P1-03 | `step-up-auth.ts` planlanmis ama **E-devlet/SMS OTP MVP disi** olarak belirlenmis | Tasarim karari |
| SEC-P1-04 | `profiles` RLS politikasi, chat partnerinin `identity_number`'ni gorebilir | `schema.snapshot.sql:889-895` |

### 🟡 P2: Orta

| ID | Sorun | Konum |
|----|-------|-------|
| SEC-P2-01 | `turnstile.ts` test modu anahtari (`1x0000000000000000000000000000000AA`) production degerlerinde kalmis olabilir | `src/lib/security/turnstile.ts` |
| SEC-P2-02 | `favorites_manage_own` FOR ALL yerine ayrı SELECT/INSERT/DELETE politikaları daha guvenli olur | `schema.snapshot.sql:916` |
| SEC-P2-03 | `listing_images_manage_owner` FOR ALL yerine ayrı politikalar | `schema.snapshot.sql:910-913` |

---

## 7. TOPLAM DEGERLENDIRME

| Kategori | Puan | Yorum |
|----------|------|-------|
| Kimlik Dogrulama | 9/10 | `getUser()` dogru, SSR uyumlu, JWT tabanli |
| Yetkilendirme | 8/10 | `ownership.ts` yeterli, bazi kose vakalari eksik |
| Oturum Yonetimi | 7/10 | `supabase/ssr` guncel, `@supabase/auth-helpers-nextjs` legacy riski |
| Girdi Dogrulama | 8/10 | Zod + trim + empty check, XSS korumasi `input-sanitizer.ts` eksikligi |
| CSRF Korumasi | 9/10 | `constantTimeCompare` ile production seviyesi |
| Rate Limiting | 1/10 | **Tamamen eksik** — kabul edilemez |
| Anahtar Guvenligi | 9/10 | `server-only` ile `service_role` istemcide gorunmez |

**Genel Guvenlik Skoru: 6.7/10**

CSRF korumasi ve anahtar yonetimi guclu. Ancak **rate limiting'in tamamen eksik olmasi** (SEC-P0-01) kritik bir acik. `input-sanitizer.ts` ve `rate-limiter.ts` dosyalarinin yoklugu AGENTS.md'deki `Code Quality Rules` ile celisir. Bu dosyalarin olusturulmasi veya tum referanslarinin temizlenmesi gerek.

---

## 8. ACL DUZELTME LISTESI

> Guncelleme (2026-05-07): `rate-limiter` alias/export duzenlemeleri, route/action rate-limit sarmalayicilari ve `@supabase/ssr` tabanli guncel Supabase istemcileri kod tabaninda aktif. Bu fazdaki ana uygulama-kodu riskleri buyuk olcude azaltildi.

### 🔴 P0 (Bu Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 1 | SEC-P0-01 | `src/lib/security/rate-limiter.ts` olustur — Vercel Edge Runtime uyumlu Redis/Upstash tabanli rate limiter implementasyonu. Tum mutation server actions ve API route'larinda uygulanmali. |
| 2 | SEC-P0-02 | `src/lib/auth/middleware.ts` icin `@supabase/auth-helpers-nextjs` ile `@supabase/ssr` migrasyonu kontrol edilmeli. |

### 🟠 P1 (Sonraki Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 3 | SEC-P1-01 | `input-sanitizer.ts` olustur -- `DOMPurify` + metin normalizasyonu |
| 4 | SEC-P1-02 | `profiles` RLS'inde `identity_number` harici tutulmali |
| 5 | SEC-P1-03 | XSS korumasi tum `dangerouslySetInnerHTML` kullanimlarinda kontrol edilmeli |

### 🟡 P2 (Refactor)

| # | ID | Cozum |
|---|-----|-------|
| 6 | SEC-P2-01 | `turnstile.ts` production anahtarlarini dogrula |
| 7 | SEC-P2-02 | `favorites`, `listing_images` RLS FOR ALL yerine ayrı politikalar |
| 8 | SEC-P2-03 | `server-only` bagimliligi -- tum `service_role` iceren dosyalar `import 'server-only'` ile baslamali |

---

**Rapor Hazirlayan:** Kilo (Senior Software Architect & Security Auditor)
**Son Guncelleme:** 2026-05-07
