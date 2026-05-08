---
trigger: always_on
---

# FRONTEND AI CONSTITUTION
## Enterprise React / Next.js Araç Alım-Satım Platformu

Bu doküman bir yapay zekanın frontend kod üretirken uyması gereken zorunlu mimari, performans, güvenlik ve kalite kurallarını tanımlar.

Bu kurallar:
- öneri değildir,
- opsiyonel değildir,
- her zaman uygulanmalıdır.

AI:
- tüm kodları bu kurallara göre üretmelidir,
- kuralları ihlal eden yapı oluşturmamalıdır,
- performans ve sürdürülebilirliği önceliklendirmelidir.

---

# 1. CORE PRINCIPLES

## Zorunlu İlkeler

Frontend aşağıdaki öncelik sırasına göre geliştirilmelidir:

1. Maintainability
2. Scalability
3. Performance
4. Accessibility
5. Security
6. Reusability
7. UX consistency

Kod:
- uzun vadeli sürdürülebilir olmalı,
- büyük ekiplerde yönetilebilir olmalı,
- feature büyüdükçe bozulmamalı.

---

# 2. REQUIRED TECH STACK

## Zorunlu Teknolojiler

```txt
React
Next.js
TypeScript
TailwindCSS
TanStack Query
Zustand
React Hook Form
Zod
```

## Yasaklar

```txt
JavaScript only
Context API for large global state
Inline CSS
Large monolithic components
```

---

# 3. ARCHITECTURE RULES

## 3.1 Feature Based Architecture Zorunlu

Dosya organizasyonu feature-based olmalıdır.

### DO

```txt
src/
  features/
    vehicle/
    auth/
    search/
```

### DON'T

```txt
components/
hooks/
pages/
utils/
```

---

## 3.2 Separation of Concerns Zorunlu

Aşağıdaki katmanlar birbirine karıştırılmamalıdır:

- UI Layer
- State Layer
- Business Layer
- API Layer
- Validation Layer

---

## 3.3 Single Responsibility Principle

Her component:
- tek amaçlı olmalı,
- tek sorumluluk taşımalı.

Bir component:
- render,
- fetch,
- validation,
- state logic
işlerini aynı anda yapmamalıdır.

---

# 4. COMPONENT RULES

## 4.1 Component Size Limit

Bir component:

- maksimum 250 satır olmalı,
- büyük componentler bölünmeli.

---

## 4.2 Smart / Dumb Component Ayrımı

### Dumb Component

Sadece:
- UI render eder,
- reusable olur,
- state içermez.

### Smart Component

- API işlemleri yapar,
- state yönetir,
- logic içerir.

---

## 4.3 Reusable UI System

Tekrarlanan UI parçaları reusable yapılmalıdır.

### Zorunlu reusable yapılar

- Button
- Input
- Modal
- Card
- Table
- Pagination
- EmptyState
- LoadingState

---

## 4.4 Forbidden Component Patterns

### ASLA YAPMA

```txt
Inline fetch
Huge JSX trees
Inline business logic
Nested ternary chaos
Hardcoded strings
Deep prop drilling
```

---

# 5. TYPESCRIPT RULES

## Strict TypeScript Zorunlu

### ASLA KULLANMA

```ts
any
```

---

## Tüm Props Interface Kullanmalı

### DO

```ts
interface VehicleCardProps {
  vehicle: Vehicle;
}
```

### DON'T

```ts
const VehicleCard = (props: any)
```

---

## Shared Types Kullan

Entity tipleri merkezi olmalıdır.

### DO

```txt
shared/types/
entities/
```

---

# 6. STATE MANAGEMENT RULES

## 6.1 Global State Minimal Olmalı

Global state sadece:

- auth
- theme
- locale
- notifications

gibi gerçek global veriler içermelidir.

---

## 6.2 Server State İçin TanStack Query Kullan

Server state:
normal React state değildir.

### Zorunlu Özellikler

- caching
- retry
- deduplication
- stale management

---

## 6.3 Derived State Saklama

### DON'T

```ts
const [totalPrice, setTotalPrice]
```

### DO

```ts
const totalPrice = items.reduce(...)
```

---

# 7. API RULES

## 7.1 API Calls Component İçinde Yazılamaz

### DON'T

```ts
useEffect(() => {
  fetch(...)
}, [])
```

### DO

```txt
services/api/
```

---

## 7.2 API Layer Zorunlu

Tüm API işlemleri:
- abstraction layer içinde olmalı,
- reusable olmalı.

