# OtoBurada End-to-End Code Review Plan

**Date**: 2026-05-10  
**Status**: ✅ COMPLETED  
**Mission**: Projeyi uçtan uca analiz edip, tüm sorunları çözerek production-ready hale getirmek.

---

## Phase 1: Architecture & Structure Review ✅
**Agent**: Atlas (Backend/DB)  
**Scope**: AGENTS.md mimari kurallarına uyum kontrolü

### 1.1 Görevler
- [ ] Folder structure compliance (src/features, src/domain, src/services)
- [ ] Service layer pattern (*-records.ts, *-logic.ts, *-actions.ts) kontrolü
- [ ] Component size limit (max 250 lines) kontrolü
- [ ] Dead code / unused imports taraması
- [ ] RLS compliance (no service_role in client)
- [ ] Deprecated patterns (class-based services, client-service.ts) kontrolü

### 1.2 Somut Kontroller
```
AGENTS.md § Folder Structure: Tüm modüller feature-based mi?
AGENTS.md § Service Architecture: *-records/logic/actions ayrımı yapılmış mı?
Frontend AI Constitution § 4.1: Component size > 250 satır var mı?
Code Quality Rules: Dead code / unused imports var mı?
Database Rules: service_role key client kodunda kullanılmış mı?
```

### 1.3 Çıktı
- Sorunlu dosyaların listesi (path + satır)
- Önerilen refactoring planı
- Düzeltme kodu

---

## Phase 2: Component & UI Review ✅

### 2.1 Görevler
- [ ] Loading states (Skeleton components) coverage
- [ ] Empty states (EmptyState component) coverage
- [ ] Error states (ErrorBoundary + inline errors) coverage
- [ ] Form UX (loading state, disabled submit, inline validation)
- [ ] Button/Input/Card consistency kontrolü

### 2.2 Somut Kontroller
```
Form Rules: Tüm formlarda loading state + disabled submit + inline validation var mı?
State Management: Loading/empty/error durumları explicit handle edilmiş mi?
UI/UX Rules: Design system consistency (spacing, typography, colors) sağlanmış mı?
```

### 2.3 Çıktı
- Missing states listesi
- Düzeltme önerileri

---

## Phase 3: Service/Logic Layer Review ✅

### 3.1 Görevler
- [ ] Records/Logic/Actions ayrımı kontrolü
- [ ] Business logic correctness (pricing, trust score, etc.)
- [ ] API response handling (null checks, error handling)
- [ ] Supabase query patterns (no SELECT *, proper projections)

### 3.2 Somut Kontroller
```
Supabase Best Practices: SELECT * kullanılmış mı? (hot paths)
Supabase Best Practices: Index coverage yeterli mi?
Service Architecture: Business logic presentational component içinde mi?
Error Handling: Tüm API çağrılarında error handling var mı?
```

### 3.3 Çıktı
- Sorunlu service dosyaları
- Query optimization önerileri

---

## Phase 4: Database & RLS Security Review ✅

### 4.1 Görevler
- [ ] Schema compliance (schema.snapshot.sql referans)
- [ ] RLS policies for ALL tables
- [ ] Index coverage (foreign keys, hot query columns)
- [ ] Foreign key integrity

### 4.2 Somut Kontroller
```
Database Rules: RLS enabled for ALL tables?
Database Rules: (SELECT auth.uid()) pattern used in policies?
Database Rules: search_path = public for SECURITY DEFINER functions?
Resilience: Banned users' listings filtered with !inner joins?
```

### 4.3 Çıktı
- Eksik RLS policies listesi
- Missing indexes
- Migration önerileri

---

## Phase 5: Security & Input Validation Review ✅

### 5.1 Görevler
- [ ] XSS sanitization (dangerouslySetInnerHTML kontrolü)
- [ ] CSRF protection implementation
- [ ] Rate limiting coverage
- [ ] Zod validator coverage (all public endpoints)
- [ ] Sensitive data handling (tokens, keys)

### 5.2 Somut Kontroller
```
Security Rules: Sanitize edilmiş HTML kullanılıyor mu?
Security Rules: Sensitive token localStorage'da tutulmuş mu?
API Rules: Tüm requestler error handling içeriyor mu?
Rate Limiting: Critical endpoints korunuyor mu?
```

### 5.3 Çıktı
- Security vulnerability listesi
- Düzeltme kodu

---

## Phase 6: Performance & Bundle Review ✅

