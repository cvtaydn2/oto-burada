# Oto Burada

Sadece arabalar için tasarlanmış, mobil öncelikli ve güven odaklı ücretsiz ilan pazaryeri MVP'si.

## Teknoloji Yığını
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zod
- TanStack Query
- Supabase Auth
- Supabase Postgres
- Supabase Storage

## Mevcut Durum
- `Post-MVP / Persistence Upgrade` ilerletildi
- Public listeleme ve ilan detay akışları hazır
- Supabase Auth ile giriş, kayıt ve korumalı dashboard akışı çalışıyor
- Profil güncelleme ve favori akışı aktif
- Dashboard içinde ilan oluşturma, düzenleme, arşivleme ve durum izleme akışları aktif
- Kullanıcı tarafında şüpheli ilan raporlama akışı aktif
- Admin panelinde ilan ve rapor moderasyonu aktif
- Listings filtreleri URL search params ile paylaşılabilir ve refresh dayanıklı hale geldi
- Homepage, listings index ve listing detail için SEO metadata aktif
- Majör async ekranlarda loading, empty, error ve disabled durumları gözden geçirildi
- Core akışlarda klavye odağı, touch target ve mobil filtre drawer erişilebilirliği güçlendirildi
- Dashboard genel bakış ekranı gerçek özet kartları ve hızlı yönlendirmeler ile tamamlandı
- Listings, reports ve favorites akışı artık Supabase-first persistence ile çalışıyor
- Supabase tablo erişimi başarısız olursa listings/reports için mevcut cookie fallback korunuyor
- Public listings, detail, admin ve dashboard favorites ekranları seed + runtime kayıtları birlikte okuyabiliyor
- Legacy cookie verileri okunurken DB kayıtları ile merge edilerek geçiş sürecinde veri kaybı riski azaltıldı
- Dashboard içinde legacy cookie verilerini Supabase'e taşıyan tek tık senkron kartı eklendi
- Admin panelinde Supabase env ve tablo erişimini özetleyen persistence health görünümü eklendi
- Repo içine Supabase schema uygulama ve demo seed komutları eklendi
- Admin paneline migration runbook eklendi ve demo seed sonucu `db:verify-demo` ile doğrulanabilir hale geldi
- Admin moderasyon kararları Supabase `admin_actions` audit trail tablosuna yazılıyor ve son aksiyonlar panelde listeleniyor
- Admin aksiyon geçmişi artık ilan/rapor filtresi ve ilgili ilan detayına hızlı geçiş bağlantıları içeriyor
- Admin moderasyon aksiyonlarında opsiyonel karar notu girilebiliyor; bu not audit trail kaydına aynen yazılıyor
- Admin audit geçmişi artık aksiyonu yapan admin profil adını da gösteriyor
- Admin audit geçmişi artık hedef tipi, aksiyon tipi ve metin araması ile filtrelenebiliyor
- Supabase schema, demo seed ve verify akisi gerçek proje üzerinde başarıyla doğrulandı
- Google AI Studio export taslagi mevcut projeye `/ui-draft` preview route'u olarak entegre edildi
- Canli `/listings` sayfasi AI Studio taslagindan ilham alan akilli preset filtreler ve sonuc ozeti ile guclendirildi
- Figma component export'undaki kart/badge/stepper dili ana sayfa hero alanina canli pazar ozeti ve 3 adimli baslangic paneli olarak tasindi
- Canli listing kartlari ve dashboard metrik kartlari AI Studio'nun ana gorsel dili baz alinarak yenilendi; Figma component mantigi ile tekrar eden kart yapilari temizlendi
- Listing detail sayfasi AI Studio karar katmanina yaklastirildi; hero ozet paneli, seller karti ve rapor formu yeni tasarim diliyle hizalandi
- Admin moderasyon ekranlari ve dashboard favorites sayfasi da ayni AI Studio + Figma diline tasindi; metrik, karar ve ozet panelleri teklesmeye basladi
- Admin aksiyon gecmisi, dashboard ilan yonetimi ve profil giris panelleri de ayni tasarim sistemine alindi; boylece ana dashboard akislarinda yuzey dili daha tutarli hale geldi
- Lint, typecheck ve production build doğrulandı

## Kurulum

### 1. Bağımlılıkları yükle
```bash
npm install
```

### 2. Ortam değişkenlerini hazırla
`.env.example` dosyasını referans alarak `.env.local` oluştur:

```bash
copy .env.example .env.local
```

PowerShell kullanıyorsan:

```powershell
Copy-Item .env.example .env.local
```

### 3. Gerekli ortam değişkenlerini doldur
Şimdilik aşağıdaki değişkenler beklenir:
- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_STORAGE_BUCKET_LISTINGS`
- `SUPABASE_DB_URL`
- `SUPABASE_DEMO_USER_PASSWORD`

`SUPABASE_STORAGE_BUCKET_LISTINGS` bucket'inin public read erişimiyle açılması ve ilan görselleri için kullanılması beklenir.
Uygulama tarafında `JPG`, `PNG`, `WebP` formatlari ve dosya basi maksimum `5 MB` kurali enforce edilir.

### 4. Geliştirme sunucusunu başlat
```bash
npm run dev
```

### 5. Doğrulama komutları
```bash
npm run lint
npm run typecheck
npm run build
```

### 6. Supabase schema ve demo seed
Schema'yi gerçek veritabanına uygulamak için:

```bash
npm run db:apply-schema
```

Demo auth kullanicilari, profiller, ilanlar, favoriler ve raporlar ile birlikte seed atmak icin:

```bash
npm run db:seed-demo
```

Seed sonrasi auth kullanicilari, tablo sayilari ve storage bucket durumunu dogrulamak icin:

```bash
npm run db:verify-demo
```

Tum akisi tek komutta calistirmak icin:

```bash
npm run db:bootstrap-demo
```

`db:apply-schema` komutu yerel ortamda `psql` aracinin PATH uzerinde olmasini bekler.

## Proje Yapısı
```txt
src/
  app/
    (public)/
    dashboard/
    admin/
    api/
  components/
    ui/
    shared/
    listings/
    forms/
    layout/
  lib/
    auth/
    constants/
    supabase/
    validators/
  services/
  hooks/
  types/
  data/
```

## Çalışma Kuralı
Yeni geliştirmeye başlamadan önce şu dosyalar gözden geçirilmelidir:
1. `AGENTS.md`
2. `TASKS.md`
3. `PROGRESS.md`
4. `UI_SYSTEM.md`
5. `BRAND_SYSTEM.md`
6. `CONTENT_COPY.md`
7. `SEED_PLAN.md`
8. `schema.sql`

## Sonraki Adım
`TASKS.md` içindeki sıralı MVP görevleri tamamlandı. Sonraki mantıklı genişleme, AI Studio gorsel dilini dashboard form ekranlari ve admin persistence/audit alt panellerine daha derin tasimak; operasyon tarafinda ise production benzeri Supabase ortaminda legacy cookie verilerini tabloya backfill etmektir.
