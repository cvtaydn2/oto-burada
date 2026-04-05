# PROGRESS.md

Bu dosya tekrar iş yapmamak ve mevcut durumu hızlı görmek için tutulur.
Her yeni geliştirme başlamadan önce okunmalıdır.

---

## Çalışma Kuralı
- Her geliştirme başlangıcında `PROGRESS.md` incelenir.
- Geliştirme sadece `TASKS.md` sırasına göre ilerler.
- Tamamlanan her görev sonunda bu dosya güncellenir.

---

## Proje Durumu
- Güncel faz: `Post-MVP`
- Güncel görev: `Persistence Upgrade`
- Durum: tamamlandı

---

## Tamamlanan İşler

### Phase 0 / Task 0.1
- Next.js App Router projesi oluşturuldu.
- TypeScript, Tailwind CSS ve ESLint kuruldu.
- `src/` tabanlı klasör yapısı hazırlandı.
- `shadcn/ui` yapılandırıldı.
- React Hook Form, Zod, TanStack Query ve Supabase istemci paketleri kuruldu.
- Mobil odaklı başlangıç ana sayfası ve `/listings` placeholder sayfası eklendi.
- TanStack Query için temel provider eklendi.

### Doğrulama
- `npm run lint` geçti
- `npm run typecheck` geçti
- `npm run build` geçti
- Yerel geliştirme sunucusu doğrulandı

### Phase 0 / Task 0.2
- `README.md` kurulum ve doğrulama adımlarıyla güncellendi.
- `.env.example` eklendi.
- `schema.sql` başlangıç seviyesinde anlamlı hale getirildi.
- `PROGRESS.md` eklendi ve çalışma kuralı `AGENTS.md` içine işlendi.

### Phase 1 / Task 1.1
- Ortak domain sabitleri tanımlandı.
- `profile`, `listing`, `listing image`, `favorite`, `report`, `admin moderation` ve `filters` için paylaşılan TypeScript tipleri eklendi.
- Aynı alanlar için Zod doğrulayıcıları oluşturuldu.
- `listingCreateSchema` zorunlu alanları ve minimum 3 görsel kuralını enforce edecek şekilde tanımlandı.

### Phase 1 / Task 1.2
- Marka-model kataloğu oluşturuldu.
- Şehir ve ilçe mock verileri eklendi.
- 1 admin ve 5 normal kullanıcıdan oluşan örnek kullanıcı verisi hazırlandı.
- Gerçekçi Türkiye pazarı odaklı örnek ilanlar eklendi.
- Seed veriler mevcut Zod şemalarıyla doğrulandı.

### Phase 2 / Task 2.1
- Public route grubu için ayrı global layout eklendi.
- Header, footer ve mobil alt navigasyon oluşturuldu.
- Public shell altında ortak sayfa yapısı tanımlandı.
- `login` ve `register` için geçici ama uyumlu placeholder sayfalar eklendi.

### Phase 2 / Task 2.2
- Ana sayfa hero arama bloğu ile genişletildi.
- Quick filter linkleri eklendi.
- Reusable listing kart bileşeni oluşturuldu.
- Öne çıkan ve yeni ilanlar bölümleri mock veri ile bağlandı.
- Trust bölümü ve section header yapısı geliştirildi.

### Phase 2 / Task 2.3
- İlanlar sayfası gerçek sonuç görünümüne dönüştürüldü.
- Desktop filtre paneli ve mobil filtre drawer yapısı eklendi.
- Sıralama, filtreleme ve load-more akışı kuruldu.
- Boş durum ve loading skeleton durumları eklendi.
- Filtreleme kuralları servis katmanına taşındı.

### Phase 2 / Task 2.4
- Dinamik ilan detay rotası oluşturuldu.
- Galeri, fiyat/özellik blokları, açıklama ve satıcı kartı eklendi.
- WhatsApp CTA, telefon aksiyonu ve şikayet bağlantısı eklendi.
- Benzer ilanlar bölümü oluşturuldu.
- Listing kartları detay sayfasına bağlandı.

