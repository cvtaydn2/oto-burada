# OTO-BURADA 8-FAZLIK KAPSAMLI DENETIM

**Proje:** oto-burada (Car-Only Classifieds Marketplace)
**Tarih:** 2026-05-07
**Denetciler:** Kilo (Senior Software Architect & Security Auditor)

---

## RAPOR HAKKINDA

> Historical audit note: Bu klasördeki içerikler tarihsel denetim çıktılarıdır. Buradaki P0, P1 ve P2 sayıları 2026-05-07 tarihli inceleme anının bulgu yoğunluğunu gösterir; bugünün açık backlog veya canlı incident listesi olarak okunmamalıdır. Güncel ürün, güvenlik, servis mimarisi ve operasyon kararları için sırasıyla [`docs/PRODUCT_STRATEGY.md`](../PRODUCT_STRATEGY.md), [`docs/SECURITY.md`](../SECURITY.md), [`docs/SERVICE_ARCHITECTURE.md`](../SERVICE_ARCHITECTURE.md), [`RUNBOOK.md`](../../RUNBOOK.md) ve [`PROGRESS.md`](../../PROGRESS.md) referans alınmalıdır.

Bu denetim projenin tum katmanlarini bottom-up yontemle Veritabani → Guvenlik → API → Servisler → Alan Mantigi → UI/UX → Yonetim → Performans şeklinde kapsamli ve butuncul sekilde inceler.

Her faz kendi icerisinde ayri bir uzmanlik alanidir. Ayni bug birden fazla fazda gorunebilir cunku etkisi capraz katmanli olabilir.

---

## RAPORLAR LISTESI

> Faz tablosu tarihsel kapsam haritasıdır. Bir faz satırında dosya bulunmaması, bugünün eksik operasyon adımı değil; yalnızca o döneme ait ayrıntılı markdown çıktısının repoda korunmamış olduğunu gösterir.

| Faz | Baslik | Kritik (P0) | Yuksek (P1) | Orta (P2) | Dosya |
|-----|--------|-------------|-------------|-----------|-------|
| 1 | Veritabani & Sema | 5 | 5 | 6 | Ayrıntılı Faz 1 markdown raporu bu klasörde korunmamıştır. Bu yüzden tabloda yalnız tarihsel özet referansı tutulur; güncel veritabanı gerçekliği için [`database/schema.snapshot.sql`](../../database/schema.snapshot.sql), migration dosyaları ve [`PROGRESS.md`](../../PROGRESS.md) esas alınmalıdır. |
| 2 | Guvenlik & Yetkilendirme | 2 | 3 | 2 | [FAZ_2_GUVENLIK_YETKILENDIRME.md](FAZ_2_GUVENLIK_YETKILENDIRME.md) |
| 3 | API & Route Handlerlar | 2 | 2 | 1 | [FAZ_3_API_ROUTE_HANDLERLAR.md](FAZ_3_API_ROUTE_HANDLERLAR.md) |
| 4 | Servisler & Uygulamalar Mantigi | 2 | 2 | 0 | [FAZ_4_SERVISLER_UYGULAMALAR_MANTIGI.md](FAZ_4_SERVISLER_UYGULAMALAR_MANTIGI.md) |
| 5 | Alan Mantigi & Durum Makineleri | 0 | 2 | 0 | [FAZ_5_DOMAIN_LOGIC_DURUM_MAKINELERI.md](FAZ_5_DOMAIN_LOGIC_DURUM_MAKINELERI.md) |
| 6 | UI/UX & Komponentler | 0 | 1 | 2 | [FAZ_6_UI_UX_KOMPONENTLER.md](FAZ_6_UI_UX_KOMPONENTLER.md) |
| 7 | Yonetim Paneli & Moderasyon | 0 | 2 | 1 | [FAZ_7_ADMIN_PANEL_MODERASYON.md](FAZ_7_ADMIN_PANEL_MODERASYON.md) |
| 8 | Performans & Olceklenebilirlik | 1 | 1 | 0 | [FAZ_8_PERFORMANS_OLCEKLENEBILIRLIK.md](FAZ_8_PERFORMANS_OLCEKLENEBILIRLIK.md) |
| Ek | Doğrulanmış mimari rapor | - | - | - | [ARCHITECTURE_REVIEW_REPORT.md](ARCHITECTURE_REVIEW_REPORT.md) |
| Ek | Tamamlanmış code review planı | - | - | - | [CODE_REVIEW_PLAN.md](CODE_REVIEW_PLAN.md) |
| **Genel Toplam** | **12** | **18** | **13** | **43 Bulgu + ek tarihsel belgeler** |

