# OtoBurada Geliştirme Programı
## Ajan Tabanlı Görev Dağılımı

**Tarih**: 2026-04-30  
**Durum**: Aktif Geliştirme  
**Metodoloji**: Ajan Tabanlı Paralel Geliştirme

---

## 🎯 Program Özeti

Bu program, `.agency` klasöründeki uzman ajanları kullanarak OtoBurada projesinin kalan görevlerini paralel ve verimli bir şekilde tamamlamayı hedefler.

**Mevcut Durum**: Phase 63 tamamlandı, güvenlik auditi yapıldı  
**Hedef**: Production-ready marketplace platformu

---

## 📋 Aktif Görev Havuzu

### 🔴 Kritik Öncelik (Hemen Başlanmalı)

#### TASK-64: Database Migration Deployment
**Sorumlu Ajan**: `engineering-database-optimizer.md`  
**Süre**: 2 saat  
**Bağımlılık**: Yok

**Görevler**:
- [ ] Migration 0134 (Chat Rate Limit) uygula
- [ ] Migration 0135 (Atomic Ban User) uygula
- [ ] Production veritabanında doğrulama testleri yap
- [ ] Rollback planını test et

**Kabul Kriterleri**:
- Migrations başarıyla uygulandı
- Chat rate limit trigger çalışıyor
- Atomic ban RPC fonksiyonu test edildi

---

#### TASK-65: Production Deployment & Monitoring
**Sorumlu Ajan**: `engineering-devops-automator.md`  
**Süre**: 4 saat  
**Bağımlılık**: TASK-64

**Görevler**:
- [ ] Staging ortamına deploy et
- [ ] Smoke testleri çalıştır
- [ ] Production'a deploy et
- [ ] Monitoring dashboard'ları kur (Sentry, Vercel, Supabase)
- [ ] Alert sistemini yapılandır

**Kabul Kriterleri**:
- Production deployment başarılı
- Tüm monitoring sistemleri aktif
- Alert'ler yapılandırıldı

---

### 🟡 Yüksek Öncelik (Bu Sprint)

#### TASK-66: Performance Optimization
**Sorumlu Ajan**: `engineering-autonomous-optimization-architect.md`  
**Süre**: 1 hafta  
**Bağımlılık**: TASK-65

**Görevler**:
- [ ] Lighthouse performance audit yap
- [ ] Bundle size optimizasyonu
- [ ] Database query optimizasyonu
- [ ] Image loading optimizasyonu
- [ ] Cache stratejisi iyileştirme

**Kabul Kriterleri**:
- Lighthouse Performance > 90
- First Contentful Paint < 1.8s
- Time to Interactive < 3.5s
- Bundle size < 500KB (gzipped)

**Dosyalar**:
- `src/app/**/*.tsx` (Server Components)
- `src/components/**/*.tsx` (Client Components)
- `next.config.js` (Build optimization)

---

#### TASK-67: SEO & Content Optimization
**Sorumlu Ajan**: `marketing-seo-specialist.md`  
**Süre**: 1 hafta  
**Bağımlılık**: TASK-65

**Görevler**:
- [ ] Meta tag optimizasyonu
- [ ] Structured data (JSON-LD) iyileştirme
- [ ] Sitemap optimizasyonu
- [ ] Robot.txt yapılandırması
- [ ] Open Graph ve Twitter Card optimizasyonu
- [ ] Internal linking stratejisi

**Kabul Kriterleri**:
- Tüm sayfalar unique meta description'a sahip
- Structured data validation geçiyor
- Sitemap 50,000 URL'yi destekliyor
- Core Web Vitals yeşil

**Dosyalar**:
- `src/app/**/metadata.ts`
- `src/app/sitemap.ts`
- `src/app/robots.ts`

---

#### TASK-68: Mobile UX Polish
**Sorumlu Ajan**: `design-ux-architect.md`  
**Süre**: 1 hafta  
**Bağımlılık**: Yok (Paralel)

**Görevler**:
- [ ] Mobile navigation flow audit
- [ ] Touch target optimization (44x44px minimum)
- [ ] Gesture support iyileştirme
- [ ] Bottom sheet interactions polish
- [ ] Loading states ve skeleton screens
- [ ] Error states ve empty states

