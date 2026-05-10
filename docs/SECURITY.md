# Security

Bu belge OtoBurada’nın teknik güvenlik referansıdır. Ürün düzeyi güven yaklaşımı [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md), moderasyon karar çerçevesi [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md), operasyonel prosedürler [`RUNBOOK.md`](../RUNBOOK.md) ve mimari kurallar [`AGENTS.md`](../AGENTS.md) altında tutulur.

Bu dosyanın amacı, uygulamadaki güvenlik katmanlarını, uygulanması beklenen teknik prensipleri ve doğrulama odaklarını tek yerde toplamaktır.

## Güvenlik hedefleri

OtoBurada teknik güvenlik tasarımı şu hedefleri korur:

- public yüzeylerde kötüye kullanımı azaltmak
- kullanıcı, ilan ve moderasyon verisini yetkisiz erişime kapatmak
- client tarafında ayrıcalıklı anahtar sızıntısını önlemek
- auth, mutation ve admin yüzeylerinde fail-closed davranmak
- ücretsiz tier sınırları içinde güvenlik katmanlarını sürdürülebilir tutmak

## Güvenlik mimarisi özeti

Ana güvenlik katmanları çoklu savunma yaklaşımıyla çalışır:

- request seviyesi kontroller
- auth ve yetki doğrulama
- input validation ve sanitization
- rate limiting ve abuse guardrails
- Supabase RLS ve veri erişim politikaları
- güvenli server-only secret kullanımı
- gözlemlenebilirlik ve incident destek akışları

## API ve request korumaları

### Route-level güvenlik orkestrasyonu

Route güvenlik orkestrasyonu [`withSecurity()`](../src/lib/api/security.ts:51) içinde merkezileştirilir. Admin yüzeyleri için [`withAdminRoute()`](../src/lib/api/security.ts:279), cron akışları için ilgili secret kontrolleri ve route bazlı guard’lar kullanılmalıdır.

### Global request güvenliği

API seviyesinde origin ve temel request güvenliği [`checkApiSecurity()`](../src/lib/middleware/api-security.ts:16) ile yürütülür. CSRF middleware sarmalayıcısı [`csrfMiddleware()`](../src/lib/middleware/csrf.ts:12) tarafında yer alır.

### Fail-closed yaklaşımı

Kritik doğrulama başarısız olduğunda işlem devam etmemelidir. Özellikle admin route’ları, ödeme webhook’ları, kimlik doğrulama akışları ve ayrıcalıklı mutation’larda belirsiz veya eksik doğrulama kabul edilmez.

## CSRF stratejisi

CSRF koruması hash-cookie ve header token modeline dayanır. Temel uygulama noktaları:

- doğrulama: [`validateCsrfToken()`](../src/lib/security/csrf.ts:98)
- token set etme: [`setCsrfTokenCookie()`](../src/lib/security/csrf.ts:161)
- token rotasyonu: [`rotateCsrfToken()`](../src/lib/security/csrf.ts:183)

Public mutation endpoint’lerde en az origin kontrolü ve gerektiğinde tam CSRF koruması bulunmalıdır. Yeni mutation yüzeyi eklenirken koruma seviyesi açıkça seçilmelidir.

## Auth, yetki ve erişim kontrolü

### Session ve kullanıcı bağlamı

Session ve profil bağlamı [`getAuthContext()`](../src/lib/auth/session.ts:1) üzerinden kurulmalıdır. Kullanıcının kimliği, rolü, ban durumu ve sahiplik ilişkileri server tarafında doğrulanmadan iş mantığı çalıştırılmamalıdır.

### Admin yüzeyleri

Admin erişimi ayrıcalıklı sayılır. Admin route’ları ve server actions aşağıdaki ilkeleri izlemelidir:

- yalnız authenticated ve yetkili kullanıcı erişebilir
- istemci tarafında `service_role` kullanılmaz
- admin projeksiyonları minimum gerekli alanla sınırlandırılır
- destructive aksiyonlar doğrulama ve audit açısından iz bırakır

### Ban ve kısıtlar

Banlı veya kısıtlı kullanıcıların ürün yüzeyindeki görünürlüğü yalnız UI seviyesinde değil, veri erişim seviyesinde de engellenmelidir. Marketplace bütünlüğü için banned seller filtrelemesi sorgu düzeyinde korunmalıdır.

