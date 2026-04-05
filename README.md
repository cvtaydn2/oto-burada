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
- `Phase 0 / Task 0.1` tamamlandı
- Proje iskeleti oluşturuldu
- Temel klasör yapısı hazırlandı
- shadcn/ui ve gerekli bağımlılıklar kuruldu
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
Sıradaki iş `Phase 1 / Task 1.1`: ortak tiplerin ve Zod doğrulayıcılarının tanımlanması.
