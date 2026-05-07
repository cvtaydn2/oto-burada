# FAZ 8: PERFORMANS & OLCEKLENEBILIRLIK DENETIMI

**Proje:** oto-burada (Car-Only Classifieds Marketplace)
**Tarih:** 2026-05-07
**Denetciler:** Kilo (Senior Software Architect & Security Auditor)
**Kapsam:** Veritabani sorgu performansı, index stratejisi, caching, CDN, ölçeklenebilirlik

---

## 1. PERFORMANS INDEKSLERI

### 1.1 Listings Tablosu Index'leri

| Index Adı | Kolonlar | Tip | Amac |
|-----------|----------|-----|------|
| `idx_listings_marketplace_default` | `status, created_at DESC` | Partial | Ana sayfa listeleme (`approved`) |
| `idx_listings_brand_city_status` | `brand, city, status, created_at DESC` | Partial | Filtreli sorgular (`approved`) |
| `idx_listings_price_range_status` | `status, price, created_at DESC` | Partial | Fiyat araligi filtresi |
| `idx_listings_year_range_status` | `status, year DESC, created_at DESC` | Partial | Yil filtresi |
| `idx_listings_fuel_transmission_status` | `fuel_type, transmission, status, created_at DESC` | Partial | Teknik ozellikler filtresi |
| `idx_listings_featured_priority` | `status, featured, featured_until DESC, created_at DESC` | Partial | One cikan ilanlar |
| `idx_listings_gallery_priority` | `status, gallery_priority DESC, created_at DESC` | Partial | Galeri onceligi |
| `idx_listings_urgent_active` | `status, urgent_until DESC, created_at DESC` | Partial | Acil ilanlar |
| `idx_listings_slug_unique` | `slug` | Unique | Slug dogrulama |
| `listings_search_vector_idx` | `search_vector` | GIN | Full-text arama |

### 1.2 Diger Onemli Index'ler

| Index Adı | Tablo | Amac |
|-----------|-------|------|
| `idx_doping_applications_expiry` | `doping_applications` | Sure'si dolan doping'ler |
| `idx_outbox_pending_next_attempt` | `transaction_outbox` | Pending outbox islemleri |
| `idx_credit_transactions_user_type` | `credit_transactions` | Kredi haraketleri sorgulari |
| `listing_views_user_daily_dedup_idx` | `listing_views` | Tekrar sayisi ogrenelim |
| `listing_views_anonymous_daily_dedup_idx` | `listing_views` | Anonim gorunum sayisi |

---

## 2. PERFORMANS BULGULARI

### P0: Kritik

| ID | Sorun | Konum |
|----|-------|-------|
| PERF-P0-01 | `listings.search_vector` tsvector `GENERATED ALWAYS` — guncelleme esnasinda maliyetli | Her update'da yeniden hesaplanir |
| PERF-P0-02 | Schema snapshot'ta **~35+ RPC fonksiyon eksik** — `adjust_user_credits_atomic`, `expire_dopings_atomic`, `confirm_payment_success`, `activate_doping`, `check_api_rate_limit` | DB'yi yeniden kurunca uygulama calismaz |

> Not: PERF-P0-02 esasen Faz 1 (BUG-DB-05) bulgusu. Baslangicta belirtilen sekilde snapshot'tan yeni DB kurulursa uygulama calismaz.

### P1: Yuksek

| ID | Sorun | Konum |
|----|-------|-------|
| PERF-P1-01 | `market_stats` tablosu `avg_price decimal(12,2)` ile aggregation maliyetli | Sayisal alan normalizasyonu |
| PERF-P1-02 | `listings` tablosundaki doping `_until` kolonlari `doping_applications` ile senkronizasyon maliyeti | Denormalizasyon maliyeti |

### P2: Orta

| ID | Sorun | Konum |
|----|-------|-------|
| PERF-P2-01 | `listing_images` tablosu `storage_path` ile boyut kontrolu | Resim optimizasyon |

---

## 3. CDN & ONBELLEKLEME

| Ozellik | Durum |
|---------|-------|
| next/image ile otomatik optimizasyon | Tamamlandi |
| Resim CDN | Vercel Edge Network |
| API onbellekleme | `revalidate` ile ISR (istegine bagli) |
| Redis/Upstash | Onayi ve rate limiter icin |

---

## 4. OLCEKLENEBILIRLIK TESTI

| Senaryo | Beklenen Performans |
|---------|---------------------|
| 1000 eşzamanli kullanici | Kabul edilebilir (500+ RPM) |
| 10000 listing | Kabul edilebilir |
| 100000 listing | Partial index'ler kritik olacak |
| 1M listing | GIN index ve partitioning gerekli |

---

## 5. DUZELTME LISTESI

> Guncelleme (2026-05-07): Faz 8 icin canli schema snapshot senkronizasyonu CLI ile denenmis, ancak remote migration history drift ve Docker image fetch/EOF sorunlari nedeniyle tamamlanamamistir. Bu nedenle bu fazdaki snapshot butunlugu bulgusu halen operasyonel olarak aciktir.

### P0 (Bu Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 1 | PERF-P0-02 | Schema Snapshot'a tum RPC fonksiyonlarini ekle -- en azindan `adjust_user_credits_atomic`, `expire_dopings_atomic`, `confirm_payment_success`, `activate_doping`, `check_api_rate_limit` |

### P1 (Sonraki Sprint)

| # | ID | Cozum |
|---|-----|-------|
| 2 | PERF-P1-01 | `market_stats` tablosu `avg_price decimal(12,2)` → `integer` (kuruş olarak) |
| 3 | PERF-P1-02 | `listings` doping kolonlarini `doping_applications`'dan turev yap |

### P2 (Refactor)

| # | ID | Cozum |
|---|-----|-------|
| 4 | PERF-P2-01 | Listing listeleme sayfalari icin `revalidate` veya `cache`'yi kullan |

---

## 6. GENEL DEGERLENDIRME

| Kategori | Puan | Yorum |
|----------|------|-------|
| Index Stratejisi | 9/10 | Partial index'ler harika, composite index'ler dogru |
| Veri Tipi Tutarliligi | 5/10 | `decimal` vs `integer`/`bigint` tutarsizliklari |
| Snapshot Butunlugu | 2/10 | **~35+ RPC fonksiyon eksik** -- yeni kurulum bozuk |
| Full-Text Search | 9/10 | `turkish_unaccent` ile dogru |
| CDN & Cache | 7/10 | next/image dogru, API cache eksik |

**Genel Performans Puani: 6.4/10** — Index stratejisi guclu aman snapshot eksikligi kabul edilemez.

---
**Rapor Hazirlayan:** Kilo (Senior Software Architect & Security Auditor)
**Son Guncelleme:** 2026-05-07
