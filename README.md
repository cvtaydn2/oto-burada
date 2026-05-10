# OtoBurada

OtoBurada, yalnızca otomobil ilanlarına odaklanan, mobil-first, güven odaklı ve ücretsiz bireysel ilan yayınlamayı merkeze alan bir pazaryeri MVP’sidir.

Bu belge deponun giriş noktasıdır. Ürün vizyonunun kuralları [`AGENTS.md`](AGENTS.md), teslim backlog’u [`TASKS.md`](TASKS.md), yapılan işlerin günlüğü [`PROGRESS.md`](PROGRESS.md), operasyonel akışlar [`RUNBOOK.md`](RUNBOOK.md) ve dokümantasyon kataloğu [`docs/INDEX.md`](docs/INDEX.md) altında tutulur.

## Belge omurgası

Bu bölüm normatif source-of-truth önceliğini özetler; önerilen onboarding okuma sırası değildir. Yeni bir okuyucu için başlangıç noktası yine [`README.md`](README.md) olur, ancak çelişki halinde aşağıdaki öncelik uygulanır:

1. [`AGENTS.md`](AGENTS.md): Ürün, mimari ve kalite için anayasa niteliğindeki kurallar.
2. [`README.md`](README.md): Hızlı başlangıç ve temel yönlendirme.
3. [`TASKS.md`](TASKS.md): Backlog, teslim sırası ve acceptance criteria.
4. [`PROGRESS.md`](PROGRESS.md): Tamamlanan işler, kararlar ve doğrulama geçmişi.
5. [`RUNBOOK.md`](RUNBOOK.md): Deploy, incident, rollback ve operasyon prosedürleri.
6. [`docs/INDEX.md`](docs/INDEX.md): Aktif, referans, audit ve archive doküman kataloğu.

## Ürün özeti

Ürün hedefi, sahibinden.com ve arabam.com benzeri yatay veya karmaşık deneyimlere kıyasla daha güvenilir, daha şeffaf, daha düşük maliyetli ve daha sade bir otomobil ilan deneyimi sunmaktır.

Temel ilkeler şunlardır:

- sadece otomobil ilanları
- bireysel kullanıcı için ücretsiz ilan yayını
- moderasyon zorunluluğu
- WhatsApp CTA ile hızlı satıcı iletişimi
- mobil-first kullanım kolaylığı
- SEO dostu public listing sayfaları
- ücretsiz tier ile sürdürülebilir mimari

Detaylı ürün yönü için [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md), güven ve politika yapısı için [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md), [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md) ve gelir modeli için [`docs/MONETIZATION.md`](docs/MONETIZATION.md) belgelerine bakılmalıdır.

## Hızlı başlangıç

Yerel geliştirme için en kısa akış:

```bash
npm install
npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinde açılır.

## Gereksinimler

- Node.js 20+
- npm 10+
- İsteğe bağlı Supabase projesi veya local Supabase stack

## Kurulum akışı

### 1. Ortam değişkenlerini hazırla

```bash
copy .env.local.template .env.local
```

Minimum anlamlı local çalışma için tipik çekirdek değişkenler:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_DB_URL=postgresql://postgres:your-password@db.your-project.supabase.co:5432/postgres
SUPABASE_STORAGE_BUCKET_LISTINGS=listing-images
SUPABASE_STORAGE_BUCKET_DOCUMENTS=listing-documents
SUPABASE_DEMO_USER_PASSWORD=test-123456
```

Tam environment ve operasyonel beklentiler için [`RUNBOOK.md`](RUNBOOK.md) okunmalıdır.

### 2. Veritabanını hazırla

Gerekliyse sırasıyla:

```bash
npm run db:apply-schema
npm run db:migrate
npm run db:seed-demo
```

Tek akış olarak:

```bash
npm run db:bootstrap-demo
```

### 3. Uygulamayı başlat

```bash
npm run dev
```

## Sık kullanılan komutlar

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm run test:unit
npm run test:int
npm run test:e2e:chromium
npm run db:check-env
npm run db:apply-schema
npm run db:migrate
npm run db:seed-demo
npm run db:bootstrap-demo
```

## Mimari özet

Uygulama tek bir full-stack Next.js kod tabanı olarak çalışır. Server component yaklaşımı varsayılandır. Mutation akışları route handlers veya server actions ile yürütülür. Supabase Auth, Postgres ve Storage ana backend omurgasını oluşturur. RLS client tarafında asla bypass edilmez.

Servis katmanı standardı için [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md), teknik güvenlik için [`docs/SECURITY.md`](docs/SECURITY.md) ve release gate’leri için [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) kullanılmalıdır.

## Repo haritası

- [`src/app`](src/app): App Router sayfaları ve route handler’lar
- [`src/features`](src/features): Feature bazlı modüller
- [`src/domain`](src/domain): Saf domain mantığı ve use case’ler
- [`src/services`](src/services): Paylaşılan veya kalan servis katmanları
- [`src/lib`](src/lib): Auth, güvenlik, env, validator ve yardımcı altyapı
- [`database`](database): Schema snapshot, base schema ve migration dosyaları
- [`scripts`](scripts): DB ve operasyon scriptleri
- [`docs`](docs): Aktif, referans, audit ve archive dokümantasyonu

## Dokümantasyon navigasyonu

Aktif belge kataloğu [`docs/INDEX.md`](docs/INDEX.md) altındadır. Yeni bir geliştirici için önerilen okuma sırası şöyledir:

1. [`README.md`](README.md)
2. [`AGENTS.md`](AGENTS.md)
3. [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
4. [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
5. [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md)
6. [`TASKS.md`](TASKS.md)
7. [`PROGRESS.md`](PROGRESS.md)
8. [`RUNBOOK.md`](RUNBOOK.md)

Bu sıra onboarding kolaylığı içindir. Normatif çelişki çözümü için üstteki belge omurgası sırası ve [`AGENTS.md`](AGENTS.md) önceliği geçerlidir.

## Notlar

Production troubleshooting, runtime hata çözümü veya tarihsel audit içerikleri için başlangıç noktası yine [`docs/INDEX.md`](docs/INDEX.md) olmalıdır. Bu dosya bilerek kısa tutulur; uzun operasyonel veya tarihsel detaylar burada tekrar edilmez.
