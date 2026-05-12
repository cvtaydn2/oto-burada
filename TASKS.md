
# TASKS.md

Bu belge proje backlog’unun aktif çalışma listesidir. Uygulama sırası, bağımlılık ilişkileri ve acceptance criteria burada tutulur. Yapılan işler buradan değil, [`PROGRESS.md`](PROGRESS.md) içinden takip edilir.

Ürün, mimari ve kalite kuralları için önce [`AGENTS.md`](AGENTS.md) okunmalıdır. Operasyonel prosedürler [`RUNBOOK.md`](RUNBOOK.md), dokümantasyon kataloğu ise [`docs/INDEX.md`](docs/INDEX.md) altındadır.

## Kullanım kuralları

Yeni iş başlatmadan önce ilgili kapsamın [`PROGRESS.md`](PROGRESS.md) içinde zaten tamamlanıp tamamlanmadığı kontrol edilmelidir. Bu dosyada sadece yapılacaklar, aktif backlog kalemleri ve kabul kriterleri bulunur. Bir iş tamamlandığında burada işaretlenir, karar ve doğrulama özeti ayrıca [`PROGRESS.md`](PROGRESS.md) içine yazılır.

## Backlog yapısı

Aşağıdaki fazlar teslim sırası açısından geçerlidir. Tamamlanan fazlar, tarihsel iz bırakmak için bu belgede korunur; ancak uygulama önceliği aktif fazlardan başlar.

---

## Active Engineering Remediation

### Task G1 — Code review kaynaklı kritik erişilebilirlik açıklarını kapat

Amaç, kapsamlı denetimde işaretlenen kırmızı seviye WCAG ve etkileşim sorunlarını kapatarak ürünün temel yüzeylerini erişilebilir, tutarlı ve denetlenebilir hale getirmektir.

Kapsam:

- form bileşenlerinde `label` → `htmlFor` → `id` bağlarını eksiksiz kur
- eksik `<h1>` ve landmark hiyerarşisini düzelt
- klavye ile erişilemeyen etkileşimli yüzeyleri semantik ve erişilebilir hale getir
- gallery ve benzeri özel UI etkileşimlerinde keyboard/focus davranışını doğrula
- remediation sonrası kalite kapılarını tekrar temiz tut

#### Acceptance Criteria

- Kritik form alanlarında programlı etiket bağlantısı eksiksizdir
- Ana sayfa ve detail yüzeylerinde başlık/landmark semantiği tutarlıdır
- Klavye ile kullanılabilen etkileşimli yüzeylerde focus görünürlüğü ve erişim korunur
- [`npm run lint`](package.json:10), [`npm run typecheck`](package.json:11) ve [`npm run build`](package.json:8) tekrar temizdir

**Status**: ⏳ ACTIVE

---

## Active Documentation Backbone

### Task D1 — Dokümantasyon omurgasını standartlaştır

Amaç, proje dokümantasyonunu güven veren bir çekirdek set etrafında sadeleştirmektir.

Kapsam:

- [`README.md`](README.md) dosyasını kısa giriş noktası olarak netleştir
- [`TASKS.md`](TASKS.md) dosyasını backlog ve acceptance criteria odağına çek
- [`PROGRESS.md`](PROGRESS.md) dosyasını karar ve doğrulama günlüğü olarak temiz tut
- [`RUNBOOK.md`](RUNBOOK.md) dosyasını operasyon, deploy, incident ve rollback odağına çek
- [`docs/INDEX.md`](docs/INDEX.md) dosyasını aktif katalog haline getir
- ürün, güven, moderasyon, gelir modeli, release readiness ve governance belgelerini aktif sete ekle

#### Acceptance Criteria

- Çekirdek belgelerin rolü açık biçimde ayrışmıştır
- Yeni aktif belge seti oluşturulmuştur
- Belgeler arasında kırık veya çelişkili yönlendirme yoktur
- Aktif ve tarihsel içerik ayrımı katalogda görünürdür

**Status**: ✅ COMPLETED (2026-05-11)
- Belge omurgası doğrulandı
- Aktif belgeler seti tanımlandı
- Code kalitesi doğrulandı (TypeScript ✅, Lint ✅)
- Analytics Phase E'ye taşındı

---

## Active Product and Delivery Backlog

### Phase A — Marketplace Core Stability

#### Task A1 — Listing create akışını iki dakikanın altında tut

- form alan yoğunluğunu ve adım sayısını düzenle
- mobil kullanımda görsel yükleme ve doğrulama sürtünmesini azalt
- moderasyon bekleme durumunu anlaşılır göster

##### Acceptance Criteria

- Yeni kullanıcı temel ilanı kısa akışta tamamlayabilir
- Mobilde form terk oranını artıracak belirsiz alanlar kaldırılmıştır
- Başarılı submit sonrası statü ve sonraki adım nettir

**Status**: ✅ COMPLETED (2026-05-10/11)

#### Task A2 — Arama ve filtreyi üç etkileşim altında tut

