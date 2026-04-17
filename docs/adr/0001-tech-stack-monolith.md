# ADR 001: Next.js + Supabase Full-stack Monolith

## Durum
Kabul Edildi

## Bağlam
OtoBurada, hızlı pazar girişi (Time-to-Market) ve düşük bakım maliyeti hedefleyen bir MVP olarak kurgulanmıştır. Ekibin odağı, karmaşık altyapı yönetimi yerine ürün özelliklerine ve kullanıcı deneyimine verilmelidir.

## Karar
Uygulamanın mimarisi için **Next.js (App Router)** ve backend servisi olarak **Supabase (Postgres, Auth, Storage, RLS)** seçilmiştir. Tüm uygulama tek bir repository içinde (Monolith) tutulacaktır.

- **Next.js:** Hem frontend hem de API katmanını (Server Actions/Route Handlers) tek bir framework içinde çözer.
- **Supabase:** DB yönetimi, kimlik doğrulama ve dosya depolama gibi "boilerplate" işleri servis olarak sunar.
- **RLS (Row Level Security):** Veri güvenliğini doğrudan DB seviyesinde çözerek backend kod yükünü azaltır.

## Sonuçlar
- **Hız:** Altyapı kurulumu için geçen süre minimize edildi.
- **Geliştirme Kolaylığı:** Yerel geliştirme ortamı tek bir komutla (`npm run dev`) ayağa kalkar.
- **Maliyet:** Serverless yapı sayesinde trafikle orantılı, düşük başlangıç maliyeti sağlanır.

## Trade-off’lar
- **Vendor Lock-in:** Supabase spesifik özelliklerine (RLS, Auth hooks vb.) bağımlılık oluşur. Ancak standart Postgres kullanımı bu riski hafifletir.
- **Monolith Sınırları:** Uygulama çok büyüdüğünde build süreleri uzayabilir; ancak bu aşamada "Modular Monolith" yaklaşımı ile yönetilebilir.