**Kabul Kriterleri**:
- Tüm touch target'lar WCAG uyumlu
- Gesture navigation smooth
- Loading states tutarlı
- Mobile Lighthouse score > 95

**Dosyalar**:
- `src/components/layout/**/*.tsx`
- `src/components/shared/**/*.tsx`
- `src/app/(public)/**/*.tsx`

---

### 🟢 Orta Öncelik (Sonraki Sprint)

#### TASK-69: Advanced Search & Filters
**Sorumlu Ajan**: `engineering-frontend-developer.md`  
**Süre**: 2 hafta  
**Bağımlılık**: TASK-66

**Görevler**:
- [ ] Saved search functionality geliştir
- [ ] Advanced filter combinations
- [ ] Search suggestions ve autocomplete
- [ ] Filter presets (Popüler Aramalar)
- [ ] Search analytics tracking

**Kabul Kriterleri**:
- Kullanıcılar arama kayıt edebiliyor
- Email notifications çalışıyor
- Autocomplete < 200ms response time
- Filter state URL'de persist ediyor

**Dosyalar**:
- `src/app/listings/page.tsx`
- `src/components/listings/listing-filters.tsx`
- `src/services/saved-searches/`

---

#### TASK-70: Trust & Safety Features
**Sorumlu Ajan**: `engineering-security-engineer.md`  
**Süre**: 2 hafta  
**Bağımlılık**: TASK-65

**Görevler**:
- [ ] Fraud detection algorithm iyileştirme
- [ ] User reputation system
- [ ] Verified seller badges
- [ ] Report handling workflow
- [ ] Automated moderation rules
- [ ] Trust score calculation refinement

**Kabul Kriterleri**:
- Fraud detection accuracy > 95%
- Trust score hesaplaması doğru
- Verified badge sistemi çalışıyor
- Report workflow end-to-end test edildi

**Dosyalar**:
- `src/services/listings/listing-submission-moderation.ts`
- `src/domain/logic/trust-score-calculator.ts`
- `src/app/admin/security/`

---

#### TASK-71: Analytics & Insights Dashboard
**Sorumlu Ajan**: `engineering-data-engineer.md`  
**Süre**: 2 hafta  
**Bağımlılık**: TASK-65

**Görevler**:
- [ ] User analytics dashboard
- [ ] Listing performance metrics
- [ ] Market trends visualization
- [ ] Seller insights panel
- [ ] Admin analytics enhancement
- [ ] Export functionality

**Kabul Kriterleri**:
- Dashboard real-time data gösteriyor
- Charts responsive ve performant
- Export CSV/PDF çalışıyor
- Data accuracy doğrulandı

**Dosyalar**:
- `src/app/dashboard/analytics/`
- `src/services/analytics/`
- `src/components/dashboard/charts/`

---

#### TASK-72: Email & Notification System
**Sorumlu Ajan**: `engineering-email-intelligence-engineer.md`  
**Süre**: 1 hafta  
**Bağımlılık**: TASK-65

**Görevler**:
- [ ] Email template optimization
- [ ] Notification preferences UI
- [ ] Push notification setup (PWA)
- [ ] Email delivery monitoring
- [ ] Unsubscribe flow
- [ ] Transactional email tracking

**Kabul Kriterleri**:
- Email delivery rate > 95%
- Templates mobile-responsive
- Notification preferences çalışıyor
- Push notifications test edildi

**Dosyalar**:
- `src/services/notifications/`
- `src/app/api/notifications/`
- `src/components/dashboard/notification-settings.tsx`

---

### 🔵 Düşük Öncelik (Backlog)

#### TASK-73: Advanced Messaging Features
**Sorumlu Ajan**: `engineering-backend-architect.md`  
**Süre**: 2 hafta  
**Bağımlılık**: TASK-65

**Görevler**:
- [ ] In-app chat enhancements
- [ ] Message templates
- [ ] Auto-responses
- [ ] Chat analytics
- [ ] Message search
- [ ] File attachments

**Not**: WhatsApp primary contact method olarak kalacak, bu secondary feature.

---

#### TASK-74: Marketplace Gamification
**Sorumlu Ajan**: `product-behavioral-nudge-engine.md`  
**Süre**: 2 hafta  
**Bağımlılık**: TASK-70

