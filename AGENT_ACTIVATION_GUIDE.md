# 🤖 Ajan Aktivasyon Rehberi

**Tarih**: 2026-04-30  
**Proje**: OtoBurada Marketplace  
**Durum**: Hazır

---

## 📋 Hızlı Başlangıç

### Ajan Olarak Görev Almak İçin 3 Adım:

1. **Rolünü Seç ve Oku**
   ```bash
   # Örnek: Database Optimizer olarak çalışacaksanız
   cat .agency/engineering/engineering-database-optimizer.md
   ```

2. **Görev Kartını İncele**
   ```bash
   # İlgili görev kartını oku
   cat .kiro/agent-tasks/TASK-XX-[task-name].md
   ```

3. **Çalışmaya Başla**
   ```bash
   # Branch oluştur ve çalışmaya başla
   git checkout -b task-XX-[task-name]
   ```

---

## 🎯 Aktif Görevler ve Ajanlar

### 🔴 Kritik Öncelik (Hemen Başlanmalı)

#### 1. TASK-64: Database Migration Deployment
**Ajan**: Database Optimizer  
**Dosya**: `.agency/engineering/engineering-database-optimizer.md`  
**Görev Kartı**: `.kiro/agent-tasks/TASK-64-database-migration.md`  
**Süre**: 2 saat  
**Durum**: 🔴 Bekliyor

**Özet**: Security audit sonrası oluşturulan 2 kritik migration'ı production'a deploy et.

**Başlamak İçin**:
```bash
# 1. Ajan dosyasını oku
cat .agency/engineering/engineering-database-optimizer.md

# 2. Görev kartını oku
cat .kiro/agent-tasks/TASK-64-database-migration.md

# 3. Branch oluştur
git checkout -b task-64-database-migration

# 4. Çalışmaya başla
# Migration dosyalarını incele
cat database/migrations/0134_chat_rate_limit_trigger.sql
cat database/migrations/0135_atomic_ban_user.sql
```

---

