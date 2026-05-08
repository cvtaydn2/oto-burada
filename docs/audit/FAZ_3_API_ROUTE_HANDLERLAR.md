# FAZ 3: API & ROUTE HANDLERLAR DENETIMI

**Proje:** oto-burada (Car-Only Classifieds Marketplace)
**Tarih:** 2026-05-07
**Denetciler:** Kilo (Senior Software Architect & Security Auditor)
**Kapsam:** API endpoint'leri, Route Handler'lar, Server Actions, input validation, error handling

---

## 1. API MUTASYON GUVENLIGI INCELEMESI

`src/__tests__/api-mutation-security.test.ts` kritik guvenlik testini icermektedir. Test, tum POST/PUT/DELETE/PATCH route handler'larinda asagidakileri dogrulamaktadir:

1. Auth kontrolu var mi?
2. CSRF korumasi var mi?
3. Input validation (Zod) var mi?
4. Rate limiting var mi?
5. Ownership dogrulama var mi?

Test kapsami yuksek ama **rate limiting testi cargasiz gecebilmektedir** -- gercek implementasyon eksik.

---

## 2. ROUTE HANDLER YAPISI

### 2.1 API Dizin Yapisi

```
src/app/api/
├── contact/                     // Iletisim formlari
├── exchange/
├── expertiz/
├── external/                    // Dis API kaynaklari
├── payments/
│   ├── webhook/
│   └── route.ts
├── listings/
├── favorites/
├── chats/
└── ...
```

### 2.2 Endpoint Kategorileri ve Guvenlik Sarmalama

| Endpoint | Yontem | Auth | Zod | Rate Limit | Ownership | Durum |
|----------|--------|------|-----|------------|-----------|-------|
| `GET /api/listings` | Public | N/A | Query | N/A | N/A | Guvenli |
| `POST /api/listings` | Auth | Session | Body | Yok | Seller | Acil |
| `PUT /api/listings/[id]` | Auth | Session | Body | Yok | Owner | Acil |
| `DELETE /api/listings/[id]` | Auth | Session | Param | Yok | Owner | Acil |
| `GET /api/favorites` | Auth | Session | Yok | Yok | Self | Kabul |
| `POST /api/favorites` | Auth | Session | Body | Yok | Self | Kabul |
| `POST /api/payments` | Auth | Session | Body | Yok | Self | Kabul |
| `GET /api/payments/webhook` | HMAC | Signature | N/A | Yok | N/A | Kabul |

---

## 3. API BULGULARI

### P0: Kritik

| ID | Sorun | Konum |
|----|-------|-------|
| API-P0-01 | **Rate limiting tamamen eksik** — Tum mutasyon endpoint'lerinde | Tum `route.ts` dosyalari |
| API-P0-02 | `api-mutation-security.test.ts`'de `rateLimiter` mock'i var ama gercek implementasyon yok | Test dosyasi gecer, prod fail olabilir |

### P1: Yuksek

| ID | Sorun | Konum |
|----|-------|-------|
| API-P1-01 | `GET /api/external` CORS header'lari kati degil | Potansiyel veri sizintisi |
| API-P1-02 | `POST /api/payments` Iyzico callback URL'si dogrulanmiyor | Man-in-the-middle riski |

### P2: Orta

| ID | Sorun | Konum |
|----|-------|-------|
| API-P2-01 | `api/listings/route.ts` GET query parametreleri `limit` 1000'e kadar izin veriyor | DoS riski |

---

## 4. SERVER ACTIONS KALIP ANALIZI

```ts
// DOGRU KALIP:
"use server"
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ ... });

export async function createSomething(formData: FormData) {
  // 1. Auth
  const { user } = await requireAuth();
  // 2. Validation
  const data = schema.parse(Object.fromEntries(formData));
  // 3. Ownership
  // ...
  // 4. Transaction
  const { error } = await supabase.rpc("atomic_operation", { ... });
  return { success: true, data };
}
```

Sunucu eylemlerinde `Zod + getUser()` ikilisi tutarli kullaniliyor.

---

## 5. DUZELTME LISTESI

> Guncelleme (2026-05-07): mutation route guvenlik sarmalari ve callback URL sertlestirmesi uygulandi. Audit maddeleri tarihsel kayit olarak korunmakla birlikte, rate limit / wrapper tabani artik kodda mevcuttur.

### P0 (Bu Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 1 | API-P0-01 | Tum mutation endpoint'lere rate limiter uygula (Upstash Redis tabanli) |
| 2 | API-P0-02 | `rateLimiter` mock'u gercek implementasyon ile degistir |

### P1 (Sonraki Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 3 | API-P1-01 | `GET /api/external` CORS policy'yi siki yapilandir |
| 4 | API-P1-02 | Iyzico callback URL dogrulamasi ekle (HMAC) |

### P2 (Refactor)

| # | ID | Cozum |
|---|-----|-------|
| 5 | API-P2-01 | Query `limit` parametresi max 100 olarak sabitle |

---
**Rapor Hazirlayan:** Kilo (Senior Software Architect & Security Auditor)
**Son Guncelleme:** 2026-05-07
