# OtoBurada Runbook

Bu belge operasyonel gerçekliğin merkezidir. Deploy, environment, migration, incident, rollback, cron ve release gate prosedürleri burada tutulur. Ürün yönü için [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md), backlog için [`TASKS.md`](TASKS.md), yapılan işler için [`PROGRESS.md`](PROGRESS.md) ve teknik güvenlik kararları için [`docs/SECURITY.md`](docs/SECURITY.md) okunmalıdır.

## Amaç ve kapsam

Runbook şu sorulara cevap verir:

- sistemi güvenli biçimde nasıl deploy ederiz
- kritik env değişkenleri nelerdir
- migration ve rollback nasıl yönetilir
- incident sırasında hangi sırayla hareket edilir
- cron, monitoring ve quality gate’ler nasıl doğrulanır
- release öncesi minimum operasyonel kontrol nedir

Bu dosya ürün stratejisini veya tarihsel geliştirme günlüğünü tekrar etmez. Uzun tarihsel bağlam [`PROGRESS.md`](PROGRESS.md), aktif release çerçevesi ise [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) altındadır.

## Operasyonel bağlam

- stack: Next.js App Router, Supabase, Vercel, Upstash Redis, Sentry, Resend
- dağıtım modeli: tek full-stack uygulama
- ortamlar: Local, Preview, Production
- yaklaşım: ücretsiz tier ile sürdürülebilir, fail-gracefully çalışan MVP

## Deployment

### Normal deploy

Ana akış `main` branch üzerinden production deploy’dur.

Temel sıra:

1. pull request kalite kapılarından geçer
2. `main` branch’e merge edilir
3. Vercel production deploy’u otomatik alır
4. deploy sonrası health ve kritik akış smoke kontrolü yapılır

### Preview deploy

Her branch için preview deploy, QA ve ürün kontrolü için kullanılır. Production verisi üzerinde geri dönülmez manuel operasyon yapılmamalıdır.

### Deploy sonrası minimum kontrol

Deploy sonrası en az şu yüzeyler doğrulanmalıdır:

- public homepage
- listing results page
- listing detail page
- login veya register akışı
- dashboard erişimi
- admin erişimi gerekiyorsa moderasyon ekranı
- [`/api/health`](src/app/api:1) benzeri sağlık yüzeyi

## Environment yönetimi

### Ortamlar

- Local: geliştirici makinesi ve `.env.local`
- Preview: branch bazlı QA ortamı
- Production: canlı kullanıcı trafiği

### Çekirdek environment değişkenleri

Uygulamanın anlamlı biçimde açılması için tipik çekirdek değişkenler:

- `NEXT_PUBLIC_APP_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_DB_URL`

Production için kritik ek değişkenler:

- `CRON_SECRET`
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`

Opsiyonel fakat önemli entegrasyonlar:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL`
- `IYZICO_API_KEY`
- `IYZICO_SECRET_KEY`
- `SUPABASE_STORAGE_BUCKET_LISTINGS`
- `SUPABASE_STORAGE_BUCKET_DOCUMENTS`

### Env senkronizasyonu

Yerel ortamı Vercel ile hizalamak gerektiğinde:

```bash
npm run vercel:pull
```

### Başlangıç doğrulaması

Environment doğrulama mantığı [`env-validation.ts`](src/lib/env-validation.ts:1) içinde tutulur. Production hata ayıklamada önce environment eksikliği kontrol edilmelidir.

## Database ve migration operasyonu

### İlkeler

- uygulanmış migration dosyası geriye dönük düzenlenmez
- yeni değişiklik yeni migration ile gelir
- migration idempotent yazılır
- migration sonrası tipler ve kalite kapıları yeniden doğrulanır
- mümkün olduğunda production öncesi preview veya eşdeğer güvenli ortamda test edilir

### Kaynak dosyalar

- tam şema kaynağı: [`database/schema.snapshot.sql`](database/schema.snapshot.sql)
- migration klasörü: [`database/migrations`](database/migrations)
- aktif migration listesi: [`database/migrations/.active-migrations.txt`](database/migrations/.active-migrations.txt)

### Uygulama sırası

Tercih sırası:

1. yönetimli Supabase uygulaması veya kontrollü otomasyon
2. [`npm run db:migrate`](package.json:18)
3. gerekirse Supabase SQL Editor ile kontrollü manuel uygulama

### Migration sonrası zorunlu kontroller

En az aşağıdakiler yeniden çalıştırılmalıdır:

- [`npm run lint`](package.json:10)
- [`npm run typecheck`](package.json:11)
- [`npm run build`](package.json:8)

RLS veya performans etkileyen değişikliklerde ayrıca [`docs/SECURITY.md`](docs/SECURITY.md) ve danışman çıktıları gözden geçirilmelidir.

## Health, monitoring ve gözlemlenebilirlik

### Sağlık kontrolü

Ana sağlık kontrolü production domain altında çalışan health endpoint üzerinden yapılmalıdır. Yanıt en azından uygulama, environment ve veritabanı erişimi hakkında sinyal vermelidir.