### Phase 3 / Task 3.1
- Supabase Auth için browser/server/proxy yardımcıları oluşturuldu.
- Giriş ve kayıt için server action tabanlı auth akışı eklendi.
- `/auth/callback` rotası tanımlandı.
- Korumalı route yönlendirmeleri eklendi.
- Dashboard için giriş sonrası açılan ilk korumalı sayfa oluşturuldu.

### Phase 3 / Task 3.2
- Dashboard için ayrı layout ve shell oluşturuldu.
- Desktop ve mobil dashboard navigasyonu eklendi.
- Korumalı dashboard alt rotaları hazırlandı.
- Genel bakış, favoriler, ilanlarım ve profil için temel sayfa iskeletleri eklendi.

### Phase 3 / Task 3.3
- Profil sayfası gerçek form ekranına dönüştürüldü.
- Profil güncelleme için server action eklendi.
- Ad soyad, telefon, şehir ve opsiyonel avatar URL doğrulaması eklendi.
- Profil alanı auth kullanıcı metadata'sı ile bağlandı.

### Phase 3 / Task 3.4
- Favori akışı client-side persistence ile kuruldu.
- Listing kartları ve detay sayfası favori butonu ile bağlandı.
- Dashboard favoriler sayfası gerçek içerik ve empty state ile dolduruldu.
- Favori state paylaşımı provider/hook katmanına taşındı.

### Phase 4 / Task 4.1
- Dashboard `İlanlarım` sayfası mobil öncelikli ilan oluşturma ekranına dönüştürüldü.
- React Hook Form + Zod ile client-side doğrulama çalışan araç ilan formu eklendi.
- `POST /api/listings` route handler ile server-side doğrulama ve submit akışı kuruldu.
- Fotoğraflar için en az 3 bağlantı kuralı, önizleme alanı ve dinamik alan ekleme akışı hazırlandı.
- Giriş yapan kullanıcılar için public `İlan Ver` CTA'ları doğrudan dashboard formuna bağlandı.
- Oluşturulan ilanlar geçici olarak cookie tabanlı persistence ile `pending` durumunda saklanmaya başlandı.

### Phase 4 / Task 4.2
- Supabase Storage için admin client ve storage env yardımcıları eklendi.
- `POST /api/listings/images` ile dosya upload, `DELETE /api/listings/images` ile temizleme akışı kuruldu.
- İlan formu URL tabanlı görsel girişinden dosya seçimi + upload progress akışına taşındı.
- JPG, PNG ve WebP dışındaki dosyalar ile 5 MB üzerindeki görseller client ve server tarafında reddedilir hale getirildi.
- Yüklenen fotoğraflar anlık önizleme, ilerleme yüzdesi ve hazır durum göstergesi ile form içine bağlandı.
- İlan submit akışı, yüklenen storage path ve public URL değerlerini kullanacak şekilde güncellendi.

### Phase 4 / Task 4.3
- Dashboard `İlanlarım` alanı gerçek kullanıcı ilan listesi ile dolduruldu.
- Kullanıcı kendi ilanları için durum rozeti, tarih ve temel özet bilgilerini görür hale geldi.
- Pending ve draft ilanlar için düzenleme modu aynı form üzerinde aktif edildi.
- İlan arşivleme için route handler ve dashboard aksiyonu eklendi.
- Liste yalnızca giriş yapan kullanıcıya ait cookie tabanlı ilanları gösterecek şekilde sınırlandı.

### Phase 5 / Task 5.1
- Auth session katmanına `getUserRole` ve `requireAdminUser` yardımcıları eklendi.
- `/admin` rotası admin olmayan kullanıcılar için `/dashboard` yönlendirmesi ile korundu.
- Kayıt olan yeni kullanıcılar Supabase metadata içinde varsayılan `user` rolü ile oluşturulacak şekilde güncellendi.
- Header içine admin kullanıcılar için görünür `Admin` erişim bağlantısı eklendi.

### Phase 5 / Task 5.2
- Admin paneli pending, approved ve rejected sayaçları ile moderasyon merkezine dönüştürüldü.
- Pending ilanlar için approve/reject aksiyonlarını çalışan admin moderasyon listesi eklendi.
- `POST /api/admin/listings/[listingId]/moderate` route handler ile admin onay/red akışı kuruldu.
- Moderasyon kararı cookie tabanlı ilan persistence içine yazılacak şekilde güncellendi.
- Admin tarafında yalnızca pending durumdaki ilanlar moderasyona açık bırakıldı.

