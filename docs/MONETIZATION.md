# Monetization

Bu belge OtoBurada’nın freemium ve çok katmanlı gelir modelini açıklar. Ürün yönü [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md), güven yaklaşımı [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md) ve release/operasyonel sınırlar [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md), [`RUNBOOK.md`](../RUNBOOK.md) ile birlikte okunmalıdır.

## Temel ilke

OtoBurada’nın gelir modeli, çekirdek kullanıcı değerini zedelemeden gelir üretme üzerine kuruludur. Bireysel kullanıcının ücretsiz ilan yayınlayabilmesi ürün omurgasının parçasıdır ve ücretli katmanlar bu temel vaadi bozmamalıdır.

## Gelir tezi

Pazarın yerleşik oyuncularında yüksek ilan verme veya görünürlük maliyetleri güven ve dönüşüm bariyeri yaratır. OtoBurada bu bariyeri düşürürken şu yaklaşımı benimser:

- temel ilan verme ücretsiz kalır
- görünürlük artırıcı araçlar düşük bariyerli olur
- profesyonel satıcılar için daha net planlar sunulur
- premium servisler çekirdek akışın üzerinde opsiyonel katman olarak konumlanır

## Katmanlı model

### Katman 1 — Doping ve boosts

En erişilebilir gelir katmanıdır. Amaç, satıcının daha fazla görünürlük için küçük ve anlaşılır bir ödeme yapabilmesidir.

**Fiyatlandırma Stratejisi**: Piyasa liderlerine göre yaklaşık **%10'luk fiyat.** Örneğin:
- Anasayfa vitrin bir ilan için nakit 760 TL yerine **76 TL**
- Üst sıra 660 TL yerine **66 TL**
- Acil rozet 182 TL yerine **18 TL**

Bu yüzeylerde temel kural, ücretli görünürlüğün kullanıcı güvenini bozacak kadar agresif olmamasıdır.

### Katman 2 — Kurumsal veya profesyonel planlar

Daha fazla ilan limiti ve operasyonel kolaylık ihtiyacı olan satıcılar için planlar sunulur.

Tipik farklılaştırmalar:

- daha yüksek ilan limiti
- profesyonel satıcı rozeti
- paket içinde belirli doping hakları
- ileri seviye görünürlük veya raporlama yüzeyleri

Bu katman, bireysel kullanıcı deneyimini bozmadan profesyonel kullanıcıya ölçek kazandırmalıdır.

### Katman 3 — Premium servisler

Temel ilan verme akışının üzerinde duran opsiyonel servislerdir.

Örnek alanlar:

- ekspertiz randevusu
- araç geçmiş raporu
- AI destekli ilan açıklaması üretimi

Bu servisler, çekirdek ürünün çalışması için zorunlu olamaz ve dış servis kotaları veya entegrasyon sorunlarında ana akışı bozmamalıdır.

### Katman 4 — Ekosistem geliri

Daha ileri aşamalarda düşünülen ama MVP omurgasını belirlemeyen katmandır.

Örnek alanlar:

- kredi veya cüzdan kullanımı
- otomotiv yan sektör reklam alanları
- anonimleştirilmiş pazar içgörüleri

Bu katmanda güven ve veri minimizasyonu ilkeleri ayrıca korunmalıdır.

## Fiyatlandırma ilkeleri

Fiyatlandırma stratejisi şu prensiplere bağlı kalır:

- çekirdek ücretsiz değer önerisini zedeleme
- pazar liderlerine göre daha düşük bariyer oluşturma
- karmaşık plan ağacı üretmeme
- görünürlük ürünlerini şeffaf biçimde adlandırma
- kullanıcının ne satın aldığını ve ne sonuç bekleyeceğini açık anlatma

## Güven ile ilişki

Monetization kararları trust and safety yaklaşımına aykırı olamaz. Örneğin ücretli görünürlük, şüpheli veya düşük kaliteli içeriğin daha fazla yayılmasına yol açmamalıdır. Moderasyon kalitesi gelir hedefinden önce gelir.

## Ücretsiz tier uyumu

Proje dış servis ve altyapı açısından ücretsiz tier ile sürdürülebilir kalmalıdır. Gelir modelinin kendisi, sabit maliyet baskısı yaratacak bağımlılıklar üzerine kurulmamalıdır. Özellikle AI ve ödeme entegrasyonları kritik yol dışında fail-gracefully tasarlanmalıdır.

## Ürün karar etkileri

Bir monetization yüzeyi eklenirken şu sorular sorulmalıdır:

- bireysel ücretsiz kullanıcı için temel değer korunuyor mu
- bu yüzey güven veya adalet algısını zedeliyor mu
- kullanıcı için teklif yeterince anlaşılır mı
- dış servis arızası veya kota problemi ana akışı bozuyor mu
- profesyonel plan ile bireysel plan ayrımı net mi

## İlgili belgeler

- ürün yönü: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- güven yaklaşımı: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- sözlük: [`docs/GLOSSARY.md`](docs/GLOSSARY.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)