# Trust and Safety

Bu belge OtoBurada’nın ürün düzeyi güven ve emniyet yaklaşımını tanımlar. Teknik kontroller için [`docs/SECURITY.md`](docs/SECURITY.md), moderasyon karar kuralları için [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md), ürün yönü için [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md) okunmalıdır.

## Amaç

OtoBurada’nın güven yaklaşımı, kullanıcıların otomobil ilanlarını daha az risk, daha yüksek şeffaflık ve daha net beklenti ile değerlendirmesini sağlamaktır. Amaç yalnız kötü aktörleri engellemek değil, aynı zamanda dürüst kullanıcıların platformu güvenli hissetmesini sağlamaktır.

## Kapsam

Bu belge şu alanları kapsar:

- kullanıcı güvenini artıran ürün sinyalleri
- abuse ve dolandırıcılık risklerinin azaltılması
- moderasyonla ürün deneyimi arasındaki ilişki
- satıcı, alıcı ve platform risklerinin dengelenmesi

## Temel ilkeler

### Güven varsayılmaz, inşa edilir

Kullanıcı güveni, açıklanabilir süreçler, görünür işaretler ve tutarlı politika uygulaması ile oluşur. Rozetler veya etiketler tek başına yeterli değildir.

### Hız güveni bozmamalı

İlan verme veya iletişim akışı hızlı olabilir; ancak riskli yüzeylerde yeterli kontrol katmanı korunmalıdır.

### Kötüye kullanım en erken noktada bastırılmalı

Spam, sahte ilan, dolandırıcılık denemesi ve kötü niyetli temas girişimleri yalnız şikayet sonrası değil, mümkün olduğunca erken aşamada sınırlandırılmalıdır.

### Moderasyon görünmez değil, anlaşılır olmalı

Kullanıcılar ilanlarının neden beklediğini, reddedildiğini veya kısıtlandığını anlaşılır biçimde görebilmelidir.

## Ana risk alanları

Platformun en önemli trust and safety riskleri şunlardır:

- sahte veya yanıltıcı otomobil ilanları
- kopya görsel veya sahte araç bilgisi
- WhatsApp üzerinden sahte ödeme veya kapora dolandırıcılığı
- spam mesajlaşma veya tekrar eden temas tacizi
- banlı veya kısıtlı kullanıcıların görünürlük kazanması
- profesyonel satıcıların bireysel kullanıcı gibi davranarak kuralları aşması

## Ürün düzeyi güven sinyalleri

Kullanıcıya güven veren sinyaller sade ama anlamlı olmalıdır. Örnek sinyaller:

- satıcı doğrulama veya hesap yaşı göstergeleri
- profesyonel satıcı rozeti
- güven puanı veya benzeri açıklanabilir sinyaller
- moderasyon durumu ve ilan statüsü
- raporlama veya şüpheli içerik bildirme aksiyonları
- telefon veya iletişim gizliliği konusunda açıklayıcı rozetler

Bu sinyaller görsel süs değil, gerçek kural ve süreçlerle desteklenmelidir.

## Kullanıcı temas güvenliği

WhatsApp CTA MVP için birincil temas yöntemidir. Bu nedenle platform, kullanıcıya aşağıdaki riskleri açıkça anlatmalıdır:

- platform dışı ödeme linklerine güvenilmemesi
- kapora veya hızlı ödeme baskısına dikkat edilmesi
- şüpheli satıcı davranışının raporlanması
- kişisel bilgi paylaşımında dikkatli olunması

Temas deneyimi satış dönüşümünü hızlandırırken dolandırıcılık farkındalığını da artırmalıdır.

## Abuse önleme yaklaşımı

Riskli yüzeylerde tipik koruma mekanizmaları şunlardır:

- rate limiting
- auth ve sahiplik kontrolleri
- input validation ve sanitization
- RLS ile veri görünürlüğü sınırları
- moderasyon kuyrukları
- raporlama ve escalation akışları

Detaylı teknik uygulama referansı [`docs/SECURITY.md`](docs/SECURITY.md) altındadır.

## Moderasyonla ilişki

Trust and safety yaklaşımı ile moderasyon politikası ayrıdır ama birlikte çalışır. Bu belge, neden ve neyi koruduğumuzu anlatır. [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md) ise hangi durumda nasıl aksiyon alındığını tanımlar.

## Kullanıcı deneyimi ilkeleri

Güven yüzeyleri şu deneyim prensiplerini izlemelidir:

- korku dili yerine net uyarı dili kullan
- kullanıcıyı karar veremez hale getirecek aşırı alarm üretme
- risk sinyalini bağlam içinde göster
- raporlama aksiyonunu görünür ama saldırgan olmayan biçimde sun
- moderasyon bekleme durumunda belirsizlik bırakma

## Operasyonel beklentiler

Trust and safety alanında ekipten beklenenler:

- riskli yüzeylerde kararları belgelemek
- moderasyon ve güven dokümanlarını güncel tutmak
- ürün ve teknik güvenlik belgeleri arasında çelişki bırakmamak
- release öncesi yüksek riskli değişikliklerde güven etkisini ayrıca değerlendirmek

## İlgili belgeler

- ürün yönü: [`docs/PRODUCT_STRATEGY.md`](docs/PRODUCT_STRATEGY.md)
- moderasyon politikası: [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md)
- teknik güvenlik: [`docs/SECURITY.md`](docs/SECURITY.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- sözlük: [`docs/GLOSSARY.md`](docs/GLOSSARY.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)