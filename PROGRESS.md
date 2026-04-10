# PROGRESS.md

Bu dosya tekrar iş yapmamak ve mevcut durumu hızlı görmek için tutulur.
Her yeni geliştirme başlamadan önce okunmalıdır.

---

## Çalışma Kuralı
- Her geliştirme başlangıcında `PROGRESS.md` incelenir.
- Geliştirme sadece `TASKS.md` sırasına göre ilerler.
- Tamamlanan her görev sonunda bu dosya güncellenir.

---

## Proje Durumu
- Güncel faz: `Trust & Operasyon (Dalga 2) Tamamlandı`
- Güncel görev: `Ekspertiz Yükleme + Moderasyon Şablonları + Fraud Heuristics tamamlandı`
- Sonraki hedef: `Dalga 2.5 (Bump sistemi) veya Dalga 3 (SEO altyapısı)`
- Durum: completed

---

## Son Doğrulama Sonuçları
- `npm run lint` - Geçti (0 error)
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 36/36 geçti

---

## 2026-04-08 Uyumluluk ve Semantik Audit

### Kapsam
- Genel dökümanlar tekrar okundu: `AGENTS.md`, `BRAND_SYSTEM.md`, `CONTENT_COPY.md`, `TASKS.md`, `README.md`
- Kod tabanı frontend + backend + test + script katmanlarında semantik olarak tarandı
- Supabase env ve MCP yapılandırması kontrol edildi

### Yapılan Düzeltmeler
- `package.json` içinde `typecheck` akışı `next typegen && tsc --noEmit` olacak şekilde düzeltildi; böylece `.next` tipleri hazır olmadan yalancı kırılım oluşmuyor
- `src/components/listings/listings-page-client.tsx` içinde React lint kıran effect tabanlı state senkronizasyonu kaldırıldı; filtre URL eşitlemesi artık event akışında kararlı çalışıyor
- `playwright.config.ts` içindeki web server akışı `build + start` modeline alındı; testler Turbopack dev server bağımlılığından çıkarıldı
- Eski response formatını bekleyen `tests/e2e.spec.ts` favori testi, mevcut standart API zarfına (`success/data`) hizalandı
- Kullanılmayan import/değişken ve küçük a11y/lint sorunları temizlendi
- `scripts/create-users.mjs` içinde eksik `NEXT_PUBLIC_SUPABASE_ANON_KEY` okuması eklendi; scriptteki bariz çalışma hatası giderildi

### Doğrulama
- `npm run lint` - Geçti
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 24/24 geçti
- `npm run db:check-env` - Geçti
  - Eksik tek bootstrap değişkeni: `SUPABASE_DEMO_USER_PASSWORD`

### Supabase MCP Notu
- `C:\Users\Cevat\.codex\config.toml` içinde Supabase MCP girdisi yanlış formatta görünüyor
- Mevcut kayıt:
  - `[mcp_servers.supabase]`
  - `command = "codex mcp add supabase --url https://mcp.supabase.com/mcp?project_ref=yagcxhrhtfhwaxzhyrkj"`
- Sorun:
  - Bu alan aktif MCP sunucu adresi yerine kurulum komutunu saklıyor
  - Ayrıca ekranda önerilen `[mcp] remote_mcp_client_enabled = true` satırı config içinde görünmüyor
  - Aktif oturumda MCP resource/template listesi boş döndü; bu da bağlantının fiilen devreye girmediğini destekliyor

### Kararlar
- `TASKS.md` sırasını bozacak yeni feature geliştirmesi yapılmadı; odak doğrulama ve uyumluluk düzeltmeleri oldu
- Mevcut kullanıcı değişiklikleri korunarak ilerlenildi, unrelated dosyalar geri alınmadı

### Sonraki Adım
- Supabase MCP config girişini gerçek `url = "..."`
  formatına çevirip remote MCP client desteğini etkinleştir
- İstersen ikinci adımda `npm run dev` akışını da ayrıca audit edip kökteki `nul` artefact’ının Turbopack üzerindeki etkisini temizleyelim

---

## 2026-04-09 Derin Proje Audit

### Kapsam
- Frontend, backend, auth, favorites, dashboard ve test altyapısı birlikte yeniden tarandı
- "Geçiyor ama risk taşıyor" sınıfındaki davranışsal sorunlar özellikle incelendi
- Dokümantasyonlar yeni gerçek durumla hizalandı

