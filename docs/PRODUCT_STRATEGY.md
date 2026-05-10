# Product Strategy

Bu belge OtoBurada’nın ürün yönünü tek yerde sabitler. Ayrıntılı backlog teslimleri [`TASKS.md`](../TASKS.md), tarihsel kararlar [`PROGRESS.md`](../PROGRESS.md), güven yaklaşımı [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md) ve gelir modeli [`docs/MONETIZATION.md`](docs/MONETIZATION.md) ile birlikte okunmalıdır.

## Ürün tezi

OtoBurada, yalnızca otomobil ilanlarına odaklanan, mobil-first, daha güvenilir, daha şeffaf ve daha düşük maliyetli bir pazar yeri olarak konumlanır. Amaç, genel ilan platformlarının karmaşık ve güven aşındıran deneyimine karşı daha sade ve güven veren bir alternatif oluşturmaktır.

Ürün şu temel gözleme dayanır: ikinci el otomobil arayan veya satan kullanıcı, çok özellikli bir platformdan önce netlik, hız ve güven ister.

## Hedef kullanıcılar

Birincil kullanıcı grupları şunlardır:

- bireysel satıcılar
- güvenli ve hızlı arama yapmak isteyen bireysel alıcılar
- sınırlı ama düzenli stok yöneten profesyonel satıcılar veya galeriler
- kalite ve politika uygulamasından sorumlu moderasyon ekibi

## Değer önerisi

OtoBurada’nın temel değer önerisi dört eksende toplanır:

- sadece otomobil odağı sayesinde daha az bilişsel yük
- moderasyon ve güven sinyalleri sayesinde daha yüksek güven
- ücretsiz bireysel ilan modeli sayesinde daha düşük bariyer
- mobil-first akışlar sayesinde daha hızlı yayınlama ve keşif

## Ürün prensipleri

### 1. Sadelik

Kullanıcı en kritik akışları az adımda tamamlamalıdır. İlan verme, filtreleme ve satıcıyla temas akışları gereksiz seçeneklerle boğulmamalıdır.

### 2. Güven

Platform, güveni yalnız görsel söylemle değil süreçlerle üretmelidir. Moderasyon, satıcı sinyalleri, abuse önlemleri ve şeffaf durum mesajları ürünün merkezindedir.

### 3. Hız

Hem teknik performans hem görev tamamlama hızı önemlidir. Kullanıcı bir ilanı yayınlamak veya ilgili ilanı bulmak için uzun ve dağınık akışlara zorlanmamalıdır.

### 4. Şeffaflık

İlan durumu, moderasyon sonucu, ücretli görünürlük araçları ve satıcı güven işaretleri kullanıcı tarafından kolayca anlaşılmalıdır.

### 5. Sürdürülebilirlik

MVP mimarisi ücretsiz tier sınırlarıyla uyumlu olmalı, dış servis bağımlılıkları kritik yolu gereksiz şekilde kırmamalıdır.

## Başarı kriterleri

Ürünün çekirdek başarı kriterleri şunlardır:

- kullanıcı bir ilanı kısa akışta yayınlayabilir
- kullanıcı az etkileşimle ilgili otomobil ilanlarına ulaşabilir
- yeni geliştirici kod ve doküman yapısını anlayabilir
- uygulama build, lint ve typecheck kapılarından temiz geçer

## MVP kapsamı

MVP aşağıdaki yüzeyleri önceliklendirir:

- public marketplace ve listing detail deneyimi
- Supabase Auth tabanlı kayıt ve giriş
- mobil-first listing create akışı
- admin moderasyon akışı
- WhatsApp CTA tabanlı satıcı iletişimi
- SEO dostu public listing sayfaları
- temel güven sinyalleri ve raporlama akışları

## MVP dışı veya ikincil alanlar

Aşağıdaki konular bu ürün yönünde ikincil veya kapsam dışı kabul edilir:

- EİDS entegrasyonu
- SMS OTP veya phone verification
- in-app chat’in birincil iletişim yöntemi olması
- maliyetli üçüncü parti bağımlılıklara yaslanan çekirdek akışlar

## Rekabet konumlandırması

Sahibinden.com ve arabam.com gibi platformlara karşı fark yaratılan alanlar şunlardır:

- daha dar ve net otomobil odaklı bilgi mimarisi
- daha anlaşılır moderasyon ve güven katmanı
- daha düşük maliyetli görünürlük ve freemium model
- mobilde daha hafif ve hızlı görev akışları

## Ürün yüzeyleri

### Marketplace

Arama, filtreleme ve listing detail deneyimi ürünün en yüksek trafik alanıdır. Bu yüzeyde hız, güven ve karar destek bilgisi öne çıkmalıdır.

### Listing creation

İlan verme akışı ürün büyümesinin kalbidir. Kullanıcıyı yoracak gereksiz alan, zorunlu karmaşa veya belirsiz moderasyon dili azaltılmalıdır.

### Trust and moderation

Güven sinyalleri, raporlama, abuse önleme ve admin moderasyon mekanikleri ürün farklılaşmasının ana parçasıdır.

### Professional seller layer

Kurumsal veya profesyonel satıcılar için daha yüksek limitler ve görünürlük araçları sunulur; ancak ürün omurgası bireysel kullanıcıyı dışlamayacak şekilde tasarlanır.

## Ürün kararlarında öncelik sırası

Yeni kararlar alınırken tipik öncelik sırası şöyledir:

1. güven ve pazar bütünlüğü
2. mobil görev tamamlama hızı
3. sadelik ve anlaşılabilirlik
4. ücretsiz tier ile sürdürülebilirlik
5. gelir optimizasyonu

Gelir artırıcı bir karar, çekirdek güven veya basitlik ilkesini bozuyorsa yeniden ele alınmalıdır.

## Dokümantasyon ilişkisi

- güven yaklaşımı: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- moderasyon kuralları: [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md)
- gelir modeli: [`docs/MONETIZATION.md`](docs/MONETIZATION.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- sözlük: [`docs/GLOSSARY.md`](docs/GLOSSARY.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)