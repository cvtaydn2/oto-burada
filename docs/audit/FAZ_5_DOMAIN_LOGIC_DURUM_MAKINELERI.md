# FAZ 5: ALAN MANTIĞI & DURUM MAKİNELERİ DENETIMI

**Proje:** oto-burada (Car-Only Classifieds Marketplace)
**Tarih:** 2026-05-07
**Denetciler:** Kilo (Senior Software Architect & Security Auditor)
**Kapsam:** Domain mantigi, durum makineleri, saf fonksiyonlar, is mantigi,

---

## 1. DURUM MAKİNELERI

### 1.1 Listing Status Makinesi

| Durum | Gecis Kosulu |
|-------|-------------|
| `draft` → `pending` | Kullanici gonder tusuna basar |
| `pending` → `approved` | Moderator onaylar |
| `pending` → `rejected` | Moderator reddeder |
| `pending` → `flagged` | Otomatik sistem isaretleme |
| `pending` → `pending_ai_review` | AI incelemesine alir |
| `approved` → `archived` | 30 gun sonra (cron) veya kullanici arsivler |
| `approved` → `flagged` | Sikayet/otomatik tespit |
| `flagged` → `approved` | Moderator onaylar |
| `flagged` → `rejected` | Moderator reddeder |

### 1.2 Payment Status Makinesi

| Durum | Gecis Kosulu |
|-------|-------------|
| `pending` → `processing` | Işlem baslatildi |
| `processing` → `success` | Odeme basarili |
| `processing` → `failed` | Odeme basarisiz |
| `failed` → `pending` | Yeniden deneme |

### 1.3 Doping Status Makinesi

| Durum | Gecis Kosulu |
|-------|-------------|
| `pending` → `active` | Odeme basarili, uygulandi |
| `active` → `expired` | Sure doldu (cron) |
| `active` → `cancelled` | Kullanici iptal etti |

---

## 2. ALAN MANTIĞI BULGULARI

### P1: Yuksek

| ID | Sorun | Konum |
|----|-------|-------|
| DOM-P1-01 | `listing-factory.ts` fiyat dogrulama `price > 0` ama kuruş donusumu `Math.round` kullaniliyor — yuvarlama hatasi olasiligi | `listing-factory.ts:45` |
| DOM-P1-02 | `trust-score-calculator.ts` puanlama algoritmasi dokumante edilmemis | Siyah kutu |

---

## 3. SAF FONKSIYON ANALIZI

```
src/domain/logic/
├── listing-factory.ts             → Listing yaratma mantigi
├── listing-status-machine.ts        → Durum gecisleri
├── payment-status-machine.ts        -> Odeme durumlari
├── doping-status-machine.ts        → Doping durumlari
├── slug-generator.ts               → URL-slug olusturma
├── trust-score-calculator.ts       → Givenilirlik hesaplama
└── profile-logic.ts                → Profil mantigi
```

### 3.1 Slug Generator

```ts
// src/domain/logic/slug-generator.ts
// Turkish transliteration dahil
// "Istanbul Otomobil 2023" → "istanbul-otomobil-2023"
// Buyuk harf I → kucuk i donusumu dogru
```

### 3.2 Trust Score Calculator

```ts
// src/domain/logic/trust-score-calculator.ts
// Algoritma:
// - Telefon dogrulamasi: +20 puan
// - Kimlik dogrulamasi: +30 puan
// - E-posta dogrulamasi: +10 puan
// - Basarili islem sayisi: max +20 puan
// - Yorumlar: max +20 puan
// Toplam: 0-100 arasi
```

---

## 4. DUZELTME LISTESI

> Guncelleme (2026-05-07): trust score algoritmasi hem [`trust-score-calculator.ts`](../../src/domain/logic/trust-score-calculator.ts) icinde hem de [`README.md`](../../README.md) uzerinde dokumante edildi. Listing fiyatinin integer-like TL olarak kalmasi icin [`listing-factory.ts`](../../src/domain/logic/listing-factory.ts) icinde round/coercion karsiti dogrulama eklendi.

### P1 (Sonraki Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 1 | DOM-P1-01 | `Math.round` yerine `Math.floor` veya kesin kuruş deger kullanma |
| 2 | DOM-P1-02 | Trust score algoritmasi README'de dokumante edilmeli |

---
**Rapor Hazirlayan:** Kilo (Senior Software Architect & Security Auditor)
**Son Guncelleme:** 2026-05-07
