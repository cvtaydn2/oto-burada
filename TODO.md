# OtoBurada — Kalan Görevler (TODO)

> Bu dosya, tamamlanan Faz 1 (Altyapı) ve Faz 2 (UI/Form) sonrasında kalan
> geliştirme, güvenlik ve optimize görevlerini tek bir yerde toplar.

---

## 🔴 Kritik (Güvenlik & Stabilite) - TAMAMLANDI ✅

### Güvenlik
- [x] **XSS Sanitizasyonu**: `isomorphic-dompurify` entegrasyonu tamamlandı. (Done)
- [x] **Rate Limiting**: API endpoint'leri için profillere bağlı sınırlama aktif. (Done)
- [x] **CSRF Koruması**: Middleware üzerinden Origin check eklendi. (Done)
- [x] **admin API'leri güçlendirme**: `/api/admin/*` route'larına `requireApiAdminUser` eklenerek JWT tabanlı yetkilendirme yapılması. (Done)

### Veritabanı
- [x] **Notifications & Saved Searches**: DB tabloları, RLS politikaları ve servisleri tamamlandı. (Done)
- [x] **Storage bucket RLS politikaları**: `listing-images` bucket'ı için SQL tabanlı politikalar uygulandı. (Done)
- [x] **Full-text search logic**: `search_vector` (GIN index) ve Postgres trigger altyapısı kuruldu. (Done)

---

## 🟡 Önemli (MVP Lansmanı İçin Güçlendirme)

### UI/UX İyileştirmeleri
- [x] **Hasar durumu JSON editörü**: Wizard'a `DamageSelector` eklendi, detay sayfasına `DamageReportCard` eklendi. (Done)
- [x] **Structured Data (JSON-LD)**: `Vehicle` ve `Product` schema markup detay sayfasında aktif. (Done)
- [x] **Open Graph tags**: Twitter Card ve zengin preview destekleri eklendi. (Done)
- [ ] **Ekspertiz raporu formu**: Wizard'a opsiyonel 4. adım olarak eklenmesi
  - Motor, şanzıman, süspansiyon vb. kontrol kartları
- [ ] **Fotoğraf sıralama (drag & drop)**: `dnd-kit` veya `@hello-pangea/dnd` ile
  fotoğraf sırasını sürükle-bırak ile değiştirebilme
- [ ] **Skeleton loader'lar**: Listing kartları ve detay sayfası için
  loading state'lerinde iskelet animasyonları
- [ ] **Mobil filtre modal**: Filtre panelini mobilde bottom-sheet olarak açan modal
- [ ] **Dark mode desteği**: CSS custom properties + Tailwind dark variant

### Performans
- [x] **ISR (Incremental Static Regeneration)**: `/listing/[slug]` sayfası için `revalidate` stratejisi eklendi. (Done)
- [ ] **Image optimization**: Next/Image ile listing fotoğraflarının responsive srcSet ve blur placeholder ile sunulması
- [ ] **Bundle analizi**: `@next/bundle-analyzer` ile chunk boyutlarının incelenmesi
- [ ] **Lazy loading**: Dashboard sayfalarında kullanılmayan bileşenlerin `dynamic()` ile lazy import edilmesi

### SEO
- [x] **Canonical URL'ler**: Yinelenen içerik sorunlarını önlemek için canonical tag'leri eklendi. (Done)
- [x] **Breadcrumb navigasyonu**: Listing detay sayfasında yapısal navigasyon eklendi. (Done)

---

## 🟢 Güzel Olur (Post-MVP)

### Özellikler
- [ ] **Bildirim sistemi**: Push notification ve in-app bildirim altyapısı
  - Saved search eşleşmesi, favori fiyat düşüşü, moderasyon sonucu
- [ ] **Karşılaştırma sayfası zenginleştirme**: Radar chart, özellik tablosu
- [ ] **İlan bump (öne çıkarma)**: Ücretli öne çıkarma akışı (Stripe/iyzico)
- [ ] **Satıcı puanlama**: İşlem sonrası alıcı değerlendirmesi
- [ ] **Araç fiyat tahmini**: Marka/model/yıl/km bazlı piyasa fiyatı göstergesi
- [ ] **PDF ilan raporu**: İlan detaylarını PDF olarak indirme

### Altyapı
- [ ] **E2E testleri**: Playwright ile kritik akışların otomasyonu
  - İlan oluşturma, moderasyon, arama, favori ekleme
- [ ] **CI/CD pipeline**: GitHub Actions ile lint → typecheck → build → deploy
- [ ] **Error tracking**: Sentry entegrasyonu
- [ ] **Analytics**: Vercel Analytics veya PostHog
- [ ] **Staging ortamı**: Supabase branch + Vercel preview deployment

---

## ✅ Tamamlanan Görevler (Özet)

| Görev | Tarih | Notlar |
|-------|-------|--------|
| DB referans tabloları | 2026-04-11 | Seed script ile dolduruldu |
| Live Reference Data | 2026-04-11 | Mock data kaldırıldı |
| Wizard Form | 2026-04-11 | 3 adımlı yapı |
| Image Compression | 2026-04-11 | Client-side compression |
| Middleware Security | 2026-04-11 | Admin protection |
| Composite Indices | 2026-04-11 | Performance fix |
| Range Slider | 2026-04-11 | New Component |
| XSS Defense | 2026-04-11 | DOMPurify Integration |
| CSRF Protection | 2026-04-11 | Origin Check Middleware |
| Damage Selector | 2026-04-11 | Granular car condition |
| Full-Text Search | 2026-04-11 | GIN Index + search_vector |
