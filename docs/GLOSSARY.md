# Glossary

Bu belge OtoBurada dokümantasyonunda tekrar eden temel ürün, güvenlik ve operasyon terimlerini standartlaştırır. Amaç, ekip içinde aynı kavram için farklı kelimeler kullanılmasını azaltmak ve yeni katılan geliştiricinin dokümanları daha hızlı anlamasını sağlamaktır.

## Terimler

### OtoBurada

Yalnızca otomobil ilanlarına odaklanan, mobil-first, güven odaklı pazar yeri ürünü.

### Listing

Platformda yayınlanan otomobil ilanı. Türkçe dokümanlarda çoğunlukla ilan olarak anılır.

### Listing create flow

Kullanıcının yeni ilan oluşturduğu çok adımlı veya yönlendirmeli akış.

### Listing detail

Tek bir ilanın kamuya açık detay sayfası. Fiyat, araç bilgileri, satıcı sinyalleri ve iletişim aksiyonları burada yer alır.

### Marketplace

Arama, filtreleme, listeleme ve listing detail yüzeylerini kapsayan public ürün alanı.

### Seller

İlanı yayınlayan kullanıcı. Bireysel veya profesyonel olabilir.

### Professional seller

Daha yüksek ilan limiti veya profesyonel plan kullanan satıcı tipi.

### WhatsApp CTA

Satıcıyla ilk temas için kullanılan birincil aksiyon. MVP’de in-app chat’in önündedir.

### Moderation

İlan, kullanıcı veya raporlar üzerinde kalite ve güven kararlarının verilmesi süreci.

### Moderation queue

İnceleme bekleyen içerik veya aksiyonların admin tarafında işlendiği kuyruk mantığı.

### Trust signal

Kullanıcıya güven vermek için gösterilen ürün işareti. Rozet, doğrulama, hesap yaşı, profesyonel statü veya benzeri sinyalleri kapsar.

### Trust score

Satıcı veya hesap güvenine ilişkin açıklanabilir skorlama veya değerlendirme yaklaşımı.

### Abuse

Spam, dolandırıcılık, kötüye kullanım, automation suistimali veya platform kurallarını aşındıran davranışların genel adı.

### RLS

Row Level Security. Supabase ve Postgres tarafında veri erişimini satır seviyesinde sınırlayan ana güvenlik katmanı.

### Server action

Next.js içinde server tarafında çalışan, özellikle mutation ve orkestrasyon için kullanılan çağrı yüzeyi.

### Records layer

Doğrudan veritabanı erişimini taşıyan `*-records.ts` dosyaları.

### Logic layer

Saf veya büyük ölçüde saf iş kurallarını taşıyan `*-logic.ts` dosyaları.

### Client layer

Üçüncü parti servis entegrasyonlarını taşıyan `*-client.ts` dosyaları.

### Release readiness

Bir değişikliğin production’a alınmadan önce karşılaması gereken kalite, güvenlik, ürün ve operasyon kontrolleri.

### Graceful degradation

Opsiyonel servis veya entegrasyon yokken ana ürün akışının tamamen bozulmadan sınırlı ama kabul edilebilir şekilde çalışması.

### Free-tier only

Ürünün sabit ücretli üçüncü parti aboneliklere bağımlı olmadan, ücretsiz planlar veya kontrollü düşük maliyetli kullanım modeliyle çalışması ilkesi.

### Archive

Artık aktif karar aldırmayan fakat tarihsel değeri olan belge kümesi.

### Audit

Belirli bir dönem, alan veya risk üzerine yapılan denetim, inceleme veya analiz çıktıları.

### Active docs

Bugün karar aldıran, güncel referans olarak kullanılan belge seti.

## İlgili belgeler

- ürün yönü: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- güven yaklaşımı: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- mimari standart: [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)