### Phase 5 / Task 5.3
- `POST /api/reports` ile kullanıcıların ilan raporu oluşturma akışı eklendi.
- Listing detay sayfasına oturum durumuna göre çalışan gerçek raporlama formu bağlandı.
- Report persistence için cookie tabanlı ayrı saklama katmanı kuruldu.
- `PATCH /api/admin/reports/[reportId]` route handler ile admin rapor durumu guncelleme akışı eklendi.
- Admin paneline open/reviewing raporları listeleyen ikinci moderasyon alanı bağlandı.
- Raporlar `reviewing`, `resolved` ve `dismissed` durumlarına geçirilebilir hale geldi.

### Phase 6 / Task 6.1
- Listings sayfası `searchParams` okuyup başlangıç filtrelerini URL üzerinden hydrate edecek hale getirildi.
- Filtre state'i için parse/serialize yardımcıları servis katmanına taşındı.
- Filtre değişiklikleri `router.replace` ile URL search params içine yazılmaya başlandı.
- Sayfa yenileme, direkt link açma ve paylaşılmış filtre URL'leri artık aynı sonuç kümesini koruyor.
- Varsayılan `sort=newest` durumu gereksiz query string üretmeden korunacak şekilde ayarlandı.

### Phase 6 / Task 6.2
- Root layout metadata yapısı `metadataBase`, canonical ve Open Graph alanlarıyla genişletildi.
- Homepage için statik SEO metadata eklendi.
- Listings index sayfası aktif filtrelere göre dinamik title/description üreten metadata akışına bağlandı.
- Listing detail sayfası her ilan için fiyat, konum ve temel araç bilgilerini içeren dinamik metadata üretir hale geldi.
- Filter URL'leri metadata tarafında da canonical/Open Graph adresine yansıtıldı.

### Phase 7 / Task 7.1
- Favoriler ekranının hydration/loading durumu skeleton görünümü ile güçlendirildi.
- Dashboard listings ekranında geçersiz `edit` isteği için açık error state eklendi.
- Majör async akışlar tekrar gözden geçirilerek loading, empty, error ve disabled durumları hizalandı.
- Auth, listing create, image upload, favorites, admin moderation ve report moderation akışlarının durum davranışları doğrulandı.

### Phase 7 / Task 7.2
- Mobil alt navigasyon, dashboard navigasyonu ve header linklerinde belirgin keyboard focus stilleri eklendi.
- Listing kartı ve favori butonunda touch target ve disabled/focus davranışları iyileştirildi.
- Listings mobil filtre drawer yapısı `aria` işaretleri, escape ile kapanma ve body scroll kilidi ile güçlendirildi.
- Auth, filter ve report formlarında focus ring, `aria-live` ve hata/basarili mesaj semantikleri iyileştirildi.
- Core akışlar mobil ve keyboard kullanım açısından tekrar doğrulandı.

### Phase 7 / Task 7.3
- Dashboard genel bakış ekranı placeholder metinden çıkarılıp gerçek özet kartları, son hareketler ve hızlı yönlendirmeler ile tamamlandı.
- Kullanılmayan `dashboard-placeholder` bileşeni kaldırıldı.
- `README.md` mevcut persistence davranışları ve tamamlanan MVP kapsamı ile hizalandı.
- `schema.sql` hedef Supabase Postgres + RLS veri modelini gerçek tablo, enum, index ve policy tanımlarıyla yansıtacak şekilde genişletildi.

