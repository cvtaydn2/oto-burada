# OtoBurada - Gelecek Geliştirme Adımları (TODO.md)

Bu dosya, platformun MVP sonrasındaki "Güven", "Operasyon" ve "Dönüşüm" safhalarının eksiksiz yol haritasını içerir. Tamamlanan *Transaction Readiness* (Saved Searches, Notifications, Tramer/Kaporta UI) fazının ardından, aşağıdaki görev sırası izlenmelidir.

---

## 🏗 İş Bekleyen Görevler (Backlog)

### Dalga 2: Trust (Güvenlik) & Operasyon İleri Seviyesi
Platformun kötüye kullanımını engellemek ve yöneticilerin işini hızlandırmak.

- [x] **Dolandırıcılık ve Duplicate Kontrolü (Heuristics):** 
  - [x] Aynı başlık, açıklama veya fotoğraflarla açılan mükerrer ilanları tespit eden bir servis katmanı (Duplicate Detection).
  - [x] Fiyatı pazarın %40 altı olan araçlar için manuel onaya düşüren veya yapay zeka bayrağı kaldıran risk algoritması.
- [x] **İlan Yaşam Döngüsü (Lifecycle Management):**
  - [x] 30 günü dolduran ilanları otomatik olarak "Expired" veya "Archived" durumuna alan bir Cron Job (Supabase pg_cron veya Edge Function).
  - [ ] Satıcıların ilanlarını süresi dolmadan güncelleyip üst sıralara taşıyabilmesini (Bump) sağlayacak UI ve rate limiting.
- [x] **Ekspertiz ve PDF Kanıt Yükleme:**
  - [x] Sadece işaretlemeyle kalmayıp, bağımsız kuruluşlardan (TSE onaylı) alınan "Ekspertiz Raporu" (PDF/Image) belgesinin ilana yüklenebilmesi.
  - [x] Yüklü kanıtı olan ilanlara "Ekspertizli" onay rozeti eklenmesi.
- [ ] **Gelişmiş Moderasyon Paneli (Audit Trail):**
  - [ ] Admin panelinde, hangi yöneticinin hangi ilanı, hangi sebeple reddettiğini gösteren aksiyon logları.
  - [ ] Hazır ret sebepleri şablonları eklenerek yöneticilere tek tuşla moderasyon yetkisi verilmesi.

---

### Dalga 3: Discovery (Keşif) & Dönüşüm Optimizasyonu
Kullanıcı alımını (Acquisition) ve UX kalitesini en üst noktaya taşımak.

- [ ] **Derin SEO & Landing Page Mimarisi:**
  - [ ] `/listings/renault-clio` veya `/listings/ankara-ikinci-el` gibi dinamik şehir ve model bazlı Landing Page'lerin üretilmesi.
  - [ ] İlgili sayfalara özel breadcrumb ve schema (Structured Data) meta etiketlerinin detaylandırılması.
- [ ] **Karşılaştırma (Compare) Ekranı Aktivasyonu:**
  - [ ] Kullanıcıların birden fazla aracı yan yana dizip özellik (Tramer, Yıl, KM) bazlı farklarını görebileceği `/compare` ekranının işlevselliğe kavuşturulması.
  - [ ] "İlanı Karşılaştır" CTA'larının liste ve detay sayfalarına entegrasyonu.
- [ ] **Listing Create Funnel Optimizasyonu (Sürtünme Azaltma):**
  - [ ] 2 dakika kuralına uyabilmek için ilan oluşturma formunda Plaka girilerek (varsa bir API entegrasyonu ile) "Marka, Model, Yıl" gibi bilgilerin otomatik doldurulması (Auto-fill).
  - [ ] Resim yükleme esnasında Client-Side (Tarayıcı içi) otomatik çözünürlük düşürme (Image Compression - örn: kompres js) işlemi.

---

### Dalga 4: Güvenilirlik & Quality Assurance
Derin test senaryolarının inşası.

- [ ] **Derin Entegrasyon Testleri (Integration Tests):**
  - [ ] Sadece uçtan uca UI testleri değil, Supabase Role Level Security (RLS) kurallarının veritabanı manipülasyonlarına karşı korumasını kanıtlayacak Jest/Vitest tabanlı servis testleri.
  - [ ] Tramer/Boya kayit formunun ve API payload'larının geçersiz formatlarda ret yemesini doğrulayan sınır testleri.

---

## 🟢 Sonraki (İlk) Eylem Planı Ne Olmalı?

Geliştirici veya YZ Aracısına Talimat:
> "Geliştirmeye **Gelişmiş Moderasyon Paneli (Audit Trail)** veya **Bump / Rate Limiting** ile devam ederek altyapıyı ticari hayata en hazır hale getirin."