### Tespit Edilen ve Düzeltilen Sorunlar
- Auth rate limiting anahtarı `getClientIp()` sonucunu beklemeden stringe gömüyordu; login/register rate limit'i fiilen IP-bazlı çalışmıyordu
- Dashboard favorites sayfası authenticated route olmasına rağmen `userId={undefined}` geçtiği için istemci tarafı misafir davranışına düşebiliyordu
- Dashboard ana ekranındaki favori metriği gerçek veri yerine sabit `-` gösteriyordu
- "İlanlarım" panelindeki arşivleme akışı API response hata gövdesini kontrol etmiyor, başarısız isteklerde sessizce refresh ediyordu
- Profil tablosuna sync edilen rol değeri yalnızca `user_metadata` üzerinden okunuyordu; admin gate ile aynı kaynak kullanılmıyordu
- ESLint üretilen `playwright-report` ve `test-results` klasörlerine girebildiği için eşzamanlı doğrulamalarda yalancı ENOENT hatası verebiliyordu
- Playwright eski server reuse davranışı ve varsayılan port yüzünden stale Next sürecine bağlanıp suite'i kararsız hale getirebiliyordu

### Yapılan Geliştirmeler
- `src/lib/auth/actions.ts`: login/register rate limit IP anahtarı gerçek `await getClientIp()` ile düzeltildi
- `src/app/dashboard/favorites/page.tsx`: dashboard favorites route artık gerçek kullanıcı kimliğini geçiriyor
- `src/app/dashboard/page.tsx`: favori sayısı gerçek DB kaydından gösteriliyor
- `src/services/favorites/favorite-records.ts`: favori sayısı için küçük servis yardımcı fonksiyonu eklendi
- `src/components/listings/my-listings-panel.tsx`: arşivleme hataları kullanıcıya görünür hale getirildi
- `src/services/profile/profile-records.ts`: profil rol senkronizasyonu `app_metadata` öncelikli olacak şekilde hizalandı
- `eslint.config.mjs`: generated output klasörleri lint taramasından çıkarıldı
- `playwright.config.ts`: testler izole `127.0.0.1:3100` portuna taşındı, `reuseExistingServer` kapatıldı; suite daha deterministik hale geldi

### Doğrulama
- `npm run lint` - Geçti
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 24/24 geçti

### Karar
- Bu turda yeni feature eklemek yerine veri doğruluğu, auth davranışı ve test kararlılığı güçlendirildi
- Görev sırasını bozan yeni faz atlaması yapılmadı; düzeltmeler mevcut MVP akışlarının güvenilirliğini artırmaya odaklandı

### Sonraki Adım
- İstersen bir sonraki turda Supabase-first gerçek akışlar için API ve admin moderasyon katmanına daha derin entegrasyon testleri ekleyelim
- Alternatif olarak dashboard/profile/favorites akışlarında kullanıcı deneyimi iyileştirmelerine geçebiliriz

---

## 2026-04-09 Audit Devam Turu

### Tespit Edilen Ek Sorunlar
- Admin listing/report moderasyon endpoint'leri rate-limit anahtarını yine `getClientIp()` Promise değeriyle kuruyordu; IP bazlı sınırlama bu iki kritik route'ta da fiilen boşa düşüyordu
- Listing create ve report form başarı mesajları API'nin üst seviye `message` alanı yerine `data.message` bekliyordu; başarılı işlemlerde özel geri bildirim kullanıcıya yansımıyordu
- Favori butonu authenticated kullanıcıda da varsayılan misafir tooltip'ini göstermeye devam edebiliyordu

### Yapılan Düzeltmeler
- `src/app/api/admin/listings/[listingId]/moderate/route.ts`: admin moderasyon rate-limit anahtarı gerçek istemci IP'si ile düzeltildi
- `src/app/api/admin/reports/[reportId]/route.ts`: rapor moderasyon rate-limit anahtarı gerçek istemci IP'si ile düzeltildi
- `src/components/forms/listing-create-form.tsx`: başarılı ilan create/update mesajı API response sözleşmesi ile hizalandı
- `src/components/forms/report-listing-form.tsx`: başarılı rapor gönderimi mesajı doğru response alanından okunur hale getirildi
- `src/components/shared/favorites-provider.tsx` ve `src/components/listings/favorite-button.tsx`: favori tooltip'i sadece misafir kullanıcılar için görünür hale getirildi

---

## 2026-04-09 Favoriler Akış Hizalama

