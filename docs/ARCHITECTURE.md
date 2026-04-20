# OtoBurada God-Tier Architecture Decision Records (ADR)

Bu belge, OtoBurada projesinin MVP aşamasından "Decacorn" seviyesine evrilmesi sırasında alınan kritik mimari kararları, tasarım desenlerini ve operasyonel protokolleri özetler.

## 1. Dağıtık İşlem Yönetimi (Saga & Outbox)
**Karar:** Finansal işlemler ve bildirimler için asenkron kuyruk yönetimi.
**Mantık:** Veritabanı transaction'ı içinde dış ağ isteği (Email, Iyzico) bekletilmez (`Connection Hostage Crisis` önleme). 
**Uygulama:** `transaction_outbox` ve `compensating_actions` tabloları. Başarısız işlemlerde "Üstel Geri Çekilme" (Exponential Backoff) ve "Zehirli Mesaj İzolasyonu" (Poison Pill) uygulanır.

## 2. Veri Güvenliği (Crypto-Shredding & Metadata Stripping)
**Karar:** Hassas verilerin (PII) kriptografik imhası ve medya gizliliği.
**Mantık:** GDPR/KVKK uyumluluğu için "Beni Unut" hakkı veritabanından veri silerek değil, şifreleme anahtarını imha ederek sağlanır. Medya verilerinden GPS ve cihaz parmak izleri `sharp` ile temizlenir.
**Uygulama:** `user_encryption_keys` tablosu ve `src/lib/security/crypto-shredding.ts`.

## 3. Performans ve Ölçekleme (CQRS & Bucketization)
**Karar:** Okuma/Yazma ayrımı ve parametre kovalama.
**Mantık:** Ağır raporlama sorgularının ana DB'yi kilitlemesi `getReadSupabaseClient` ile engellenir. Sonsuz sayıda filtre kombinasyonunun cache'i patlatması, fiyat ve KM gibi değerlerin "Kovalar" (Buckets) halinde gruplanmasıyla çözülür.
**Uygulama:** `replica-client.ts`, `canonical-params.ts`.

## 4. Dayanıklılık ve Hata Yönetimi (Circuit Breaker)
**Karar:** Dış servis bağımlılıklarının izolasyonu.
**Mantık:** Resend veya Iyzico çöktüğünde sistemin kaskad olarak durması yerine, bu servisler geçici olarak devre dışı bırakılır (`OPEN state`).
**Uygulama:** `src/lib/utils/resilience.ts`.

## 5. Operasyonel Güvenlik (Zero-Trust Secrets)
**Karar:** Sırların (Secrets) en az ayrıcalıkla yönetimi.
**Mantık:** Tek bir API zafiyetinde tüm `.env` dosyasının sızdırılması (Blast Radius) engellenir. Modüller sadece ihtiyacı olan anahtarlara `secrets.ts` üzerinden erişir.
**Uygulama:** `src/lib/security/secrets.ts`.

## 6. Yasal Uyum (Compliance Vacuum)
**Karar:** Otomatik veri temizliği.
**Mantık:** 90 günü geçen "archived" veriler yasal zorunluluk gereği `compliance-vacuum.ts` ile fiziksel olarak (Hard Delete) silinir.

---

### Onboarding Notu (Yeni Geliştiriciler İçin)
OtoBurada mimarisi "Event-Driven" ve "Resilient" prensipler üzerine kuruludur. Herhangi bir mutasyon (yazma) yaparken şunlara dikkat edin:
1. **Transaction İçinde Fetch Yapmayın**: Dış servislere istek atacaksanız `enqueueOutboxEvent` kullanın.
2. **PII Verileri Şifreleyin**: Kullanıcı telefonu veya e-postası kaydedilecekse `encryptPII` kullanın.
3. **Kotaları Atomik Düşün**: `UPDATE user_quotas SET remaining = remaining - 1 WHERE remaining > 0` desenini takip edin.

---
**Durum:** Üretim Ortamına Hazır (Production Ready) ✅
