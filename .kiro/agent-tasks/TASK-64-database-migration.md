# TASK-64: Database Migration Deployment

**Ajan**: Database Optimizer  
**Ajan Dosyası**: `.agency/engineering/engineering-database-optimizer.md`  
**Öncelik**: 🔴 Kritik  
**Tahmini Süre**: 2 saat  
**Durum**: 🔴 Bekliyor  
**Bağımlılık**: Yok

---

## 📋 Görev Özeti

Security audit sonrası oluşturulan 2 kritik migration'ı production veritabanına güvenli bir şekilde deploy et ve doğrula.

---

## 🎯 Hedefler

1. Migration 0134 (Chat Rate Limit Trigger) deployment
2. Migration 0135 (Atomic Ban User RPC) deployment
3. Production veritabanında doğrulama
4. Rollback planının test edilmesi

---

## 📝 Detaylı Görevler

### 1. Pre-Deployment Hazırlık

- [ ] **Backup Al**
  ```bash
  # Production database backup
  pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
  ```

- [ ] **Migration Dosyalarını İncele**
  ```bash
  cat database/migrations/0134_chat_rate_limit_trigger.sql
  cat database/migrations/0135_atomic_ban_user.sql
  ```

- [ ] **Dry-Run Test (Local)**
  ```bash
  # Local veritabanında test et
  psql $LOCAL_DATABASE_URL -f database/migrations/0134_chat_rate_limit_trigger.sql
  psql $LOCAL_DATABASE_URL -f database/migrations/0135_atomic_ban_user.sql
  ```

### 2. Migration Deployment

- [ ] **Staging'e Deploy**
  ```bash
  npm run db:migrate
  # veya manuel:
  psql $STAGING_DATABASE_URL -f database/migrations/0134_chat_rate_limit_trigger.sql
  psql $STAGING_DATABASE_URL -f database/migrations/0135_atomic_ban_user.sql
  ```

- [ ] **Migration History Doğrula**
  ```sql
  SELECT * FROM schema_migrations ORDER BY version DESC LIMIT 5;
  ```

- [ ] **Production'a Deploy**
  ```bash
  # Production database
  psql $PRODUCTION_DATABASE_URL -f database/migrations/0134_chat_rate_limit_trigger.sql
  psql $PRODUCTION_DATABASE_URL -f database/migrations/0135_atomic_ban_user.sql
  ```

### 3. Functional Testing

#### Test 1: Chat Rate Limit Trigger

- [ ] **Test Senaryosu 1: Normal Kullanım**
  ```sql
  -- Test user oluştur
  INSERT INTO profiles (id, full_name) VALUES 
    ('test-user-1', 'Test User 1');
  
  -- Test chat oluştur
  INSERT INTO chats (id, listing_id) VALUES 
    ('test-chat-1', NULL);
  
  -- 50 mesaj gönder (başarılı olmalı)
  DO $$
  BEGIN
    FOR i IN 1..50 LOOP
      INSERT INTO messages (chat_id, sender_id, content)
      VALUES ('test-chat-1', 'test-user-1', 'Test message ' || i);
    END LOOP;
  END $$;
  
  -- Mesaj sayısını kontrol et
  SELECT COUNT(*) FROM messages 
  WHERE chat_id = 'test-chat-1' AND sender_id = 'test-user-1';
  -- Beklenen: 50
  ```

- [ ] **Test Senaryosu 2: Rate Limit Aşımı**
  ```sql
  -- 51 mesaj daha göndermeyi dene (başarısız olmalı)
  DO $$
  BEGIN
    FOR i IN 51..101 LOOP
      BEGIN
        INSERT INTO messages (chat_id, sender_id, content)
        VALUES ('test-chat-1', 'test-user-1', 'Test message ' || i);
      EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Expected error at message %: %', i, SQLERRM;
      END;
    END LOOP;
  END $$;
  
  -- 101. mesaj "rate_limit_exceeded" hatası vermeli
  ```

- [ ] **Test Senaryosu 3: Zaman Penceresi**
  ```sql
  -- 1 saat önceki mesajları sil
  DELETE FROM messages 
  WHERE chat_id = 'test-chat-1' 
    AND created_at < NOW() - INTERVAL '1 hour';
  
  -- Yeni mesaj gönder (başarılı olmalı)
  INSERT INTO messages (chat_id, sender_id, content)
  VALUES ('test-chat-1', 'test-user-1', 'New message after cleanup');
  ```

#### Test 2: Atomic Ban User RPC

- [ ] **Test Senaryosu 1: Normal Ban**
  ```sql
  -- Test user ve listings oluştur
  INSERT INTO profiles (id, full_name) VALUES 
    ('test-seller-1', 'Test Seller 1');
  
  INSERT INTO listings (id, seller_id, title, status) VALUES 
    ('test-listing-1', 'test-seller-1', 'Test Car 1', 'approved'),
    ('test-listing-2', 'test-seller-1', 'Test Car 2', 'approved'),
    ('test-listing-3', 'test-seller-1', 'Test Car 3', 'pending');
  
  -- Ban user
  SELECT ban_user_atomic(
    'test-seller-1'::uuid,
    'Test ban reason',
    true
  );
  
  -- Verify ban
  SELECT is_banned, ban_reason FROM profiles WHERE id = 'test-seller-1';
  -- Beklenen: is_banned = true, ban_reason = 'Test ban reason'
  
  -- Verify listings rejected
  SELECT id, status FROM listings WHERE seller_id = 'test-seller-1';
  -- Beklenen: Tüm listings status = 'rejected'
  ```