### Tespit Edilen Ek Sorun
- Misafir kullanıcılar lokal favori ekleyebildiği halde `/favorites` sayfası doğrudan dashboard'a yönleniyordu; bu yüzden kaydedilen favoriler görülemiyor ve ürün davranışı kendi içinde çelişiyordu
- Header ve mobile nav favori bağlantıları da misafir kullanıcıyı aynı kapalı route'a götürüyordu
- Favori tooltip metni "giriş yapmadan kaydedemezsin" gibi algılanıyordu; oysa sistem misafir için cihaz içi kaydı zaten destekliyordu

### Yapılan Düzeltmeler
- `src/app/(public)/favorites/page.tsx`: public favoriler sayfası gerçek içerik gösterecek şekilde açıldı
- `src/components/listings/favorites-page-client.tsx`: misafir kullanıcı için engelleyici login ekranı kaldırıldı; lokal favoriler listelenirken senkronizasyon banner'ı gösterilir hale getirildi
- `src/components/layout/site-header.tsx` ve `src/components/layout/header-mobile-nav.tsx`: favori linkleri auth durumuna göre `"/favorites"` veya `"/dashboard/favorites"` olacak şekilde ayrıldı
- `src/components/listings/favorite-button.tsx`: misafir tooltip kopyası ürün davranışıyla hizalandı ve login linki etkileşimli hale getirildi
- `tests/e2e.spec.ts`: misafir favori akışı için yeni Playwright senaryosu eklendi

### Doğrulama
- `npm run lint` - Geçti
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 26/26 geçti

---

## 2026-04-09 Pazar Hazirlik Degerlendirmesi

### Genel Durum
- Uygulama artik "teknik olarak ayakta duran car-only MVP" seviyesinde
- Temel create, browse, favorite, report ve admin moderation akislarinin iskeleti mevcut
- Ancak mevcut hal, guven, likidite ve operasyon derinligi acisindan "insanlar burada gonul rahatligiyla arac alip satar" seviyesine henuz gelmedi

### Kritik Eksikler
- Guven katmani eksik: satici dogrulama, ilan kalitesi puani, ekspertiz/proof baglantisi, ilan tazeligi ve dolandiricilik sinyalleri zayif
- Dashboard `notifications` ve `saved-searches` sayfalari gercek persistence yerine sabit ornek veriyle calisiyor; kullaniciya vaat edilen tekrar gelme nedeni henuz backend tarafinda yok
- Admin operasyonu tek ekranda manuel yurutuluyor; queue onceliklendirme, bulk aksiyon, karar sebebi sablonlari ve SLA benzeri operasyon yardimcilari eksik
- Test katmani agirlikli olarak smoke E2E seviyesinde; kritik is kurallari icin API/integration seviyesinde daha derin koruma yok
- Arac satma/alma kararini hizlandiran guven sinyalleri yetersiz: "neden bu ilana guveneyim", "satici kim", "ilan ne kadar saglikli" sorularina guclu cevap verilmiyor
- Acquisition/discovery tarafi MVP duzeyinde; SEO landing depth, kayitli arama bildirimleri ve geri donus dongusu yetersiz

### Oncelikli Gelistirme Plani

#### Dalga 1 - Transaction Readiness
- Gercek `saved searches` persistence modeli kur
- Gercek `notifications` veri modeli ve event uretimi kur
- Listing detail ve seller profilinde guven sinyallerini artir: uye olma tarihi, profil tamamlilik, ilan tazelik bilgisi, ekspertiz durumu, cevap beklentisi
- Listing create akisina kalite bariyerleri ekle: zorunlu guven alanlari, aciklama yonlendirmesi, kapora/dolandiricilik uyari dili
- Admin moderasyona hizli karar araclari ekle: filtreler, note presets, yuksek risk kuyruğu

#### Dalga 2 - Trust ve Operasyon
- Dolandiricilik heuristics ve duplicate listing kontrolleri ekle
- Ilan yenileme / sure dolumu / arsiv yasami gibi lifecycle kurallarini netlestir
- Moderasyon audit trail uzerine raporlanabilir operasyon panelleri kur
- Favori, rapor ve ilan aksiyonlari icin event tabanli backend akislarini standartlastir
- Kritik backend servisleri icin integration test seti olustur

#### Dalga 3 - Discovery ve Donusum
- SEO odakli marka/sehir/model landing stratejisini derinlestir
- Kayitli arama bildirimleri ve geri donus mekanizmasi ile tekrar ziyaret dongusu kur
- Compare, favorites ve search akislarinda "karar vermeyi hizlandiran" veri panelleri ekle
- Listing create surecini 2 dakikanin altina indirecek friction audit ve funnel optimizasyonu yap

