# Documentation Governance

Bu belge OtoBurada dokümantasyon sisteminin nasıl yönetileceğini tanımlar. Amaç, aktif bilgi ile tarihsel veya denetim amaçlı bilgi arasındaki ayrımı korumak, tekrarları azaltmak ve yeni ekip üyelerinin doğru belgeye hızlıca ulaşmasını sağlamaktır.

Merkezi katalog [`docs/INDEX.md`](docs/INDEX.md) altındadır. Ürün yönü [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md), backlog [`TASKS.md`](../TASKS.md), karar günlüğü [`PROGRESS.md`](../PROGRESS.md) ve operasyon bilgisi [`RUNBOOK.md`](../RUNBOOK.md) üzerinden yönetilir. Katalog ve önerilen okuma sırası ile normatif source-of-truth önceliği farklı kavramlardır; çelişki çözümü için [`AGENTS.md`](../AGENTS.md) ve [`README.md`](../README.md) içindeki öncelik notları esas alınır.

## İlkeler

### Tek sorumlu belge mantığı

Her bilgi türünün baskın bir evi olmalıdır. Aynı içerik birden fazla yerde uzun uzun tekrar edilmemelidir.

### Aktif ve tarihsel ayrımı

Bugün karar aldıran belgeler aktif set içinde tutulur. Tarihsel audit, faz raporu veya bir defalık inceleme çıktıları ayrı kategoride kalır.

### Kısa merkez, detaylı yan belge

[`README.md`](../README.md) ve [`docs/INDEX.md`](docs/INDEX.md) kısa ve yönlendirici kalmalıdır. Derin detay ilgili tematik belgede yaşamalıdır.

### Güncel gerçeklik önceliği

Kod veya süreç değiştiğinde, ilgili source of truth belge güncellenmeden iş tamamlanmış sayılmaz.

## Belge rollerinin sözleşmesi

### Kök belgeler

- [`AGENTS.md`](../AGENTS.md): anayasa, değişmesi en zor kurallar
- [`README.md`](../README.md): giriş noktası ve yönlendirme
- [`TASKS.md`](../TASKS.md): backlog ve acceptance criteria
- [`PROGRESS.md`](../PROGRESS.md): karar, uygulama ve doğrulama günlüğü
- [`RUNBOOK.md`](../RUNBOOK.md): deploy, incident, rollback, cron ve operasyon

### Aktif `docs` seti

Aktif `docs` belgeleri ürün, güven, mimari veya release kararında bugün kullanılabilen belgelerdir. Örnekler:

- [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md)
- [`docs/MONETIZATION.md`](docs/MONETIZATION.md)
- [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- [`docs/SECURITY.md`](docs/SECURITY.md)
- [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md)
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md)

### Reference, audit ve archive

- reference: operasyonel veya teknik yardımcı belgeler
- audit: denetim, inceleme, faz bazlı gözlem çıktıları
- archive: artık aktif karar aldırmayan ama tarihsel değeri olan belgeler

Bu görev turunda katalog ayrımı fiziksel markdown yerleşimiyle hizalanmıştır. Kök dizinde tarihsel bir markdown bırakılacaksa, içerik yerine yalnız kanonik konuma yönlendiren kısa bir not taşımalıdır.

## Güncelleme kuralları

Bir değişiklik yapıldığında şu sorular sorulur:

- bu değişiklik ürün yönünü etkiliyor mu
- backlog veya acceptance criteria değişiyor mu
- operasyon veya release prosedürü etkileniyor mu
- güvenlik veya moderasyon politikası etkileniyor mu
- yalnız tarihsel kayıt mı gerekiyor

Buna göre uygun belge güncellenir; gerekmedikçe birden fazla yere aynı açıklama eklenmez.

## Yeni belge ekleme kuralları

Yeni belge eklenmeden önce:

1. mevcut belgelerden biri kapsamı karşılıyor mu kontrol edilir
2. gerçekten yeni bir bilgi evi gerekiyorsa belge açılır
3. belge [`docs/INDEX.md`](docs/INDEX.md) içine uygun kategoriyle eklenir
4. belge sahibi veya güncelleme bağlamı netleştirilir

## Belge emekliliği

Bir belge artık aktif karar aldırmıyorsa ama tarihsel değer taşıyorsa katalogda aktif setten çıkarılmalı ve uygun kategori altında gösterilmelidir. Tercih edilen yaklaşım, belgenin kanonik kopyasını [`docs/archive`](archive) veya [`docs/audit`](audit) altına taşımak ve eski konumda yalnız kısa bir yönlendirme notu bırakmaktır.

## Yazım standardı

Belgeler şu standardı izlemelidir:

- kısa giriş ve amaç bölümü
- açık kapsam ve sınır tanımı
- tekrar yerine referans bağlantısı
- kod veya dosya referanslarında mümkünse somut link kullanımı
- ürün, güvenlik ve operasyon belgeleri arasında çelişki bırakmama

## Dokümantasyon kalite checklist

Bir belge güncellemesi şu koşulları sağlamalıdır:

- rolü açık mı
- başka bir belgeyi gereksiz tekrar ediyor mu
- indeks içinde bulunabilir mi
- mevcut ürün ve mimari gerçeklikle uyumlu mu
- tarihsel not ile aktif kural birbirine karışmış mı

## İlgili belgeler

- katalog: [`docs/INDEX.md`](docs/INDEX.md)
- ürün yönü: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- backlog: [`TASKS.md`](../TASKS.md)
- karar günlüğü: [`PROGRESS.md`](../PROGRESS.md)
- operasyon: [`RUNBOOK.md`](../RUNBOOK.md)