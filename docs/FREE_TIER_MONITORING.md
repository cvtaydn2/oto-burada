# Ücretsiz Tier Monitoring & Debugging Stratejisi

Bu doküman, ücretli monitoring araçları olmadan production sorunlarını nasıl tespit edeceğinizi gösterir.

## 🎯 Strateji: 3 Katmanlı Monitoring

```
1. Browser-Based (Gerçek zamanlı)
2. Log-Based (Geçmiş analiz)
3. Scheduled Checks (Proaktif)
```

---

## 1️⃣ Browser-Based Monitoring (Ücretsiz)

### A. Browser Console ile Canlı Debug

**Kullanıcı sorun bildirdiğinde:**

```javascript
// 1. Console'u aç (F12)
// 2. Bu kodu yapıştır ve çalıştır:

console.log('=== OtoBurada Debug Info ===');

// Auth durumu
const authToken = localStorage.getItem('sb-' + window.location.hostname.split('.')[0] + '-auth-token');
console.log('Auth Token:', authToken ? 'Mevcut ✅' : 'Yok ❌');

// Environment
console.log('Environment:', {
  url: window.location.href,
  supabaseUrl: document.querySelector('meta[name="supabase-url"]')?.content || 'Not found',
  appUrl: window.location.origin
});

// Network errors (son 5 dakika)
console.log('Network Errors:', performance.getEntriesByType('resource')
  .filter(r => r.responseStatus >= 400)
  .map(r => ({ url: r.name, status: r.responseStatus }))
);

// Local storage
console.log('LocalStorage Keys:', Object.keys(localStorage));

console.log('=== Debug Info End ===');
```

**Kullanıcıya gönder:**
- Screenshot al (F12 > Console)
- Veya "Copy console output" yap

---

### B. Network Tab Monitoring

**Kayıt/Login sırasında:**

1. F12 > **Network** tab
2. **Preserve log** ✅ işaretle
3. **Filter:** `fetch/xhr`
4. Kayıt/Login işlemini yap
5. Kırmızı (failed) isteklere bak

**Yaygın Hatalar:**

| Status | Neden | Çözüm |
|--------|-------|-------|
| **401** | Auth token yok/geçersiz | Logout/login tekrar |
| **403** | RLS policy engelledi | Database policy kontrol |
| **429** | Rate limit | 1 saat bekle |
| **500** | Server hatası | Vercel logs kontrol |
| **CORS** | Origin izni yok | Supabase CORS ayarları |

---

### C. Application Tab (Storage)

**F12 > Application > Storage:**

```
Local Storage:
  └─ sb-xxxxx-auth-token (Auth durumu)
  └─ supabase.auth.token (Eski format)

Cookies:
  └─ sb-xxxxx-auth-token (Session cookie)

Session Storage:
  └─ (Geçici data)
```

**Kontrol:**
- Auth token var mı?
- Expire olmuş mu?
- Domain doğru mu?

---

## 2️⃣ Log-Based Monitoring (Ücretsiz)

### A. Vercel Logs (Real-time)

**Terminal'den:**

```bash
# Real-time logs (canlı izle)
vercel logs --follow

# Son 100 log
vercel logs -n 100

# Sadece error'lar
vercel logs --follow | grep -i error

# Belirli bir endpoint
vercel logs --follow | grep "/api/auth"
```

**Web'den:**
```
Vercel Dashboard > Projen > Logs
- Filter: Errors only
- Time range: Last 1 hour
```

**Yaygın Log Patterns:**

```bash
# Auth hatası
"Failed to fetch favorites: DB Error"
→ RLS policy veya connection sorunu

# Rate limit
"Too many requests"
→ 1 saat bekle veya Redis ekle

# Environment variable eksik
"Supabase yapılandırması eksik"
→ Vercel env variables kontrol

# Email gönderim hatası
"Email rate limit exceeded"
→ Supabase ücretsiz tier limiti (4/saat)
```

---

### B. Supabase Logs (Ücretsiz)

**Dashboard > Logs:**

#### 1. **API Logs** (HTTP requests)
```
Filter: Status >= 400
Time: Last 1 hour

Örnek:
POST /auth/v1/signup → 429 (Rate limit)
GET /rest/v1/listings → 401 (Auth failed)
```

#### 2. **Auth Logs** (Login/Signup)
```
Filter: Event type = signup
Time: Last 24 hours

Örnek:
✅ User signed up: user@example.com
❌ Signup failed: Email rate limit exceeded
```

#### 3. **Database Logs** (SQL queries)
```
Filter: Slow queries (>1000ms)
Time: Last 1 hour

Örnek:
SELECT * FROM listings WHERE ... (2.5s)
→ Index eksik olabilir
```

---

### C. Browser Console Logs (Kullanıcıdan)

**Kullanıcıya şunu gönder:**

```
Sorun yaşadığınızda:
1. F12 tuşuna basın
2. Console tab'ına gidin
3. Kırmızı hataları screenshot alın
4. Bize gönderin
```