**Görevler**:
- [ ] Achievement system
- [ ] Seller levels
- [ ] Badges ve rewards
- [ ] Referral program
- [ ] Loyalty points
- [ ] Leaderboards

---

#### TASK-75: AI-Powered Features
**Sorumlu Ajan**: `engineering-ai-engineer.md`  
**Süre**: 3 hafta  
**Bağımlılık**: TASK-66

**Görevler**:
- [ ] AI listing description enhancement
- [ ] Image quality analysis
- [ ] Price recommendation AI
- [ ] Chatbot for common questions
- [ ] Fraud detection ML model
- [ ] Market prediction model

**Not**: Free-tier AI services kullanılacak (Gemini, HuggingFace).

---

## 🔄 Sprint Planlaması

### Sprint 1 (Hafta 1-2): Production Stabilization
**Odak**: Deployment, Monitoring, Critical Fixes

| Görev | Ajan | Durum | Başlangıç | Bitiş |
|-------|------|-------|-----------|-------|
| TASK-64 | Database Optimizer | 🔴 Bekliyor | - | - |
| TASK-65 | DevOps Automator | 🔴 Bekliyor | - | - |
| TASK-68 | UX Architect | 🟡 Paralel | - | - |

**Hedef**: Production'da stabil çalışan platform

---

### Sprint 2 (Hafta 3-4): Performance & SEO
**Odak**: Optimization, Search Engine Visibility

| Görev | Ajan | Durum | Başlangıç | Bitiş |
|-------|------|-------|-----------|-------|
| TASK-66 | Optimization Architect | 🟡 Bekliyor | - | - |
| TASK-67 | SEO Specialist | 🟡 Bekliyor | - | - |
| TASK-72 | Email Engineer | 🟢 Paralel | - | - |

**Hedef**: Lighthouse 90+ score, SEO-ready platform

---

### Sprint 3 (Hafta 5-6): Trust & Features
**Odak**: Security, User Trust, Advanced Features

| Görev | Ajan | Durum | Başlangıç | Bitiş |
|-------|------|-------|-----------|-------|
| TASK-69 | Frontend Developer | 🟢 Bekliyor | - | - |
| TASK-70 | Security Engineer | 🟢 Bekliyor | - | - |
| TASK-71 | Data Engineer | 🟢 Paralel | - | - |

**Hedef**: Trust-first marketplace, advanced search

---

### Sprint 4+ (Hafta 7+): Growth & Innovation
**Odak**: Gamification, AI, Advanced Features

| Görev | Ajan | Durum | Başlangıç | Bitiş |
|-------|------|-------|-----------|-------|
| TASK-73 | Backend Architect | 🔵 Backlog | - | - |
| TASK-74 | Behavioral Nudge | 🔵 Backlog | - | - |
| TASK-75 | AI Engineer | 🔵 Backlog | - | - |

**Hedef**: Competitive advantage, user engagement

---

## 📊 Ajan Rolleri ve Sorumluluklar

### 1. Database Optimizer (TASK-64)
**Dosya**: `.agency/engineering/engineering-database-optimizer.md`

**Sorumluluklar**:
- Migration deployment
- Database performance tuning
- Index optimization
- Query analysis
- RLS policy verification

**Çıktılar**:
- Migration execution report
- Performance benchmark results
- Rollback procedures documentation

---

### 2. DevOps Automator (TASK-65)
**Dosya**: `.agency/engineering/engineering-devops-automator.md`

**Sorumluluklar**:
- CI/CD pipeline management
- Deployment automation
- Monitoring setup
- Alert configuration
- Infrastructure as code

**Çıktılar**:
- Deployment checklist completion
- Monitoring dashboard URLs
- Alert configuration documentation
- Rollback procedures

---

### 3. Optimization Architect (TASK-66)
**Dosya**: `.agency/engineering/engineering-autonomous-optimization-architect.md`

**Sorumluluklar**:
- Performance profiling
- Bundle size optimization
- Code splitting strategy
- Cache optimization
- Database query optimization

**Çıktılar**:
- Lighthouse audit reports
- Bundle analysis reports
- Performance improvement metrics
- Optimization recommendations

---

### 4. SEO Specialist (TASK-67)
**Dosya**: `.agency/marketing/marketing-seo-specialist.md`

