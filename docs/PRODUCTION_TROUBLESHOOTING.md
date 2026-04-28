# Production Troubleshooting Guide

Bu doküman, production ortamında (özellikle ücretsiz tier'larda) karşılaşılan yaygın sorunları ve çözümlerini içerir.

## 🚨 Hızlı Tanı

Production'da sorun yaşıyorsanız önce diagnostic script'i çalıştırın:

```bash
npm run diagnose
```

Bu script otomatik olarak:
- Environment variables kontrolü
- Supabase bağlantı testi
- Auth yapılandırması kontrolü
- Database tabloları kontrolü
- RLS policies kontrolü
- Storage buckets kontrolü
- Email ayarları kontrolü

yapacak ve size detaylı rapor sunacaktır.

---

## 🔴 Problem: Kayıt Olma Çalışmıyor

### Belirti
- Local'de kayıt çalışıyor ama production'da çalışmıyor
- "Kayıt oluşturulamadı" hatası alınıyor
- Form submit ediliyor ama hiçbir şey olmuyor

### Olası Nedenler ve Çözümler

#### 1. Supabase Email Provider Kapalı

**Kontrol:**
1. Supabase Dashboard'a git
2. Authentication > Providers > Email
3. "Enable Email provider" açık mı kontrol et

**Çözüm:**
```
✅ Enable Email provider
✅ Confirm email: Açık (ücretsiz tier için önerilen)
```

**Not:** Ücretsiz tier'da email confirmation zorunludur.

---

#### 2. Site URL ve Redirect URLs Yanlış

**Kontrol:**
1. Supabase Dashboard > Authentication > URL Configuration
2. Site URL ve Redirect URLs kontrol et

**Doğru Yapılandırma:**
```
Site URL: https://your-domain.com
Redirect URLs:
  - https://your-domain.com/auth/callback
  - https://your-domain.vercel.app/auth/callback (Vercel preview için)
```

**Yaygın Hatalar:**
- ❌ `http://` kullanmak (HTTPS olmalı)
- ❌ Trailing slash eklemek (`/auth/callback/`)
- ❌ Localhost URL'i production'da bırakmak

---

#### 3. Environment Variables Eksik veya Yanlış

**Kontrol:**
```bash
# Local'de
npm run diagnose

# Vercel'de
vercel env ls
```

**Gerekli Variables:**
```env
# Zorunlu
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Opsiyonel ama önerilen
RESEND_API_KEY=re_...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
TURNSTILE_SECRET_KEY=0x4AAA...
```

**Vercel'de Güncelleme:**
1. Vercel Dashboard > Settings > Environment Variables
2. Eksik variables ekle
3. **ÖNEMLİ:** Redeploy tetikle (Settings > Deployments > Redeploy)

---

#### 4. Email Rate Limit (Ücretsiz Tier)

**Belirti:**
- İlk birkaç kayıt çalışıyor sonra durduruyor
- "Email rate limit exceeded" hatası

**Supabase Ücretsiz Tier Limitleri:**
- **Email:** 4 email/saat
- **Auth Users:** 50,000 kullanıcı
- **Database:** 500 MB

**Çözüm:**
1. **Kısa Vadeli:** Test için farklı email adresleri kullan
2. **Orta Vadeli:** Email confirmation'ı geçici olarak kapat (güvenlik riski!)
3. **Uzun Vadeli:** Supabase Pro'ya geç ($25/ay)

**Email Confirmation Kapatma (Sadece Test İçin):**
```
Supabase Dashboard > Authentication > Providers > Email
❌ Confirm email (GÜVENLİK RİSKİ - sadece test için)
```

---

#### 5. CORS Hatası

**Belirti:**
- Browser console'da CORS error
- Network tab'de preflight request fail

**Kontrol:**
```
Browser Console > Network Tab > Failed Request > Headers
```

**Çözüm:**
1. Supabase Dashboard > Settings > API
2. "Additional Allowed Origins" ekle:
   ```
   https://your-domain.com
   https://your-domain.vercel.app
   ```

---

#### 6. Database Trigger Çalışmıyor (Profile Oluşturulmuyor)

**Belirti:**
- Kayıt başarılı ama profile oluşturulmuyor
- Dashboard'a giriş yapılamıyor

**Kontrol:**
```sql
-- Supabase SQL Editor'de çalıştır
SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 5;
SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
```

**Çözüm 1: Trigger Kontrolü**
```sql
-- Trigger var mı kontrol et
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Yoksa oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, created_at, updated_at)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

**Çözüm 2: Manuel Profile Oluşturma**

Kod zaten bunu yapıyor (`registerAction` içinde retry logic var), ama trigger yoksa her seferinde 3 retry bekleyecek.

---

#### 7. Turnstile Bot Protection Hatası

**Belirti:**
- "Güvenlik doğrulaması başarısız" hatası
- Local'de çalışıyor, production'da çalışmıyor

**Kontrol:**
```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAA...
TURNSTILE_SECRET_KEY=0x4AAA...
```

**Çözüm:**
1. Cloudflare Dashboard > Turnstile
2. Domain'i whitelist'e ekle
3. Test mode'dan production mode'a geç

**Geçici Çözüm (Test İçin):**
```env
# .env.local'den kaldır (production'da bot protection olmaz!)
# NEXT_PUBLIC_TURNSTILE_SITE_KEY=
# TURNSTILE_SECRET_KEY=
```

---

## 🔴 Problem: Login Çalışmıyor

### Belirti
- "Giriş yapılamadı" hatası
- Email/şifre doğru ama giriş olmuyor

### Çözümler

#### 1. Email Confirmation Bekliyor

**Kontrol:**
```sql
SELECT email, email_confirmed_at FROM auth.users WHERE email = 'user@example.com';
```

**Çözüm:**
- Kullanıcıya email confirmation linki gönder
- Veya admin olarak manuel confirm et:
```sql
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

#### 2. Session Cookie Problemi

**Belirti:**
- Login başarılı ama redirect sonrası logout oluyor
- Cookie set edilmiyor

**Çözüm:**
1. `NEXT_PUBLIC_APP_URL` doğru domain'e ayarlı mı kontrol et
2. HTTPS kullanıldığından emin ol
3. Browser'da 3rd party cookies enabled mı kontrol et

---

## 🔴 Problem: Database Migration Uygulanmamış

### Belirti
- "Table does not exist" hatası
- RLS policy hatası

### Çözüm

**Local'den Production'a Migration:**

```bash
# 1. Migration dosyalarını kontrol et
npm run db:migrate:status

# 2. Supabase DB URL'i production'a ayarla
# .env.local içinde:
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# 3. Migration'ları uygula
npm run db:migrate

# 4. Doğrula
npm run db:migrate:status
```

**Alternatif: SQL Editor ile Manuel**

1. Supabase Dashboard > SQL Editor
2. `database/schema.snapshot.sql` içeriğini kopyala
3. Run

---

## 🔴 Problem: Storage/Upload Çalışmıyor

### Belirti
- Resim yüklenmiyor
- "Storage bucket not found" hatası

### Çözüm

**1. Bucket Oluştur:**
```
Supabase Dashboard > Storage > Create bucket
Name: listing-images
Public: ✅ (veya RLS policy ile kontrol et)
```

**2. RLS Policy Ekle:**
```sql
-- Public read
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Authenticated upload
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images' 
  AND auth.role() = 'authenticated'
);
```

**3. Environment Variable:**
```env
SUPABASE_STORAGE_BUCKET_LISTINGS=listing-images
```

---

## 🔴 Problem: Rate Limit Hatası

### Belirti
- "Çok fazla istek" hatası
- 429 Too Many Requests

### Çözüm

**Ücretsiz Tier Limitleri:**
- Redis (Upstash): 10,000 requests/day
- Supabase: 500 requests/second

**Geçici Çözüm:**
```env
# Redis yoksa in-memory fallback kullanılır
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=
```

**Kalıcı Çözüm:**
1. Upstash ücretsiz tier kullan (10K/day yeterli)
2. Veya Vercel KV kullan

---

## 🔴 Problem: Email Gönderilmiyor

### Belirti
- Kayıt başarılı ama confirmation email gelmiyor
- Forgot password email gelmiyor

### Çözüm

**1. Supabase Email Settings:**
```
Supabase Dashboard > Authentication > Email Templates
✅ Confirm signup
✅ Reset password
```

**2. SMTP Ayarları (Opsiyonel):**

Ücretsiz tier'da Supabase kendi SMTP'sini kullanır ama limitli.

**Resend ile Custom SMTP:**
```env
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=noreply@your-domain.com
```

**3. Spam Klasörü:**
- Kullanıcılara spam klasörünü kontrol etmelerini söyle
- Supabase email'leri bazen spam'e düşebilir

---

## 📊 Monitoring ve Debug

### Vercel Logs

```bash
# Real-time logs
vercel logs --follow

# Son 100 log
vercel logs -n 100

# Specific deployment
vercel logs [deployment-url]
```

### Supabase Logs

```
Supabase Dashboard > Logs
- API Logs: HTTP requests
- Auth Logs: Login/signup attempts
- Database Logs: SQL queries
```

### Browser Console

```javascript
// Local storage kontrol
localStorage.getItem('supabase.auth.token')

// Network tab
// Filter: Fetch/XHR
// Failed requests kontrol et
```

---

## 🎯 Production Checklist

Deploy öncesi kontrol listesi:

### Environment Variables
- [ ] `NEXT_PUBLIC_SUPABASE_URL` set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` set
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set
- [ ] `NEXT_PUBLIC_APP_URL` production domain
- [ ] Tüm variables Vercel'de tanımlı

### Supabase Configuration
- [ ] Email provider enabled
- [ ] Site URL production domain
- [ ] Redirect URLs doğru
- [ ] Storage buckets oluşturulmuş
- [ ] RLS policies aktif

### Database
- [ ] Migrations uygulanmış
- [ ] Seed data (opsiyonel)
- [ ] Triggers çalışıyor
- [ ] Indexes oluşturulmuş

### Security
- [ ] CORS ayarları doğru
- [ ] Rate limiting aktif
- [ ] CSRF protection aktif
- [ ] Turnstile (opsiyonel)

### Testing
- [ ] `npm run diagnose` başarılı
- [ ] Test kayıt/login çalışıyor
- [ ] Email confirmation çalışıyor
- [ ] Image upload çalışıyor

---

## 🆘 Hala Çalışmıyor mu?

1. **Diagnostic Script Çalıştır:**
   ```bash
   npm run diagnose
   ```

2. **Logs Kontrol Et:**
   ```bash
   vercel logs --follow
   ```

3. **Supabase Logs:**
   - Dashboard > Logs > Auth Logs
   - Failed login/signup attempts kontrol et

4. **Browser Console:**
   - F12 > Console
   - Network tab > Failed requests
   - Error messages kopyala

5. **GitHub Issue Aç:**
   - Diagnostic script çıktısını ekle
   - Browser console errors ekle
   - Vercel logs ekle

---

## 📚 Faydalı Linkler

- [Supabase Auth Docs](https://supabase.com/docs/guides/auth)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)
- [Cloudflare Turnstile](https://developers.cloudflare.com/turnstile/)
