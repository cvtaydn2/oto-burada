# OtoBurada

Sadece arabalar için tasarlanmış, mobil öncelikli ve güven odaklı ücretsiz ilan pazaryeri.

## Genel durum

Bu repo şu anda local ortamda başarıyla:

- `npm run lint`
- `npm run typecheck`
- `npm run build`
- `npm run test:unit`
- `npm run test:int`
- `npm run test:e2e:chromium`

komutlarını geçecek durumda stabilize edilmiştir.

## Tek komutla çalıştırma

En hızlı local başlangıç:

```bash
npm install && npm run dev
```

Uygulama varsayılan olarak `http://localhost:3000` üzerinde açılır.

## Gereksinimler

- Node.js 20+
- npm 10+
- İsteğe bağlı: Supabase projesi veya local Supabase stack

## Hızlı kurulum

### 1) Env dosyasını oluştur

```bash
copy .env.local.template .env.local
```

Windows PowerShell dışında iseniz manuel olarak da kopyalayabilirsiniz.

### 2) Minimum local env değerlerini gir

Uygulamanın anlamlı şekilde açılması için en az şu alanları doldurun:

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

Notlar:

- Turnstile local geliştirmede zorunlu değildir. `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ve `TURNSTILE_SECRET_KEY` boş kalabilir.
- Redis, Resend, PostHog ve Iyzico local boot için zorunlu değildir.
- Bu opsiyonel servisler tanımlı değilse uygulama degrade modda çalışır.

### 3) Bağımlılıkları kur

```bash
npm install
```

### 4) Veritabanını hazırla

Supabase schema ve demo data gerekiyorsa sırayla:

```bash
npm run db:apply-schema
npm run db:migrate
npm run db:seed-demo
```

Tek akış olarak çalıştırmak isterseniz:

```bash
npm run db:bootstrap-demo
```

### 5) Uygulamayı başlat

```bash
npm run dev
```

## Kullanılabilir komutlar

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

## Local geliştirme davranışı

### Turnstile

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` yoksa widget render edilmez.
- `TURNSTILE_SECRET_KEY` yoksa server doğrulaması development ve test ortamında fail-open çalışır.
- Production için her ikisi de tanımlanmalıdır.

### Redis

- `UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` yoksa bazı rate-limit ve dedup akışları localde hafifletilmiş modda çalışır.

### E-posta

- `RESEND_API_KEY` yoksa transactional email akışları localde tam aktif olmaz.

### Ödeme

- `IYZICO_*` değişkenleri production için gereklidir.
- Local boot ve temel UI/test akışları için zorunlu değildir.

## E2E ve demo kullanıcı

Playwright listing wizard testi için demo kullanıcı beklenir:

```env
SUPABASE_DEMO_USER_PASSWORD=test-123456
```

Varsayılan test kullanıcısı:

- `emre@otoburada.demo`

Bu hesabın seed sırasında oluşmuş olması gerekir.

## Proje yapısı

- `src/app`: App Router sayfaları ve API route'ları
- `src/components`: Paylaşılan ve feature tabanlı UI bileşenleri
- `src/features`: Üst seviye feature modülleri
- `src/domain`: Domain logic ve use case katmanı
- `src/services`: Veri erişimi, iş mantığı ve harici servis entegrasyonları
- `src/lib`: Auth, güvenlik, env, utils, validator ve altyapı yardımcıları
- `database/`: Schema snapshot, base schema ve migration dosyaları
- `scripts/`: DB, bootstrap ve operasyon scriptleri
- `e2e/`, `tests/`: Playwright ve diğer test senaryoları

## Mimari notlar

- Server component yaklaşımı varsayılandır.
- Mutations için route handlers ve server-side orchestration kullanılır.
- Supabase Auth/Postgres/Storage ana backend omurgasıdır.
- RLS bypass edecek client-side service role kullanımı yoktur.

## Env açıklamaları

### Zorunlu çekirdek değişkenler

- `NEXT_PUBLIC_APP_URL`: Public app origin
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Server-side privileged operations
- `SUPABASE_DB_URL`: Migration ve schema scriptleri için DB bağlantısı

### Depolama

- `SUPABASE_STORAGE_BUCKET_LISTINGS`: İlan görselleri bucket adı
- `SUPABASE_STORAGE_BUCKET_DOCUMENTS`: Doküman bucket adı

### Opsiyonel güvenlik ve entegrasyonlar

- `NEXT_PUBLIC_TURNSTILE_SITE_KEY`: Client bot koruma widget anahtarı
- `TURNSTILE_SECRET_KEY`: Server doğrulama anahtarı
- `UPSTASH_REDIS_REST_URL`: Upstash Redis URL
- `UPSTASH_REDIS_REST_TOKEN`: Upstash Redis token
- `RESEND_API_KEY`: E-posta servisi
- `RESEND_FROM_EMAIL`: Gönderen adresi
- `IYZICO_API_KEY`: Ödeme API key
- `IYZICO_SECRET_KEY`: Ödeme secret key
- `IYZICO_BASE_URL`: Sandbox/production base URL
- `CRON_SECRET`: Cron endpoint koruması
- `POSTHOG_WEBHOOK_SECRET`: PostHog webhook doğrulaması
- `INTERNAL_API_SECRET`: Internal API çağrıları