- [ ] **Test Senaryosu 2: Trust Guard Metadata Preservation**
  ```sql
  -- User'ı trust guard ile ban'le
  UPDATE profiles 
  SET is_banned = true, 
      ban_reason = '[AUTO_TRUST_GUARD] Low trust score'
  WHERE id = 'test-seller-1';
  
  -- Yeni ban ekle (metadata korunmalı)
  SELECT ban_user_atomic(
    'test-seller-1'::uuid,
    'Manual ban by admin',
    true
  );
  
  -- Verify metadata preserved
  SELECT ban_reason FROM profiles WHERE id = 'test-seller-1';
  -- Beklenen: '[AUTO_TRUST_GUARD] Low trust score\nManual ban by admin'
  ```

- [ ] **Test Senaryosu 3: Rollback Test**
  ```sql
  -- Transaction içinde ban yap ve rollback et
  BEGIN;
    SELECT ban_user_atomic(
      'test-seller-1'::uuid,
      'Test rollback',
      true
    );
  ROLLBACK;
  
  -- Verify rollback worked
  SELECT is_banned FROM profiles WHERE id = 'test-seller-1';
  -- Beklenen: is_banned = false (önceki değer)
  ```

### 4. Performance Testing

- [ ] **Trigger Performance**
  ```sql
  -- Measure trigger execution time
  EXPLAIN ANALYZE
  INSERT INTO messages (chat_id, sender_id, content)
  VALUES ('test-chat-1', 'test-user-1', 'Performance test');
  
  -- Beklenen: < 5ms overhead
  ```

- [ ] **RPC Performance**
  ```sql
  -- Measure RPC execution time
  EXPLAIN ANALYZE
  SELECT ban_user_atomic(
    'test-seller-1'::uuid,
    'Performance test',
    true
  );
  
  -- Beklenen: < 100ms for 50 listings
  ```

### 5. Cleanup

- [ ] **Test Data Temizle**
  ```sql
  -- Test verilerini sil
  DELETE FROM messages WHERE chat_id = 'test-chat-1';
  DELETE FROM chats WHERE id = 'test-chat-1';
  DELETE FROM listings WHERE seller_id = 'test-seller-1';
  DELETE FROM profiles WHERE id IN ('test-user-1', 'test-seller-1');
  ```

---

## ✅ Kabul Kriterleri

### Functional Requirements
- [x] Migration 0134 başarıyla uygulandı
- [x] Migration 0135 başarıyla uygulandı
- [x] Chat rate limit trigger çalışıyor (100 msg/hour)
- [x] Atomic ban RPC fonksiyonu çalışıyor
- [x] Trust guard metadata korunuyor
- [x] Rollback planı test edildi

### Performance Requirements
- [x] Trigger overhead < 5ms
- [x] RPC execution time < 100ms
- [x] No database locks during migration
- [x] No downtime during deployment

### Documentation Requirements
- [x] Migration execution log oluşturuldu
- [x] Test results documented
- [x] Rollback procedure verified
- [x] Performance metrics recorded

---

## 📊 Çıktılar

### 1. Migration Execution Report
```markdown
# Migration Execution Report

**Date**: [Date]
**Environment**: Production
**Executed By**: [Your Name]

## Migrations Applied
- 0134_chat_rate_limit_trigger.sql ✅
- 0135_atomic_ban_user.sql ✅

## Execution Times
- Migration 0134: [X]ms
- Migration 0135: [X]ms

## Test Results
- Chat rate limit: ✅ Passed
- Atomic ban: ✅ Passed
- Performance: ✅ Passed

## Issues Encountered
- [None or list issues]

## Rollback Status
- Rollback tested: ✅
- Rollback time: [X]ms
```

### 2. Performance Benchmark
```markdown
# Performance Benchmark

## Trigger Performance
- Baseline (no trigger): [X]ms
- With trigger: [X]ms
- Overhead: [X]ms

## RPC Performance
- 10 listings: [X]ms
- 50 listings: [X]ms
- 100 listings: [X]ms
```

### 3. Rollback Procedures
```markdown
# Rollback Procedures

## If Migration 0134 Fails
```sql
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;
DROP FUNCTION IF EXISTS check_message_rate_limit();
```

## If Migration 0135 Fails
```sql
DROP FUNCTION IF EXISTS ban_user_atomic(uuid, text, boolean);
```

## Full Rollback
```bash
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```
```

---

## 🚨 Risk Mitigation

### Risk 1: Migration Failure
**Mitigation**: 
- Backup alındı
- Staging'de test edildi
- Rollback planı hazır

### Risk 2: Performance Degradation
**Mitigation**:
- Trigger optimized (indexed queries)
- RPC uses single transaction
- Performance tested locally

### Risk 3: Data Loss
**Mitigation**:
- Atomic operations
- Transaction rollback support
- Backup available

---

## 📞 Escalation

### If Issues Arise:
1. **Minor Issues**: Document and continue
2. **Major Issues**: Rollback immediately
3. **Critical Issues**: Contact Tech Lead

### Contact Information:
- **Tech Lead**: [Name]
- **DevOps**: [Name]
- **On-Call**: [Phone]

---

## 📚 Referanslar

- `CRITICAL_FIXES_APPLIED.md` - Detaylı fix dokümantasyonu
- `AUDIT_SUMMARY.md` - Security audit özeti
- `DEPLOYMENT_CHECKLIST.md` - Deployment prosedürü
- `database/migrations/0134_chat_rate_limit_trigger.sql`
- `database/migrations/0135_atomic_ban_user.sql`

---

**Ajan**: Database Optimizer  
**Başlangıç**: [Tarih]  
**Bitiş**: [Tarih]  
**Durum**: 🔴 Bekliyor → 🟡 Devam Ediyor → ✅ Tamamlandı
