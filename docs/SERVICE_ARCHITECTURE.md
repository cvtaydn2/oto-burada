# Service Architecture

Bu belge OtoBurada servis katmanı standardının güncel referansıdır. Amaç, projede hangi dosyanın hangi sorumluluğu taşıdığını netleştirmek ve yeni geliştirmelerde tek bir baskın pattern kullanılmasını sağlamaktır.

Ürün kuralları [`AGENTS.md`](../AGENTS.md), operasyonel süreçler [`RUNBOOK.md`](../RUNBOOK.md), teknik güvenlik beklentileri [`docs/SECURITY.md`](docs/SECURITY.md) ve backlog yönü [`TASKS.md`](../TASKS.md) altındadır.

## Neden bu belge var

Kod tabanı çok sayıda refactor ve hardening fazından geçtiği için tarihsel olarak birden fazla servis yaklaşımı oluştu. Bu belge, bugün geçerli olan standardı açıklar ve eski pattern’lerin artık nasıl değerlendirilmesi gerektiğini netleştirir.

## Güncel standart

Varsayılan yaklaşım, server actions veya route handlers ile orkestre edilen fonksiyonel servis mimarisidir. Sorumluluk ayrımı aşağıdaki gibi kurulmalıdır.

### `*-actions.ts`

Bu dosyalar mutation veya server taraflı orkestrasyon giriş noktalarıdır.

Beklenen sorumluluklar:

- auth ve authorization kontrolü
- request seviyesinde giriş doğrulama
- iş akışının orkestrasyonu
- gerektiğinde cache revalidation
- serializable sonuç döndürme

Tipik örnek yüzeyler arasında [`actions.ts`](../src/app/dashboard/favorites/actions.ts:1) ve [`actions.ts`](../src/app/api/payments/actions.ts:1) bulunur.

### `*-records.ts`

Bu dosyalar veri erişim katmanıdır.

Beklenen sorumluluklar:

- Supabase sorguları
- CRUD işlemleri
- projection ve join kararları
- RLS uyumlu veri erişimi
- null guard ve veri şekillendirme

İş mantığı burada yoğunlaşmamalıdır. Bu katman veriyi alır, yazar veya minimum dönüştürür.

### `*-logic.ts`

Bu dosyalar saf veya büyük ölçüde saf iş mantığını taşır.

Beklenen sorumluluklar:

- domain kuralları
- hesaplamalar
- durum geçişleri
- validasyon yardımcıları
- stateless dönüşümler

Bu katman, UI veya DB detayına bağımlı olmadan çalışabilmelidir.

### `*-client.ts`

Bu dosyalar yalnız dış servis entegrasyonu için kullanılır.

Beklenen sorumluluklar:

- Iyzico, Resend veya benzeri üçüncü parti API sarmalaması
- HTTP client davranışı
- imzalama, request mapping ve response normalizasyonu

Bu katman uygulama business logic merkezi olmamalıdır. Sadece dış dünya ile konuşur.

## Domain katmanı ile ilişki

Bazı iş akışları tek bir servis dosyasından daha geniştir. Bu durumda [`src/domain/usecases`](../src/domain/usecases) altındaki use case dosyaları devreye girer.

Bu katman şu işlerde kullanılmalıdır:

- birden fazla servis veya feature arasında koordinasyon
- transaction veya idempotent süreç orkestrasyonu
- business workflow düzeyinde karar zincirleri

Saf domain kuralları ise [`src/domain/logic`](../src/domain/logic) altında tutulabilir.

## Karar ağacı

Yeni bir davranış eklerken dosya yeri seçimi için kısa karar ağacı:

- kullanıcıdan gelen bir mutation veya server-side işlem mi başlıyor → `*-actions.ts`
- doğrudan veritabanı okuma yazma mı yapılıyor → `*-records.ts`
- saf iş kuralı veya hesaplama mı yazılıyor → `*-logic.ts`
- üçüncü parti API ile mi konuşuluyor → `*-client.ts`
- birden fazla servis katmanını bağlayan iş akışı mı var → `domain/usecases/*`

## Güncel klasör yaklaşımı

