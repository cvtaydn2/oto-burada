# Release Readiness

Bu belge OtoBurada’nın yayına uygunluk çerçevesini tanımlar. Operasyonel prosedürler [`RUNBOOK.md`](../RUNBOOK.md), backlog öncelikleri [`TASKS.md`](../TASKS.md), yapılan doğrulamalar [`PROGRESS.md`](../PROGRESS.md) ve teknik güvenlik beklentileri [`docs/SECURITY.md`](docs/SECURITY.md) ile birlikte okunmalıdır.

## Amaç

Release readiness, bir değişikliğin production’a alınmadan önce hangi minimum kalite, güvenlik, ürün ve operasyon kontrollerinden geçmesi gerektiğini tek yerde toplar.

## Çekirdek yayın kapıları

Aşağıdaki kapılar, production öncesi temel beklentidir:

- [`npm run lint`](../package.json:10)
- [`npm run typecheck`](../package.json:11)
- [`npm run build`](../package.json:8)

Bu üç kapı temiz değilse değişiklik production-ready kabul edilmez.

## Ürün odaklı yayın kontrolleri

Değişiklik türüne göre aşağıdaki yüzeyler ayrıca gözden geçirilmelidir:

- listing create akışı
- marketplace arama ve filtreleme akışı
- listing detail ve WhatsApp CTA görünürlüğü
- auth ve dashboard erişimi
- admin moderasyon yüzeyleri
- SEO etkileyen public route değişiklikleri

## Güven ve güvenlik kapıları

Aşağıdaki alanlarda regresyon bırakılmamalıdır:

- public mutation endpoint korumaları
- auth, yetki ve sahiplik kontrolleri
- RLS uyumu
- rate limiting ve abuse guard’ları
- hassas veri veya secret sızıntısı olmaması
- moderasyon ve trust sinyalleriyle çelişen ürün akışı olmaması

Teknik referans için [`docs/SECURITY.md`](docs/SECURITY.md), politika referansları için [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md) ve [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md) kullanılır.

## Operasyonel hazır oluş

Release öncesi ekip en az şu başlıklarda net olmalıdır:

- gerekli env değişkenleri tam mı
- migration uygulanacaksa sıra ve geri dönüş planı hazır mı
- cron veya background job etkisi var mı
- deploy sonrası smoke kontrolü kim tarafından yapılacak
- rollback ihtiyacı olursa hangi güvenli yol izlenecek

Bu başlıkların operasyonel detayları [`RUNBOOK.md`](../RUNBOOK.md) altında yaşar.

## Migration etkili release’ler

Şema değişikliği içeren release’lerde ekstra dikkat gerekir.

Kontrol alanları:

- migration idempotent mi
- geriye dönük uyum korunuyor mu
- tipler veya query kontratları etkileniyor mu
- RLS policy değişimi varsa doğrulandı mı
- rollback senaryosu düşünülmüş mü

## Ücretsiz tier ve graceful degradation kontrolleri

OtoBurada ücretsiz tier sınırlarıyla uyumlu çalışmalıdır. Bu yüzden release değerlendirmesinde şu soru sorulmalıdır:

- Redis yoksa veya sorunluysa kritik yüzeyler güvenli degrade oluyor mu
- e-posta servisi yoksa ana akış bozuluyor mu
- ödeme veya AI entegrasyonu yoksa temel kullanıcı değeri korunuyor mu
- Sentry veya izleme kısıtları altında anlamlı sinyal kalıyor mu

## Dokümantasyon kapısı

Yayına çıkan değişiklik, ilgili dokümanı güncellemeden tamamlanmış sayılmamalıdır. En az şu belgeler etki analizine göre güncellenir:

- backlog etkisi varsa [`TASKS.md`](../TASKS.md)
- karar ve doğrulama kaydı için [`PROGRESS.md`](../PROGRESS.md)
- operasyon etkisi varsa [`RUNBOOK.md`](../RUNBOOK.md)
- güvenlik etkisi varsa [`docs/SECURITY.md`](docs/SECURITY.md)
- ürün veya politika etkisi varsa ilgili aktif docs belgeleri

## Release karar soruları

Production öncesi kısa karar seti:

1. kalite kapıları temiz mi
2. çekirdek kullanıcı akışları bozulmadan çalışıyor mu
3. güvenlik ve RLS sınırları korunuyor mu
4. migration veya env değişikliği kontrol altında mı
5. rollback yolu açık mı
6. dokümantasyon güncel mi

Bu sorulardan biri net hayır ise release bekletilmelidir.

## İlgili belgeler

- runbook: [`RUNBOOK.md`](../RUNBOOK.md)
- teknik güvenlik: [`docs/SECURITY.md`](docs/SECURITY.md)
- güven yaklaşımı: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- moderasyon politikası: [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md)
- gelir modeli: [`docs/MONETIZATION.md`](docs/MONETIZATION.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)