**Yaygın Console Errors:**

```javascript
// CORS hatası
"Access to fetch at 'https://xxx.supabase.co' has been blocked by CORS policy"
→ Supabase Dashboard > Settings > API > Additional Origins

// Network hatası
"Failed to fetch"
→ Internet bağlantısı veya Supabase down

// Auth hatası
"Invalid JWT token"
→ Token expire olmuş, logout/login

// RLS hatası
"new row violates row-level security policy"
→ Database policy kontrol
```

---

## 3️⃣ Scheduled Checks (Proaktif - Ücretsiz)

### A. GitHub Actions Health Check (Ücretsiz)

**`.github/workflows/health-check.yml`:**

```yaml
name: Production Health Check

on:
  schedule:
    - cron: '0 */6 * * *'  # Her 6 saatte bir
  workflow_dispatch:  # Manuel tetikleme

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run diagnostic
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          NEXT_PUBLIC_APP_URL: ${{ secrets.NEXT_PUBLIC_APP_URL }}
        run: npm run diagnose
      
      - name: Notify on failure
        if: failure()
        run: |
          echo "❌ Health check failed!"
          echo "Check logs: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
```

**Avantajlar:**
- ✅ Ücretsiz (GitHub Actions 2000 dakika/ay)
- ✅ Otomatik çalışır
- ✅ Email bildirimi (GitHub notifications)

---

### B. Vercel Cron ile Health Check (Ücretsiz)

**`src/app/api/health-check/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Cron secret kontrolü
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const checks = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    checks: {} as Record<string, { status: string; message?: string }>,
  };

  // 1. Supabase bağlantı
  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
    
    checks.checks.database = error 
      ? { status: 'unhealthy', message: error.message }
      : { status: 'healthy' };
  } catch (error) {
    checks.checks.database = { status: 'unhealthy', message: String(error) };
    checks.status = 'unhealthy';
  }

  // 2. Environment variables
  const requiredEnvs = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ];
  
  const missingEnvs = requiredEnvs.filter(key => !process.env[key]);
  checks.checks.environment = missingEnvs.length > 0
    ? { status: 'unhealthy', message: `Missing: ${missingEnvs.join(', ')}` }
    : { status: 'healthy' };

  if (missingEnvs.length > 0) {
    checks.status = 'unhealthy';
  }

  // 3. Storage (opsiyonel)
  if (process.env.SUPABASE_STORAGE_BUCKET_LISTINGS) {
    try {
      const supabase = await createSupabaseServerClient();
      const { error } = await supabase.storage.getBucket(process.env.SUPABASE_STORAGE_BUCKET_LISTINGS);
      
      checks.checks.storage = error
        ? { status: 'warning', message: error.message }
        : { status: 'healthy' };
    } catch (error) {
      checks.checks.storage = { status: 'warning', message: String(error) };
    }
  }

  return NextResponse.json(checks, {
    status: checks.status === 'healthy' ? 200 : 503,
  });
}
```

**`vercel.json`:**

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

**Avantajlar:**
- ✅ Ücretsiz (Vercel Hobby plan)
- ✅ Otomatik çalışır
- ✅ Vercel Dashboard'da sonuçları görebilirsin

---

### C. UptimeRobot (Ücretsiz)

**Setup:**

1. [UptimeRobot](https://uptimerobot.com) hesap aç (ücretsiz)
2. **Add New Monitor:**
   ```
   Monitor Type: HTTP(s)
   URL: https://your-domain.com/api/health
   Interval: 5 minutes (ücretsiz tier)
   Alert Contacts: Email
   ```

3. **Alert Conditions:**
   - Status code != 200
   - Response time > 5000ms
   - Keyword not found (opsiyonel)

**Avantajlar:**
- ✅ Tamamen ücretsiz (50 monitor)
- ✅ Email/SMS bildirimi
- ✅ Public status page
- ✅ 5 dakika interval

---

## 4️⃣ Kullanıcı Feedback Sistemi (Ücretsiz)

### A. Simple Error Reporting

**`src/components/shared/error-reporter.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ErrorReporter({ error }: { error?: Error }) {
  const [feedback, setFeedback] = useState('');
  const [sent, setSent] = useState(false);

  const handleReport = async () => {
    const report = {
      error: error?.message,
      stack: error?.stack,
      feedback,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    };

    // GitHub Issue olarak kaydet (ücretsiz)
    const issueBody = `
## Kullanıcı Hatası

**URL:** ${report.url}
**Zaman:** ${report.timestamp}

**Hata:**
\`\`\`
${report.error}
\`\`\`

**Kullanıcı Açıklaması:**
${report.feedback}

**Stack Trace:**
\`\`\`
${report.stack}
\`\`\`

**User Agent:**
${report.userAgent}
    `.trim();

    // Supabase'e kaydet (ücretsiz)
    await fetch('/api/error-reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(report),
    });

    setSent(true);
  };

  if (sent) {
    return <div className="text-green-600">✅ Teşekkürler! Hata bildirildi.</div>;
  }

  return (
    <div className="space-y-4">
      <Textarea
        placeholder="Ne oldu? (opsiyonel)"
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
      />
      <Button onClick={handleReport}>Hata Bildir</Button>
    </div>
  );
}
```

**Database:**

```sql
CREATE TABLE error_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  error_message TEXT,
  stack_trace TEXT,
  user_feedback TEXT,
  url TEXT,
  user_agent TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Sadece kendi hatalarını görebilir