### 6.1 Görevler
- [ ] Bundle size analysis (next/bundle-analyzer)
- [ ] Code splitting (dynamic imports)
- [ ] Image optimization (WebP, AVIF, lazy loading)
- [ ] SSR/SEO compliance (metadata, structured data)
- [ ] Large lists pagination/virtuaization

### 6.2 Somut Kontroller
```
Performance Rules: Heavy components dynamic import ile yükleniyor mu?
Performance Rules: Large lists pagination yapıyor mu?
SEO Rules: Tüm public sayfalarda metadata var mı?
Image Optimization: next/image kullanılıyor mu?
```

### 6.3 Çıktı
- Bundle bloat sources
- Optimization önerileri

---

## Phase 7: Mobile UX & Accessibility Review ✅

### 7.1 Görevler
- [ ] Mobile responsive breakpoints
- [ ] Touch targets (min 44x44px)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility (ARIA labels)
- [ ] Focus management (modals, dropdowns)

### 7.2 Somut Kontroller
```
Mobile First: Tüm sayfalar mobile'da usable mı?
Touch Targets: Interactive elements min 44x44px mi?
Accessibility: aria-labels, role attributes, live regions var mı?
Focus Management: Modal/dropdown focus trapping yapılmış mı?
```

### 7.3 Çıktı
- Accessibility violations listesi
- Düzeltme önerileri

---

## Phase 8: Documentation Alignment ✅

### 8.1 Görevler
- [ ] AGENTS.md ↔ Gerçek kod uyumu
- [ ] README.md güncelleme (setup instructions)
- [ ] TASKS.md ↔ PROGRESS.md senkronizasyonu
- [ ] Legacy doküman temizliği

### 8.2 Çıktı
- Güncellenmiş dokümanlar
- Silinecek gereksiz dosyalar

---

## Final: Build Validation & Push 🔄 IN PROGRESS

### Görevler
- [ ] `npm run typecheck` → 0 errors
- [ ] `npm run lint` → 0 errors, 0 warnings
- [ ] `npm run build` → Success
- [ ] Git commit with semantic message

### Success Criteria
- ✅ Tüm MVP acceptance criteria karşılanmış
- ✅ typecheck: 0 errors
- ✅ lint: 0 errors, 0 warnings
- ✅ build: success
- ✅ Mobile-first UX validated
- ✅ Security audit passed

---

## Review Context (Stateful Memory)

### Completed in Session
- Phase 77: UX Polish
  - Password visibility toggle ✅
  - Step indicator responsive fix ✅
  - WhatsApp desktop fallback ✅
  - Phone copy button ✅

### Known Issues (Pre-existing)
- TODO: Documented in Phase 54 backlog
- TODO: Documented in ARCHITECTURE_REVIEW_REPORT.md

### Open Questions
- Q1: Listing wizard - Plaka lookup loading state belirsiz
- Q2: Filter validation - error'da filter'a scroll/focus gerekli mi?
- Q3: Drag-drop upload - PhotosStep için gerekli mi?

---

## Agent Commands

### Copilot'a Sorulacak Sorular

**Q1 (Atlas)**: "Projedeki tüm service katmanı dosyalarını listele. Hangi dosyalar deprecated pattern (class-based veya client-service) kullanıyor? Her biri için migration planı öner."

**Q2 (Aria)**: "src/features/ dizini altındaki tüm component'lerin satır sayısını hesapla. 250 satırı aşanları listele ve her biri için split önerisi sun."

**Q3 (Vera)**: "Public API endpoint'lerini listele. Her biri için Zod validation var mı? Eksik validation varsa schema öner."

**Q4 (Atlas)**: "Database schema'daki tüm tabloları listele. Hangi tablolarda RLS policy eksik? Önerilen policy'leri yaz."

**Q5 (Aria)**: "src/app/(public) altındaki tüm sayfaları listele. Hangi sayfalarda loading/empty/error state eksik?"

**Q6 (Vera)**: "XSS vulnerability taraması yap. dangerouslySetInnerHTML kullanılan yerleri ve sanitization durumunu raporla."

**Q7 (Atlas)**: "Performance kritik endpoint'leri (marketplace listings, listing detail) analiz et. N+1 query, missing index, or SELECT * var mı?"

**Q8 (Aria)**: "Mobile responsive kontrolleri yap. 768px breakpoint'te kırılan layout, küçük touch target, kaybolan içerik var mı?"

