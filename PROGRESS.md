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
- Güncel faz: `Phase 2`
- Güncel görev: `Task 2.3`
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

---

## Alınan Kararlar
- Mimari tek Next.js kod tabanı olarak kalacak.
- Server component varsayılan yaklaşım olacak.
- Başlangıç aşamasında gereksiz backend karmaşıklığı eklenmeyecek.
- Google Fonts bağımlılığı kaldırıldı; yerel sistem fontları kullanıldı.
- Next.js Turbopack kök dizini repo ile sınırlandırıldı.

---

## Bu Görevde Yapılacaklar
- Listings sayfası filtrelenebilir sonuç deneyimine dönüştürüldü.
- Loading, empty ve sonuç state'leri eklendi.
- Filtreleme mantığı UI bileşenlerinden ayrıldı.

---

## Sonraki Görev
- `Phase 2 / Task 2.4`
- İlan detay sayfası galeri, fiyat, satıcı kartı, WhatsApp CTA ve benzer ilanlarla oluşturulacak.

---

## Son Doğrulama Sonuçları
- `npm run lint` geçti
- `npm run typecheck` geçti
- `npm run build` geçti
