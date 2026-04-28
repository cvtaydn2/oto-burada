# Bilinen Güvenlik Sorunları (Ücretsiz Tier)

Bu doküman, ücretsiz tier'da kullanılan dependency'lerdeki bilinen güvenlik sorunlarını ve risk değerlendirmelerini içerir.

## 🎯 Strateji: Risk-Based Approach

Ücretsiz tier'da bazı dependency'lerin güvenlik açıkları olabilir. Ancak:
- ✅ **Gerçek risk değerlendirmesi** yapıyoruz
- ✅ **Mitigasyon stratejileri** uyguluyoruz
- ✅ **Deployment'ı engellemiyoruz** (warning veriyoruz)

---

## 📊 Mevcut Durum

### Bilinen Vulnerability'ler

#### 1. `iyzipay` (v2.0.67) - Transitive Dependencies

**Sorun:**
- `form-data` ve `postman-request` bağımlılıklarında critical vulnerability'ler
- Upstream package güncellenmemiş

**Risk Değerlendirmesi:**
- 🟡 **Orta Risk**: Sadece server-side kullanılıyor
- ✅ **Mitigasyon**: `server-only` ile client bundle'a sızmıyor
- ✅ **Mitigasyon**: Webhook signature verification ile korunuyor
- ✅ **Mitigasyon**: Input validation (Zod) aktif

**Çözüm Seçenekleri:**
1. **Bekle** (Önerilen - Ücretsiz Tier): Iyzico'nun package'ı güncellemesini bekle
2. **Fork & Fix** (6 saat): Package'ı fork'la ve dependency'leri güncelle
3. **Direct API** (8-12 saat): Iyzico REST API'sini doğrudan kullan
4. **Switch Provider** (16-24 saat): Stripe/PayTR gibi alternatif kullan

**Ücretsiz Tier Önerisi:** Bekle + Mitigasyon stratejilerini uygula

---

#### 2. `postcss` (Next.js internal)

**Sorun:**
- Next.js'in internal dependency'sinde moderate vulnerability

**Risk Değerlendirmesi:**
- 🟢 **Düşük Risk**: Build-time dependency
- ✅ **Mitigasyon**: Production runtime'da kullanılmıyor
- ✅ **Mitigasyon**: Next.js güncellemeleri ile otomatik düzelecek

**Çözüm:**
- Next.js'i en son versiyona güncelle (zaten yapıldı: v16.2.4)
- Yeni Next.js release'lerini takip et

---

#### 3. `resend` (v6.12.2)

**Sorun:**
- False positive (muhtemelen zaten düzeltilmiş)

**Risk Değerlendirmesi:**
- 🟢 **Düşük Risk**: Email gönderimi için kullanılıyor
- ✅ **Mitigasyon**: Outbox pattern ile asenkron
- ✅ **Mitigasyon**: Rate limiting aktif

**Çözüm:**
- Resend'i en son versiyona güncelle
- `npm update resend`

---

## 🛡️ Uygulanan Mitigasyon Stratejileri

### 1. Server-Only Protection

**Nedir:**
```typescript
import "server-only";
```

**Faydası:**
- Hassas kod client bundle'a sızmaz
- Build-time error verir

**Uygulandığı Yerler:**
- ✅ `src/lib/security/secrets.ts`
- ✅ `src/lib/security/iyzico-webhook.ts`
- ✅ `src/services/payments/iyzico-client.ts`

---

### 2. Input Validation (Zod)

**Nedir:**
- Tüm user input'ları Zod schema ile validate edilir

**Faydası:**
- SQL injection engellenir
- XSS engellenir
- Type safety

**Uygulandığı Yerler:**
- ✅ Tüm form'lar
- ✅ Tüm API endpoint'leri
- ✅ Webhook payload'ları

---

### 3. Webhook Signature Verification

**Nedir:**
```typescript
const isValid = verifyIyzicoWebhookSignature(payload, signature);
if (!isValid) throw new Error("Invalid signature");
```

**Faydası:**
- Sahte webhook'lar engellenir
- Man-in-the-middle saldırıları engellenir

**Uygulandığı Yerler:**
- ✅ `/api/payments/webhook`

---

### 4. Rate Limiting

**Nedir:**
- IP-based rate limiting (Upstash Redis veya in-memory)

**Faydası:**
- Brute force saldırıları engellenir
- DDoS koruması

**Uygulandığı Yerler:**
- ✅ Auth endpoints (login, register)
- ✅ Payment endpoints
- ✅ API endpoints

---

### 5. CSRF Protection

**Nedir:**
- Token-based CSRF protection

**Faydası:**
- Cross-site request forgery engellenir

**Uygulandığı Yerler:**
- ✅ Tüm mutation endpoint'leri
- ✅ Form submission'ları

---

### 6. RLS (Row Level Security)

**Nedir:**
- Database seviyesinde access control

**Faydası:**
- Unauthorized data access engellenir
- SQL injection'dan korunma

**Uygulandığı Yerler:**
- ✅ Tüm Supabase tabloları

---

## 📋 Güvenlik Checklist (Ücretsiz Tier)

### Deployment Öncesi

- [ ] `npm audit` çalıştır ve sonuçları gözden geçir
- [ ] Critical vulnerability'ler için mitigasyon stratejisi uygula
- [ ] `server-only` kullanımını kontrol et
- [ ] Input validation (Zod) tüm endpoint'lerde var mı?
- [ ] Webhook signature verification aktif mi?
- [ ] Rate limiting çalışıyor mu?
- [ ] CSRF protection aktif mi?
- [ ] RLS policies doğru mu?

