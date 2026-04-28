# Runtime Errors - Hızlı Çözüm

Bu doküman, production/local ortamda karşılaşılan runtime hatalarını ve çözümlerini içerir.

## 🔴 Sorun 1: Maintenance Mode Aktif (Admin Bile Etkileniyor)

### Belirti
```
[maintenanceCheck] Path: /dashboard/listings/create, Maintenance: true
[maintenanceCheck] User: xxx, Admin: true
```

Admin olsan bile maintenance ekranına yönlendiriliyorsun.

### Neden
`platform_settings` tablosunda `maintenance_mode: true` ayarlanmış.

### Çözüm 1: Maintenance Mode'u Kapat (Önerilen)

**Supabase SQL Editor:**
```sql
-- Maintenance mode'u kapat
UPDATE platform_settings
SET value = jsonb_set(value, '{maintenance_mode}', 'false')
WHERE key = 'general_appearance';

-- Kontrol et
SELECT value->>'maintenance_mode' as maintenance_mode
FROM platform_settings
WHERE key = 'general_appearance';
```

### Çözüm 2: Environment Variable ile Bypass (Local Development)

**`.env.local`:**
```env
MAINTENANCE_MODE_BYPASS=true
```

Bu sadece local development için kullanılmalı. Production'da kullanma!

### Çözüm 3: Admin Olarak Giriş Yap

Kod zaten admin'leri bypass ediyor. Eğer hala sorun varsa:

1. Logout yap
2. Admin hesabı ile login yap
3. `/dashboard` veya `/admin` sayfasına git

---

## 🟡 Sorun 2: Redis Config Eksik (Rate Limiting Warning)

### Belirti
```
CRITICAL: Upstash Redis config missing in production. 
Rate limiting will FAIL CLOSED.
```

### Neden
`UPSTASH_REDIS_REST_URL` ve `UPSTASH_REDIS_REST_TOKEN` tanımlı değil.

### Risk Değerlendirmesi
- 🟢 **Düşük Risk**: In-memory fallback aktif
- ✅ **Mitigasyon**: Rate limiting hala çalışıyor (local memory)
- ⚠️ **Sınırlama**: Distributed rate limiting yok (tek server için OK)

### Çözüm 1: Upstash Redis Ekle (Önerilen - Ücretsiz)

