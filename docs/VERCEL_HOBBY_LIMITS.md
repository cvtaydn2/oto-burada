# Vercel Hobby Plan Limitleri

Bu doküman, Vercel Hobby (ücretsiz) plan'ın limitlerini ve çözümlerini içerir.

## 🎯 Özet

| Özellik | Hobby (Ücretsiz) | Pro ($20/ay) |
|---------|------------------|--------------|
| **Cron Jobs** | Günde 1 kez | Dakikada 1 kez |
| **Cron Precision** | ±59 dakika | Dakika hassasiyeti |
| **Bandwidth** | 100 GB/ay | 1 TB/ay |
| **Build Time** | 6000 dakika/ay | 24000 dakika/ay |
| **Deployments** | Unlimited | Unlimited |
| **Team Members** | 1 | Unlimited |

---

## 🔴 Kritik Limit: Cron Jobs (Günde 1 Kez)

### Sorun
Vercel Hobby plan'da cron job'lar **günde sadece 1 kez** çalışabilir.

**Hata Mesajı:**
```
Hobby accounts are limited to daily cron jobs. 
This cron expression would run more than once per day.
```

### Çalışmayan Cron Expressions
```
0 */6 * * *   # Her 6 saatte (günde 4 kez) ❌
0 */12 * * *  # Her 12 saatte (günde 2 kez) ❌
*/30 * * * *  # Her 30 dakikada ❌
0 * * * *     # Her saat ❌
```

### Çalışan Cron Expressions
```
0 0 * * *     # Her gün gece yarısı ✅
0 2 * * *     # Her gün saat 02:00 ✅
0 14 * * *    # Her gün saat 14:00 ✅
0 0 * * 1     # Her Pazartesi gece yarısı ✅
```

### Çözüm 1: UptimeRobot Kullan (Önerilen - Ücretsiz)

**Avantajlar:**
- ✅ Her 5 dakikada kontrol
- ✅ Tamamen ücretsiz
- ✅ Email/SMS alerts
- ✅ Public status page