### İzlenecek ana sinyaller

- production hata oranı
- auth başarısızlıklarında ani artış
- listing create ve payment akış hataları
- cron başarısızlıkları
- DB erişim gecikmesi veya connection saturation
- rate limit fallback kullanımında sıçrama

### Araçlar

- Vercel deployment ve function logları
- Sentry issue ve release görünümü
- Supabase dashboard, loglar ve query performance görünümü
- gerekiyorsa harici uptime monitörü

### Monitoring yaklaşımı

Ücretsiz tier odağından dolayı gürültülü ve düşük değerli event’ler biriktirilmemelidir. Session replay gibi maliyetli veya gereksiz yüzeyler varsayılan olarak kapalı tutulur.

## Quality gates

### Merge öncesi zorunlu kapılar

- [`npm run lint`](package.json:10)
- [`npm run typecheck`](package.json:11)
- [`npm run build`](package.json:8)

### Hedefli doğrulama

Kapsama göre kritik test yüzeyleri ayrıca doğrulanmalıdır. Özellikle auth, marketplace query, admin moderasyon, güvenlik ve listing create akışları etkilenmişse hedefli test seti seçilmelidir.

### Release readiness ilişkisi

Runbook operasyonel prosedürü tanımlar. Yayına uygunluk kapıları ve karar çerçevesi [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md) altında tutulur.

## Rollback

### Kod rollback

Kod kaynaklı production kırığında önce son sağlıklı deploy’a dönülür. Vercel promote veya git revert yaklaşımı kullanılabilir. Kod rollback’i mümkün olduğunca veritabanı rollback’inden önce değerlendirilmelidir.

### Database rollback

Her rollback kontrollü ve etkisi anlaşılmış şekilde yapılmalıdır. Özellikle kolon silme, tip değişimi, policy daraltma veya function sözleşmesi değişimlerinde veri uyumu ayrıca değerlendirilir.

### Cache ve entegrasyonlar

Stale cache veya entegrasyon token problemi varsa ilgili Redis, Vercel veya üçüncü parti entegrasyon katmanı ayrıca temizlenmeli ya da rotate edilmelidir.

## Cron işleri

Cron işleri kritik yan etkileri transaction dışında, güvenli ve idempotent biçimde yürütmelidir. Her cron endpoint’i yetkisiz çağrıya kapalı olmalı ve secret doğrulaması kullanmalıdır.

Cron eklenirken minimum beklenti:

- route handler oluştur
- cron secret doğrulaması ekle
- zamanlama kaydını deploy konfigürasyonuna ekle
- bu runbook içinde iş amacı ve doğrulama notunu güncelle

## Incident response

### Öncelik seviyeleri

- P0: site erişilemez, veri kaybı veya ana akış tamamen durmuş
- P1: listing create, auth, arama gibi çekirdek akış kırık
- P2: önemli ama alternatifli özellik kırık
- P3: düşük etkili UX veya operasyonel kusur

### P0 yaklaşımı

Sıra şu şekilde ilerler:

1. health endpoint’i kontrol et
2. son deploy ve function loglarını kontrol et
3. Supabase durumunu ve DB erişimini kontrol et
4. environment değişikliği veya secret rotasyonu olup olmadığını doğrula
5. kod kaynaklı ise rollback değerlendir
6. veri veya entegrasyon kaynaklı ise etkili yüzeyi izole et
7. kullanıcı etkisini azaltacak güvenli iletişim ve bakım adımını uygula

### Yaygın failure sınıfları

- Supabase erişim hatası
- eksik veya bozuk production env
- migration drift
- cron secret eksikliği
- rate limiting altyapı kesintisi
- ödeme veya mail servisinde üçüncü parti arıza

## Secrets rotation

Rotate gereken ana yüzeyler:

- Supabase service role key
- cron secret
- Upstash Redis token
- Sentry token veya DSN ilişkili ayarlar
- Resend ve ödeme anahtarları

Rotation sonrası zorunlu aksiyonlar:

- ilgili env değerini güncelle
- deploy veya yeniden yükleme yap
- health ve kritik akış smoke kontrolü çalıştır

## Seed ve bootstrap notları

Yeni veya boş ortama kurulum gerektiğinde tipik sıra:

1. şemayı uygula
2. migration’ları uygula
3. referans veriyi yükle
4. demo veya test kullanıcılarını oluştur
5. health ve auth akışını doğrula

Bu akışta kullanılan komutlar [`README.md`](README.md) içindeki hızlı başlangıç bölümünde listelenmiştir.

## İlgili belgeler

- ürün yönü: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- güven politikası: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- moderasyon politikası: [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md)
- gelir modeli: [`docs/MONETIZATION.md`](docs/MONETIZATION.md)
- teknik güvenlik: [`docs/SECURITY.md`](docs/SECURITY.md)
- servis katmanı standardı: [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- dokümantasyon yönetişimi: [`docs/DOCUMENTATION_GOVERNANCE.md`](docs/DOCUMENTATION_GOVERNANCE.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)
