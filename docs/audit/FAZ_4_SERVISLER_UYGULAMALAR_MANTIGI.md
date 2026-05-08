# FAZ 4: SERVISLER & UYGULAMALAR MANTIĞI DENETIMI

**Proje:** oto-burada (Car-Only Classifieds Marketplace)
**Tarih:** 2026-05-07
**Denetciler:** Kilo (Senior Software Architect & Security Auditor)
**Kapsam:** Servis katmani, business logic, data access, external API clients, sunucu eylemleri

---

## 1. SERViS MIMARISI GENEL GORUNUMU

```
src/services/
├── listings/               → listing-actions.ts, listing-records.ts, listing-logic.ts
├── favorites/              → favorite-records.ts
├── profile/                → profile-records.ts
├── payments/               → payment-logic.ts, doping-logic.ts
├── chats/                  → chat-records.ts
├── reservations/           → Rezervasyon sistemi
├── exchange/               → Doviz/takas servisi
├── expertiz/               → Ekspertiz randevu sistemi
├── reports/                → Sikayet/raporlama
├── gallery/                → Galeri/fleet yonetimi
├── notifications/          → Bildirim servisi
├── market/                 → Piyasa verileri
├── market-stats/           → Istatistik hesaplama
├── reference/              → Referans veri servisi
├── saved-searches/         → Kayitli arama
├── ai/                     → OpenAI entegrasyonu
├── support/                → Destek bileti
├── system/                 → Sistem ayarlari
├── admin/                  → Admin yetkileri
└── email/                  → E-posta servisi
```

---

## 2. KALIP UYUMU

| Kalip | Durum | Yorum |
|-------|-------|-------|
| `*-actions.ts` (Server Actions) | Yaygin | `use server` ile tum mutasyonlar |
| `*-records.ts` (Data Access) | Yaygin | RLS uyumlu CRUD |
| `*-logic.ts` (Business Logic) | Yeni | Saf fonksiyonlar |
| `*-client.ts` (External API) | Eksik | Yalnizca Iyzico/OpenAI'de |
| Sinif tabanli servisler | Eskimis | `PaymentService`, `ListingService` silinmeli |

---

## 3. SERVIS BULGULARI

### P0: Kritik

| ID | Sorun | Konum |
|----|-------|-------|
| SVC-P0-01 | `services/payments/payment-logic.ts` `amount` integer kuruş ama DB `decimal(12,2)` — donusum kaybi riski | `payment-logic.ts:116` |
| SVC-P0-02 | `services/payments/doping-logic.ts` doping surekliligi `doping_applications` ve `listings` arasinda senkronizasyon riski | Cift kaynak |

### P1: Yuksek

| ID | Sorun | Konum |
|----|-------|-------|
| SVC-P1-01 | `services/listings/listing-submission-persistence.ts` slug retry 0 yoklama | Race condition teorik |
| SVC-P1-02 | `services/favorites/favorite-records.ts` N+1 sorgu kalibi potansiyeli | Cogul favori listelemede |

---

## 4. KALITECI SISTEM ANALIZI

### 4.1 Olumsuz Servisler

| Eski Servis | Durum | Yedek |
|-------------|-------|-------|
| `PaymentService` (sinif tabanli) | Eskimis | `payment-logic.ts` (fonksiyonel) |
| `DopingService` (sinif tabanli) | Eskimis | `doping-logic.ts` (fonksiyonel) |
| `ListingService` (sinif tabanli) | Eskimis | `listing-actions.ts` + `listing-records.ts` |
| `ChatService` (sinif tabanli) | Eskimis | `chat-records.ts` |
| `SupportService` (sinif tabanli) | Eskimis | `support/*-actions.ts` |
| `profile/client-service.ts` | Eskimis | Dogrudan sunucu eylemleri |
| `reports/client-service.ts` | Eskimis | Dogrudan sunucu eylemleri |
| `auth/client-service.ts` | Eskimis | Dogrudan sunucu eylemleri |
| `notifications/client-service.ts` | Eskimis | Dogrudan sunucu eylemleri |

### 4.2 Migrasyon Durumu

| Adim | Durum |
|------|-------|
| 1. Eski servisleri tanimla | Tamamlandi |
| 2. Is mantigini `*-logic.ts`'e tas | Tamamlandi |
| 3. Sunucu eylemlerini `*-actions.ts`'te olustur | Devam ediyor |
| 4. Guncellemeleri degistir | Devam ediyor |
| 5. Eski dosyalari sil | Kismen — bazi dosyalar hala mevcut |

---

## 5. DUZELTME LISTESI

> Guncelleme (2026-05-07): [`payment-logic.ts`](../../src/services/payments/payment-logic.ts) amount yazimi decimal TRY semantigine hizalandi. [`doping-logic.ts`](../../src/services/payments/doping-logic.ts) icinde `doping_applications`/active-RPC canonical kaynak olarak netlestirildi.

### P0 (Bu Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 1 | SVC-P0-01 | `payment-logic.ts`'te `amount` tipi `integer` yerine DB'ye uyumlu `decimal(12,2)` yapilmasi -- kuruş donusumu duzelt |
| 2 | SVC-P0-02 | `doping-logic.ts`'te `doping_applications` tek kaynak olarak belirle, `listings` kolonlarini turev olarak guncelle |

### P1 (Sonraki Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 3 | SVC-P1-01 | Slug retry mekanizmasinda `pg_advisory_lock` ile race condition onleme |
| 4 | SVC-P1-02 | `favorite-records.ts`'te `JOIN` ile N+1 sorununu coz |

---
**Rapor Hazirlayan:** Kilo (Senior Software Architect & Security Auditor)
**Son Guncelleme:** 2026-05-07
