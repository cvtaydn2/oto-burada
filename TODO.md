# OtoBurada - Gelecek Geliştirme Yol Haritası (TODO.md)

Bu dosya, platformun MVP sonrasındaki tüm geliştirme safhaları için **eksiksiz** bir izleme (tracking) belgesidir.
Her madde öncelik sırasına göre dalga (wave) bazlı gruplandırılmıştır.

> **Son güncelleme:** 2026-04-10
> **Durum kodu:** ✅ Tamamlandı | 🔲 Bekliyor | 🚧 Devam ediyor

---

## ✅ Tamamlanan Görevler

### Dalga 1: Transaction Readiness (Temel MVP)
- [x] Kullanıcı kayıt & giriş (Supabase Auth)
- [x] Profil yönetimi (kullanıcı paneli)
- [x] İlan oluşturma formu (fotoğraf yükleme, validasyon, Zod)
- [x] İlan listeleme & filtreleme (marka, model, şehir, fiyat, yıl, km)
- [x] Full-text search (search_vector + pg trgm)
- [x] İlan detay sayfası (galeri, açıklama, konum, satıcı bilgisi)
- [x] WhatsApp CTA entegrasyonu (SafeWhatsAppButton + dolandırıcılık uyarısı)
- [x] Favori sistemi (kalp butonu, favori listesi)
- [x] Kayıtlı arama (saved searches)
- [x] Bildirim sistemi (notifications tablosu + UI)
- [x] Raporlama sistemi (fake ilan, yanlış bilgi, spam)
- [x] Admin moderasyon paneli (onay/red, istatistikler, rapor yönetimi)
- [x] Admin audit trail (aksiyon geçmişi, filtreleme, arama)
- [x] RLS (Row Level Security) politikaları
- [x] Rate limiting (IP + kullanıcı bazlı)
- [x] View counter (görüntülenme sayacı)
- [x] Fiyat analizi kartı (PriceAnalysisCard)
- [x] Satıcı profil sayfası (/seller/[id])
- [x] Responsive / mobile-first tasarım

