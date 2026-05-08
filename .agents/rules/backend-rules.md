# BACKEND / API / DATABASE AI CONSTITUTION
## Enterprise Araç Alım-Satım Platformu İçin Backend Kuralları

Bu doküman bir yapay zekanın backend, API ve database geliştirirken uyması gereken zorunlu kuralları tanımlar.

Bu kurallar:
- öneri değildir,
- opsiyonel değildir,
- her zaman uygulanmalıdır.

AI:
- tüm backend kodlarını bu kurallara göre üretmelidir,
- performans,
- güvenlik,
- ölçeklenebilirlik,
- sürdürülebilirlik
önceliklerine göre hareket etmelidir.

---

# 1. CORE PRINCIPLES

## Öncelik Sırası

Backend aşağıdaki öncelik sırasına göre tasarlanmalıdır:

1. Security
2. Scalability
3. Maintainability
4. Performance
5. Reliability
6. Observability
7. Modularity

---

# 2. REQUIRED TECH STACK

## Zorunlu Teknolojiler

```txt
Node.js
TypeScript
NestJS veya Express + Clean Architecture
PostgreSQL
Redis
Prisma ORM
JWT Authentication
Docker
```

---

## Opsiyonel Ama Önerilen

```txt
Kafka
RabbitMQ
ElasticSearch
S3 Compatible Storage
```

---

# 3. ARCHITECTURE RULES

## 3.1 Clean Architecture Zorunlu

Katmanlar birbirinden ayrılmalıdır.

### Zorunlu Katmanlar

- Controller Layer
- Service Layer
- Repository Layer
- Domain Layer
- Validation Layer

---

## 3.2 Business Logic Controller İçinde Yazılamaz

### DON'T

```ts
app.post("/vehicle", async (req, res) => {
  // business logic
})
```

### DO

```txt
Controller -> Service -> Repository
```

---

## 3.3 Feature-Based Structure Zorunlu

### DO

```txt
src/
  modules/
    vehicle/
    auth/
    payment/
```

### DON'T

```txt
controllers/
services/
routes/
```

---

# 4. API DESIGN RULES

## 4.1 REST Standards Zorunlu

API:
- predictable,
- versioned,
- stateless
olmalıdır.

---

## 4.2 API Versioning Zorunlu

### DO

```txt
/api/v1/vehicles
```

---

## 4.3 HTTP Status Standards

### Zorunlu

```txt
200 OK
201 Created
400 Bad Request
401 Unauthorized
403 Forbidden
404 Not Found
409 Conflict
422 Validation Error
500 Internal Server Error
```

---

## 4.4 Response Standardization

Tüm API response’ları standart formatta olmalıdır.

### Success