### Post-MVP / Persistence Upgrade
- Listings ve reports route handler'lari Supabase tablo yazma/guncelleme akisina alindi; DB basarisiz olursa mevcut cookie fallback korunuyor.
- Favoriler icin yeni `/api/favorites` route'u eklendi ve provider oturum acik kullanicida Supabase favori kayitlarini senkronize eder hale geldi.
- Public listings index, listing detail, admin paneli ve dashboard favorites ekranlari seed veriler ile runtime Supabase kayitlarini birlikte okur hale getirildi.
- Profil kaydi gerektiren persistence akislarinda auth kullanicisindan `profiles` satiri upsert edilerek foreign key uyumu saglandi.
- Kullanilmayan `listing-details` servisi kaldirildi.
- Listings ve reports okuma katmaninda DB + legacy cookie merge davranisi eklendi; gecis sirasinda ayni istekte veri surekliligi korundu.
- `/api/migrations/legacy-sync` endpoint'i ve dashboard tetikleme karti ile mevcut browser cookie kayitlarini Supabase'e tasiyan elle calistirilabilir bir backfill araci eklendi.
- Admin paneline Supabase env ve tablo erisilebilirligini gosteren persistence health ozeti eklendi.
- `profiles`, `listings`, `listing_images`, `favorites`, `reports` ve `admin_actions` tablolari icin sayim tabanli hazirlik kontrolu yapildi.
- Repo icine `db:check-env`, `db:apply-schema`, `db:seed-demo` ve `db:bootstrap-demo` komutlari eklendi.
- Yeni scriptler Supabase schema uygulama ve demo auth/profile/listing seed akisini tekrar kullanilabilir hale getirdi.
- `db:verify-demo` komutu eklendi; demo auth kullanicilari, tablo sayilari ve storage bucket durumu script seviyesinde kontrol ediliyor.
- Admin panelindeki persistence bolumu migration runbook ile genisletildi; terminal komutlari ve legacy backfill sirasi artik UI uzerinden de gorunuyor.
- Listing ve report moderasyon route'lari Supabase `admin_actions` tablosuna audit kaydi yazar hale getirildi.
- Admin paneline son moderasyon kararlarini gosteren aksiyon gecmisi bolumu eklendi.
- Aksiyon gecmisi ilan ve rapor bazinda filtrelenebilir hale getirildi.
- Audit kayitlari uygun oldugunda ilgili public ilan detayina hizli gecis linki uretir hale geldi.
- Admin moderasyon ekranlarina opsiyonel karar notu alani eklendi.
- Listing ve report moderasyon route'lari kisa/gecersiz notu reddedip gecerli notu `admin_actions.note` alanina yazacak sekilde guncellendi.
- Gercek Supabase projesine `schema.sql` basariyla uygulandi.
- `listing-images` bucket'i, demo auth kullanicilari ve demo tablo verileri gercek Supabase ortamina seed edildi.
- `db:verify-demo` gercek Supabase ortami uzerinde basariyla calisti ve tablo/bucket sayimlari dogrulandi.

---