## Input validation ve sanitization

### Validation

Public input’lar Zod tabanlı merkezi validator katmanından geçmelidir. Validation kuralları client ve server arasında mümkün olduğunca ortak tutulur. Hata mesajları kullanıcı için anlaşılır, saldırgana ise düşük bilgi değerli olmalıdır.

### Sanitization

Serbest metin, HTML benzeri girişler ve kullanıcı üretimli içerik sanitize edilmelidir. Özellikle listing açıklamaları, mesajlaşma ve destek yüzeyleri XSS açısından savunmalı kalmalıdır.

## Rate limiting ve abuse korumaları

Rate limit stratejisi kötüye kullanımı baskılamak için gereklidir. Dağıtık altyapı mevcutsa Redis tabanlı katman kullanılır, altyapı kesintisinde kontrollü in-memory fallback devreye girebilir. Ancak fallback hiçbir zaman korumayı tamamen devre dışı bırakma gerekçesi olmamalıdır.

Yeni public veya auth-sensitive endpoint’lerde şu soru sorulmalıdır: bu yüzey spam, enumeration, brute-force veya scraping için cazip mi. Cevap evet ise uygun profil tanımlanmalıdır.

## Supabase ve RLS

### RLS first yaklaşımı

Her yeni tablo için erişim politikaları migration ile birlikte yazılmalıdır. Şema ve güvenlik aynı değişiklik setinin parçasıdır.

### Client ve secret ayrımı

Client bileşenlerde `service_role` anahtarı kullanılmaz. Ayrıcalıklı işlemler server tarafında ve kontrollü yetki bağlamında kalır.

### Politika yazımı

Mümkün olduğunda `(SELECT auth.uid())` kullanım standardı izlenir. Sahiplik, görünürlük ve admin istisnaları politika düzeyinde açık yazılmalıdır. RLS, UI kontrolünün yerine geçen asıl güvenlik sınırıdır.

## Secret ve environment güvenliği

Aşağıdaki ilkeler kalıcıdır:

- secret’lar istemci bundle’ına sızmamalıdır
- production env değişiklikleri kontrollü yapılmalıdır
- secret rotation sonrası health ve kritik akış smoke testi zorunludur
- üçüncü parti anahtarlar yalnız gereken server yüzeylerinde erişilebilir olmalıdır

Operasyonel secret yönetimi için [`RUNBOOK.md`](../RUNBOOK.md) kullanılmalıdır.

## Monitoring ve güvenlik gözlemlenebilirliği

Güvenlik sinyalleri sadece engelleme ile değil gözlemlenebilirlikle de desteklenmelidir. İzlenmesi değerli sinyaller arasında şunlar bulunur:

- auth başarısızlıklarında sıra dışı artış
- rate limit tetiklenmelerinde ani sıçrama
- admin veya webhook route’larında tekrar eden hata kümeleri
- production’da beklenmeyen 401, 403 ve 429 artışı
- abuse veya report hacminde operasyonel anomali

## Güvenlik inceleme checklist

Yeni veya değişen bir yüzey için minimum kontrol listesi:

1. mutation veya ayrıcalıklı route uygun security wrapper ile korunuyor mu
2. public surface için origin ve gerekirse CSRF kontrolü var mı
3. input Zod veya eşdeğer merkezi validator katmanından geçiyor mu
4. hassas veri istemciye gereksiz biçimde sızıyor mu
5. rate limit veya abuse profili tanımlı mı
6. RLS ve sahiplik sınırı veri katmanında gerçekten uygulanıyor mu
7. hata mesajları fazla iç detay ifşa ediyor mu
8. log ve monitoring sinyalleri incident anında anlamlı mı

## İlgili belgeler

- güven ve platform politikası: [`docs/TRUST_AND_SAFETY.md`](docs/TRUST_AND_SAFETY.md)
- moderasyon politikası: [`docs/MODERATION_POLICY.md`](docs/MODERATION_POLICY.md)
- servis mimarisi: [`docs/SERVICE_ARCHITECTURE.md`](docs/SERVICE_ARCHITECTURE.md)
- release kapıları: [`docs/RELEASE_READINESS.md`](docs/RELEASE_READINESS.md)
- operasyon prosedürleri: [`RUNBOOK.md`](../RUNBOOK.md)
- katalog: [`docs/INDEX.md`](docs/INDEX.md)
