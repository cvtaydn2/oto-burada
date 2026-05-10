# Moderation Policy

Bu belge OtoBurada’da ilan, kullanıcı ve güvenlik sinyalleri üzerinde hangi moderasyon kararlarının nasıl alındığını tanımlar. Ürün düzeyi güven yaklaşımı [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md), teknik korumalar [`docs/SECURITY.md`](docs/SECURITY.md) ve operasyonel süreçler [`RUNBOOK.md`](../RUNBOOK.md) ile birlikte okunmalıdır.

## Amaç

Moderasyon politikasının amacı, platform kalitesini, kullanıcı güvenini ve pazar bütünlüğünü korumaktır. Bu politika, yalnız iç ekip için değil ürün kararları için de referans niteliğindedir.

## Moderasyonun kapsamı

Moderasyon özellikle şu alanlarda uygulanır:

- yeni veya güncellenen ilanlar
- kullanıcıdan gelen raporlar
- şüpheli satıcı veya alıcı davranışı
- yanlış kategori, yanıltıcı bilgi veya sahte içerik
- abuse ve dolandırıcılık sinyalleri

## Temel ilkeler

### Tutarlılık

Benzer ihlaller benzer sonuç üretmelidir. Kararlar moderatöre göre değişen kişisel yorumlara dayanmamalıdır.

### Açıklanabilirlik

İlan reddi, askıya alma veya ek inceleme gibi sonuçlar anlaşılır gerekçeyle desteklenmelidir.

### Orantılılık

Her ihlal kalıcı yaptırım gerektirmez. İçeriğin ve davranışın şiddetine göre kademeli yaklaşım uygulanmalıdır.

### Pazar bütünlüğü

Platformun güvenilir görünmesi, kısa vadeli ilan hacminden daha önemlidir. Şüpheli veya düşük güvenli içeriğin yayına alınması büyüme metriği için kabul edilmez.

## Moderasyon kapsamına giren ilan sorunları

Aşağıdaki durumlar inceleme veya aksiyon sebebidir:

- araç bilgileri açık biçimde tutarsız veya yanıltıcıysa
- görseller aracı temsil etmiyorsa veya tekrar eden sahte kullanım şüphesi varsa
- fiyat, açıklama veya iletişim alanları dolandırıcılık işareti taşıyorsa
- yasaklı, uygunsuz veya alakasız içerik girilmişse
- araç dışı ürün veya hizmet otomobil ilanı gibi sunuluyorsa
- ilan, ürün stratejisindeki yalnız otomobil kuralını ihlal ediyorsa

## Kullanıcı davranışı kaynaklı sorunlar

Aşağıdaki davranışlar ayrıca moderasyon veya kısıtlama sebebidir:

- tekrar eden spam veya aldatıcı temas denemeleri
- raporlama sisteminin kötüye kullanımı
- ban veya kısıtı aşmaya yönelik tekrar eden hesap davranışı
- profesyonel hesap gerektiren davranışın bireysel hesap üzerinden sürdürülmesi
- platform dışı riskli ödeme yönlendirmeleri

## Olası karar sonuçları

Tipik moderasyon sonuçları şunlardır:

- onay
- red
- ek inceleme veya beklemeye alma
- düzenleme talebi
- geçici kısıtlama
- kalıcı ban veya görünürlük kaldırma

Uygulama düzeyindeki gerçek statü ve geçişler kod tabanı ile uyumlu tutulmalıdır. Bu belge politika çerçevesini verir; teknik statü isimlerinin kaynağı ürün ve sistem gerçekliğidir.

## Red veya kısıtlama gerekçeleri

Karar dili kısa, tutarlı ve kullanıcıya anlaşılır olmalıdır. Tipik gerekçe kategorileri:

- yanlış veya eksik araç bilgisi
- yetersiz veya şüpheli görsel seti
- fiyat veya açıklamada aldatıcı ifade
- platform dışı riskli yönlendirme
- tekrar eden kural ihlali
- otomobil dışı içerik

## Moderatör beklentileri

Moderatörlerden beklenenler:

- aynı ihlal için benzer aksiyon almak
- riskli içeriği şüphe varsa yayına almak yerine incelemeye çekmek
- kullanıcıya gereksiz sert ama belirsiz olmayan açıklama sunmak
- not ve gerekçe alanlarını operasyonel fayda sağlayacak biçimde kullanmak

## Ürün ve operasyon ilişkisi

Moderasyon politikası yalnız admin paneli için yazılmaz. Listing create, listing edit, seller trust sinyalleri ve raporlama UX’i bu politikayla uyumlu olmalıdır. Bir ürün yüzeyi, politika tarafından uygulanamayacak beklenti üretmemelidir.

## Escalation yaklaşımı

Aşağıdaki durumlar daha yüksek dikkat gerektirir:

- organize dolandırıcılık şüphesi
- birden fazla kullanıcı raporunun aynı hesapta toplanması
- ödeme, sahte link veya kimlik taklidi göstergeleri
- banlı davranışın yeni hesaplarla devam etmesi

Bu durumlarda görünürlük azaltma, askıya alma veya ek teknik inceleme birlikte değerlendirilmelidir.

## İlgili belgeler

- ürün yönü: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- güven yaklaşımı: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- teknik güvenlik: [`docs/SECURITY.md`](docs/SECURITY.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)