```json
{
  "success": true,
  "data": {},
  "message": "Vehicle created"
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

---

# 5. VALIDATION RULES

## Validation Zorunlu

Tüm inputlar validate edilmelidir.

---

## ASLA

```txt
Raw request body kullanma
```

---

## Kullan

```txt
Zod
Joi
Class Validator
```

---

## Validation Katmanı Ayrı Olmalı

Validation:
- controller içinde yazılmamalı,
- reusable olmalı.

---

# 6. AUTHENTICATION RULES

## JWT Authentication Zorunlu

### Kullan

- Access Token
- Refresh Token

---

## Token Security

### Zorunlu

- expiration
- rotation
- secure storage
- invalidation support

---

## ASLA

```txt
Plain password saklama
```

---

## Password Rules

### Kullan

```txt
bcrypt veya argon2
```

---

# 7. AUTHORIZATION RULES

## Role-Based Access Control Zorunlu

### Örnek Roller

- user
- dealer
- admin
- moderator

---

## Permissions Middleware Kullan

Authorization:
- merkezi yönetilmeli,
- route içinde hardcoded olmamalı.

---

# 8. DATABASE RULES

## 8.1 PostgreSQL Zorunlu

Primary relational database PostgreSQL olmalıdır.

---

## 8.2 Database Normalization

### Minimum

3NF standardı uygulanmalıdır.

---

## 8.3 Indexing Zorunlu

Aşağıdaki alanlar indexlenmelidir:

- foreign keys
- search fields
- filters
- sorting columns

---

## 8.4 Soft Delete Standardı

Hard delete kullanılmamalıdır.

### Kullan

```txt
deleted_at
```

---

## 8.5 Audit Fields Zorunlu

Tüm tablolar şunları içermelidir:

```txt
created_at
updated_at
deleted_at
```

---

# 9. ORM RULES

## Prisma Kullan

### Zorunlu

- typed queries
- migrations
- schema management

---

## ASLA

```txt
Raw SQL everywhere
```

---

## Ancak

Complex reporting ve optimization durumlarında raw SQL kullanılabilir.

---

# 10. PERFORMANCE RULES

## Performance First Yaklaşımı

Backend:
yük altında stabil çalışmalıdır.

---

## 10.1 Pagination Zorunlu

### ASLA

10.000 kayıt tek request ile dönme.

---

## 10.2 Query Optimization

### Zorunlu

- select only needed fields
- avoid N+1 queries
- proper joins
- indexing

---

## 10.3 Caching Zorunlu

### Kullan

```txt
Redis
```

---

## Cache Kullanılacak Alanlar

- vehicle listings
- filters
- search results
- metadata

---

# 11. SEARCH RULES

## Advanced Search Required

Araç platformlarında arama sistemi kritik öneme sahiptir.

---

## Search Özellikleri

- full text search
- filtering
- sorting
- pagination

---

## Büyük Sistemlerde

### Kullan

```txt
ElasticSearch
```

---

# 12. FILE STORAGE RULES

## File Upload Standardı

### Kullan

```txt
S3 compatible storage
```

---

## ASLA

```txt
Image dosyalarını backend server içinde saklama
```

---

## Upload Validation

### Zorunlu

- mime type validation
- file size validation
- secure file naming

---

# 13. SECURITY RULES

## Güvenlik Önceliklidir

---

## Zorunlu Güvenlik Önlemleri

- rate limiting
- helmet
- CORS policy
- input sanitization
- SQL injection prevention
- XSS prevention
- CSRF protection

---

## Secrets Management

### ASLA

```txt
Secret key hardcode etme
```

---

## Kullan

```txt
.env
secret manager
vault systems
```

---

# 14. ERROR HANDLING RULES

## Global Error Handler Zorunlu

Tüm hatalar merkezi yönetilmelidir.

---

## ASLA

```txt
Raw stack trace dönme
```

---

## Error Logging

Tüm kritik hatalar loglanmalıdır.

---

# 15. LOGGING RULES

## Structured Logging Zorunlu

### Kullan

```txt
Winston
Pino
```

---

## Log Türleri

- info
- warn
- error
- audit

---

## Hassas Veri Loglama

### ASLA

```txt
password
token
credit card
```

---

# 16. OBSERVABILITY RULES

## Monitoring Zorunlu

### Kullan

```txt
Sentry
Prometheus
Grafana
OpenTelemetry
```

---

## İzlenmesi Gerekenler

- response time
- memory usage
- CPU usage
- failed requests
- database performance

---

# 17. EVENT DRIVEN RULES

## Büyük Ölçekli Sistemlerde

Asenkron işlemler event-driven olmalıdır.

---

## Kullanılabilecek Sistemler

```txt
Kafka
RabbitMQ
BullMQ
```

---

## Queue Kullanılacak Alanlar

- email sending
- notifications
- image processing
- analytics
- background jobs

---

# 18. RATE LIMITING RULES

## API Abuse Protection Zorunlu

### Uygula

- IP based limits
- user based limits
- auth endpoint protection

---

# 19. TEST RULES

## Minimum Test Katmanları

### Zorunlu

- unit tests
- integration tests
- e2e tests

---

## Kritik Senaryolar

- login
- payment
- vehicle creation
- authorization
- upload system

---

# 20. CI/CD RULES

## Deployment Pipeline Zorunlu

### İçermeli

- lint
- type check
- tests
- security scan
- docker build

---

# 21. DOCKER RULES

## Containerization Zorunlu

### Backend:

- stateless olmalı
- scalable olmalı

---

## Multi-stage Build Kullan

---

# 22. MICROSERVICE RULES

## Gereksiz Microservice Kullanma

Başlangıç:
- modular monolith olmalı.

Microservice:
- gerçekten ihtiyaç olduğunda ayrılmalı.

---

# 23. SCALABILITY RULES

## Backend Horizontal Scale Desteklemeli

### Zorunlu

- stateless architecture
- shared cache
- distributed session support

---

# 24. DATABASE SCALABILITY RULES

## Büyük Ölçekte

### Kullan

- read replicas
- connection pooling
- query optimization

---

# 25. FORBIDDEN PATTERNS

## ASLA YAPMA

```txt
business logic in controller
massive god services
raw SQL everywhere
unvalidated input
plain password storage
hardcoded secrets
no pagination
blocking operations
sync heavy tasks
duplicate business logic
huge database transactions
deep nested queries
```

---

# 26. FINAL REQUIREMENTS

AI aşağıdaki özelliklere sahip backend üretmelidir:

- scalable
- secure
- maintainable
- modular
- observable
- production-ready
- strongly typed
- high performance
- fault tolerant

Kod:
- kısa vadeli değil,
- uzun vadeli sürdürülebilir olmalıdır.