### Karar
- `sahibinden.com` ile dogrudan platform genisligi yarisi yerine, once "araba ozelinde daha sade ve daha guven veren deneyim" kanitlanmali
- Sonraki gelistirme sprintleri placeholder dashboard ekranlarini gercek veriyle baglamaya ve guven katmanini kalinlastirmaya odaklanmali

### Sonraki Uygulanabilir Adim
- Ilk sprintte `saved-searches + notifications persistence + guven sinyali audit` paketi ele alinacak

---

## 2026-04-09 Saved Searches Sprinti

### Kapsam
- Roadmap'in ilk parcası olarak `saved-searches` akisi mock seviyesinden gercek persistence katmanina tasindi
- Listings sayfasindan arama kaydetme, dashboard'da kayitli aramalari gorme, bildirim tercihi degistirme ve silme akislari eklendi
- Schema niyeti ve persistence health ozeti yeni tabloyu kapsayacak sekilde guncellendi

### Yapılan Geliştirmeler
- `src/types/domain.ts` ve `src/lib/validators/domain.ts`: `SavedSearch` domain tipi ve create/update validator'lari eklendi
- `src/services/saved-searches/saved-search-utils.ts`: filtre normalize etme, signature, baslik ve ozet yardimcilari eklendi
- `src/services/saved-searches/saved-search-records.ts`: Supabase-backed kayitli arama CRUD servisi eklendi
- `src/app/api/saved-searches/route.ts` ve `src/app/api/saved-searches/[searchId]/route.ts`: listeleme, olusturma, guncelleme ve silme endpoint'leri eklendi
- `src/components/listings/save-search-button.tsx`: listings sonuc ekranina arama kaydetme CTA'si eklendi
- `src/app/dashboard/saved-searches/page.tsx` ve `src/components/listings/saved-searches-panel.tsx`: dashboard saved searches ekrani mock veriden gercek persistence modeline baglandi
- `schema.sql`: `saved_searches` tablosu, RLS policy'leri ve `is_admin()` fonksiyonunda `app_metadata` kullanan daha guvenli yetki kontrolu eklendi
- `src/services/admin/persistence-health.ts`: admin persistence ozeti yeni tabloyu gosterecek sekilde guncellendi

### Doğrulama
- `npm run lint` - Geçti
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 32/32 geçti

### Kalan Sonraki Adım
- Saved searches tamamlandigi icin siradaki odak alanı guven sinyalleri, event standardizasyonu ve daha derin integration testleri olmali

---

## 2026-04-09 Notifications Sprinti

### Kapsam
- `dashboard/notifications` ekrani mock listeden cikarilarak gercek Supabase persistence modeline tasindi
- Favori, admin listing moderasyonu ve rapor durumu guncelleme olaylari bildirim uretecek sekilde backend'e baglandi
- Bildirim listeleme, tekil okundu, tumunu okundu ve silme akislarina API ve UI katmani eklendi

### Yapılan Geliştirmeler
- `src/types/domain.ts`, `src/lib/constants/domain.ts` ve `src/lib/validators/domain.ts`: `Notification` domain tipi, enum ve validator katmani eklendi
- `src/services/notifications/notification-records.ts`: Supabase-backed bildirim CRUD servisi eklendi
- `src/app/api/notifications/route.ts` ve `src/app/api/notifications/[notificationId]/route.ts`: listeleme, tumunu okundu, tekil okundu ve silme endpoint'leri eklendi
- `src/app/dashboard/notifications/page.tsx` ve `src/components/shared/notifications-panel.tsx`: dashboard notifications ekrani mock veriden cikarak gercek persistence modeline baglandi
- `src/app/api/favorites/route.ts`: bir kullanici baskasinin ilanini favorilere eklediginde saticiya bildirim uretiliyor
- `src/app/api/admin/listings/[listingId]/moderate/route.ts`: ilan onay/red kararlarinda saticiya moderasyon bildirimi uretiliyor
- `src/app/api/admin/reports/[reportId]/route.ts`: rapor durumu degistiginde raporu gonderen kullaniciya geri bildirim bildirimi uretiliyor
- `schema.sql`: `notification_type` enum'u, `notifications` tablosu, index, trigger ve RLS policy'leri eklendi
- `src/services/admin/persistence-health.ts`: admin persistence ozeti `notifications` tablosunu da raporlar hale getirildi
- `tests/e2e.spec.ts`: notifications endpoint'leri icin auth koruma testleri eklendi