#### 2. TASK-65: Production Deployment & Monitoring
**Ajan**: DevOps Automator  
**Dosya**: `.agency/engineering/engineering-devops-automator.md`  
**Görev Kartı**: `.kiro/agent-tasks/TASK-65-production-deployment.md`  
**Süre**: 4 saat  
**Durum**: 🔴 Bekliyor (TASK-64'e bağımlı)

**Özet**: Security fixes'i production'a deploy et ve monitoring kur.

**Başlamak İçin**:
```bash
# 1. Ajan dosyasını oku
cat .agency/engineering/engineering-devops-automator.md

# 2. Görev kartını oku
cat .kiro/agent-tasks/TASK-65-production-deployment.md

# 3. TASK-64'ün tamamlanmasını bekle
# 4. Branch oluştur
git checkout -b task-65-production-deployment
```

---

### 🟡 Yüksek Öncelik (Bu Sprint)

#### 3. TASK-66: Performance Optimization
**Ajan**: Autonomous Optimization Architect  
**Dosya**: `.agency/engineering/engineering-autonomous-optimization-architect.md`  
**Süre**: 1 hafta  
**Durum**: 🟡 Bekliyor (TASK-65'e bağımlı)

**Özet**: Lighthouse audit, bundle optimization, query optimization.

**Başlamak İçin**:
```bash
cat .agency/engineering/engineering-autonomous-optimization-architect.md
cat DEVELOPMENT_PROGRAM.md  # TASK-66 bölümünü oku
```

---

#### 4. TASK-67: SEO & Content Optimization
**Ajan**: SEO Specialist  
**Dosya**: `.agency/marketing/marketing-seo-specialist.md`  
**Süre**: 1 hafta  
**Durum**: 🟡 Bekliyor (TASK-65'e bağımlı)

**Özet**: Meta tags, structured data, sitemap optimization.

**Başlamak İçin**:
```bash
cat .agency/marketing/marketing-seo-specialist.md
cat DEVELOPMENT_PROGRAM.md  # TASK-67 bölümünü oku
```

---

#### 5. TASK-68: Mobile UX Polish
**Ajan**: UX Architect  
**Dosya**: `.agency/design/design-ux-architect.md`  
**Süre**: 1 hafta  
**Durum**: 🟡 Paralel (Hemen başlanabilir)

**Özet**: Mobile navigation, touch targets, gestures, loading states.

**Başlamak İçin**:
```bash
cat .agency/design/design-ux-architect.md
cat DEVELOPMENT_PROGRAM.md  # TASK-68 bölümünü oku
git checkout -b task-68-mobile-ux-polish
```

---

## 📚 Önemli Dokümanlar

### Proje Dokümanları (Mutlaka Oku)
1. **AGENTS.md** - Proje vizyonu, kurallar, mimari standartlar
2. **README.md** - Teknik setup, quick start
3. **TASKS.md** - Tüm görevler ve kabul kriterleri
4. **PROGRESS.md** - İlerleme kaydı, tamamlanan işler

### Güvenlik Audit Dokümanları
5. **CRITICAL_FIXES_APPLIED.md** - Uygulanan 16 kritik düzeltme
6. **AUDIT_SUMMARY.md** - Yönetici özeti
7. **DEPLOYMENT_CHECKLIST.md** - Deployment prosedürü

### Geliştirme Programı
8. **DEVELOPMENT_PROGRAM.md** - Ajan tabanlı görev dağılımı
9. **AGENT_ACTIVATION_GUIDE.md** - Bu dosya

### Görev Kartları
10. `.kiro/agent-tasks/TASK-64-database-migration.md`
11. `.kiro/agent-tasks/TASK-65-production-deployment.md`
12. (Diğer görev kartları oluşturulacak)

---

## 🔄 Çalışma Akışı

### 1. Görev Alma
```bash
# Ajan dosyasını oku
cat .agency/[category]/[agent-name].md

# Görev kartını oku
cat .kiro/agent-tasks/TASK-XX-[task-name].md

# Proje durumunu anla
cat PROGRESS.md
cat AGENTS.md
```

### 2. Çalışma Başlangıcı
```bash
# Branch oluştur
git checkout -b task-XX-[task-name]

# Başlangıç raporu yaz
echo "## TASK-XX Başlangıç Raporu" >> PROGRESS.md
echo "**Ajan**: [Ajan Adı]" >> PROGRESS.md
echo "**Tarih**: $(date)" >> PROGRESS.md
echo "**Durum**: Başladı" >> PROGRESS.md
```

### 3. İlerleme Raporlama
```bash
# Her gün sonunda commit yap
git add .
git commit -m "TASK-XX: [Yapılan iş özeti]"
git push origin task-XX-[task-name]

# PROGRESS.md'yi güncelle
# İlerleme yüzdesini ve tamamlanan işleri ekle
```

### 4. Tamamlama
```bash
# Final commit
git add .
git commit -m "TASK-XX: Completed - [Özet]"
git push origin task-XX-[task-name]

# Pull request oluştur
gh pr create --title "TASK-XX: [Başlık]" --body "$(cat .kiro/agent-tasks/TASK-XX-[task-name].md)"

# PROGRESS.md'yi güncelle
echo "## TASK-XX Tamamlandı ✅" >> PROGRESS.md
```

---

## 📊 Raporlama Formatları

### Başlangıç Raporu
```markdown
## TASK-XX Başlangıç Raporu

**Ajan**: [Ajan Adı]
**Tarih**: [Tarih]
**Durum**: Başladı

### Analiz
- Mevcut durum: [Analiz]
- Bağımlılıklar: [Liste]
- Risk değerlendirmesi: [Değerlendirme]

### Plan
1. [Adım 1]
2. [Adım 2]
3. [Adım 3]

### Tahmini Süre
[X] saat/gün
```

### İlerleme Raporu
```markdown
## TASK-XX İlerleme Raporu

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

### Tamamlama Raporu
```markdown
## TASK-XX Tamamlama Raporu

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

## 🎯 Başarı Kriterleri

### Her Görev İçin
- [ ] Kabul kriterleri karşılandı
- [ ] Testler yazıldı ve geçti
- [ ] Dokümantasyon güncellendi
- [ ] Code review yapıldı
- [ ] PROGRESS.md güncellendi

### Kod Kalitesi
- [ ] `npm run typecheck` geçiyor
- [ ] `npm run lint` geçiyor
- [ ] `npm run build` geçiyor
- [ ] Test coverage yeterli

### Dokümantasyon
- [ ] README.md güncel
- [ ] PROGRESS.md güncel
- [ ] Inline comments yeterli
- [ ] API documentation var

---

## 🚨 Sorun Giderme

### Bağımlılık Sorunları
```bash
# Node modules temizle ve yeniden yükle
rm -rf node_modules
npm install
```

### TypeScript Hataları
```bash
# Type check yap
npm run typecheck

# Hataları düzelt
# Gerekirse types/ klasörünü güncelle
```

### Build Hataları
```bash
# Build yap
npm run build

# Hataları incele
# .next/ klasörünü temizle
rm -rf .next
npm run build
```

### Database Sorunları
```bash
# Migration durumunu kontrol et
npm run db:status

# Migration uygula
npm run db:migrate

# Rollback (gerekirse)
npm run db:rollback
```

---

## 📞 İletişim ve Koordinasyon

### Daily Standup
Her gün aynı saatte (örn: 10:00) kısa standup:

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

### Escalation
1. **Teknik Sorunlar**: Engineering Lead
2. **Ürün Kararları**: Product Manager
3. **Acil Durumlar**: Project Manager

---

## 🎓 Ajan Eğitimi

### Yeni Ajan Onboarding

#### Adım 1: Proje Anlayışı (1 saat)
```bash
# Temel dokümanları oku
cat README.md
cat AGENTS.md
cat TASKS.md
cat PROGRESS.md
```

#### Adım 2: Teknik Setup (30 dakika)
```bash
# Projeyi clone et
git clone [repo-url]
cd oto-burada

# Dependencies yükle
npm install

# Environment variables kur
cp .env.example .env.local
# .env.local'i düzenle

# Database setup
npm run db:migrate

# Projeyi çalıştır
npm run dev
```

#### Adım 3: Ajan Rolü Anlayışı (30 dakika)
```bash
# Ajan dosyasını oku
cat .agency/[category]/[your-agent].md

# İlgili görev kartlarını oku
ls .kiro/agent-tasks/
cat .kiro/agent-tasks/TASK-XX-[relevant-task].md
```

#### Adım 4: İlk Görev (Değişken)
```bash
# Küçük bir görevle başla
# Örnek: Documentation update, bug fix, test yazma
```

---

## 📈 İlerleme Takibi

### Sprint Board

| Görev | Ajan | Durum | Başlangıç | Bitiş | İlerleme |
|-------|------|-------|-----------|-------|----------|
| TASK-64 | Database Optimizer | 🔴 Bekliyor | - | - | 0% |
| TASK-65 | DevOps Automator | 🔴 Bekliyor | - | - | 0% |
| TASK-68 | UX Architect | 🟡 Paralel | - | - | 0% |

### Metrik Dashboard

```markdown
## Sprint Metrikleri

**Sprint**: 1 (Hafta 1-2)
**Başlangıç**: [Tarih]
**Bitiş**: [Tarih]

### Velocity
- Planlanan: 3 görev
- Tamamlanan: 0 görev
- Velocity: 0%

### Kod Kalitesi
- TypeScript Errors: 0 ✅
- ESLint Warnings: 0 ✅
- Test Coverage: [X]%

### Deployment
- Staging Deployments: 0
- Production Deployments: 0
- Rollbacks: 0
```

---

## ✅ Checklist: İlk Görev İçin Hazır mısın?

- [ ] Proje dokümanlarını okudum (README, AGENTS, TASKS, PROGRESS)
- [ ] Ajan rolümü anladım
- [ ] Görev kartımı okudum
- [ ] Teknik setup tamamlandı (npm install, .env.local, database)
- [ ] Proje çalışıyor (npm run dev)
- [ ] Git branch oluşturdum
- [ ] İlk commit yaptım
- [ ] Başlangıç raporumu yazdım

**Hepsi ✅ ise, çalışmaya başlayabilirsin! 🚀**

---

## 🎉 Başarı Hikayeleri

### Örnek: TASK-63 - Accessibility Hardening
**Ajan**: UX Architect  
**Süre**: 1 hafta  
**Sonuç**: Lighthouse A11y score 95'e çıktı ✅

**Öğrenilen Dersler**:
- Radix UI kullanımı focus management'ı kolaylaştırdı
- Touch target standardizasyonu mobile UX'i iyileştirdi
- Systematic approach ile tüm components tutarlı hale geldi

---

## 📞 Destek

### Sorularınız mı var?

1. **Teknik Sorular**: `AGENTS.md` ve `README.md`'yi kontrol et
2. **Görev Soruları**: İlgili görev kartını oku
3. **Proje Soruları**: `PROGRESS.md` ve `TASKS.md`'yi incele
4. **Acil Durumlar**: Team lead'e ulaş

---

**Hazırlayan**: Kiro AI (Claude Sonnet 4.5)  
**Tarih**: 2026-04-30  
**Versiyon**: 1.0  
**Durum**: Aktif ✅

---

## 🚀 Hadi Başlayalım!

İlk görevinizi seçin ve çalışmaya başlayın. Başarılar! 🎯