## Alınan Kararlar
- Mimari tek Next.js kod tabanı olarak kalacak.
- Server component varsayılan yaklaşım olacak.
- Başlangıç aşamasında gereksiz backend karmaşıklığı eklenmeyecek.
- Google Fonts bağımlılığı kaldırıldı; yerel sistem fontları kullanıldı.
- Next.js Turbopack kök dizini repo ile sınırlandırıldı.
- Task 4.1 için ilan submit akışı, tablo kurulumu gelene kadar cookie tabanlı geçici persistence ile ilerletildi.
- Task 4.2 kapsamında `listing-images` bucket'i public read URL üretecek şekilde varsayıldı.
- Dosya yükleme kuralı tek yerde tutulacak: sadece JPG/PNG/WebP ve maksimum 5 MB.
- Task 4.3 ve Phase 5 moderasyon işleri için ilan persistence modeli aynı cookie tabanlı katmanda sürdürüldü; DB entegrasyonu sonraki fazlara bırakıldı.
- Admin yetkisi şimdilik Supabase Auth `user_metadata.role === "admin"` kontrolü ile belirleniyor.
- Runtime persistence artik Supabase-first ilerliyor; DB erisimi hata verirse listings/reports icin cookie fallback korunuyor.
- Aynı kullanıcı aynı ilan için acik veya incelemedeki raporu tekrar gönderirse mevcut rapor güncellenir.
- URL filtreleme için canonical davranış `router.replace` üzerinden kuruldu; filtre güncellerken geçmiş yığını gereksiz büyütülmüyor.
- SEO metadata üretimi için ortak helper katmanı kullanılıyor; sayfa bazlı kurallar burada merkezileştirildi.
- Mobil filtre drawer kapandığında body scroll varsayılan haline geri dönmeli; keyboard kullanıcısı `Escape` ile drawer'ı kapatabilmeli.
- Favoriler oturum acik kullanicida Supabase ile senkronize edilir; misafir kullanicida local saklama davranisi korunur.
- Legacy cookie verileri bir anda silinmek yerine DB sonucu ile birlikte okunur; bu sayede kademeli migration daha guvenli ilerler.
- Legacy sync basarili oldugunda kullanicinin kendi cookie tabanli ilan ve rapor kayitlari tarayicidan temizlenir.
- Admin panelindeki persistence health ozeti service-role client ile calisir; amaci migration hazirligini gormektir, kullaniciya acik bir ekran degildir.
- `db:apply-schema` komutu `psql` ve `SUPABASE_DB_URL` bekler; demo seed ise service-role ile auth kullanicilari dahil seed atar.
- `db:bootstrap-demo` akisi artik verify adimini da calistirir; boylece schema + seed sonrasi hizli bir kabul kontrolu uretilir.
- Moderasyon action enum degerleri uygulama sabitleri ile `schema.sql` tarafindaki enum ile hizalandi.
- Admin aksiyon gecmisi zenginlestirilirken listing/report hedef eslestirmesi admin sayfasinda yapiliyor; eksik hedefte guvenli fallback metni gosteriliyor.
- Moderasyon notu opsiyoneldir; girilirse en az 3 karakter olmali ve mevcut otomatik audit notunun yerini alir.
- `db:*` scriptleri artik `.env.local` okuyarak calisir; Windows ortaminda `psql.exe` icin yaygin kurulum yollarini otomatik dener.

---

## Bu Görevde Yapılacaklar
- Supabase tablo katmani listings, reports ve favorites akislari icin runtime'a baglandi.
- Public ve dashboard ekranlari seed + runtime veri birlikte okuyacak sekilde guncellendi.
- Okuma katmaninda merge davranisi eklenerek legacy cookie kayitlari ile yeni DB kayitlari ayni ekranda birlikte gorunur hale getirildi.
- Persistence genislemesi sonrasi lint/typecheck/build tekrar dogrulandi.
- Legacy verileri manuel olarak Supabase'e tasiyan dashboard kontrollu backfill akisi eklendi.
- Admin paneline tablo ve env sagligini gosteren migration readiness kartlari eklendi.
- Supabase migration ve seed akisini komutlastiran scriptler eklendi, `.env.example` ve `README.md` buna gore guncellendi.
- Migration readiness bolumu runbook mantigina genisletildi ve `db:verify-demo` dokumante edildi.
- Admin audit trail akisi baglandi ve panel uzerinden gorunur hale getirildi.
- Admin audit trail paneli filtreleme ve hedef linkleri ile daha hizli inceleme akisina uyarlandi.
- Audit trail artik admin tarafindan girilen insan okunur karar notlarini da tasiyabiliyor.
- Runtime persistence'in hedef Supabase projesi artik bos degil; schema + demo seed + verify operasyonu tamamlandi.

---

## Sonraki Görev
- `Final Definition of Done`
- `TASKS.md` icindeki sıralı MVP kapsami tamamlandi; sonraki mantikli is bu yeni migration/seed komutlarini production benzeri ortamda calistirip legacy cookie verisini backfill etmektir.
- Sonrasindaki adim production benzeri Supabase ortaminda bootstrap + verify calistirip dashboard Legacy Sync ile kalan tarayici verisini tasimaktir.
- Sonraki pratik adim, uygulamayi bu env ile acip dashboard Legacy Sync karti uzerinden mevcut tarayici cookie verilerini tabloya backfill etmektir.

---

## Son Doğrulama Sonuçları
- `npm run lint` geçti
- `npm run typecheck` geçti
- `npm run build` geçti
- `node scripts/apply-supabase-schema.mjs` geçti
- `node scripts/seed-supabase-demo.mjs` geçti
- `node scripts/verify-supabase-demo.mjs` geçti