---

## 7.3 Error Handling Zorunlu

Tüm requestler:

- loading state
- error state
- retry
- timeout

içermelidir.

---

# 8. PERFORMANCE RULES

## 8.1 Performance First

Kod yazılırken performans öncelikli düşünülmelidir.

---

## 8.2 Gereksiz Re-render Engellenmeli

### Kullan

- React.memo
- useMemo
- useCallback

### Ancak

Gereksiz memoization yapılmamalı.

---

## 8.3 Large Lists Optimize Edilmeli

### Zorunlu

- pagination
- virtualization
- infinite query optimization

### ASLA

10.000 kayıt tek seferde render edilmemeli.

---

## 8.4 Code Splitting Zorunlu

### Kullan

- dynamic import
- lazy loading
- route splitting

---

## 8.5 Image Optimization

### Zorunlu

- WebP
- AVIF
- responsive images
- lazy loading

---

# 9. FORM RULES

## 9.1 React Hook Form Kullan

Formlar:
- uncontrolled yaklaşım kullanmalı,
- performant olmalı.

---

## 9.2 Validation İçin Zod Kullan

Validation:
- schema-based olmalı,
- reusable olmalı.

---

## 9.3 Form UX Rules

### Zorunlu

- loading state
- disabled submit
- inline validation
- clear error messages

---

# 10. UI / UX RULES

## 10.1 Design System Zorunlu

Tüm UI:
tek design system kullanmalıdır.

### İçermeli

- spacing system
- typography scale
- radius tokens
- shadow tokens
- color tokens

---

## 10.2 Consistency Zorunlu

Tüm:
- buttons
- forms
- modals
- cards

aynı davranış modelini kullanmalıdır.

---

## 10.3 Mobile First

Mobil deneyim öncelikli düşünülmelidir.

### Zorunlu

- touch-friendly UI
- responsive layout
- sticky mobile actions

---

# 11. ACCESSIBILITY RULES

## Accessibility Zorunlu

### Tüm ekranlar:

- keyboard accessible olmalı,
- semantic HTML kullanmalı,
- aria-label içermeli,
- focus state göstermeli.

### ASLA

Mouse bağımlı UI oluşturma.

---

# 12. SECURITY RULES

## Güvenlik Zorunlu

### Kurallar

- sanitize edilmiş HTML
- XSS protection
- secure auth handling
- CSP compatible structure

---

## ASLA

```txt
sensitive token localStorage içinde tutma
```

---

# 13. SEO RULES

## Araç Platformu SEO Öncelikli Olmalı

### Zorunlu

- SSR
- dynamic metadata
- canonical URLs
- structured data
- sitemap
- fast LCP

---

# 14. ERROR HANDLING RULES

## Error Boundary Zorunlu

Kritik alanlar Error Boundary ile korunmalıdır.

---

## White Screen Yasak

Bir hata:
tüm uygulamayı çökertmemelidir.

---

# 15. TEST RULES

## Minimum Test Yapıları

### Zorunlu

- unit tests
- integration tests
- e2e tests

### Kritik Akışlar

- login
- ilan oluşturma
- ödeme
- filtreleme

---

# 16. CODE QUALITY RULES

## Kod Standartları

### Zorunlu

- ESLint
- Prettier
- import sorting
- naming conventions
- strict TypeScript

---

## Kod Yazım Standardı

Kod:
- okunabilir olmalı,
- self-documenting olmalı,
- gereksiz complexity içermemeli.

---

# 17. OBSERVABILITY RULES

## Monitoring Zorunlu

### Kullan

- Sentry
- PostHog
- Analytics
- Performance tracking

---

# 18. DEPLOYMENT RULES

## Zorunlu

- CI/CD
- automated checks
- preview deployment
- environment separation

---

# 19. FORBIDDEN PATTERNS

## ASLA YAPMA

```txt
any type
inline fetch
inline styles
massive components
deep prop drilling
duplicated state
hardcoded API urls
business logic in JSX
nested ternary hell
unoptimized huge lists
blocking rendering
manual form validation chaos
```

---

# 20. FINAL REQUIREMENTS

AI aşağıdaki hedeflere göre kod üretmelidir:

- scalable
- maintainable
- performant
- accessible
- reusable
- enterprise-grade
- mobile-first
- SEO-friendly
- strongly typed
- production-ready

Kod:
- kısa vadeli değil,
- uzun vadeli sürdürülebilir olmalıdır.