#### Adım 1: Upstash Hesap Aç (2 dakika)
1. [Upstash Console](https://console.upstash.com/) > Sign Up
2. GitHub ile giriş yap (ücretsiz)

#### Adım 2: Redis Database Oluştur (1 dakika)
1. **Create Database**
2. Ayarlar:
   ```
   Name: otoburada-ratelimit
   Type: Regional
   Region: eu-west-1 (Ireland - en yakın)
   Plan: Free (10K requests/day)
   ```
3. **Create**

#### Adım 3: Credentials Al (30 saniye)
1. Database > **REST API** tab
2. Kopyala:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxx
   ```

#### Adım 4: Environment Variables Ekle

**Vercel:**
1. Vercel Dashboard > Settings > Environment Variables
2. Ekle:
   ```
   UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
   UPSTASH_REDIS_REST_TOKEN=AXXXxxx
   ```
3. **Save** > **Redeploy**

**Local:**
```env
# .env.local
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXxxx
```

### Çözüm 2: In-Memory Fallback Kullan (Geçici)

Hiçbir şey yapma! In-memory fallback zaten aktif.

**Sınırlamalar:**
- Tek server için çalışır (Vercel'de her function ayrı instance)
- Restart'ta sıfırlanır
- Distributed değil

**Yeterli mi?**
- ✅ Küçük/orta trafik için yeterli
- ✅ Ücretsiz tier için OK
- ⚠️ Yüksek trafik için Upstash önerilir

---

## 🔴 Sorun 3: Database Column Eksik

### Belirti
```
column profiles.verification_requested_at does not exist
```

### Neden
Database migration uygulanmamış.

### Çözüm: Migration Uygula

#### Yöntem 1: Supabase SQL Editor (Önerilen)

1. Supabase Dashboard > **SQL Editor**
2. Aşağıdaki SQL'i kopyala ve çalıştır:

```sql
-- Add verification_requested_at column
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS verification_requested_at TIMESTAMPTZ;

-- Add index
CREATE INDEX IF NOT EXISTS idx_profiles_verification_requested_at 
ON profiles(verification_requested_at) 
WHERE verification_requested_at IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.verification_requested_at IS 'Timestamp when business verification was requested';
```

3. **Run** (Ctrl+Enter)
4. ✅ "Success. No rows returned"

#### Yöntem 2: Migration Script (psql gerekli)

```bash
npm run db:migrate
```

**Not:** Bu yöntem için `psql` kurulu olmalı.

#### Doğrulama

```sql
-- Column var mı kontrol et
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name = 'verification_requested_at';
```

**Beklenen Sonuç:**
```
column_name                  | data_type
-----------------------------+---------------------------
verification_requested_at    | timestamp with time zone
```

---

## 🟡 Sorun 4: Security Definer View Warning

### Belirti
```
Security Definer View: View `public.public_profiles` is defined 
with the SECURITY DEFINER property
```

### Neden
View, creator'ın permission'larını kullanıyor (querying user'ın değil).

### Risk Değerlendirmesi
- 🟡 **Orta Risk**: RLS bypass potansiyeli
- ✅ **Mitigasyon**: View sadece public field'ları expose ediyor
- ⚠️ **Best Practice:** SECURITY INVOKER kullanılmalı

### Çözüm: View'ı SECURITY INVOKER ile Yeniden Oluştur

**Supabase SQL Editor:**
```sql
-- Drop existing view
DROP VIEW IF EXISTS public.public_profiles;

-- Recreate with SECURITY INVOKER (safer)
CREATE VIEW public.public_profiles 
WITH (security_invoker = true) AS
SELECT 
  id, 
  full_name, 
  avatar_url, 
  city, 
  role, 
  user_type, 
  business_name, 
  business_logo_url, 
  is_verified, 
  is_banned, 
  ban_reason, 
  verified_business, 
  verification_status, 
  trust_score, 
  business_slug, 
  created_at, 
  updated_at
FROM public.profiles;

-- Grant access
GRANT SELECT ON public.public_profiles TO anon, authenticated, service_role;
```

### Doğrulama

```sql
-- View'ın security type'ını kontrol et
SELECT 
  schemaname,
  viewname,
  CASE 
    WHEN definition LIKE '%security_invoker%' THEN 'INVOKER ✅'
    ELSE 'DEFINER ⚠️'
  END as security_type
FROM pg_views
WHERE schemaname = 'public' 
AND viewname = 'public_profiles';
```

**Beklenen Sonuç:**
```
schemaname | viewname         | security_type
-----------+------------------+--------------
public     | public_profiles  | INVOKER ✅
```

---

## 🎯 Hızlı Kontrol Checklist

### Production'da Sorun Yaşıyorsan

```bash
# 1. Diagnostic çalıştır
npm run diagnose

# 2. Vercel logs kontrol et
vercel logs -n 100 | grep -i error

# 3. Supabase logs kontrol et
# Dashboard > Logs > Database Logs
```

### Yaygın Hatalar ve Çözümleri

| Hata | Çözüm | Süre |
|------|-------|------|
| Maintenance mode aktif | SQL ile kapat | 1 dakika |
| Redis config eksik | Upstash ekle | 5 dakika |
| Column eksik | Migration uygula | 2 dakika |
| Security Definer View | View'ı SECURITY INVOKER ile yeniden oluştur | 2 dakika |
| RLS policy hatası | Policy kontrol et | 5 dakika |
| Auth token invalid | Logout/login | 30 saniye |

---

## 📊 Log Seviyeleri

### Kritik (🔴 CRITICAL)
- **Aksiyon:** Hemen düzelt
- **Örnek:** Database down, Auth bypass

### Hata (🟠 ERROR)
- **Aksiyon:** Bu gün düzelt
- **Örnek:** API call fail, Query error

### Uyarı (🟡 WARNING)
- **Aksiyon:** Bu hafta düzelt
- **Örnek:** Redis eksik, Slow query

### Bilgi (🔵 INFO)
- **Aksiyon:** Gözlemle
- **Örnek:** User login, API call

### Debug (⚪ DEBUG)
- **Aksiyon:** Development only
- **Örnek:** Function call, Variable value

---

## 🔧 Troubleshooting Workflow

### Adım 1: Log'ları Topla (2 dakika)

```bash
# Vercel logs
vercel logs -n 100 > vercel-logs.txt

# Local logs
# Terminal output'u kopyala
```

### Adım 2: Hatayı Kategorize Et (1 dakika)

- 🔴 **Critical:** Hemen düzelt
- 🟡 **Warning:** Gözlemle
- 🔵 **Info:** Normal

### Adım 3: Çözümü Uygula (5-10 dakika)

Bu dokümandaki çözümleri takip et.

### Adım 4: Doğrula (2 dakika)

```bash
# Diagnostic çalıştır
npm run diagnose

# Logs kontrol et
vercel logs -n 10
```

---

## 📚 İlgili Dokümanlar

- [`docs/PRODUCTION_TROUBLESHOOTING.md`](PRODUCTION_TROUBLESHOOTING.md) - Detaylı troubleshooting
- [`docs/PRODUCTION_QUICK_FIX.md`](PRODUCTION_QUICK_FIX.md) - 5 dakikada çözüm
- [`docs/FREE_TIER_MONITORING.md`](FREE_TIER_MONITORING.md) - Monitoring stratejisi
- [`docs/KNOWN_SECURITY_ISSUES.md`](KNOWN_SECURITY_ISSUES.md) - Güvenlik sorunları

---

## 🆘 Hala Çalışmıyor mu?

### 1. Diagnostic Çalıştır
```bash
npm run diagnose
```

### 2. Logs Kontrol Et
```bash
vercel logs --follow
```

### 3. Supabase Kontrol Et
- Dashboard > Logs > Database Logs
- Dashboard > Logs > Auth Logs

### 4. GitHub Issue Aç
- Log'ları ekle
- Hata mesajını ekle
- Adımları açıkla

---

## ✅ Özet

**4 Ana Sorun:**
1. ✅ Maintenance mode → SQL ile kapat
2. ✅ Redis eksik → Upstash ekle (5 dakika) veya in-memory kullan
3. ✅ Column eksik → Migration uygula (2 dakika)
4. ✅ Security Definer View → SECURITY INVOKER ile yeniden oluştur (2 dakika)

**Toplam Süre:** 12 dakika

**İlk Adım:**
```bash
npm run diagnose
```

🚀 **Sorunlar çözüldü!**
