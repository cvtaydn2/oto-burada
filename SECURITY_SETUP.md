# 🔒 Contact Form Security Setup Guide

Bu rehber, contact form için gelişmiş güvenlik katmanlarını aktif hale getirmek için yapman gereken adımları içeriyor.

---

## ✅ YAPILDI (Otomatik)

Aşağıdaki dosyalar oluşturuldu ve kod tabanına eklendi:

### 📁 Yeni Dosyalar
```
database/migrations/0039_contact_abuse_tracking.sql  → Supabase migration
src/lib/security/turnstile.ts                       → Cloudflare Turnstile doğrulama
src/lib/security/email-validation.ts                → Disposable email blocker
src/hooks/use-turnstile.ts                          → React Turnstile hook
src/app/api/contact/route.ts                        → Güncellenmiş contact API
src/app/admin/security/page.tsx                     → Admin abuse dashboard
src/app/api/admin/security/ban/route.ts             → IP ban API
src/components/shared/contact-form.tsx              → Güncellenmiş form (Turnstile + honeypot)
```

### 🛡️ Eklenen Korumalar
- ✅ Origin kontrolü (CSRF)
- ✅ Honeypot field (bot detection)
- ✅ Spam pattern analizi
- ✅ Subject/message similarity check
- ✅ Rate limit (3/saat per IP)
- ✅ Disposable email blocker (200+ domain)
- ✅ Cloudflare Turnstile (invisible CAPTCHA)
- ✅ IP banlist + abuse tracking
- ✅ Admin dashboard

---

## 🎯 SENİN YAPMAN GEREKENLER

### 1️⃣ Cloudflare Turnstile Kurulumu (10 dakika)

