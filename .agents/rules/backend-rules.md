---
trigger: always_on
---

# BACKEND / API / DATABASE AI CONSTITUTION
## OtoBurada İçin Next.js + Supabase Backend Kuralları

Bu doküman bir yapay zekanın backend, API, server action, route handler ve database geliştirirken uyması gereken zorunlu kuralları tanımlar.

Bu kurallar:
- öneri değildir,
- opsiyonel değildir,
- her zaman uygulanmalıdır.

Bu doküman [`AGENTS.md`](AGENTS.md) ile uyumlu olacak şekilde yazılmıştır.
Çelişki durumunda nihai kaynak [`AGENTS.md`](AGENTS.md) kabul edilir.

AI:
- tüm backend kodlarını bu kurallara göre üretmelidir,
- güvenlik,
- sürdürülebilirlik,
- performans,
- ölçeklenebilirlik,
- gözlemlenebilirlik
önceliklerine göre hareket etmelidir.

---

# 1. CORE PRINCIPLES

## Öncelik Sırası

Backend aşağıdaki öncelik sırasına göre tasarlanmalıdır:

1. Security
2. Maintainability
3. Reliability
4. Performance
5. Scalability
6. Observability
7. Simplicity

## Ürün ve Mimari Gerçeği

Bu proje:
- tek bir full-stack Next.js kod tabanı kullanır,
- App Router kullanır,
- backend için route handlers + server actions kullanır,
- primary backend platform olarak Supabase kullanır,
- ayrı Express veya NestJS backend kullanmaz,
- microservice mimarisi kullanmaz,
- modular monolith olarak ilerler.

---

# 2. REQUIRED TECH STACK

## Zorunlu Teknolojiler

```txt
Next.js App Router
TypeScript
Route Handlers
Server Actions
Supabase Auth
Supabase Postgres
Supabase Storage
Supabase Row Level Security
Zod
Redis / Upstash (opsiyonel cache / rate limit / replay protection)
```

## Yasaklar

```txt
Ayrı Express backend
Ayrı NestJS backend
Prisma zorunlu varsayımı
Service role key'i client bundle'a sızdırmak
RLS bypass eden client-side erişim
```

## Opsiyonel Ama Önerilen

```txt
pg_cron
Postgres RPC
Outbox / fulfillment jobs
Sentry
OpenTelemetry / telemetry events
```

---

# 3. ARCHITECTURE RULES

## 3.1 Tek Kod Tabanı Zorunlu

Backend akışı aynı Next.js repo içinde yaşamalıdır.

### DO

```txt
src/app/api/**/route.ts
src/app/**/actions.ts
src/domain/**
src/features/**/services/**
src/lib/**
```

### DON'T

```txt
backend/
api-server/
express-server/
nest-app/
```

---

## 3.2 Route Handler İnce Kalmalı

Route handler:
- auth,
- authorization,
- CSRF,
- rate limit,
- input parsing,
- response mapping
işlerini yapmalıdır.

Business logic route içinde büyümemelidir.

### DO

```txt
Route Handler -> Security Wrapper -> Validation -> Domain/Service Logic -> Response Mapper
```

### DON'T

```ts
export async function POST(req: Request) {
  // burada 200+ satır business logic, query orchestration, ödeme ve fulfillment
}
```

---

## 3.3 Service / Domain Ayrımı Zorunlu

Aşağıdaki ayrım korunmalıdır:

- Route Layer
- Action Layer
- Domain Layer
- Data Access Layer
- Validation Layer
- Shared Infrastructure Layer

### Kabul Edilen Dosya Kalıpları

```txt
*-actions.ts   -> server actions / orchestration entrypoints
*-logic.ts     -> business logic
*-records.ts   -> database/data access
*-client.ts    -> third-party API wrappers
```

### Yasaklar

```txt
class-based god service
route içinde doğrudan karmaşık business logic
aynı iş kuralının birden fazla route içine kopyalanması
```

---

## 3.4 Feature-Based Structure Zorunlu

Backend kodu feature etrafında organize edilmelidir.

### DO

```txt
src/features/marketplace/
src/features/payments/
src/features/profile/
src/features/admin-moderation/
src/features/shared/
src/domain/
src/lib/
```

### DON'T

```txt
controllers/
routes/
repositories/
services/
```

tek başına üst seviye domain dışı klasörleşme.

---

# 4. API DESIGN RULES

## 4.1 Route Handler Standardı

API route'ları Next.js route handler olarak yazılmalıdır.

### DO

```txt
src/app/api/listings/route.ts
src/app/api/listings/[id]/route.ts
src/app/api/payments/webhook/route.ts
```

---