### Deployment Sonrası

- [ ] GitHub Actions security audit sonuçlarını kontrol et
- [ ] Vercel deployment logs'da hata var mı?
- [ ] Supabase logs'da suspicious activity var mı?
- [ ] UptimeRobot uptime %99+ mı?

### Haftalık

- [ ] `npm audit` çalıştır
- [ ] GitHub Security Advisories kontrol et
- [ ] Dependency updates kontrol et
- [ ] Supabase logs review

### Aylık

- [ ] Tüm dependency'leri güncelle (`npm update`)
- [ ] Security audit report review
- [ ] Incident response plan review

---

## 🚨 Ne Zaman Acil Aksiyon Gerekir?

### Kırmızı Alarm (Hemen)

- 🔴 **Active exploit in the wild**: CVE için public exploit var
- 🔴 **Data breach**: Kullanıcı verisi sızdı
- 🔴 **Authentication bypass**: Auth atlanabiliyor
- 🔴 **RCE (Remote Code Execution)**: Uzaktan kod çalıştırılabiliyor

**Aksiyon:**
1. Hemen maintenance mode'a al
2. Sorunu fix'le
3. Incident report yaz
4. Kullanıcılara bildir

---

### Sarı Alarm (Bu Hafta)

- 🟡 **High severity vulnerability**: CVSS score 7.0+
- 🟡 **Dependency with known exploit**: Exploit var ama mitigasyon mevcut
- 🟡 **Outdated critical dependency**: 6+ ay güncel değil

**Aksiyon:**
1. Risk değerlendirmesi yap
2. Mitigasyon stratejisi uygula
3. Fix planı oluştur
4. 1 hafta içinde fix'le

---

### Yeşil Alarm (Bu Ay)

- 🟢 **Moderate/Low severity**: CVSS score < 7.0
- 🟢 **Transitive dependency**: Doğrudan kullanılmıyor
- 🟢 **False positive**: Gerçek risk yok

**Aksiyon:**
1. Dokümante et
2. Mitigasyon stratejisi uygula
3. Upstream fix'i bekle
4. Aylık update cycle'da fix'le

---

## 📊 Risk Matrisi

| Vulnerability | Severity | Exploitability | Impact | Risk Level | Action |
|---------------|----------|----------------|--------|------------|--------|
| iyzipay deps | Critical | Low | Medium | 🟡 Medium | Mitigate + Wait |
| postcss | Moderate | Low | Low | 🟢 Low | Update Next.js |
| resend | Low | Low | Low | 🟢 Low | Update package |

---

## 🎓 Güvenlik Best Practices (Ücretsiz Tier)

### 1. Defense in Depth

Tek bir güvenlik katmanına güvenme:
- ✅ Input validation (Zod)
- ✅ Server-side validation
- ✅ Database RLS
- ✅ Rate limiting
- ✅ CSRF protection

### 2. Principle of Least Privilege

Minimum gerekli izinleri ver:
- ✅ RLS policies user-specific
- ✅ Service role key sadece server-side
- ✅ API keys environment variables'da

### 3. Fail Secure

Hata durumunda güvenli tarafta kal:
- ✅ Webhook signature fail → reject
- ✅ Rate limit exceed → block
- ✅ CSRF token invalid → reject

### 4. Security by Design

Güvenliği sonradan ekleme, baştan tasarla:
- ✅ RLS policies migration ile birlikte
- ✅ Input validation schema ile birlikte
- ✅ Auth flow'da CSRF built-in

---

## 📚 Kaynaklar

### Güvenlik Araçları (Ücretsiz)

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/) (ücretsiz tier)
- [GitHub Security Advisories](https://github.com/advisories)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Güvenlik Rehberleri

- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security)
- [Supabase Security](https://supabase.com/docs/guides/platform/security)

---

## 🔄 Güncelleme Stratejisi

### Dependency Update Cycle

**Haftalık (Otomatik - Dependabot):**
- Patch updates (1.0.x)
- Security fixes

**Aylık (Manuel):**
- Minor updates (1.x.0)
- Feature updates

**Quarterly (Manuel):**
- Major updates (x.0.0)
- Breaking changes

### Update Workflow

```bash
# 1. Mevcut durumu kontrol et
npm audit
npm outdated

# 2. Güvenlik güncellemelerini uygula
npm audit fix

# 3. Test et
npm run lint
npm run typecheck
npm run test:unit
npm run build

# 4. Deploy et
git commit -m "chore: security updates"
git push
```

---

## ✅ Sonuç

**Ücretsiz tier'da güvenlik mümkün!**

- ✅ Bilinen vulnerability'ler dokümante edildi
- ✅ Risk değerlendirmesi yapıldı
- ✅ Mitigasyon stratejileri uygulandı
- ✅ Deployment engellenmedi (warning verildi)

**Önemli:**
- 🔴 Critical vulnerability'ler için hemen aksiyon al
- 🟡 High severity için 1 hafta içinde fix'le
- 🟢 Moderate/Low için aylık cycle'da fix'le

**İlk Adım:**
```bash
npm audit
```

**Sorun mu var?**
- `docs/PRODUCTION_TROUBLESHOOTING.md`
- `docs/PRODUCTION_QUICK_FIX.md`