#### Adım 1: Cloudflare Dashboard
1. https://dash.cloudflare.com/ → Giriş yap
2. Sol menüden **Turnstile** seç
3. **Add Site** tıkla
4. Form doldur:
   - **Site name**: `Oto Burada Contact Form`
   - **Domain**: `oto-burada.vercel.app` (veya custom domain'in)
   - **Widget Mode**: **Invisible** seç ⚠️ (kullanıcı görmez)
5. **Create** → 2 key alacaksın:
   ```
   Site Key:   0x4AAAAAAA... (public)
   Secret Key: 0x4AAAAAAA... (private)
   ```

#### Adım 2: Vercel Environment Variables
1. https://vercel.com/dashboard → Projen → **Settings** → **Environment Variables**
2. Ekle:
   ```
   NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
   TURNSTILE_SECRET_KEY=0x4AAAAAAA...
   ```
3. **All Environments** seç (Production + Preview + Development)
4. **Save**

#### Adım 3: Local Development
`.env.local` dosyana ekle:
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAA...
TURNSTILE_SECRET_KEY=0x4AAAAAAA...
```

**Test için Cloudflare'in dummy key'lerini kullanabilirsin:**
```bash
# Her zaman geçer (sadece development için)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

---

### 2️⃣ Supabase Migration Çalıştırma (5 dakika)

#### Adım 1: SQL Dosyasını Kopyala
1. `database/migrations/0039_contact_abuse_tracking.sql` dosyasını aç
2. **Tüm içeriği** kopyala (Ctrl+A → Ctrl+C)

#### Adım 2: Supabase SQL Editor
1. https://supabase.com/dashboard → Projen
2. Sol menüden **SQL Editor** seç
3. **New Query** tıkla
4. Kopyaladığın SQL'i yapıştır
5. **Run** (F5) → ✅ Success göreceksin

#### Adım 3: Doğrulama
SQL Editor'da şu sorguları çalıştır:

```sql
-- Tabloları kontrol et
SELECT * FROM contact_abuse_log LIMIT 1;
SELECT * FROM ip_banlist LIMIT 1;

-- RPC fonksiyonunu test et
SELECT check_contact_abuse('test@example.com', '1.2.3.4');
```

Hata almazsan ✅ başarılı!

---

### 3️⃣ Admin Dashboard Erişimi (2 dakika)

1. Tarayıcıda `/admin/security` adresine git
2. Göreceklerin:
   - **Stats Cards**: Son 24 saat abuse sayısı, yasaklı IP sayısı
   - **Banned IPs**: Yasaklı IP listesi
   - **Abuse Log**: Tüm contact form denemeleri (son 100)

3. **Ban IP** butonu:
   - Abuse log'daki herhangi bir IP'yi yasaklayabilirsin
   - Yasaklı IP'ler artık contact form'u kullanamaz

---

## 🧪 TEST SENARYOLARI

### Test 1: Normal Kullanıcı
1. `/contact` sayfasına git
2. Formu doldur (gerçek email, mesaj)
3. **Gönder** → ✅ "Mesajın bize ulaştı" göreceksin
4. `/admin/security` → Log'da `reason: success` göreceksin

### Test 2: Honeypot (Bot Detection)
1. Tarayıcı console'u aç
2. Şunu çalıştır:
   ```js
   document.querySelector('input[name="_hp"]').value = 'bot';
   ```
3. Formu gönder → ✅ 200 OK (ama ticket oluşmaz)
4. `/admin/security` → Log'da `reason: honeypot` göreceksin

### Test 3: Spam Pattern
1. Mesaj alanına şunu yaz: `Buy viagra cheap casino bitcoin`
2. Gönder → ❌ "spam içeriği" hatası
3. `/admin/security` → Log'da `reason: spam_pattern` göreceksin

### Test 4: Disposable Email
1. Email: `test@10minutemail.com`
2. Gönder → ❌ "Geçici e-posta adresleri kabul edilmemektedir"
3. `/admin/security` → Log'da `reason: disposable_email` göreceksin

### Test 5: Rate Limit
1. Formu 4 kez üst üste gönder
2. 4. denemede → ❌ 429 Too Many Requests
3. `/admin/security` → Log'da `reason: rate_limit` göreceksin

### Test 6: IP Ban
1. `/admin/security` → Abuse log'dan bir IP seç
2. **Ban IP** tıkla
3. O IP'den form göndermeyi dene → ❌ "Bu IP adresi engellenmiştir"

### Test 7: Turnstile (Production'da)
1. Turnstile key'lerini Vercel'e ekle
2. Deploy et
3. Contact form'u aç → Invisible widget yüklenecek (görmeyeceksin)
4. Formu gönder → Arka planda Cloudflare doğrulaması yapılacak

---

## 📊 ABUSE TRACKING

### Reason Kodları
| Kod | Açıklama |
|-----|----------|
| `success` | Başarılı submission (spam değil) |
| `honeypot` | Bot honeypot field'ı doldurdu |
| `spam_pattern` | Spam keyword tespit edildi |
| `similarity` | Subject ve message çok benzer |
| `rate_limit` | 3/saat limiti aşıldı |
| `disposable_email` | Geçici email servisi kullanıldı |
| `turnstile_fail` | Cloudflare doğrulaması başarısız |
| `ip_banned` | IP banlist'te |
| `email_limit` | 24 saatte 5+ deneme (aynı email) |
| `ip_limit` | 24 saatte 10+ deneme (aynı IP) |

### PostHog Events
```
contact_form_submitted       → Başarılı
contact_form_bot_detected    → Bot yakalandı
contact_form_spam_detected   → Spam yakalandı
contact_form_abuse_blocked   → Abuse history nedeniyle reddedildi
ip_banned                    → Admin IP yasakladı
```

---

## 🔧 SORUN GİDERME

### Turnstile widget görünmüyor
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` environment variable'ı var mı kontrol et
- Tarayıcı console'da hata var mı bak
- Cloudflare'in script'i yüklendi mi: `window.turnstile` kontrol et

### Migration hatası: "relation already exists"
- Normal, migration daha önce çalıştırılmış
- `SELECT * FROM contact_abuse_log LIMIT 1;` çalışıyorsa sorun yok

### Admin dashboard boş
- Migration çalıştırıldı mı kontrol et
- Henüz hiç abuse denemesi olmadıysa normal (boş olur)
- Test senaryolarını çalıştır, log'lar gelecek

### IP ban çalışmıyor
- `ip_banlist` tablosunda IP var mı kontrol et:
  ```sql
  SELECT * FROM ip_banlist WHERE ip_address = '1.2.3.4';
  ```
- RPC fonksiyonu çalışıyor mu test et:
  ```sql
  SELECT check_contact_abuse('test@test.com', '1.2.3.4');
  ```

---

## 📈 İZLEME & ANALİZ

### Günlük Kontrol
1. `/admin/security` → Son 24 saat abuse sayısı
2. En çok tetiklenen reason'ı gör
3. Şüpheli IP'leri ban'le

### Haftalık Analiz
1. PostHog → `contact_form_*` eventlerini filtrele
2. Spam pattern'leri güncelle (gerekirse)
3. Disposable email listesini güncelle

### Aylık Optimizasyon
1. Banlist'i temizle (expired ban'ler)
2. Abuse log'u arşivle (>1 ay eski kayıtlar)
3. Rate limit profilini ayarla (çok sıkı/gevşek mi?)

---

## 🚀 DEPLOYMENT

### Vercel'e Deploy
```bash
git add .
git commit -m "feat: advanced contact form security"
git push origin main
```

Vercel otomatik deploy edecek. Environment variables'ları eklemeyi unutma!

### Production Checklist
- [ ] Turnstile key'leri Vercel'e eklendi
- [ ] Supabase migration çalıştırıldı
- [ ] `/admin/security` sayfası açılıyor
- [ ] Test senaryoları geçti
- [ ] PostHog events geliyor

---

## 📞 DESTEK

Sorun yaşarsan:
1. Tarayıcı console'u kontrol et
2. Vercel logs'u kontrol et
3. Supabase logs'u kontrol et
4. PostHog events'i kontrol et

Hala çözemediysen, bana sor! 🚀
