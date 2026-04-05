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
`TASKS.md` içindeki sıralı MVP görevleri tamamlandı. Sonraki mantıklı genişleme, gerçek Supabase migration/seed akışını çalıştırıp mevcut cookie verilerini tabloya taşımak olur.