### Feature flag'ler

Hepsi opsiyoneldir, default davranış `false` kabul edilir.

```env
NEXT_PUBLIC_ENABLE_BILLING=false
NEXT_PUBLIC_ENABLE_AI=false
NEXT_PUBLIC_ENABLE_CHAT=false
NEXT_PUBLIC_ENABLE_COMPARE=true
NEXT_PUBLIC_ENABLE_DOCS=false
NEXT_PUBLIC_ENABLE_PWA=false
```

## Troubleshooting

### Uygulama açılıyor ama bazı özellikler eksik

Bu genelde opsiyonel env eksikliğidir. Local geliştirmede aşağıdakiler eksik olabilir:

- Redis
- Turnstile
- Resend
- PostHog
- Iyzico

Çekirdek akışlar yine çalışmalıdır.

### DB scriptleri hata veriyor

Önce env doğrulayın:

```bash
npm run db:check-env
```

Ardından `SUPABASE_DB_URL` ve Supabase key'lerini kontrol edin.

### E2E wizard testi login aşamasında kalıyor

Muhtemel nedenler:

- demo kullanıcı seed edilmedi
- `SUPABASE_DEMO_USER_PASSWORD` yanlış
- local database bootstrap tamamlanmadı

### Production'da kayıt/login çalışmıyor

**Hızlı Tanı:**
```bash
npm run diagnose
```

Bu script otomatik olarak tüm production sorunlarını kontrol eder.

**Detaylı Troubleshooting:**
Detaylı çözümler için [`docs/PRODUCTION_TROUBLESHOOTING.md`](docs/PRODUCTION_TROUBLESHOOTING.md) dosyasına bakın.

**Yaygın Sorunlar:**
1. Supabase Email Provider kapalı
2. Site URL/Redirect URLs yanlış yapılandırılmış
3. Environment variables eksik veya yanlış
4. Email rate limit (ücretsiz tier: 4 email/saat)
5. Database migrations uygulanmamış
6. Profile trigger çalışmıyor

**Hızlı Çözüm Kontrol Listesi:**
- [ ] Supabase Dashboard > Auth > Providers > Email **enabled**
- [ ] Supabase Dashboard > Auth > URL Configuration doğru
- [ ] Vercel Environment Variables tanımlı
- [ ] `NEXT_PUBLIC_APP_URL` production domain'e ayarlı
- [ ] Database migrations uygulanmış (`npm run db:migrate`)
- [ ] Profile trigger mevcut (veya manuel profile creation aktif)

## Monitoring (Ücretsiz Tier)

### Hızlı Tanı

```bash
# Tüm sistemleri kontrol et
npm run diagnose
```

### Otomatik Monitoring

Proje 3 katmanlı ücretsiz monitoring ile gelir:

1. **GitHub Actions** (her 6 saatte)
   - Otomatik health check
   - Sorun varsa GitHub Issue oluşturur
   - Email bildirimi

2. **Vercel Cron** (her 6 saatte)
   - `/api/health-check` endpoint'i
   - Environment, database, auth kontrolü
   - Vercel Dashboard'da sonuçlar

3. **UptimeRobot** (manuel kurulum - 5 dakika)
   - Her 5 dakikada uptime kontrolü
   - Email/SMS alerts
   - Public status page

**Detaylı Kurulum:** [`docs/MONITORING_SETUP.md`](docs/MONITORING_SETUP.md) (15 dakika)

### Manuel Debug

**Vercel Logs:**
```bash
vercel logs --follow          # Real-time
vercel logs -n 100            # Son 100 log
```

**Supabase Logs:**
- Dashboard > Logs > Auth Logs (login/signup)
- Dashboard > Logs > API Logs (HTTP requests)
- Dashboard > Logs > Database Logs (SQL queries)

**Browser Console:**
- F12 > Console (JavaScript errors)
- F12 > Network (Failed requests)
- F12 > Application > Storage (Auth tokens)

**Detaylı Guide:** [`docs/FREE_TIER_MONITORING.md`](docs/FREE_TIER_MONITORING.md)

## Dokümantasyon

- `AGENTS.md`: ürün ve mimari kurallar
- `TASKS.md`: backlog ve kabul kriterleri
- `PROGRESS.md`: yapılan işler ve doğrulama geçmişi
- `docs/SECURITY.md`: güvenlik kararları
- `docs/SERVICE_ARCHITECTURE.md`: servis katmanı düzeni
- `docs/PRODUCTION_TROUBLESHOOTING.md`: production sorun çözümleri (50+ sayfa)
- `docs/PRODUCTION_QUICK_FIX.md`: 5 dakikada hızlı çözümler
- `docs/FREE_TIER_MONITORING.md`: ücretsiz monitoring stratejisi
- `docs/MONITORING_SETUP.md`: 15 dakikada monitoring kurulumu
