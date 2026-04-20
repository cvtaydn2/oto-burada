# OtoBurada Production Deployment Guide

Bu belge, OtoBurada platformunun canlı ortama (Launch) alınırken takip edilmesi gereken operasyonel adımları listeler.

## 1. Çevresel Değişkenler (Environment Variables)
Aşağıdaki anahtarların Vercel ve Supabase üzerinde kilitlendiğinden ve güvende olduğundan emin olun:
- `NEXT_PUBLIC_SUPABASE_URL`: DB ve API URL
- `SUPABASE_SERVICE_ROLE_KEY`: Admin işlemleri için (Sadece Server tarafında)
- `UPSTASH_REDIS_REST_URL` & `TOKEN`: Mutex, Rate Limit ve Cache için
- `CRON_SECRET`: Vercel Cron güvenliği için
- `IYZICO_API_KEY` & `SECRET`: Ödemeler için
- `ENCRYPTION_MASTER_KEY`: Crypto-shredding için (Dizi şeklinde: `key1,key2` rotasyon için)

## 2. Cron Job Yapılandırması (Vercel/GitHub Actions)
`api/cron/outbox` endpoint'i **her dakika** tetiklenmelidir. Bu tetikleme şunları sağlar:
- `Outbox Queue`: İşlemleri (Email, SMS) dağıtır.
- `Compensating Actions`: Hata durumlarında iadeleri yapar.
- `Compliance Vacuum`: Eski verileri siler (KVKK).
- `Reconciliation`: Ödemeleri doğrular (Zombie account temizliği).

## 3. Güvenlik ve FinOps (Maliyet Yönetimi)
- **Supabase PitR (Point-in-Time Recovery)**: Canlı ortamda mutlaka aktif edilmelidir.
- **Auto-Scaling**: Vercel üzerinde `Max Duration` ve `Concurrency` ayarları maliyet/performans dengesi için normalize edilmelidir.
- **Snyk/Dependabot**: Bağımlılık (Dependency) taramaları aktif edilmelidir.

## 4. Müşteri Hizmetleri Oryantasyonu (Issue 2)
Admin panelindeki `System Health` sekmesi üzerinden:
- Bekleyen (Pending) Outbox işlemleri
- Reddedilen (DLQ) ödeme kayıtları
- Circuit Breaker durumları
izlenebilir olmalıdır.

---

### Launch Protokolü
1. `npm run db:migrate` (Prod DB üzerinde)
2. `npm run build` (Sıfır hata kontrolü)
3. `CRON_SECRET` testi
4. Iyzico test ödemesi (Sandbox)
5. **LIVE!** 🚀
