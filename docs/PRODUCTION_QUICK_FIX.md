# Production Quick Fix Guide

## 🚨 Kayıt Olma Çalışmıyor - 5 Dakikada Çözüm

### Adım 1: Diagnostic Çalıştır (30 saniye)

```bash
npm run diagnose
```

Çıktıyı oku ve kırmızı (❌) işaretli sorunları not et.

---

### Adım 2: Supabase Email Provider Kontrol (1 dakika)

1. [Supabase Dashboard](https://supabase.com/dashboard) > Projen seç
2. **Authentication** > **Providers** > **Email**
3. Kontrol et:
   - ✅ **Enable Email provider** AÇIK olmalı
   - ✅ **Confirm email** AÇIK olmalı (ücretsiz tier için zorunlu)

**Değişiklik yaptıysan:** Kaydet ve 2 dakika bekle.

---

### Adım 3: URL Configuration Kontrol (1 dakika)

1. Supabase Dashboard > **Authentication** > **URL Configuration**
2. Kontrol et:

```
Site URL: https://your-domain.com
```

3. **Redirect URLs** ekle:

```
https://your-domain.com/auth/callback
https://your-domain.vercel.app/auth/callback
```

**ÖNEMLİ:**
- ❌ `http://` KULLANMA (HTTPS olmalı)
- ❌ Trailing slash EKLEME (`/auth/callback/` değil `/auth/callback`)
- ❌ `localhost` BIRAKMA

**Değişiklik yaptıysan:** Kaydet.

---

### Adım 4: Vercel Environment Variables Kontrol (2 dakika)

1. [Vercel Dashboard](https://vercel.com/dashboard) > Projen seç
2. **Settings** > **Environment Variables**
3. Kontrol et (hepsi **Production** için tanımlı olmalı):

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

**Eksik veya yanlış varsa:**
1. Ekle/Düzelt
2. **Deployments** > En son deployment > **⋯** > **Redeploy**
3. 2-3 dakika bekle

---

### Adım 5: Test Et (30 saniye)

1. Production site'ına git
2. Kayıt ol
3. Email kutunu kontrol et (spam klasörü dahil)
4. Confirmation linkine tıkla
5. Login ol

---

## 🎯 Hala Çalışmıyor mu?

### Senaryo A: "Kayıt oluşturulamadı" Hatası

**Neden:** Email rate limit (ücretsiz tier: 4 email/saat)

**Çözüm:**
1. 1 saat bekle
2. Veya farklı email adresi dene
3. Veya Supabase Pro'ya geç ($25/ay)

---

### Senaryo B: Email Gelmiyor

**Kontrol:**
1. Spam klasörü
2. Email adresi doğru mu?
3. Supabase Dashboard > Logs > Auth Logs > Email gönderildi mi?

**Çözüm:**
```sql
-- Supabase SQL Editor'de çalıştır (manuel confirm)
UPDATE auth.users 
SET email_confirmed_at = NOW() 
WHERE email = 'user@example.com';
```

---

### Senaryo C: Login Sonrası Logout Oluyor

**Neden:** Cookie domain mismatch

**Çözüm:**
1. `NEXT_PUBLIC_APP_URL` production domain'e ayarlı mı kontrol et
2. Vercel'de redeploy yap
3. Browser cache temizle (Ctrl+Shift+Delete)

---

### Senaryo D: "Table does not exist" Hatası

**Neden:** Database migrations uygulanmamış

**Çözüm:**
```bash
# .env.local içinde production DB URL'i ayarla
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# Migration'ları uygula
npm run db:migrate
```

**Alternatif (Hızlı):**
1. Supabase Dashboard > **SQL Editor**
2. `database/schema.snapshot.sql` dosyasını aç
3. İçeriği kopyala ve SQL Editor'e yapıştır
4. **Run**

---

## 📞 Destek

Hala çalışmıyorsa:

1. **Diagnostic çıktısını kaydet:**
   ```bash
   npm run diagnose > diagnostic-output.txt
   ```

2. **Vercel logs al:**
   ```bash
   vercel logs -n 100 > vercel-logs.txt
   ```

3. **Browser console screenshot al:**
   - F12 > Console
   - Network tab > Failed requests

4. **GitHub Issue aç** ve yukarıdaki 3 dosyayı ekle.

---

## ✅ Başarı Kontrol Listesi

Kayıt/Login çalışıyorsa:

- [ ] Yeni kullanıcı kaydı oluşturulabiliyor
- [ ] Email confirmation geliyor
- [ ] Login çalışıyor
- [ ] Dashboard'a erişilebiliyor
- [ ] Profile bilgileri görünüyor

**Hepsi ✅ ise:** Production hazır! 🚀

---

## 🔧 Maintenance Mode

Sorun çözülene kadar maintenance mode aktif et:

```env
# Vercel Environment Variables
NEXT_PUBLIC_MAINTENANCE_MODE=true
```

Kullanıcılar "Bakım çalışması" mesajı görecek.