### Dalga 2: Trust (Güvenlik) & Operasyon
- [x] Tramer kaydı ve kaporta hasar durumu (damage_status_json) — DB + UI
- [x] VehicleDamageReport componenti (boya/değişen/orijinal rozet sistemi)
- [x] Dolandırıcılık heuristik motoru (fraudScore + fraudReason)
- [x] Otomatik yüksek-risk ilan reddi (≥60 puan → rejected)
- [x] Admin panelinde fraud skoru uyarı kutusu
- [x] İlan yaşam döngüsü — pg_cron ile 30 gün sonra otomatik arşivleme
- [x] Ekspertiz PDF/Fotoğraf yükleme altyapısı (API + Storage + Form UI)
- [x] ExpertInspectionCard içinde "Doğrulanmış Ekspertiz Belgesi" rozeti + görüntüle
- [x] Moderasyon ret/onay şablonları (hazır not chip'leri)
- [x] İlan Bump (Yenileme) sistemi — API + cooldown (7 gün) + Dashboard UI

---

## 🔲 Bekleyen Görevler

### Dalga 2.5: Operasyon İyileştirmeleri
Moderasyon ve satıcı deneyimini olgunlaştırmak.

- [x] **İlan Bump (Yenileme) Sistemi:**
  - [x] Satıcının ilanını süresi dolmadan "güncelleyip" listenin üstüne taşıyabilmesi
  - [x] Rate limiting: İlan başına 7 günde 1 bump hakkı
  - [x] Dashboard'da "İlanı Yenile" butonu ve kalan süre göstergesi
- [ ] **Admin İlan Düzenleme:**
  - [ ] Admin'in ilan başlığı, fiyat veya açıklamasını direkt düzenleyebilmesi (küçük düzeltmeler)
  - [ ] Düzenleme yapıldığında audit log'a "edit" aksiyonu kaydedilmesi
- [ ] **Toplu Moderasyon:**
  - [ ] Birden fazla ilanı seçip tek tuşla onaylama/reddetme
  - [ ] "Tümünü onayla" ve "Seçilenleri reddet" butonları
- [ ] **E-posta Bildirimleri:**
  - [ ] İlan onaylandığında satıcıya e-posta
  - [ ] İlan reddedildiğinde satıcıya sebepli e-posta
  - [ ] Favori ilandaki fiyat değişikliğinde alıcıya e-posta
- [ ] **İlan Süresi Dolmadan Uyarı:**
  - [ ] 25. günde satıcıya "İlanın 5 gün sonra arşivlenecek" bildirimi
  - [ ] Dashboard'da kalan gün göstergesi

---

### Dalga 3: Discovery (Keşif) & Dönüşüm Optimizasyonu
Kullanıcı alımını (Acquisition) ve UX kalitesini en üst noktaya taşımak.

- [x] **Derin SEO & Landing Page Mimarisi:**
  - [x] `sitemap.xml` dinamik üretimi (tüm aktif ilanlar + model/şehir sayfaları)
  - [x] `robots.txt` dosyası
  - [x] WebSite JSON-LD Structured Data (SearchAction)
  - [ ] `/listings/renault-clio` veya `/listings/ankara-ikinci-el` gibi model/şehir bazlı landing page'ler
  - [x] Her sayfaya `<title>`, `<meta description>`, Open Graph etiketleri
  - [ ] Breadcrumb navigasyonu ve JSON-LD Structured Data (Vehicle, Product) detaylandırma
  - [ ] Canonical URL'ler
  - [x] **Karşılaştırma (Compare) Ekranı Aktivasyonu:**
    - [x] `/compare` sayfasının gerçek veriye bağlanması (şu an statik/placeholder)
    - [x] Listing kartlarına ve detay sayfasına "Karşılaştır" CTA butonu
    - [x] Karşılaştırma tablosunda Tramer, Yıl, KM, Fiyat, Ekspertiz farkları
    - [x] URL'de karşılaştırılan ilan ID'lerinin query param olarak tutulması
  - [ ] **Listing Create Funnel Optimizasyonu:**
  - [ ] Plaka ile otomatik araç bilgisi doldurma (Marka/Model/Yıl) — 3rd party API
  - [ ] Client-side fotoğraf sıkıştırma (browser-image-compression veya compressorjs)
  - [ ] Multi-step (adım adım) form wizard UX'i (opsiyonel)
  - [ ] İlan oluşturma süresinin 2 dakika altında kalmasını sağlayan UX iyileştirmeleri
- [ ] **Gelişmiş Filtreleme:**
  - [ ] Renk filtresi
  - [ ] Kasa tipi filtresi (sedan, hatchback, SUV, vb.)
  - [ ] Motor hacmi filtresi
  - [ ] "Ekspertizli" / "Tramer kaydı yok" gibi güven filtreleri
  - [ ] Fiyat aralığı slider UI
- [ ] **Sıralama İyileştirmeleri:**
  - [ ] "En çok görüntülenen" sıralama seçeneği
  - [ ] "Yakınımdaki ilanlar" (konum bazlı, opsiyonel geolocation)

---

### Dalga 4: Güvenilirlik & Quality Assurance
Derin test senaryolarının inşası ve kod kalitesinin kanıtlanması.

- [ ] **Test Altyapısı Kurulumu:**
  - [ ] Vitest veya Jest kurulumu ve konfigürasyonu
  - [ ] Test scriptlerinin package.json'a eklenmesi
- [ ] **Birim Testler (Unit Tests):**
  - [ ] Zod validator şemalarının sınır değer testleri
  - [ ] `formatCurrency`, `formatDate`, `formatNumber` yardımcı fonksiyon testleri
  - [ ] `calculateFraudScore` heuristik motoru testleri
  - [ ] `buildListingImageStoragePath` ve `buildExpertDocumentStoragePath` testleri
- [ ] **Entegrasyon Testleri (Integration Tests):**
  - [ ] RLS politikalarının doğrudan Supabase sorgusu ile doğrulanması
  - [ ] API route handler'larının (listings, images, documents, reports) testleri
  - [ ] Admin moderasyon API'sinin yetki kontrol testleri
  - [ ] Rate limiting davranış testleri
- [ ] **E2E Testler (End-to-End):**
  - [ ] Playwright veya Cypress kurulumu
  - [ ] İlan oluşturma akışı (form → yükleme → moderasyon → yayın)
  - [ ] Kayıt → Giriş → Profil güncelleme akışı
  - [ ] Admin onay/red akışı
  - [ ] Arama ve filtreleme akışı

---

### Dalga 5: Performans & Altyapı
Ölçeklenebilirlik ve kullanıcı deneyimi performansı.

- [ ] **Next.js Middleware:**
  - [ ] Auth middleware (dashboard/admin route koruması server-side)
  - [ ] Redirect kuralları (eski URL → yeni URL)
- [ ] **Görsel Optimizasyonu:**
  - [ ] next/image kullanımının yaygınlaştırılması (tüm listing kartları ve galeri)
  - [ ] Supabase Storage CDN ayarları ve cache policy
  - [ ] Lazy loading ve blur placeholder'lar
- [ ] **Veritabanı Performansı:**
  - [ ] Sık kullanılan sorguların EXPLAIN ANALYZE ile profillenmesi
  - [ ] Bileşik index'lerin (brand+city, status+created_at) eklenmesi
  - [ ] Connection pooling ayarlarının optimize edilmesi
- [ ] **Bundle Optimizasyonu:**
  - [ ] Dynamic import ile kod bölme (listing form, admin panel)
  - [ ] Tree shaking doğrulaması
  - [ ] Lighthouse Performance skoru ≥ 85 hedefi (mobile)
- [ ] **Error Monitoring:**
  - [ ] Sentry veya benzeri hata izleme servisi entegrasyonu
  - [ ] Structured logging (server-side)
  - [ ] Uptime monitoring

---

### Dalga 6: Monetizasyon & Büyüme (Post-MVP)
Gelir modeli ve büyüme kanalları.

- [ ] **Öne Çıkan İlan (Promoted Listing):**
  - [ ] Ücretli "öne çıkar" özelliği (featured = true + ödeme)
  - [ ] Stripe veya İyzico ödeme entegrasyonu
  - [ ] Listeleme sayfasında featured ilanların ayrıcalıklı konumlandırılması
- [ ] **Bayi / Galeri Hesabı:**
  - [ ] Birden fazla ilan yönetebilen ticari hesap türü
  - [ ] Galeri profil sayfası (logo, açıklama, tüm ilanlar)
  - [ ] Aylık abonelik modeli
- [ ] **Analytics Dashboard:**
  - [ ] Satıcılar için ilan görüntülenme, favorilenme, WhatsApp tıklama istatistikleri
  - [ ] Admin için platform genelinde günlük/haftalık metrikler
- [ ] **PWA (Progressive Web App):**
  - [ ] Service worker ve manifest.json
  - [ ] Offline erişim (son görüntülenen ilanlar cache)
  - [ ] Push notification desteği
- [ ] **Çoklu Dil Desteği (i18n):**
  - [ ] next-intl veya benzeri kütüphane entegrasyonu
  - [ ] Türkçe (varsayılan) + İngilizce
  - [ ] URL yapısında /tr ve /en prefix'leri

---

### Dalga 7: Güvenlik Sertleştirme (Hardening)
Prodüksiyon ortamında güvenlik önlemleri.

- [ ] **CSRF Koruması:**
  - [ ] Tüm mutation API'lerde CSRF token doğrulaması
- [ ] **Content Security Policy (CSP):**
  - [ ] Next.js headers konfigürasyonu ile CSP header'ı
- [ ] **Input Sanitizasyonu:**
  - [ ] XSS saldırılarına karşı HTML/script tag temizliği (açıklama alanı vb.)
  - [ ] SQL injection testleri (Supabase parametrik sorgular ile korunuyor ama audit)
- [ ] **Dosya Yükleme Güvenliği:**
  - [ ] Storage bucket'ta public erişim politikalarının daraltılması
  - [ ] Yüklenen dosyaların antivirus/malware taraması (opsiyonel)
  - [ ] Dosya boyutu ve MIME type double-check (server-side, mevcut)
- [ ] **Rate Limiting Geliştirme:**
  - [ ] Redis tabanlı distributed rate limiting (çoklu instance için)
  - [ ] Captcha entegrasyonu (Cloudflare Turnstile veya hCaptcha)
- [ ] **Audit & Compliance:**
  - [ ] KVKK uyumluluk sayfası ve onay mekanizması
  - [ ] Çerez politikası banner'ı
  - [ ] Veri silme talebi (GDPR/KVKK "unutulma hakkı") endpoint'i

---

## 🟢 Sonraki Eylem Planı

Geliştirici veya YZ Aracısına Talimat:
> "Dalga 2.5'ten **Admin İlan Düzenleme** veya Dalga 3'ten **Karşılaştırma Ekranı Aktivasyonu** ile devam edin."