**Sorumluluklar**:
- Meta tag optimization
- Structured data implementation
- Sitemap generation
- Content optimization
- Link building strategy

**Çıktılar**:
- SEO audit report
- Meta tag templates
- Structured data schemas
- Content optimization guide

---

### 5. UX Architect (TASK-68)
**Dosya**: `.agency/design/design-ux-architect.md`

**Sorumluluklar**:
- User flow optimization
- Mobile UX enhancement
- Accessibility compliance
- Interaction design
- Usability testing

**Çıktılar**:
- UX audit report
- Mobile flow diagrams
- Accessibility compliance report
- Interaction design specs

---

### 6. Frontend Developer (TASK-69)
**Dosya**: `.agency/engineering/engineering-frontend-developer.md`

**Sorumluluklar**:
- Advanced search implementation
- Filter system enhancement
- Client-side optimization
- Component development
- State management

**Çıktılar**:
- Search feature implementation
- Filter component library
- Performance metrics
- Component documentation

---

### 7. Security Engineer (TASK-70)
**Dosya**: `.agency/engineering/engineering-security-engineer.md`

**Sorumluluklar**:
- Fraud detection enhancement
- Security audit
- Trust system implementation
- Vulnerability assessment
- Security policy enforcement

**Çıktılar**:
- Security audit report
- Fraud detection metrics
- Trust score algorithm
- Security policy documentation

---

### 8. Data Engineer (TASK-71)
**Dosya**: `.agency/engineering/engineering-data-engineer.md`

**Sorumluluklar**:
- Analytics pipeline
- Data visualization
- Reporting system
- Data warehouse design
- ETL processes

**Çıktılar**:
- Analytics dashboard
- Data pipeline documentation
- Report templates
- Data quality metrics

---

### 9. Email Engineer (TASK-72)
**Dosya**: `.agency/engineering/engineering-email-intelligence-engineer.md`

**Sorumluluklar**:
- Email template development
- Notification system
- Delivery monitoring
- A/B testing
- Personalization

**Çıktılar**:
- Email template library
- Notification system documentation
- Delivery metrics dashboard
- A/B test results

---

## 🎯 Başarı Metrikleri

### Teknik Metrikler
- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 95
- [ ] Lighthouse SEO > 95
- [ ] Build time < 2 dakika
- [ ] Bundle size < 500KB (gzipped)
- [ ] API response time < 200ms (p95)
- [ ] Database query time < 50ms (p95)
- [ ] Zero TypeScript errors
- [ ] Zero ESLint warnings

### İş Metrikleri
- [ ] User registration conversion > 5%
- [ ] Listing creation completion > 80%
- [ ] Search to listing view > 30%
- [ ] Listing view to contact > 10%
- [ ] Fraud detection accuracy > 95%
- [ ] User satisfaction score > 4.5/5
- [ ] Mobile traffic > 70%
- [ ] Organic search traffic > 40%

### Operasyonel Metrikler
- [ ] Deployment frequency: Daily
- [ ] Mean time to recovery < 1 saat
- [ ] Change failure rate < 5%
- [ ] Uptime > 99.9%
- [ ] Error rate < 0.1%
- [ ] Support ticket resolution < 24 saat

---

## 📝 Ajan Çalışma Protokolü

### 1. Görev Alma
```bash
# Ajan dosyasını oku
cat .agency/engineering/engineering-[role].md

# Görev detaylarını incele
cat DEVELOPMENT_PROGRAM.md

# Mevcut durumu kontrol et
cat PROGRESS.md
cat TASKS.md
```

### 2. Çalışma Başlangıcı
```markdown
## [TASK-XX] Başlangıç Raporu

**Ajan**: [Ajan Adı]
**Tarih**: [Tarih]
**Durum**: Başladı

### Analiz
- [Mevcut durum analizi]
- [Bağımlılıklar]
- [Risk değerlendirmesi]

### Plan
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

### Tahmini Süre
[X] saat/gün
```

### 3. İlerleme Raporlama
```markdown
## [TASK-XX] İlerleme Raporu

**Tarih**: [Tarih]
**Tamamlanan**: %[XX]

### Tamamlanan İşler
- [x] [İş 1]
- [x] [İş 2]

### Devam Eden İşler
- [ ] [İş 3]
- [ ] [İş 4]

### Engeller
- [Engel varsa]

### Sonraki Adımlar
- [Adım 1]
- [Adım 2]
```