---

## EN KRITIK BULGULAR (P0 Ozeti)

> Durum Notu: Faz 2-7 kapsamındaki birçok uygulama-kodu düzeltmesi sonradan uygulanmıştır. Bu README tablosu tarihsel audit özeti olarak korunur; bugünün açık problemleri bu listeden türetilmemeli, canlı durum için faz dosyalarındaki güncelleme notları ve [`PROGRESS.md`](../../PROGRESS.md) referans alınmalıdır.

| # | Faz | ID | Sorun |
|---|-----|-----|-------|
| 1 | 1 | BUG-DB-01 | `chats.listing_id ON DELETE CASCADE` sohbet+mesaj kayiplari |
| 2 | 1 | BUG-DB-03 | `credit_transactions` ON DELETE CASCADE mali kayit silinir |
| 3 | 1 | BUG-DB-04 | `payments.amount decimal(12,2)` integer kuruş ile uyumsuz |
| 4 | 1 | BUG-DB-05 | **Schema snapshot'ta ~35+ RPC fonksiyon eksik** |
| 5 | 1 | BUG-DB-07 | `listings.featured` + `is_featured` duplicate kolonlar |
| 6 | 2 | SEC-P0-01 | **Rate limiting tamamen eksik** |
| 7 | 2 | SEC-P0-02 | `@supabase/auth-helpers-nextjs` **deprecated** |
| 8 | 3 | API-P0-01 | API endpoint'lerde rate limiting yok |
| 9 | 3 | API-P0-02 | Rate limiter test mock'u gercek yok |
| 10 | 4 | SVC-P0-01 | Payment amount tip tutarsizligi |
| 11 | 4 | SVC-P0-02 | Doping senkronizasyon riski |
| 12 | 8 | PERF-P0-02 | **Snapshottan yeni DB = bozuk uygulama** |

---

## DUZELTME ONCELIĞI

> Historical prioritization note: Aşağıdaki sıra audit gününde önerilen müdahale önceliğidir. Bugünün aktif iş sırası veya açık sprint planı olarak değil, tarihsel triage kaydı olarak okunmalıdır. Güncel backlog için [`TASKS.md`](../../TASKS.md) ve gerçekleşen düzeltmeler için [`PROGRESS.md`](../../PROGRESS.md) esas alınmalıdır.

> Guncel Durum: Faz 2/3 rate-limit ve callback sertlestirmeleri, Faz 4/5 payment-domain duzeltmeleri ve Faz 6/7 admin-drawer refactor'lari uygulanmistir. En buyuk acik kalan madde Faz 8 snapshot senkronizasyonunun harici ortam bagimliliklari nedeniyle tamamlanamamasidir.

### Bu Sprint Acil
1. Faz 1: BUG-DB-05 — Schema snapshot'a tum RPC fonksiyonlarini ekle
2. Faz 2: SEC-P0-01 — Rate limiting implementasyonu
3. Faz 2: SEC-P0-02 — `@supabase/auth-helpers-nextjs` → `@supabase/ssr` migrasyonu
4. Faz 1: BUG-DB-01 — `chats` ON DELETE CASCADE → SET NULL

### Sonraki Sprint
5. Faz 1: BUG-DB-03 — `credit_transactions` ON DELETE CASCADE → SET NULL
6. Faz 4: SVC-P0-01 — Payment amount tip duzeltme
7. Faz 4: SVC-P0-02 — Doping senkronizasyon duzeltme
8. Faz 1: BUG-DB-07 — `is_featured` kaldirma

### Refactor
9. Faz 6: UI-P2-03 — ErrorBoundary
10. Faz 7: ADMIN-P1-04 — Merkezi admin eylem loglama
11. Faz 5: DOM-P1-02 — Trust score dokumantasyonu

---

## RAPOR HAZIRLAYAN

**Kilo** (Senior Software Architect & Security Auditor)

**Son Guncelleme:** 2026-05-07
