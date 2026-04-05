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
- Güncel faz: `Phase 7`
- Güncel görev: `Task 7.1`
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
- Report persistence de MVP aşamasında cookie tabanlı tutuldu; ileride DB tablosuna taşınacak.
- Aynı kullanıcı aynı ilan için acik veya incelemedeki raporu tekrar gönderirse mevcut rapor güncellenir.
- URL filtreleme için canonical davranış `router.replace` üzerinden kuruldu; filtre güncellerken geçmiş yığını gereksiz büyütülmüyor.
- SEO metadata üretimi için ortak helper katmanı kullanılıyor; sayfa bazlı kurallar burada merkezileştirildi.

---

## Bu Görevde Yapılacaklar
- SEO metadata katmanı homepage, listings ve detail sayfalarında tamamlandı.
- Majör async ekranlarda eksik loading/error/disabled durumları güçlendirildi.
- Durum denetimi sonrası UI davranışı lint/typecheck/build ile tekrar doğrulandı.

---

## Sonraki Görev
- `Phase 7 / Task 7.2`
- Erişilebilirlik ve responsive kullanım denetimi tamamlanacak.

---

## Son Doğrulama Sonuçları
- `npm run lint` geçti
- `npm run typecheck` geçti
- `npm run build` geçti