- ana arama, hızlı filtre ve sonuç daraltma akışlarını sadeleştir
- boş, loading ve hata durumlarını güven veren şekilde sun
- URL tabanlı paylaşılabilir filtre davranışını koru

##### Acceptance Criteria

- Kullanıcı ana akışta az etkileşimle ilgili ilanlara ulaşabilir
- Filtre durumu paylaşılabilir ve refresh sonrası korunur
- Mobil filtre drawer ve masaüstü sidebar tutarlı davranır

**Status**: ✅ COMPLETED (2026-05-11)

#### Task A3 — Listing detail güven sinyallerini güçlendir

- satıcı güven işaretleri, ilan şeffaflığı ve raporlama aksiyonlarını netleştir
- WhatsApp CTA birincil temas yöntemi olarak kalır
- benzer ilanlar ve fiyat bağlamı karar vermeyi kolaylaştırır

##### Acceptance Criteria

- Listing detail bilgi hiyerarşisi güven odaklıdır
- WhatsApp CTA görünür ve ikincil aksiyonlardan ayrışır
- Güven ve moderasyon sinyalleri kullanıcı tarafından fark edilir düzeydedir

**Status**: ✅ COMPLETED (2026-05-11)

---

### Phase B — Trust, Moderation and Safety

#### Task B1 — Moderasyon akışlarını operasyonel hale getir

- pending, approved, rejected ve archived durumları netleştir
- red nedenleri ve moderatör notu yapısını standardize et
- admin görünümünde hızlı karar akışını koru

##### Acceptance Criteria

- Moderatör bir ilanı tutarlı gerekçelerle onaylayabilir veya reddedebilir
- Statü geçişleri ürün ve politika belgeleriyle uyumludur
- Admin ekranları operasyonel yoğunluk altında anlaşılır kalır

**Status**: ✅ COMPLETED (2026-05-11)

#### Task B2 — Kullanıcı güvenliği ve kötüye kullanım önlemlerini sertleştir

- raporlama, oran sınırlama ve satıcı güven sinyallerini gözden geçir
- sahte ödeme linki, WhatsApp dolandırıcılığı ve tekrar eden abuse senaryolarını ele al
- veri, auth ve public surface güvenliğini teknik belgelerle uyumlu tut

##### Acceptance Criteria

- Abuse riskleri için ürün, politika ve teknik güvenlik dokümanları hizalıdır
- Public mutation yüzeylerinde koruma katmanları nettir
- Moderasyon ve güven belgeleri uygulama için referans verebilir durumdadır

**Status**: ✅ COMPLETED (2026-05-11)

---

### Phase C — Monetization and Professional Sellers

#### Task C1 — Freemium ve doping modelini ürün akışına bağla

- bireysel ücretsiz ilan modelini koru
- doping, öne çıkarma ve profesyonel plan yüzeylerini sadeleştir
- ücretli katmanları kullanıcı güvenini zedelemeden konumlandır

##### Acceptance Criteria

- Ücretsiz temel değer önerisi bozulmaz
- Doping ve planlar ürün stratejisiyle tutarlıdır
- Kurumsal kullanıcı farkı anlaşılır ama karmaşık değildir

**Status**: ✅ COMPLETED (2026-05-11)

#### Task C2 — Premium servisleri kritik yol dışında konumlandır

- ekspertiz, araç geçmişi ve AI destekli ilan oluşturma gibi servisleri ikincil katman olarak ele al
- ana ilan verme akışını bu servislerden bağımsız tut

##### Acceptance Criteria

- Premium servisler opsiyonel katman olarak konumlanır
- Dış servis veya kota problemi ana akışı bozmaz

**Status**: ✅ COMPLETED (2026-05-11)

---

### Phase D — Release Readiness and Governance

#### Task D2 — Release gate ve operasyonel hazırlığı netleştir

- lint, typecheck, build ve hedefli test kapılarını tek yerde topla
- incident, rollback, env ve cron prosedürlerini güncel tut
- ücretsiz tier kısıtları altında fail-gracefully davranışını doğrula

##### Acceptance Criteria

- Release readiness kriterleri tek belgede anlaşılırdır
- Runbook operasyon ekibi için yeterince nettir
- Kritik entegrasyonların degrade davranışı belgelenmiştir

**Status**: ✅ COMPLETED

#### Task D3 — Dokümantasyon yönetişimini kalıcı hale getir

- hangi bilginin hangi belgede yaşadığını tanımla
- aktif, referans, audit ve archive ayrımını koru
- yeni belge ekleme ve eski belgeyi düşürme kuralları oluştur

##### Acceptance Criteria

- Belge sahipliği ve güncelleme beklentisi açıktır
- Tekrar ve çelişki riski azaltılmıştır
- Yeni ekip üyesi doğru belgeyi hızlıca bulabilir

**Status**: ✅ COMPLETED

---

## Historical Delivery Log Snapshot

