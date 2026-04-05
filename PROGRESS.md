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
- Güncel faz: `Phase 3`
- Güncel görev: `Task 3.4`
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

---

## Alınan Kararlar
- Mimari tek Next.js kod tabanı olarak kalacak.
- Server component varsayılan yaklaşım olacak.
- Başlangıç aşamasında gereksiz backend karmaşıklığı eklenmeyecek.
- Google Fonts bağımlılığı kaldırıldı; yerel sistem fontları kullanıldı.
- Next.js Turbopack kök dizini repo ile sınırlandırıldı.

---

## Bu Görevde Yapılacaklar
- Favori ekleme/çıkarma akışı eklendi.
- Favoriler sayfası gerçek liste ve empty state ile tamamlandı.
- Favori state'i reusable client katmanda toplandı.

---

## Sonraki Görev
- `Phase 4 / Task 4.1`
- Araç ilanı oluşturma formu kurulacak.

---

## Son Doğrulama Sonuçları
- `npm run lint` geçti
- `npm run typecheck` geçti
- `npm run build` geçti