## 4.2 REST-benzeri ve Tahmin Edilebilir Tasarım

API:
- predictable,
- stateless,
- güvenli,
- resource-oriented
olmalıdır.

## 4.3 Versiyonlama Kuralı

Bu projede mevcut canonical yapı `/api/...` şeklindedir.
AI:
- var olan route yüzeyini bozacak şekilde zorla `/api/v1/...` eklememelidir,
- ancak yeni public API versiyonlama stratejisi resmi olarak alınırsa buna uymalıdır.

Yani mevcut repo için:

### DO

```txt
/ api / listings
/ api / payments / webhook
/ api / admin / users / export
```

### DON'T

```txt
Mevcut tüm route'ları plansız şekilde /api/v1 altına taşımak
```

---

## 4.4 Response Standardization

Mümkün olan her yerde ortak response helper'ları kullanılmalıdır.

### Success

```json
{
  "success": true,
  "data": {},
  "message": "OK"
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid payload"
  }
}
```

### Kural

- tercihen ortak helper kullan: `apiSuccess`, `apiError`
- ham `NextResponse.json` sadece gerçekten gerekli düşük seviyeli durumlarda kullanılmalı
- aynı feature içinde response formatı keyfi değişmemeli

---

## 4.5 HTTP Status Standards

### Zorunlu

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
413 Payload Too Large
422 Validation Error (gerektiğinde)
429 Rate Limited
500 Internal Server Error
503 Service Unavailable
```

---

# 5. VALIDATION RULES

## 5.1 Validation Zorunlu

Tüm inputlar validate edilmelidir.

- request body
- query params
- route params
- webhook payloads
- cron trigger inputs

---

## 5.2 ASLA

```txt
Raw request body ile doğrudan business logic çalıştırma
```

---

## 5.3 Kullan

```txt
Zod
shared validators
feature validators
```

## 5.4 Validation Ayrı Katmanda Olmalı

Validation:
- route handler içinde dağınık olmamalı,
- reusable olmalı,
- merkezi validator katmanında tutulmalı,
- frontend ile mümkün olduğunca shared contract kullanmalıdır.

---

# 6. AUTHENTICATION RULES

## 6.1 Supabase Auth Zorunlu

Authentication için canonical kaynak Supabase Auth'tur.

### Kullan

- session / cookie tabanlı auth context
- server-side user resolution
- request-scoped auth access

---

## 6.2 Auth Kontrolleri Route Girişinde Yapılmalı

Auth kontrolü:
- route handler başında,
- server action başında,
- security wrapper üzerinden
çalışmalıdır.

### Tercih Edilen Wrapper'lar

```txt
withUserRoute
withUserAndCsrf
withAdminRoute
withCronRoute
withCronOrAdmin
```

---

## 6.3 Token Security

### Zorunlu

- secure cookie/session handling
- invalid session handling
- stale JWT verisine kör güvenmeme
- kritik yetkilerde DB profile doğrulaması

---

## 6.4 ASLA

```txt
Plain password saklama
client içinde service role auth kullanma
```

---

# 7. AUTHORIZATION RULES

## 7.1 RBAC Zorunlu

Örnek roller:
- user
- admin
- moderator / staff benzeri genişletilebilir roller

## 7.2 Authorization Merkezi Olmalı

Authorization:
- route içinde hardcoded dağılmamalı,
- wrapper / helper / domain check üzerinden yönetilmeli,
- ownership check reusable olmalı.

## 7.3 Ban / Restriction Kontrolü

JWT tek başına yeterli kabul edilmemelidir.
Taze DB profile üzerinden:
- ban status
- role
- restriction state
kontrolü yapılmalıdır.

---

# 8. DATABASE RULES

## 8.1 Supabase Postgres Zorunlu

Primary relational database Supabase Postgres'tir.

## 8.2 Schema Source of Truth

Schema yönetimi şu kurallara göre yapılmalıdır:
- full schema source of truth: `database/schema.snapshot.sql`
- baseline: `database/schema.base.sql`
- yeni değişiklikler: `database/migrations/00XX_name.sql`
- migration takibi: `npm run db:migrate`

## 8.3 RLS First

Her yeni tablo için:
- schema,
- policies,
- access model
aynı değişiklik seti içinde düşünülmelidir.

### Zorunlu

- tüm uygun tablolarda RLS
- client erişiminde RLS bypass etmeme
- policy içinde mümkünse `(SELECT auth.uid())` kullanımı
- `SECURITY DEFINER` fonksiyonlarında `search_path = public`

## 8.4 Indexing Zorunlu

Aşağıdaki alanlar indexlenmelidir:
- foreign keys
- arama alanları
- filtre alanları
- sorting alanları
- join hot-path kolonları

## 8.5 Soft Delete Standardı

Hard delete default davranış olmamalıdır.

### Kullan

```txt
deleted_at
archived / inactive flags
soft delete RPC / helper
```

## 8.6 Audit Fields

Mümkün olan her tabloda şu alanlar düşünülmelidir:

```txt
created_at
updated_at
deleted_at (uygunsa)
```

---

# 9. DATA ACCESS RULES

## 9.1 Canonical Access Layer

Database erişimi tercihen `*-records.ts`, `*-logic.ts` veya iyi ayrıştırılmış data-access helpers içinde yapılmalıdır.

## 9.2 ASLA

```txt
Aynı SQL / query zincirini farklı route'larda kopyalama
route handler içinde dağınık ve tekrarlı query yazma
```

## 9.3 Raw SQL Kullanımı

Raw SQL serbesttir ancak sadece şu durumlarda tercih edilmelidir:
- migration
- RPC / Postgres function
- reporting
- performance-critical query
- concurrency-safe atomic operations

Raw SQL kullanımı:
- bilinçli,
- gerekçeli,
- testlenmiş,
- güvenlik açısından gözden geçirilmiş
olmalıdır.

Bu projede Prisma zorunlu değildir.
Supabase client + RPC + SQL migration canonical yaklaşımdır.

---

# 10. PERFORMANCE RULES

## 10.1 Performance First

Backend yük altında stabil çalışmalıdır.

## 10.2 Query Optimization

### Zorunlu

- sadece gereken alanları seç
- N+1 query'den kaçın
- doğru join kullan
- doğru index kullan
- hot path'te `SELECT *` kullanma

## 10.3 Pagination Zorunlu

### ASLA

10.000 kayıt tek request ile dönme.

## 10.4 Cache ve Degrade Mode

### Kullan

```txt
Redis / Upstash
in-memory fallback (gerektiğinde)
edge-safe cache helpers
```

Cache kullanılabilecek alanlar:
- listing search sonuçları
- suggestion endpointleri
- metadata
- read-heavy aggregate veriler

## 10.5 Background Work Ayrımı

Aşağıdaki işler request-response kritik yolunda bloklanmamalıdır:
- email
- notification
- reconciliation
- fulfillment
- cleanup
- heavy analytics

---

# 11. PAYMENT / WEBHOOK / JOB RULES

## 11.1 Fail-Closed Güvenlik

Kritik doğrulama başarısız olursa işlem durmalıdır.

Örnek:
- webhook signature invalid
- callback URL invalid
- authorization failed
- payment ownership mismatch

## 11.2 Transaction İçinde Harici Ağ Çağrısı Yasak

### ASLA

```txt
DB transaction içindeyken email gönderme
DB transaction içindeyken ödeme sağlayıcı çağrısı bekleme
DB transaction içindeyken webhook fulfillment tamamlama
```

## 11.3 Outbox / Fulfillment / Job Ayrımı

Yan etkiler tercihen job/outbox pattern ile yürütülmelidir.

### Kullanım Alanları

- payment fulfillment
- email sending
- push/notification
- reconciliation
- cleanup workers

## 11.4 Idempotency Zorunlu

Aşağıdaki akışlar idempotent tasarlanmalıdır:
- webhook processing
- payment callbacks
- cron reruns
- outbox processing
- storage cleanup retries

---

# 12. FILE STORAGE RULES

## 12.1 Supabase Storage Zorunlu

Dosya yükleme için canonical storage Supabase Storage'dır.

## 12.2 ASLA

```txt
Görselleri uygulama sunucusunun local diskinde kalıcı saklama
client'a kontrolsüz path accept etme
```

## 12.3 Upload Validation

### Zorunlu

- mime type validation
- file size validation
- secure path generation
- ownership / authorization check
- gerektiğinde magic-byte doğrulaması

---

# 13. SECURITY RULES

## 13.1 Güvenlik Önceliklidir

### Zorunlu Önlemler

- rate limiting
- CSRF protection
- origin validation
- input sanitization
- XSS prevention
- SQL injection prevention
- secrets isolation
- ownership checks
- admin route hardening
- cron secret validation

## 13.2 Service Role Kullanımı

### Zorunlu

- service role sadece server tarafında
- `server-only` boundary ile korunmalı
- client bundle'a asla sızmamalı

## 13.3 Secrets Management

### ASLA

```txt
Secret key hardcode etme
service role key'i browser'a gönderme
```

### Kullan

```txt
.env
platform secrets
server-only modules
```

## 13.4 Abuse Protection

Aşağıdaki yüzeylerde rate limit zorunludur:
- auth
- mutation endpoints
- admin routes
- cron/admin dual endpoints
- public expensive endpoints

---

# 14. ERROR HANDLING RULES

## 14.1 Merkezi Hata Yönetimi

Tüm kritik backend hataları:
- loglanmalı,
- normalize edilmeli,
- kullanıcıya güvenli mesaj dönmeli,
- internal detail sızdırmamalıdır.

## 14.2 ASLA

```txt
Raw stack trace dönme
sensitive DB / secret içeriğini response'a koyma
```

## 14.3 Error Mapping

Beklenen iş hataları uygun HTTP status'a map edilmelidir.

Örnek:
- validation -> 400 / 422
- unauthorized -> 401
- forbidden -> 403
- missing resource -> 404
- concurrency conflict -> 409
- rate limit -> 429
- unavailable dependency -> 503

---

# 15. LOGGING RULES

## 15.1 Structured Logging Zorunlu

Structured, context-aware logging kullanılmalıdır.

### Log Türleri

- info
- warn
- error
- audit
- security

## 15.2 Hassas Veri Loglama

### ASLA

```txt
password
token
service role key
credit card raw payload
csrf raw token
```

## 15.3 Sanitization

Log'a giren string veriler log forging ve control-character riskine karşı sanitize edilmelidir.

---

# 16. OBSERVABILITY RULES

## 16.1 Monitoring Zorunlu

### Kullan

```txt
Sentry
telemetry events
performance tracking
structured logs
```

## 16.2 İzlenmesi Gerekenler

- response time
- failed requests
- cron/job failures
- webhook failures
- database query issues
- rate limit degradation
- cache degradation

---

# 17. CRON / SCHEDULER RULES

## 17.1 Cron Güvenliği Zorunlu

Cron endpointleri:
- `CRON_SECRET` ile korunmalı,
- gerektiğinde admin fallback ile ayrıştırılmalı,
- public erişime açık bırakılmamalıdır.

## 17.2 Cron İşleri İdempotent Olmalı

Cron tekrar çalışsa da veri bozulmamalıdır.

## 17.3 Uzun Süren İşler

Uzun işler parçalara ayrılmalı veya job/outbox mantığıyla işlenmelidir.

---

# 18. RATE LIMITING RULES

## API Abuse Protection Zorunlu

### Uygula

- IP-based limits
- user-based limits
- auth endpoint protection
- admin mutation protection
- fail-open / fail-closed kararını endpoint kritikliğine göre bilinçli ver

---

# 19. TEST RULES

## Minimum Test Katmanları

### Zorunlu

- unit tests
- integration tests
- e2e tests

## Kritik Senaryolar

- login / auth
- listing creation
- listing moderation
- payment flow
- webhook flow
- authorization
- upload system
- cron safety

## Build Health

Aşağıdakiler sürekli temiz kalmalıdır:
- lint
- typecheck
- build

---

# 20. CI / DEPLOYMENT RULES

## Deployment Pipeline Zorunlu

### İçermeli

- lint
- typecheck
- tests
- build
- mümkünse security checks

## Değişiklik Kalitesi

Yeni backend işi tamamlandı sayılmaz eğer:
- build kırılıyorsa,
- typecheck kırılıyorsa,
- lint kırılıyorsa,
- route contract bozuluyorsa.

---

# 21. SCALABILITY RULES

## Horizontal Scale Dostu Olmalı

### Zorunlu

- stateless request handling
- shared cache where needed
- idempotent background processing
- retry-safe webhook / cron behavior

## Database Scalability

### Kullan

- connection pooling
- indexed queries
- efficient joins
- RPC for atomic multi-step operations where justified

---

# 22. FORBIDDEN PATTERNS

## ASLA YAPMA

```txt
business logic in route handler
service role key in client code
RLS bypass in browser code
unvalidated input
hardcoded secrets
no pagination on large lists
blocking heavy side effects in request path
webhook signature doğrulamadan işlem yapmak
aynı business logic'i birden fazla endpoint'e kopyalamak
harici network call'ı DB transaction içine koymak
```

---

# 23. FINAL REQUIREMENTS

AI aşağıdaki özelliklere sahip backend üretmelidir:

- secure
- maintainable
- modular
- observable
- production-ready
- strongly typed
- high performance
- fault tolerant
- Supabase-native
- Next.js App Router ile uyumlu

Kod:
- kısa vadeli değil,
- uzun vadeli sürdürülebilir olmalıdır,
- [`AGENTS.md`](AGENTS.md) içindeki Next.js + Supabase mimarisini bozmayacak şekilde üretilmelidir.
