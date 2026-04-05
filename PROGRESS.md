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
- Güncel faz: `Phase 0`
- Güncel görev: `Task 0.2`
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

---

## Alınan Kararlar
- Mimari tek Next.js kod tabanı olarak kalacak.
- Server component varsayılan yaklaşım olacak.
- Başlangıç aşamasında gereksiz backend karmaşıklığı eklenmeyecek.
- Google Fonts bağımlılığı kaldırıldı; yerel sistem fontları kullanıldı.
- Next.js Turbopack kök dizini repo ile sınırlandırıldı.

---

## Bu Görevde Yapılacaklar
- `README.md` kurulum adımlarıyla güncellendi.
- `.env.example` eklendi.
- `schema.sql` başlangıç planı ile düzeltildi.
- İlerleme takibi için bu dosya kalıcı hale getirildi.

---

## Sonraki Görev
- `Phase 1 / Task 1.1`
- Ortak domain tipleri ve Zod doğrulayıcıları oluşturulacak.

---

## Son Doğrulama Sonuçları
- `npm run lint` geçti
- `npm run typecheck` geçti
- `npm run build` geçti
