# Documentation Index

[`docs/INDEX.md`](docs/INDEX.md) OtoBurada dokümantasyonunun merkezi katalogudur. Bu belge, hangi dokümanın bugün karar aldırdığını ve hangilerinin referans, audit veya archive niteliğinde olduğunu görünür kılar.

## Reading order

Bu bölüm onboarding amaçlı önerilen okuma sırasını verir; normatif source-of-truth hiyerarşisini tanımlamaz. Yeni bir geliştirici veya karar verici için önerilen başlangıç sırası şöyledir:

1. [`README.md`](../README.md)
2. [`AGENTS.md`](../AGENTS.md)
3. [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
4. [`TASKS.md`](../TASKS.md)
5. [`PROGRESS.md`](../PROGRESS.md)
6. [`RUNBOOK.md`](../RUNBOOK.md)

Çelişki çözümü için normatif öncelik [`AGENTS.md`](../AGENTS.md) içindeki source-of-truth sırası ve [`README.md`](../README.md) içindeki belge omurgası notu üzerinden okunmalıdır.

## Core backbone

Bu belgeler dokümantasyon omurgasının çekirdeğidir ve normatif öncelikleri [`AGENTS.md`](../AGENTS.md) ile [`README.md`](../README.md) içinde tanımlanır:

- [`AGENTS.md`](../AGENTS.md): Ürün, mimari ve kalite için anayasa niteliğindeki kurallar
- [`README.md`](../README.md): Depoya giriş noktası ve kısa yönlendirme
- [`TASKS.md`](../TASKS.md): Backlog, teslim sırası ve acceptance criteria
- [`PROGRESS.md`](../PROGRESS.md): Yapılan işler, kararlar ve doğrulama günlüğü
- [`RUNBOOK.md`](../RUNBOOK.md): Deploy, incident, rollback, cron ve operasyon prosedürleri

## Active docs

Bunlar bugün ürün, güven, mimari veya release kararı aldıran aktif belgelerdir:

- [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md): Ürün vizyonu, hedef kullanıcı ve değer önerisi
- [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md): Ürün düzeyi güven ve emniyet yaklaşımı
- [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md): Moderasyon karar çerçevesi ve uygulama ilkeleri
- [`docs/MONETIZATION.md`](docs/MONETIZATION.md): Freemium, doping ve profesyonel plan gelir modeli
- [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md): Production öncesi kalite, güvenlik ve operasyon kapıları
- [`docs/DOCUMENTATION_GOVERNANCE.md`](docs/DOCUMENTATION_GOVERNANCE.md): Belge sahipliği, sınıflandırma ve güncelleme kuralları
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md): Ortak terimler ve standart tanımlar
- [`docs/SECURITY.md`](docs/SECURITY.md): Teknik güvenlik referansı
- [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md): Güncel servis katmanı standardı

## Reference docs

Bunlar aktif kararları destekleyen, daha çok operasyonel veya teknik yardımcı dokümanlardır:

- [`docs/PRODUCTION_TROUBLESHOOTING.md`](docs/PRODUCTION_TROUBLESHOOTING.md)

Bu kategorideki belge sayısı ileride artabilir; ancak ürün ve politika kaynağı olarak değil yardımcı referans olarak değerlendirilmelidir.

## Audit docs

Bunlar inceleme, denetim veya faz bazlı değerlendirme çıktılarıdır. Bu klasördeki belgeler açıkça tarihsel/ikincil kabul edilir ve güncel source of truth yerine geçmez:

- [`docs/audit/README.md`](docs/audit/README.md)
- [`docs/audit/ARCHITECTURE_REVIEW_REPORT.md`](docs/audit/ARCHITECTURE_REVIEW_REPORT.md)
- [`docs/audit/CODE_REVIEW_PLAN.md`](docs/audit/CODE_REVIEW_PLAN.md)
- [`docs/audit/FAZ_2_GUVENLIK_YETKILENDIRME.md`](docs/audit/FAZ_2_GUVENLIK_YETKILENDIRME.md)
- [`docs/audit/FAZ_3_API_ROUTE_HANDLERLAR.md`](docs/audit/FAZ_3_API_ROUTE_HANDLERLAR.md)
- [`docs/audit/FAZ_4_SERVISLER_UYGULAMALAR_MANTIGI.md`](docs/audit/FAZ_4_SERVISLER_UYGULAMALAR_MANTIGI.md)
- [`docs/audit/FAZ_5_DOMAIN_LOGIC_DURUM_MAKINELERI.md`](docs/audit/FAZ_5_DOMAIN_LOGIC_DURUM_MAKINELERI.md)
- [`docs/audit/FAZ_6_UI_UX_KOMPONENTLER.md`](docs/audit/FAZ_6_UI_UX_KOMPONENTLER.md)
- [`docs/audit/FAZ_7_ADMIN_PANEL_MODERASYON.md`](docs/audit/FAZ_7_ADMIN_PANEL_MODERASYON.md)
- [`docs/audit/FAZ_8_PERFORMANS_OLCEKLENEBILIRLIK.md`](docs/audit/FAZ_8_PERFORMANS_OLCEKLENEBILIRLIK.md)

## Archive docs

Tarihsel ama bugün ana karar kaynağı olmayan belgeler archive altında tutulur. Bu klasördeki belgeler aktif karar kaynağı değil, korunmuş geçmiş kaydıdır:

- [`docs/archive/DEPLOYMENT_CHECKLIST.md`](docs/archive/DEPLOYMENT_CHECKLIST.md)
- [`docs/archive/RUNTIME_ERRORS_FIX.md`](docs/archive/RUNTIME_ERRORS_FIX.md)

Bu turda markdown tabanlı fiziksel taşıma yapıldı; kök dizindeki eski giriş noktaları yalnız yönlendirme notu olarak bırakıldı.

## Governance note

Yeni belge eklenirse veya bir belge aktif setten düşerse önce [`docs/DOCUMENTATION_GOVERNANCE.md`](docs/DOCUMENTATION_GOVERNANCE.md) ilkeleri izlenmeli, ardından bu indeks güncellenmelidir. Bu indeks katalog görevi görür; normatif çelişki çözüm belgesi değildir.
