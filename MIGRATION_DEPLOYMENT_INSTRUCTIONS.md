# 🚀 Migration Deployment Instructions - TASK-64

**Date**: 2025-01-XX  
**Status**: Ready for Manual Deployment  
**Method**: Supabase Dashboard SQL Editor

---

## 📋 Overview

Due to Supabase API limitations, migrations must be applied manually via the Supabase Dashboard SQL Editor. This is the **safest and most reliable method** for production deployments.

**Migrations to Apply**:
1. Migration 0134: Chat Rate Limit Trigger
2. Migration 0135: Atomic Ban User RPC

**Estimated Time**: 5 minutes  
**Risk Level**: Medium  
**Rollback Available**: Yes

---

## 🔐 Pre-Deployment Checklist

### Step 1: Create Backup (CRITICAL)

1. Go to: https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/database/backups
2. Click "Create Backup" or verify automatic backup exists
3. Note the backup timestamp for rollback reference

**Status**: ⏳ Pending

---

### Step 2: Verify Database Connection

1. Go to: https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql
2. Run test query:
   ```sql
   SELECT current_database(), current_user, version();
   ```
3. Verify connection is successful

**Status**: ⏳ Pending

---

## 🚀 Migration Deployment

### Migration 1: Chat Rate Limit Trigger (0134)

#### Step 1: Open SQL Editor

1. Go to: https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql
2. Click "New Query"

#### Step 2: Paste Migration SQL

Copy and paste the following SQL:

```sql
-- ── SECURITY FIX: Issue CHAT-01 - Database-Level Rate Limiting ──────────────
-- Previous application-level rate limiting had race condition vulnerability.
-- This trigger enforces rate limit atomically at database level.

CREATE OR REPLACE FUNCTION check_message_rate_limit()
RETURNS TRIGGER AS $$
DECLARE 
  v_count int;
  v_one_hour_ago timestamptz;
BEGIN
  v_one_hour_ago := NOW() - INTERVAL '1 hour';
  
  SELECT COUNT(*) INTO v_count 
  FROM messages
  WHERE sender_id = NEW.sender_id 
    AND chat_id = NEW.chat_id
    AND created_at > v_one_hour_ago
    AND deleted_at IS NULL;
  
  IF v_count >= 100 THEN
    RAISE EXCEPTION 'rate_limit_exceeded: Maximum 100 messages per hour per chat';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;

-- Create trigger
CREATE TRIGGER enforce_message_rate_limit
  BEFORE INSERT ON messages
  FOR EACH ROW 
  EXECUTE FUNCTION check_message_rate_limit();

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_message_rate_limit() TO authenticated;
```

#### Step 3: Execute Migration

1. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
2. Wait for execution to complete
3. Verify success message appears

**Expected Output**:
```
Success. No rows returned
```

#### Step 4: Verify Migration

Run verification query:

```sql
-- Check function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'check_message_rate_limit';

-- Check trigger exists
SELECT tgname, tgrelid::regclass, tgfoid::regproc
FROM pg_trigger
WHERE tgname = 'enforce_message_rate_limit';
```

**Expected Output**:
- Function: `check_message_rate_limit` exists
- Trigger: `enforce_message_rate_limit` on `messages` table

#### Step 5: Record Migration

```sql
-- Record migration in tracking table
INSERT INTO public._migrations (name, checksum, executed_at)
VALUES (
  '0134_chat_rate_limit_trigger.sql',
  'manual_deployment_' || extract(epoch from now())::text,
  now()
)
ON CONFLICT (name) DO NOTHING;
```

**Status**: ⏳ Pending

---

### Migration 2: Atomic Ban User RPC (0135)

#### Step 1: Open New SQL Query

1. In SQL Editor, click "New Query"

#### Step 2: Paste Migration SQL

Copy and paste the following SQL:

```sql
-- ── SECURITY FIX: Issue ADMIN-02 - Atomic User Ban with Listing Rejection ──
-- Previous implementation had two separate operations that could fail independently.
-- This RPC ensures atomicity and preserves trust guard metadata.

CREATE OR REPLACE FUNCTION ban_user_atomic(
  p_user_id uuid,
  p_reason text,
  p_preserve_metadata boolean DEFAULT true
)
RETURNS jsonb AS $$
DECLARE
  v_current_ban_reason text;
  v_final_ban_reason text;
  v_listings_rejected int;
BEGIN
  -- Get current ban reason to preserve trust guard metadata if requested
  IF p_preserve_metadata THEN
    SELECT ban_reason INTO v_current_ban_reason
    FROM profiles
    WHERE id = p_user_id;
    
    -- If current ban_reason contains trust guard metadata, append new reason
    IF v_current_ban_reason IS NOT NULL AND v_current_ban_reason LIKE '%[AUTO_TRUST_GUARD]%' THEN
      v_final_ban_reason := v_current_ban_reason || E'\n' || p_reason;
    ELSE
      v_final_ban_reason := p_reason;
    END IF;
  ELSE
    v_final_ban_reason := p_reason;
  END IF;

  -- Update profile
  UPDATE profiles 
  SET 
    is_banned = true,
    ban_reason = v_final_ban_reason,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Reject all active listings atomically
  WITH rejected AS (
    UPDATE listings 
    SET status = 'rejected'
    WHERE seller_id = p_user_id 
      AND status NOT IN ('rejected', 'archived')
    RETURNING id
  )
  SELECT COUNT(*) INTO v_listings_rejected FROM rejected;

  RETURN jsonb_build_object(
    'success', true,
    'listings_rejected', v_listings_rejected
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION ban_user_atomic(uuid, text, boolean) TO authenticated;
```