**Kurulum (5 dakika):**
1. [UptimeRobot](https://uptimerobot.com) > Sign Up
2. Add New Monitor:
   ```
   URL: https://your-domain.vercel.app/api/health-check
   Interval: 5 minutes
   ```
3. Done!

### Çözüm 2: GitHub Actions Kullan (Ücretsiz)

**Avantajlar:**
- ✅ Günde 1 kez (Vercel ile aynı)
- ✅ Otomatik GitHub Issue oluşturur
- ✅ 2000 dakika/ay (yeterli)

**Kurulum:**
Zaten yapılandırılmış! `.github/workflows/health-check.yml`

### Çözüm 3: Vercel Pro'ya Geç ($20/ay)

**Avantajlar:**
- ✅ Dakikada 1 kez cron
- ✅ Dakika hassasiyeti
- ✅ 1 TB bandwidth
- ✅ Team collaboration

**Ne Zaman Gerekir:**
- Yüksek trafik (>100 GB/ay)
- Sık health check gereksinimi
- Team collaboration

---

## 🟡 Timing Precision (±59 Dakika)

### Sorun
Hobby plan'da cron job'lar **±59 dakika** hassasiyetle çalışır.

**Örnek:**
```
Cron: 0 2 * * *  (Her gün saat 02:00)
Gerçek: 02:00 - 02:59 arası herhangi bir zaman
```

### Çözüm
- ✅ **Kabul Et:** Çoğu use case için sorun değil
- ✅ **UptimeRobot:** Hassas timing gerekiyorsa
- ⚠️ **Pro Plan:** Kritik timing gerekiyorsa

---

## 🟢 Bandwidth (100 GB/ay)

### Ne Kadar Yeterli?

**Örnek Hesaplama:**
```
Ortalama sayfa boyutu: 500 KB
100 GB = 100,000 MB = 100,000,000 KB
100,000,000 KB / 500 KB = 200,000 sayfa görüntüleme/ay
200,000 / 30 gün = ~6,600 sayfa görüntüleme/gün
```

**Yeterli mi?**
- ✅ Küçük/orta siteler için bol bol yeterli
- ✅ İlk 6 ay için kesinlikle yeterli
- ⚠️ Viral olursa Pro'ya geç

### Bandwidth Aşımı
- Vercel otomatik olarak Pro'ya upgrade önerir
- Veya site geçici olarak yavaşlar

---

## 🟢 Build Time (6000 dakika/ay)

### Ne Kadar Yeterli?

**Örnek Hesaplama:**
```
Ortalama build süresi: 3 dakika
6000 dakika / 3 dakika = 2000 build/ay
2000 / 30 gün = ~66 build/gün
```

**Yeterli mi?**
- ✅ Bol bol yeterli
- ✅ Her commit'te build yapsan bile yeterli

---

## 📊 Mevcut Kullanım

### Proje Yapılandırması

**Cron Jobs:**
```json
{
  "crons": [
    {
      "path": "/api/cron/main",
      "schedule": "0 0 * * *"  // Her gün gece yarısı ✅
    },
    {
      "path": "/api/health-check",
      "schedule": "0 2 * * *"  // Her gün saat 02:00 ✅
    }
  ]
}
```

**GitHub Actions:**
```yaml
schedule:
  - cron: '0 3 * * *'  # Her gün saat 03:00 UTC ✅
```

**UptimeRobot (Manuel):**
```
Interval: 5 minutes  # Her 5 dakikada ✅
```

---

## 🎯 Önerilen Monitoring Stratejisi (Ücretsiz)

### Katman 1: UptimeRobot (Her 5 Dakika)
- **Amaç:** Uptime monitoring
- **Maliyet:** Ücretsiz
- **Kurulum:** 5 dakika

### Katman 2: GitHub Actions (Günde 1 Kez)
- **Amaç:** Comprehensive health check
- **Maliyet:** Ücretsiz
- **Kurulum:** Zaten yapılandırılmış

### Katman 3: Vercel Cron (Günde 1 Kez)
- **Amaç:** Internal health check
- **Maliyet:** Ücretsiz
- **Kurulum:** Zaten yapılandırılmış

**Sonuç:** 3 katmanlı monitoring, tamamen ücretsiz! 🎉

---

## 🚀 Ne Zaman Pro'ya Geçmeli?

### Geçiş Sinyalleri

#### 1. Bandwidth Aşımı
```
Vercel Dashboard > Usage
Bandwidth: 95 GB / 100 GB (⚠️ %95)
```

**Aksiyon:** Pro'ya geç

#### 2. Yüksek Trafik
```
Google Analytics
Daily Users: 10,000+ (sürekli)
```

**Aksiyon:** Pro'ya geç

#### 3. Team Collaboration
```
Ekip büyüdü: 2+ developer
```

**Aksiyon:** Pro'ya geç

#### 4. Kritik Timing
```
Cron job'lar hassas timing gerektiriyor
Örn: Payment processing, Stock updates
```

**Aksiyon:** Pro'ya geç

### Pro Plan Fiyatlandırma

**$20/ay** (yıllık ödeme ile $17/ay)

**Dahil Olanlar:**
- 1 TB bandwidth
- Dakikada 1 kez cron
- Dakika hassasiyeti
- Unlimited team members
- Advanced analytics
- Priority support

---

## 📋 Hobby Plan Checklist

### Deployment Öncesi
- [ ] Cron expressions günde 1 kez mi? (`0 X * * *`)
- [ ] UptimeRobot kuruldu mu? (her 5 dakika için)
- [ ] GitHub Actions yapılandırıldı mı?

### Deployment Sonrası
- [ ] Vercel Dashboard > Cron Jobs kontrol
- [ ] İlk cron çalıştı mı?
- [ ] UptimeRobot monitoring aktif mi?

### Aylık
- [ ] Bandwidth kullanımı kontrol et
- [ ] Build time kullanımı kontrol et
- [ ] Pro'ya geçiş gerekli mi değerlendir

---

## 🆘 Deployment Fail Ediyorsa

### Hata: "Hobby accounts are limited to daily cron jobs"

**Çözüm:**
```json
// vercel.json - YANLIŞ ❌
{
  "crons": [
    {
      "path": "/api/health-check",
      "schedule": "0 */6 * * *"  // Her 6 saatte ❌
    }
  ]
}

// vercel.json - DOĞRU ✅
{
  "crons": [
    {
      "path": "/api/health-check",
      "schedule": "0 2 * * *"  // Her gün saat 02:00 ✅
    }
  ]
}
```

**Deploy:**
```bash
git add vercel.json
git commit -m "fix: update cron to daily for Hobby plan"
git push
```

---

## ✅ Özet

**Hobby Plan Limitleri:**
- 🔴 Cron: Günde 1 kez (kritik)
- 🟡 Timing: ±59 dakika (kabul edilebilir)
- 🟢 Bandwidth: 100 GB/ay (yeterli)
- 🟢 Build: 6000 dakika/ay (bol bol)

**Çözüm:**
- ✅ UptimeRobot (her 5 dakika, ücretsiz)
- ✅ GitHub Actions (günde 1 kez, ücretsiz)
- ✅ Vercel Cron (günde 1 kez, ücretsiz)

**Sonuç:** Ücretsiz tier'da production-grade monitoring mümkün! 🚀

---

## 📚 Kaynaklar

- [Vercel Pricing](https://vercel.com/pricing)
- [Vercel Cron Jobs Docs](https://vercel.com/docs/cron-jobs)
- [UptimeRobot](https://uptimerobot.com)
- [GitHub Actions Pricing](https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions)