### Doğrulama
- `npm run lint` - Geçti
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run test` - 36/36 geçti

### Karar
- Dashboard tarafinda mock kalan temel tekrar ziyaret ekranlari artik kalmadi; `saved-searches` ve `notifications` canli DB ile calisiyor
- Bir sonraki sprintte odak, kullanicinin "neden bu ilana guveneyim" sorusunu cevaplayan trust sinyalleri ve smoke test otesi servis/integration korumalari olmali

---

## 2026-04-09 Trust Features Phase 1 - Veri Katmanı (Data Modeling)

### Kapsam
- OtoBurada Trust Building inisiyatifi kapsamında \`listings\` tablosuna \`tramer_amount\` ve \`damage_status_json\` alanları eklendi
- Typescript domain yapıları yeni nesne modeliyle hizalanarak validation (zod) entegrasyonu tamamlandı
- UI bileşenleri öncesi core data modeling işlemi Production-Ready düzeyde bağlandı

### Yapılan Geliştirmeler
- \`schema.sql\`: \`tramer_amount\` (bigint) ve \`damage_status_json\` (jsonb) eklendi
- \`src/types/domain.ts\`: Alanlar \`Listing\`, \`ListingCreateInput\` arabirimlerine opsiyonel \`tramerAmount\`, \`damageStatusJson\` olarak eklendi
- \`src/lib/validators/domain.ts\`: Zod schema'larına non-negative integer formülleri ile eklendi
- \`src/services/listings/listing-submissions.ts\`: Frontend ile Supabase arasında dbRow mapping işlemleri bu yeni alanları algılayacak şekilde güçlendirildi
- MCP üzerinden SQL Migration DB'ye direk canlı uygulandı

### Doğrulama
- \`npx tsc --noEmit\` Typescript Build Geçti

### Sonraki Adım
- İlan oluşturma ekranında (`ListingCreateForm`) Tramer ve Boya/Değişen seçim UI'larının tasarlanıp bağlanması
- İlan detay sayfasında bu verilerin şeffaflık oluşturacak güzel grafik/rozet UI bileşenleriyle gösterilmesi
- WhatsApp yönlendirmesi öncesi Güvenlik Modalı (Fraud Alert) eklentisi

---

## 2026-04-10 Karşılaştırma (Compare) Özelliği Aktifleştirme

### Kapsam
- `/compare` sayfası artık gerçek veriyle çalışıyor
- ListingCard ve ListingDetail sayfasına "Karşılaştır" butonu eklendi
- Karşılaştırma listesi localStorage üzerinde tutuluyor (max 4 araç)

### Yapılan Geliştirmeler
- `src/components/shared/compare-provider.tsx`: Karşılaştırma liste yönetimi için CompareProvider (favoriler gibi localStorage tabanlı)
- `src/components/listings/compare-button.tsx`: ListingCard ve listing detail'da kullanılacak buton
- `src/components/listings/listing-card.tsx`: Hem mobil hem desktop için Karşılaştır butonu eklendi
- `src/app/(public)/listing/[slug]/page.tsx`: Mevcut statik Link yerine CompareButton kullanılıyor
- `src/components/shared/app-providers.tsx`: CompareProvider eklendi
- `src/app/globals.css`: CSS import sorunu çözüldü (shadcn ve tw-animate CSS dosyaları lib/styles'a kopyalandı)

### Doğrulama
- `npm run typecheck` - Geçti
- `npm run build` - Geçti
- `npm run dev` - Geçti (dev server 200 OK döndürüyor)

---

## 2026-04-10 Admin İlan Düzenleme & CSS İyileştirmeleri

### Yapılan Geliştirmeler
- **CSS Onarımı**: Tailwind v4 için `postcss.config.mjs` eksikliği giderildi ve `globals.css` içindeki aliaslı importlar relative yollarla güncellendi.
- **Admin İlan Düzenleme API**: `PATCH /api/admin/listings/[listingId]/edit` rotası oluşturuldu.
- **Moderasyon UI Güncellemesi**: Admin panelinde ilanları onaylamadan önce başlık, fiyat ve açıklamayı inline düzenleme yeteneği eklendi.
- **Compare UX**: Karşılaştırma butonları ve provider entegrasyonu tamamlandı.

### Doğrulama
- `npm run build` - Başarılı (Tailwind derlemeyi tamamladı)
- TypeScript - Hata yok