Aşağıdaki başlıklar tarihsel bağlamı korumak için özet seviyede tutulur. Ayrıntılı uygulama kayıtları [`PROGRESS.md`](PROGRESS.md) içinde, bazı tarihsel teknik denetimler ise [`docs/audit`](docs/audit) altında bulunur.

### Completed Foundations

- Bootstrap ve temel proje kurulumu tamamlandı
- Shared validators ve temel domain tipleri oluşturuldu
- Public marketplace UI omurgası hayata geçirildi
- Auth, dashboard ve profile akışları eklendi
- Listing creation ve image upload akışları bağlandı
- Admin moderasyon ve reports yüzeyleri kuruldu
- URL-driven filters ve temel SEO metadata desteği sağlandı

### Completed Hardening Themes

- Server actions odaklı servis mimarisi yaygınlaştırıldı
- RLS ve güvenlik sertleştirmeleri uygulandı
- Performans, responsive UX ve accessibility iyileştirmeleri yapıldı
- Production build, lint ve typecheck istikrarı sağlandı
- Free-tier uyumluluğu ve graceful degradation yaklaşımı işlendi

## Final Definition of Done

MVP teslimi aşağıdaki koşullar sürdürülebilir biçimde sağlandığında kabul edilir:

- kullanıcı kayıt olabilir ve giriş yapabilir
- kullanıcı otomobil ilanı oluşturabilir
- ilanlar bulunabilir, filtrelenebilir ve detay sayfasında incelenebilir
- satıcıya WhatsApp CTA üzerinden ulaşılabilir
- kullanıcı favori ve raporlama akışlarını kullanabilir
- admin ilan ve rapor moderasyonu yapabilir
- uygulama mobil-first davranır
- [`npm run lint`](package.json:10), [`npm run typecheck`](package.json:11) ve [`npm run build`](package.json:8) temizdir
- dokümantasyon, ürün yönü ve operasyonel gerçeklik birbiriyle uyumludur

---

## Phase E — Product Enhancement and Scale

**Not**: MVP sonrası ilerideki iyileştirmeler ve ölçekleme fazı.

### Task E1 — Kullanıcı Deneyimi ve Discovery Geliştirmeleri

- arama otomatik tamamlama ve önerileri
- ilan detayında gelişmiş görsel galeri
- mobil sticky action bar davranışını optimize et

##### Acceptance Criteria

- Arama önerileri 300ms altında yanıt verir
- Görsel galeri swipe ve pinch-zoom desteği sunar
- Mobil sticky bar kaydırma sırasında doğru şekilde davranır

**Status**: ✅ COMPLETED

### Task E2 — Analytics ve Kullanıcı Davranış İzleme

- sayfa görüntüleme ve etkileşim takibi
- dönüşüm hunisi ve abandonment noktaları
- dashboard'da satıcı performans metrikleri

##### Acceptance Criteria

- Privacy-first, free-tier compatible analytics entegre edilir
- Kritik akışlarda dönüşüm oranları ölçülür
- Satıcılar kendi ilan performansını görebilir

**Status**: ✅ COMPLETED (2026-05-11)

### Task E3 — Bildirim ve Gerçek Zamanlı Güncellemeler

- yeni mesaj ve ilan görüntülendğiinde bildirim
- doping süresi bitmeden hatırlatma bildirimleri
- push notification entegrasyonu

##### Acceptance Criteria

- Bildirim tercihleri kullanıcı kontrolünde
- In-app bildirim merkezi oluşturulur
- Push notification free-tier'da çalışır

**Status**: ✅ COMPLETED (2026-05-11)

---

## Phase F — Phone Verification and Communications

**Not**: Post-MVP telefon doğrulama, SMS bildirimleri ve push kanalları zenginleştirmesi.

### Task F1 — Telefon Doğrulama Altyapısı ve Veritabanı Katmanı

- `profiles` tablosuna `is_phone_verified` ve `phone_verified_at` eklenmesi
- OTP doğrulama kodları için veritabanı tablosu veya Redis entegrasyonu (TTL desteği ile)
- SMS gönderim abstraction katmanı (Zero-cost uyumlu fallback/mock dahil)

##### Acceptance Criteria

- Yeni veri modeli hatasız uygulanmıştır (Migration ✅)
- RLS kuralları doğrulanmıştır (Security ✅)
- SMS provider interfacedir ve mocking destekler

**Status**: ✅ COMPLETED (2026-05-11)

### Task F2 — Telefon Doğrulama Server Action'ları ve UI Entegrasyonu

- OTP gönderme ve doğrulama action'larını ekle
- profil formu ve doğrulama diyaloğu ile uçtan uca akışı bağla
- doğrulanmış telefon durumunu profil ve auth state ile hizala

##### Acceptance Criteria

- Kullanıcı SMS kodu isteyebilir ve doğrulayabilir
- Doğrulama sonrası profil durumu anında güncellenir
- Type-safe server action ve UI entegrasyonu tamamdır

**Status**: ✅ COMPLETED (2026-05-11)
