# Ücretsiz Monitoring Kurulumu - 15 Dakika

Bu rehber, ücretsiz planlarda production monitoring'i 15 dakikada kurmayı gösterir.
Yalnızca Sentry, Vercel ve Supabase izleme yüzeyleri esas alınır.
Ayrı product analytics aracı kullanılmaz; hata ve performans izleme için Sentry temel kaynaktır.

## ✅ Kurulum Checklist

- [ ] GitHub Actions Health Check (5 dakika)
- [ ] Vercel Cron Health Check (2 dakika)
- [ ] UptimeRobot Monitoring (5 dakika)
- [ ] Browser Console Debug (3 dakika)

**Toplam Süre:** 15 dakika  
**Toplam Maliyet:** 0 TL/ay

---

## 1️⃣ GitHub Actions Health Check (5 dakika)

### Adım 1: Secrets Ekle (2 dakika)

1. GitHub repo'na git
2. **Settings** > **Secrets and variables** > **Actions**
3. **New repository secret** ile ekle:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
NEXT_PUBLIC_APP_URL=https://your-domain.com
SUPABASE_STORAGE_BUCKET_LISTINGS=listing-images
```

### Adım 2: Workflow Dosyası Zaten Mevcut ✅

`.github/workflows/health-check.yml` dosyası zaten oluşturuldu.

### Adım 3: Test Et (1 dakika)

1. GitHub repo > **Actions** tab
2. **Production Health Check** workflow'u seç
3. **Run workflow** > **Run workflow**
4. Sonucu bekle (30 saniye)

**Beklenen Sonuç:**
- ✅ Yeşil check mark
- Veya ❌ Kırmızı X + otomatik GitHub Issue

### Adım 4: Email Bildirimleri Aktif Et (2 dakika)

1. GitHub > **Settings** (profil settings, repo değil)
2. **Notifications**
3. **Actions** bölümünde:
   - ✅ **Send notifications for failed workflows**
   - ✅ **Email**

**Sonuç:** Her 6 saatte bir otomatik kontrol + sorun varsa email ✅

---

## 2️⃣ Vercel Cron Health Check (2 dakika)

### Adım 1: Vercel.json Zaten Güncel ✅

`vercel.json` dosyasına health check cron'u eklendi:

```json
{
  "crons": [
    {
      "path": "/api/health-check",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

### Adım 2: Deploy Et (1 dakika)

```bash
git add .
git commit -m "Add health check monitoring"
git push
```

Vercel otomatik deploy edecek.

### Adım 3: Test Et (1 dakika)

```bash
# Local test
curl http://localhost:3000/api/health-check

# Production test
curl https://your-domain.com/api/health-check
```

**Beklenen Sonuç:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "checks": {
    "environment": { "status": "healthy" },
    "supabase": { "status": "healthy" },
    "auth": { "status": "healthy" },
    "storage": { "status": "healthy" },
    "database_tables": { "status": "healthy" }
  }
}
```

### Adım 4: Vercel Dashboard'da Kontrol

1. Vercel Dashboard > Projen
2. **Cron Jobs** tab
3. `/api/health-check` görünmeli
4. İlk çalışma: Bir sonraki 6 saatlik dilim (00:00, 06:00, 12:00, 18:00 UTC)

**Sonuç:** Her 6 saatte bir otomatik health check ✅

---

## 3️⃣ UptimeRobot Monitoring (5 dakika)

### Adım 1: Hesap Aç (1 dakika)

1. [UptimeRobot](https://uptimerobot.com) > **Sign Up**
2. Email ile kayıt ol (ücretsiz)
3. Email'i confirm et

### Adım 2: Monitor Ekle (2 dakika)

1. Dashboard > **Add New Monitor**
2. Ayarlar:

```
Monitor Type: HTTP(s)
Friendly Name: OtoBurada Health Check
URL: https://your-domain.com/api/health-check
Monitoring Interval: 5 minutes
Monitor Timeout: 30 seconds
```

3. **Alert Contacts:**
   - Email adresini ekle
   - ✅ **Send alerts when down**
   - ✅ **Send alerts when up**

4. **Create Monitor**

### Adım 3: Keyword Monitoring Ekle (Opsiyonel - 1 dakika)

1. Aynı monitor'ü edit et
2. **Advanced Settings:**

```
Keyword Type: Keyword exists
Keyword: "healthy"
```

Bu, sadece HTTP 200 değil, response içinde "healthy" kelimesini de kontrol eder.

### Adım 4: Public Status Page Oluştur (Opsiyonel - 1 dakika)

1. Dashboard > **Status Pages**
2. **Add Status Page**
3. Monitors'ı seç
4. **Create Status Page**
5. URL'i paylaş: `https://stats.uptimerobot.com/xxxxx`

**Sonuç:** Her 5 dakikada bir kontrol + sorun varsa email ✅

---

## 4️⃣ Browser Console Debug (3 dakika)

### Adım 1: Debug Script Hazırla (1 dakika)

Kullanıcılara gönderilecek debug script'i hazırla:

**`docs/USER_DEBUG_SCRIPT.md`:**

```markdown
# Sorun Bildirimi İçin Debug Bilgileri

Lütfen aşağıdaki adımları takip edin:

## Adım 1: Console'u Açın
1. Klavyede **F12** tuşuna basın
2. **Console** tab'ına tıklayın

## Adım 2: Bu Kodu Kopyalayın
Aşağıdaki kodu kopyalayın ve Console'a yapıştırıp Enter'a basın:

\`\`\`javascript
console.log('=== OtoBurada Debug ===');
console.log('URL:', window.location.href);
console.log('Auth Token:', localStorage.getItem('sb-' + window.location.hostname.split('.')[0] + '-auth-token') ? 'Mevcut ✅' : 'Yok ❌');
console.log('LocalStorage Keys:', Object.keys(localStorage));
console.log('Errors:', performance.getEntriesByType('resource').filter(r => r.responseStatus >= 400));
console.log('=== Debug End ===');
\`\`\`

## Adım 3: Screenshot Alın
1. Console'daki çıktının screenshot'ını alın
2. Bize gönderin

## Adım 4: Network Tab (Opsiyonel)
1. **Network** tab'ına tıklayın
2. Kırmızı (failed) isteklerin screenshot'ını alın
```

### Adım 2: Kullanıcı Feedback Formu (Opsiyonel - 2 dakika)

Basit bir feedback formu ekle:

**`src/app/feedback/page.tsx`:**

```tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export default function FeedbackPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const debugInfo = {
      email,
      message,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      localStorage: Object.keys(localStorage),
    };

    // GitHub Issue olarak kaydet
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debugInfo),
    });

    setSent(true);
  };

  if (sent) {
    return (
      <div className="container max-w-md py-12 text-center">
        <h1 className="text-2xl font-bold mb-4">✅ Teşekkürler!</h1>
        <p>Geri bildiriminiz alındı. En kısa sürede dönüş yapacağız.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-12">
      <h1 className="text-2xl font-bold mb-6">Sorun Bildir</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Sorun Açıklaması</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder="Ne oldu? Hangi adımda sorun yaşadınız?"
            required
          />
        </div>
        <Button type="submit" className="w-full">
          Gönder
        </Button>
      </form>
    </div>
  );
}
```

**Sonuç:** Kullanıcılar sorun bildirebilir + otomatik debug bilgileri ✅

---

## 5️⃣ Monitoring Dashboard (Bonus)

### Tüm Monitoring Araçlarını Tek Yerden İzle

**Bookmark'lar:**

```
📊 Monitoring Dashboard
├─ GitHub Actions: https://github.com/[user]/[repo]/actions
├─ Vercel Logs: https://vercel.com/[team]/[project]/logs
├─ Supabase Logs: https://supabase.com/dashboard/project/[ref]/logs
├─ UptimeRobot: https://uptimerobot.com/dashboard
└─ Status Page: https://stats.uptimerobot.com/[id]
```

### Daily Check Routine (5 dakika/gün)

**Her sabah:**
1. UptimeRobot Dashboard kontrol (30 saniye)
2. Vercel Logs son 24 saat (1 dakika)
3. Supabase Logs > Auth Logs (1 dakika)
4. GitHub Actions son run (30 saniye)
5. Email inbox (automated alerts) (2 dakika)

---

## 6️⃣ Alert Kuralları

### Ne Zaman Alert Alırsın?

| Durum | Alert Kaynağı | Süre |
|-------|---------------|------|
| Site down | UptimeRobot | 5 dakika |
| Health check fail | GitHub Actions | 6 saat |
| Database error | Vercel Cron | 6 saat |
| User feedback | Email | Anında |

### Alert Geldiğinde Ne Yapmalısın?

1. **Hemen:**
   ```bash
   npm run diagnose
   vercel logs -n 100
   ```

2. **5 Dakika İçinde:**
   - Supabase Dashboard > Logs kontrol
   - GitHub Actions logs kontrol
   - Sorunu tespit et

3. **15 Dakika İçinde:**
   - Quick Fix Guide'ı takip et
   - Sorunu çöz
   - Verify et

4. **30 Dakika İçinde:**
   - Kullanıcılara bilgi ver (Twitter/Status page)
   - Post-mortem dokümanı yaz

---

## 7️⃣ Test Et

### Tüm Sistemi Test Et (5 dakika)

```bash
# 1. Local diagnostic
npm run diagnose

# 2. Production health check
curl https://your-domain.com/api/health-check

# 3. GitHub Actions manuel trigger
# GitHub > Actions > Production Health Check > Run workflow

# 4. UptimeRobot manuel check
# UptimeRobot Dashboard > Monitor > Quick Check

# 5. Vercel logs
vercel logs -n 10
```

**Beklenen Sonuç:**
- ✅ Tüm kontroller yeşil
- ✅ Email bildirimi yok
- ✅ Logs'da hata yok

---

## 8️⃣ Özet

### Kurduğun Sistemler

```
┌─────────────────────────────────────────┐
│  Otomatik Monitoring (Ücretsiz)        │
├─────────────────────────────────────────┤
│  ✅ GitHub Actions (her 6 saatte)      │
│  ✅ Vercel Cron (her 6 saatte)         │
│  ✅ UptimeRobot (her 5 dakikada)       │
│  ✅ Email alerts                        │
│  ✅ Public status page                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Manuel Debug Araçları                  │
├─────────────────────────────────────────┤
│  ✅ npm run diagnose                    │
│  ✅ Browser console script              │
│  ✅ User feedback form                  │
│  ✅ Vercel logs                         │
│  ✅ Supabase logs                       │
└─────────────────────────────────────────┘
```

### Toplam Maliyet

**0 TL/ay** 🎉

### Kapsam

- ✅ 24/7 uptime monitoring
- ✅ Health checks (her 5-6 saatte)
- ✅ Email alerts
- ✅ Public status page
- ✅ User feedback system
- ✅ Debug tools

---

## 🚀 Sonraki Adımlar

1. **Bu Hafta:**
   - [ ] Tüm monitoring sistemlerini kur
   - [ ] İlk health check sonuçlarını gözlemle
   - [ ] Alert email'lerini test et

2. **Bu Ay:**
   - [ ] Daily check routine'i alışkanlık haline getir
   - [ ] İlk incident'ı yönet ve dokümante et
   - [ ] Monitoring'i iyileştir (yeni metrikler ekle)

3. **Gelecek:**
   - [ ] Sentry proje kurallarına uygun şekilde iyileştirilmeye devam etsin
   - [ ] Ücretsiz-plan uyumlu custom metrics dashboard oluştur
   - [ ] Automated incident response
   - [ ] Ayrı analytics ürünü eklemeden Vercel + Supabase + Sentry üçlüsünü koru

---

## 📚 Faydalı Linkler

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel Cron Jobs](https://vercel.com/docs/cron-jobs)
- [UptimeRobot Docs](https://uptimerobot.com/api/)
- [Supabase Monitoring](https://supabase.com/docs/guides/platform/metrics)

**Sorun mu var?** → `npm run diagnose` 🚀
