# Hızlı Başlangıç - Ücretsiz Tier

Bu rehber, projeyi ücretsiz tier'larda 30 dakikada production'a deploy etmeyi gösterir.

## ✅ Ön Gereksinimler (Ücretsiz)

- [ ] GitHub hesabı
- [ ] Vercel hesabı (GitHub ile giriş)
- [ ] Supabase hesabı (GitHub ile giriş)
- [ ] Node.js 20+ (local development için)

**Toplam Maliyet:** 0 TL/ay 🎉

---

## 🚀 30 Dakikada Production'a Deploy

### 1️⃣ Supabase Kurulumu (10 dakika)

#### Adım 1: Proje Oluştur (2 dakika)
1. [Supabase Dashboard](https://supabase.com/dashboard) > **New Project**
2. Ayarlar:
   ```
   Name: otoburada
   Database Password: [güçlü şifre - kaydet!]
   Region: Frankfurt (en yakın)
   Plan: Free
   ```
3. **Create Project** (2-3 dakika bekle)

#### Adım 2: Database Setup (5 dakika)
1. Supabase Dashboard > **SQL Editor**
2. `database/schema.snapshot.sql` dosyasını aç
3. İçeriği kopyala ve SQL Editor'e yapıştır
4. **Run** (30 saniye)
5. ✅ Başarılı: "Success. No rows returned"

#### Adım 3: Storage Buckets (2 dakika)
1. Supabase Dashboard > **Storage**
2. **Create bucket:**
   ```
   Name: listing-images
   Public: ✅
   ```
3. **Create bucket:**
   ```
   Name: listing-documents
   Public: ❌
   ```

#### Adım 4: Auth Configuration (1 dakika)
1. Supabase Dashboard > **Authentication** > **Providers**
2. **Email** provider:
   ```
   ✅ Enable Email provider
   ✅ Confirm email
   ```
3. **Save**

---

### 2️⃣ Vercel Deployment (10 dakika)

#### Adım 1: GitHub'a Push (2 dakika)
```bash
# Eğer henüz push etmediysen
git add .
git commit -m "Initial commit"
git push origin main
```

#### Adım 2: Vercel'e Import (3 dakika)
1. [Vercel Dashboard](https://vercel.com/dashboard) > **Add New** > **Project**
2. GitHub repo'nu seç: `oto-burada`
3. **Import**
4. Framework Preset: **Next.js** (otomatik seçilir)
5. **Deploy** (3-5 dakika bekle)

#### Adım 3: Environment Variables (5 dakika)
1. Vercel Dashboard > Projen > **Settings** > **Environment Variables**
2. Şu variables'ları ekle:

```env
# Supabase (Zorunlu)
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.xxxxx.supabase.co:5432/postgres

# App (Zorunlu)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app

# Storage (Zorunlu)
SUPABASE_STORAGE_BUCKET_LISTINGS=listing-images
SUPABASE_STORAGE_BUCKET_DOCUMENTS=listing-documents

# Demo (Opsiyonel)
SUPABASE_DEMO_USER_PASSWORD=test-123456
```

**Supabase Credentials Nerede?**
- Supabase Dashboard > **Settings** > **API**
- URL: `Project URL`
- Anon Key: `anon` `public`
- Service Role Key: `service_role` `secret`

3. **Save**
4. **Deployments** > En son deployment > **⋯** > **Redeploy**

---

### 3️⃣ Supabase URL Configuration (5 dakika)

#### Adım 1: Vercel Domain'i Kopyala
```
https://oto-burada-xxxxx.vercel.app
```

#### Adım 2: Supabase'e Ekle
1. Supabase Dashboard > **Authentication** > **URL Configuration**
2. **Site URL:**
   ```
   https://oto-burada-xxxxx.vercel.app
   ```
3. **Redirect URLs** (her satıra bir tane):
   ```
   https://oto-burada-xxxxx.vercel.app/auth/callback
   https://oto-burada-xxxxx.vercel.app/**
   ```
4. **Save**

---

### 4️⃣ Test Et (5 dakika)

#### Adım 1: Site'ı Aç
```
https://oto-burada-xxxxx.vercel.app
```

#### Adım 2: Kayıt Ol
1. **Kayıt Ol** butonuna tıkla
2. Email ve şifre gir
3. **Kayıt Ol**
4. ✅ "Hesabın oluşturuldu. E-posta doğrulaması açıksa gelen kutunu kontrol et."

#### Adım 3: Email Confirmation
1. Email kutunu kontrol et (spam klasörü dahil)
2. Confirmation linkine tıkla
3. ✅ Yönlendirildin

#### Adım 4: Login
1. Email ve şifre ile giriş yap
2. ✅ Dashboard'a yönlendirildin

#### Adım 5: Diagnostic Çalıştır (Opsiyonel)
```bash
# Local'de
npm run diagnose
```

**Beklenen Sonuç:**
```
✅ Başarılı: 7
❌ Başarısız: 0
⚠️  Uyarı: 2-3 (Turnstile opsiyonel)
```

---

## 🎯 Başarı! Production'dasın 🚀

### Sonraki Adımlar

#### 1. Monitoring Kur (15 dakika)
```bash
# Detaylı rehber
cat docs/MONITORING_SETUP.md
```

**Özet:**
- GitHub Actions secrets ekle
- UptimeRobot hesap aç
- Health check test et

#### 2. Custom Domain Ekle (Opsiyonel - 10 dakika)
1. Vercel Dashboard > Projen > **Settings** > **Domains**
2. Domain ekle: `otoburada.com`
3. DNS kayıtlarını güncelle (domain sağlayıcında)
4. Supabase URL Configuration'ı güncelle

#### 3. Demo Data Ekle (Opsiyonel - 5 dakika)
```bash
# Local'de
npm run db:seed-demo
```

---

## 🔧 Troubleshooting

### Sorun: Kayıt olma çalışmıyor

**Hızlı Kontrol:**
```bash
npm run diagnose
```

**Yaygın Nedenler:**
1. ❌ Email Provider kapalı
   - Çözüm: Supabase > Auth > Providers > Email > Enable ✅

2. ❌ Site URL yanlış
   - Çözüm: Supabase > Auth > URL Configuration kontrol et

3. ❌ Environment variables eksik
   - Çözüm: Vercel > Settings > Environment Variables kontrol et

4. ❌ Email rate limit (4/saat ücretsiz tier)
   - Çözüm: 1 saat bekle veya farklı email dene

**Detaylı Çözümler:**
- [`docs/PRODUCTION_QUICK_FIX.md`](PRODUCTION_QUICK_FIX.md) - 5 dakikada çözüm
- [`docs/PRODUCTION_TROUBLESHOOTING.md`](PRODUCTION_TROUBLESHOOTING.md) - Detaylı rehber

---

### Sorun: Build hatası

**Kontrol:**
```bash
npm run lint
npm run typecheck
npm run build
```

**Yaygın Nedenler:**
1. ❌ Node.js versiyonu eski
   - Çözüm: Node.js 20+ kullan

2. ❌ Dependencies eksik
   - Çözüm: `npm install`

3. ❌ TypeScript hatası
   - Çözüm: `npm run typecheck` çıktısını kontrol et

---

### Sorun: Vercel deployment fail

**Kontrol:**
```bash
vercel logs -n 100
```

**Yaygın Nedenler:**
1. ❌ Environment variables eksik
   - Çözüm: Vercel > Settings > Environment Variables

2. ❌ Build command yanlış
   - Çözüm: `vercel.json` kontrol et (zaten doğru)

3. ❌ Security audit fail
   - Çözüm: GitHub Actions > Security Audit kontrol et (artık non-blocking)

---

## 📊 Ücretsiz Tier Limitleri

| Platform | Limit | Kullanım | Yeterli mi? |
|----------|-------|----------|-------------|
| **Supabase** | 500 MB DB | ~50 MB | ✅ Bol bol |
| **Supabase** | 4 email/saat | Kayıt confirmation | ⚠️ Dikkat |
| **Supabase** | 50K users | Kullanıcı sayısı | ✅ Yeterli |
| **Vercel** | 100 GB bandwidth | Traffic | ✅ Yeterli |
| **Vercel** | Unlimited deployments | Deploy sayısı | ✅ Sınırsız |
| **GitHub Actions** | 2000 dakika/ay | CI/CD | ✅ Bol bol |

**En Kritik Limit:** Supabase email (4/saat)
- İlk kullanıcılar için yeterli
- Çok kayıt varsa Supabase Pro ($25/ay) gerekebilir

---

## 🎓 Öğrendiklerimiz

### ✅ Ücretsiz Tier'da Production Mümkün!
- Supabase Free: Database + Auth + Storage
- Vercel Hobby: Unlimited deployments
- GitHub Actions: CI/CD + Monitoring

### ✅ 30 Dakikada Deploy
- Supabase setup: 10 dakika
- Vercel deployment: 10 dakika
- URL configuration: 5 dakika
- Test: 5 dakika

### ✅ Monitoring Dahil
- GitHub Actions health check (her 6 saatte)
- Vercel cron health check (her 6 saatte)
- UptimeRobot (her 5 dakikada - opsiyonel)

---

## 📚 Faydalı Komutlar

```bash
# Development
npm run dev                 # Local server
npm run build              # Production build
npm run lint               # Lint check
npm run typecheck          # Type check

# Database
npm run db:migrate         # Run migrations
npm run db:seed-demo       # Seed demo data
npm run db:bootstrap-demo  # Full setup

# Diagnostic
npm run diagnose           # Health check

# Deployment
git push                   # Auto-deploy (Vercel)
vercel logs --follow       # Real-time logs

# Monitoring
npm run diagnose           # Local health check
```

---

## 🆘 Yardım

### Dokümantasyon
- [`README.md`](../README.md) - Genel bakış
- [`docs/PRODUCTION_QUICK_FIX.md`](PRODUCTION_QUICK_FIX.md) - 5 dakikada çözüm
- [`docs/PRODUCTION_TROUBLESHOOTING.md`](PRODUCTION_TROUBLESHOOTING.md) - Detaylı troubleshooting
- [`docs/FREE_TIER_MONITORING.md`](FREE_TIER_MONITORING.md) - Monitoring stratejisi
- [`docs/MONITORING_SETUP.md`](MONITORING_SETUP.md) - Monitoring kurulumu

### Komutlar
```bash
npm run diagnose           # İlk adım her zaman bu!
vercel logs -n 100         # Vercel logs
```

### Community
- GitHub Issues: Sorun bildir
- GitHub Discussions: Soru sor

---

## ✅ Checklist

### Deployment Öncesi
- [ ] Supabase projesi oluşturuldu
- [ ] Database schema uygulandı
- [ ] Storage buckets oluşturuldu
- [ ] Auth provider aktif
- [ ] GitHub'a push edildi

### Deployment Sonrası
- [ ] Vercel'e import edildi
- [ ] Environment variables eklendi
- [ ] Supabase URL configuration güncellendi
- [ ] Test kayıt/login çalışıyor
- [ ] Diagnostic başarılı

### Monitoring (Opsiyonel)
- [ ] GitHub Actions secrets eklendi
- [ ] UptimeRobot hesap açıldı
- [ ] Health check test edildi

**Hepsi ✅ ise:** Production hazır! 🚀

---

## 🎉 Tebrikler!

Projen artık production'da ve ücretsiz tier'da çalışıyor!

**Sonraki Adımlar:**
1. Custom domain ekle
2. Monitoring kur
3. Demo data ekle
4. İlk gerçek kullanıcıyı bekle 😊

**Sorun mu var?**
```bash
npm run diagnose
```

🚀 **Happy Coding!**