ALTER TABLE error_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own errors"
ON error_reports FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
```

---

## 5️⃣ Pratik Debugging Workflow

### Senaryo: "Kayıt olma çalışmıyor" bildirimi geldi

#### Adım 1: Hızlı Kontrol (2 dakika)
```bash
# 1. Diagnostic çalıştır
npm run diagnose

# 2. Vercel logs kontrol
vercel logs -n 50 | grep -i "signup\|register\|error"

# 3. Supabase logs kontrol
# Dashboard > Logs > Auth Logs > Son 1 saat
```

#### Adım 2: Kullanıcıdan Bilgi Al (3 dakika)
```
Kullanıcıya sor:
1. Hangi email adresi? (rate limit kontrolü için)
2. Hata mesajı ne? (screenshot)
3. Browser console'da kırmızı hata var mı? (F12)
4. Hangi browser/device?
```

#### Adım 3: Reproduce Et (5 dakika)
```bash
# 1. Aynı email ile dene (local)
# 2. Aynı email ile dene (production)
# 3. Farklı email ile dene (production)

# Sonuç:
# - Tüm emailler fail → Genel sorun (Email provider kapalı?)
# - Sadece o email fail → Rate limit veya banned
# - Reproduce edilemiyor → Browser/network sorunu
```

#### Adım 4: Fix ve Verify (10 dakika)
```bash
# Sorunu çöz (örn: Email provider aç)
# Kullanıcıya test ettir
# Logs'da başarılı signup gör
```

---

## 6️⃣ Ücretsiz Tier Limitleri - Proaktif İzleme

### A. Email Rate Limit Tracker

**`src/app/api/admin/email-usage/route.ts`:**

```typescript
import { NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  const supabase = createSupabaseAdminClient();
  
  // Son 1 saatte kaç email gönderildi?
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  
  const { count } = await supabase
    .from('auth.users')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo);

  const limit = 4; // Supabase free tier
  const remaining = Math.max(0, limit - (count || 0));

  return NextResponse.json({
    limit,
    used: count || 0,
    remaining,
    resetAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    status: remaining > 0 ? 'ok' : 'limit_reached',
  });
}
```

**Dashboard'da göster:**
```tsx
// Admin dashboard'da
const { data } = await fetch('/api/admin/email-usage');
// "Email Quota: 2/4 (2 remaining)"
```

---

### B. Database Size Tracker

```sql
-- Supabase SQL Editor'de çalıştır
SELECT 
  pg_size_pretty(pg_database_size(current_database())) as total_size,
  pg_size_pretty(524288000) as free_tier_limit, -- 500 MB
  ROUND(
    (pg_database_size(current_database())::numeric / 524288000) * 100, 
    2
  ) as usage_percent;
```

**Sonuç:**
```
total_size: 45 MB
free_tier_limit: 500 MB
usage_percent: 9%
```

---

## 7️⃣ Özet: Ücretsiz Monitoring Stack

```
┌─────────────────────────────────────────┐
│  Real-time (Sorun anında)              │
├─────────────────────────────────────────┤
│  • Browser Console (F12)                │
│  • Network Tab                          │
│  • Vercel Logs (vercel logs --follow)  │
│  • Supabase Dashboard Logs              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Proaktif (Sorun olmadan önce)         │
├─────────────────────────────────────────┤
│  • GitHub Actions (her 6 saatte)       │
│  • Vercel Cron (her 6 saatte)          │
│  • UptimeRobot (her 5 dakikada)        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Kullanıcı Feedback                     │
├─────────────────────────────────────────┤
│  • Error Reporter Component             │
│  • Email bildirimleri                   │
│  • GitHub Issues                        │
└─────────────────────────────────────────┘
```

**Toplam Maliyet:** 0 TL/ay 🎉

---

## 🎯 Hızlı Başlangıç

```bash
# 1. Diagnostic script'i test et
npm run diagnose

# 2. GitHub Actions health check ekle
# .github/workflows/health-check.yml oluştur

# 3. UptimeRobot hesap aç
# https://uptimerobot.com

# 4. Vercel logs'u izlemeye başla
vercel logs --follow

# 5. Supabase Dashboard > Logs > Bookmark yap
```

**İlk sorun bildiriminde:**
1. Vercel logs kontrol et
2. Supabase logs kontrol et
3. Kullanıcıdan browser console iste
4. Reproduce et
5. Fix yap
6. Verify et

**Hepsi ücretsiz!** 🚀