#### Step 3: Execute Migration

1. Click "Run" (or press Ctrl+Enter / Cmd+Enter)
2. Wait for execution to complete
3. Verify success message appears

**Expected Output**:
```
Success. No rows returned
```

#### Step 4: Verify Migration

Run verification query:

```sql
-- Check function exists
SELECT proname, proargtypes, prorettype::regtype
FROM pg_proc 
WHERE proname = 'ban_user_atomic';

-- Test function (dry run with non-existent user)
SELECT ban_user_atomic(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Test verification',
  true
);
```

**Expected Output**:
- Function: `ban_user_atomic` exists with correct signature
- Test: Returns `{"success": true, "listings_rejected": 0}`

#### Step 5: Record Migration

```sql
-- Record migration in tracking table
INSERT INTO public._migrations (name, checksum, executed_at)
VALUES (
  '0135_atomic_ban_user.sql',
  'manual_deployment_' || extract(epoch from now())::text,
  now()
)
ON CONFLICT (name) DO NOTHING;
```

**Status**: ⏳ Pending

---

## 🧪 Post-Deployment Testing

### Test 1: Chat Rate Limit Trigger

#### Quick Smoke Test

```sql
-- Create test chat (use existing listing and users)
DO $$
DECLARE
  v_test_chat_id uuid := gen_random_uuid();
  v_test_user_id uuid;
  v_test_listing_id uuid;
  v_seller_id uuid;
BEGIN
  -- Get a real user and listing
  SELECT id INTO v_test_user_id FROM profiles WHERE role = 'user' LIMIT 1;
  SELECT id, seller_id INTO v_test_listing_id, v_seller_id FROM listings WHERE status = 'approved' LIMIT 1;
  
  -- Create test chat
  INSERT INTO chats (id, listing_id, buyer_id, seller_id)
  VALUES (v_test_chat_id, v_test_listing_id, v_test_user_id, v_seller_id);
  
  -- Send 5 test messages (should succeed)
  FOR i IN 1..5 LOOP
    INSERT INTO messages (chat_id, sender_id, content)
    VALUES (v_test_chat_id, v_test_user_id, 'Test message ' || i);
  END LOOP;
  
  RAISE NOTICE 'Test passed: 5 messages sent successfully';
  
  -- Cleanup
  DELETE FROM messages WHERE chat_id = v_test_chat_id;
  DELETE FROM chats WHERE id = v_test_chat_id;
  
  RAISE NOTICE 'Test cleanup completed';
END $$;
```

**Expected Output**:
```
NOTICE: Test passed: 5 messages sent successfully
NOTICE: Test cleanup completed
```

**Status**: ⏳ Pending

---

### Test 2: Atomic Ban User RPC

#### Quick Smoke Test

```sql
-- Test with non-existent user (safe test)
SELECT ban_user_atomic(
  '00000000-0000-0000-0000-000000000000'::uuid,
  'Test ban - should affect 0 listings',
  true
);
```

**Expected Output**:
```json
{
  "success": true,
  "listings_rejected": 0
}
```

**Status**: ⏳ Pending

---

## 📊 Performance Verification

### Check Trigger Performance

```sql
-- Check trigger execution count
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserts,
  n_tup_upd as updates
FROM pg_stat_user_tables
WHERE tablename = 'messages';
```

### Check RPC Performance

```sql
-- Check function call statistics (if pg_stat_statements enabled)
SELECT 
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE query LIKE '%ban_user_atomic%'
LIMIT 5;
```

**Status**: ⏳ Pending

---

## 🚨 Rollback Procedures

### If Migration 0134 Needs Rollback

```sql
-- Remove trigger and function
DROP TRIGGER IF EXISTS enforce_message_rate_limit ON messages;
DROP FUNCTION IF EXISTS check_message_rate_limit();

-- Remove migration record
DELETE FROM public._migrations WHERE name = '0134_chat_rate_limit_trigger.sql';
```

### If Migration 0135 Needs Rollback

```sql
-- Remove function
DROP FUNCTION IF EXISTS ban_user_atomic(uuid, text, boolean);

-- Remove migration record
DELETE FROM public._migrations WHERE name = '0135_atomic_ban_user.sql';
```

---

## ✅ Deployment Completion Checklist

- [ ] Backup created and verified
- [ ] Migration 0134 applied successfully
- [ ] Migration 0134 verified (function + trigger exist)
- [ ] Migration 0134 recorded in _migrations table
- [ ] Migration 0135 applied successfully
- [ ] Migration 0135 verified (function exists)
- [ ] Migration 0135 recorded in _migrations table
- [ ] Smoke tests passed
- [ ] Performance metrics checked
- [ ] No errors in Supabase logs
- [ ] Deployment report updated

---

## 📞 Support

If you encounter any issues:

1. **Check Supabase Logs**: Dashboard > Logs > Postgres Logs
2. **Review Error Messages**: Copy full error text
3. **Rollback if Critical**: Use rollback procedures above
4. **Document Issues**: Update MIGRATION_DEPLOYMENT_REPORT.md

---

## 📚 Next Steps

After successful deployment:

1. Update `MIGRATION_DEPLOYMENT_REPORT.md` with results
2. Monitor Sentry for any new errors
3. Check application logs for rate limit triggers
4. Verify admin ban functionality in production
5. Update `PROGRESS.md` with Phase 28.5 completion

---

**Prepared By**: Database Optimizer (Kiro AI)  
**Date**: 2025-01-XX  
**Status**: Ready for Deployment