### 4. Tamamlama Raporu
```markdown
## [TASK-XX] Tamamlama Raporu

**Ajan**: [Ajan Adı]
**Tarih**: [Tarih]
**Durum**: ✅ Tamamlandı

### Teslim Edilenler
- [Deliverable 1]
- [Deliverable 2]

### Metrikler
- [Metric 1]: [Value]
- [Metric 2]: [Value]

### Dokümantasyon
- [Doc 1 path]
- [Doc 2 path]

### Test Sonuçları
- [Test 1]: ✅ Geçti
- [Test 2]: ✅ Geçti

### Sonraki Öneriler
- [Öneri 1]
- [Öneri 2]
```

---

## 🚀 Hızlı Başlangıç

### Ajan Olarak Görev Almak İçin:

1. **Ajan Dosyasını Oku**:
```bash
# Örnek: Database Optimizer olarak çalışacaksanız
cat .agency/engineering/engineering-database-optimizer.md
```

2. **Görev Detaylarını İncele**:
```bash
# Bu dosyada ilgili TASK-XX bölümünü oku
cat DEVELOPMENT_PROGRAM.md
```

3. **Mevcut Durumu Kontrol Et**:
```bash
# Projenin mevcut durumunu anla
cat PROGRESS.md
cat AGENTS.md
cat README.md
```

4. **Çalışmaya Başla**:
```bash
# Görev için branch oluştur
git checkout -b task-64-database-migration

# Çalışmaya başla
# [Ajan rolüne göre işlemleri yap]
```

5. **İlerlemeyi Raporla**:
```bash
# PROGRESS.md'yi güncelle
# Commit ve push yap
git add .
git commit -m "TASK-64: Migration deployment progress"
git push origin task-64-database-migration
```

---

## 📞 İletişim ve Koordinasyon

### Daily Standup Format
```markdown
## Daily Standup - [Tarih]

### [Ajan Adı]
**Dün**: [Yapılan işler]
**Bugün**: [Yapılacak işler]
**Engeller**: [Varsa engeller]
```

### Ajan Arası Koordinasyon
- Bağımlılıklar için diğer ajanlarla senkronize ol
- Ortak dosyalarda çakışma olmaması için iletişim kur
- Code review için diğer ajanları etiketle

### Escalation Path
1. **Teknik Sorunlar**: Engineering Lead
2. **Ürün Kararları**: Product Manager
3. **Acil Durumlar**: Project Manager

---

## 📚 Referans Dokümanlar

### Proje Dokümanları
- `AGENTS.md` - Proje vizyonu ve kurallar
- `README.md` - Teknik setup
- `TASKS.md` - Tüm görevler
- `PROGRESS.md` - İlerleme kaydı
- `DEPLOYMENT_CHECKLIST.md` - Deployment prosedürü
- `AUDIT_SUMMARY.md` - Güvenlik audit özeti

### Ajan Dokümanları
- `.agency/engineering/` - Engineering ajanları
- `.agency/design/` - Design ajanları
- `.agency/marketing/` - Marketing ajanları
- `.agency/product/` - Product ajanları

### Teknik Dokümanlar
- `database/schema.snapshot.sql` - Database schema
- `src/types/` - TypeScript types
- `src/lib/validators/` - Validation schemas

---

## ✅ Program Onay ve Aktivasyon

**Hazırlayan**: Kiro AI (Claude Sonnet 4.5)  
**Tarih**: 2026-04-30  
**Durum**: Onay Bekliyor

### Onay Gereksinimleri
- [ ] Product Owner onayı
- [ ] Tech Lead onayı
- [ ] Ajan rolleri atandı
- [ ] Sprint planı onaylandı
- [ ] Kaynak tahsisi yapıldı

### Aktivasyon Sonrası
- [ ] Kick-off meeting yapıldı
- [ ] Ajanlar görevlerini aldı
- [ ] İlk sprint başladı
- [ ] Daily standup kuruldu
- [ ] Progress tracking aktif

---

**Not**: Bu program dinamik bir dokümandır. Sprint sonlarında review edilip güncellenecektir.