Kod tabanı feature-first yapıya doğru evrilmiştir. Bu nedenle servis kodu yalnız kök [`src/services`](../src/services) altında değil, ilgili feature altında da yaşayabilir.

Pratikte iki geçerli konum vardır:

- paylaşılan veya yatay altyapı servisleri için [`src/services`](../src/services)
- feature’e sıkı bağlı servisler için [`src/features`](../src/features) altındaki `services` klasörleri

Önemli olan fiziksel klasörden çok sorumluluk ayrımı ve isim standardıdır.

## Tercih edilen akış

Yeni feature geliştirmelerinde önerilen akış şöyledir:

1. Zod schema ve input shape netleştirilir
2. veri erişimi `*-records.ts` içinde yazılır
3. iş mantığı `*-logic.ts` içine çıkarılır
4. auth ve orkestrasyon `*-actions.ts` içinde kurulur
5. dış servis gerekiyorsa `*-client.ts` ile sınırlandırılır
6. gerekirse use case katmanında çok adımlı akış kurulur

## Anti-patternler

Aşağıdaki yaklaşımlar yeni kodda tercih edilmemelidir.

### Class-based service merkezleri

`export class PaymentService` benzeri yapılar tarihsel kalıntı olarak görülmelidir. Fonksiyonel yaklaşım tercih edilir. Bunun nedeni, test etme, sorumluluk ayrımı ve server action akışlarına entegrasyonun daha sade olmasıdır.

### Redundant client-service wrapper katmanı

Sadece REST veya API çağrısını gizleyen ince istemci wrapper’ları çoğu durumda gereksiz soyutlama üretir. Özellikle doğrudan server action kullanılabilecek yüzeylerde bu pattern büyütülmemelidir.

### Business logic’in UI veya records içine gömülmesi

JSX içinde karar ağacı, records katmanında karmaşık domain kuralı veya client içinde auth bypass mantığı birikmemelidir.

## Mimari beklentiler

Servis katmanında kalıcı beklentiler şunlardır:

- fonksiyonel yaklaşım, sınıf tabanlı yaklaşıma tercih edilir
- RLS client tarafından bypass edilmez
- hot path’lerde `SELECT *` kullanılmaz
- hatalar yutulmaz, anlamlı biçimde yüzeye taşınır
- side effect’ler transaction içinde bekletilmez
- ödeme, e-posta ve benzeri dış yan etkiler idempotent ve ayrıştırılmış tasarlanır
- dosya isimleri ve sorumluluklar tutarlı kalır

## Örnek referans alanlar

Kod tabanında bu pattern’in görüldüğü referans alanlar şunlardır:

- favoriler server action yüzeyi [`actions.ts`](../src/app/dashboard/favorites/actions.ts:1)
- ödeme action yüzeyi [`actions.ts`](../src/app/api/payments/actions.ts:1)
- domain use case örnekleri [`listing-create.ts`](../src/domain/usecases/listing-create.ts:1), [`payment-initiate.ts`](../src/domain/usecases/payment-initiate.ts:1)

## Refactor sırasında kontrol listesi

Mevcut bir servisi yeni standarda çekerken minimum kontrol:

1. mevcut public API ve import yüzeyini tespit et
2. veri erişimini `*-records.ts` içine ayır
3. saf iş kurallarını `*-logic.ts` içine çıkar
4. auth ve orkestrasyonu `*-actions.ts` katmanına al
5. gerekirse facade veya re-export ile geçiş uyumu sağla
6. testleri ve çağıran import’ları güncelle
7. dokümantasyonu bu belgeyle çelişmeyecek şekilde hizala

## Bu belgenin sınırı

Bu dosya tüm tarihsel migration listesini taşımaz. Ayrıntılı refactor geçmişi [`PROGRESS.md`](../PROGRESS.md) altında yaşar. Bu belge yalnız güncel standardı ve karar mantığını sabitlemek içindir.

## İlgili belgeler

- mimari kurallar: [`AGENTS.md`](../AGENTS.md)
- teknik güvenlik: [`docs/SECURITY.md`](docs/SECURITY.md)
- operasyonel prosedürler: [`RUNBOOK.md`](../RUNBOOK.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)
