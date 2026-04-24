# OtoBurada Migration Management Guide

## Overview

This guide covers the enhanced migration management system for OtoBurada, designed to handle the existing 69+ migrations and provide a robust foundation for future database changes.

## Migration System Features

### ✅ **Enhanced Migration Manager**
- **Idempotent Migrations**: Safe to run multiple times
- **Transaction-based Execution**: Atomic operations with rollback support
- **UP/DOWN Migration Pattern**: Proper rollback capabilities
- **Migration Validation**: Syntax and integrity checking
- **Comprehensive Logging**: Detailed execution tracking
- **Checksum Verification**: Detect modified migrations

### ✅ **Migration Lifecycle Management**
- **Creation**: Template-based migration generation
- **Validation**: Pre-execution checks and warnings
- **Execution**: Transaction-safe application
- **Rollback**: Automated rollback capabilities
- **Status Tracking**: Complete migration history

### ✅ **Consolidation Tools**
- **Baseline Creation**: Consolidate existing migrations
- **Backup & Restore**: Safe migration management
- **Legacy Support**: Backward compatibility

## Quick Start

### 1. Check Migration Status
```bash
npm run db:migrate:status
```

### 2. Create New Migration
```bash
# General migration
npm run db:migrate:create add_new_feature

# Specific type migrations
npm run db:migrate:create add_user_table table
npm run db:migrate:create add_email_column column
npm run db:migrate:create optimize_queries index
```

### 3. Apply Migrations
```bash
npm run db:migrate
```

### 4. Validate Migrations
```bash
npm run db:migrate:validate
```

### 5. Rollback Migration (if needed)
```bash
npm run db:migrate:rollback 0070_migration_name.sql
```

## Migration File Structure

### UP/DOWN Pattern
All new migrations should follow this pattern:

```sql
-- Description of what this migration does
-- UP
CREATE TABLE IF NOT EXISTS public.new_table (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_new_table_name ON public.new_table(name);

-- DOWN
DROP INDEX IF EXISTS public.idx_new_table_name;
DROP TABLE IF EXISTS public.new_table;
```

### Migration Types

#### 1. Table Creation
```sql
-- UP
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- DOWN
DROP TABLE IF EXISTS public.users;
```

#### 2. Column Addition
```sql
-- UP
ALTER TABLE public.listings 
ADD COLUMN IF NOT EXISTS priority_score integer DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_listings_priority_score 
ON public.listings(priority_score);

-- DOWN
DROP INDEX IF EXISTS public.idx_listings_priority_score;
ALTER TABLE public.listings 
DROP COLUMN IF EXISTS priority_score;
```

#### 3. Function Creation
```sql
-- UP
CREATE OR REPLACE FUNCTION public.calculate_trust_score(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Function logic here
  RETURN 100;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_trust_score(uuid) TO authenticated;

-- DOWN
DROP FUNCTION IF EXISTS public.calculate_trust_score(uuid);
```

#### 4. RLS Policies
```sql
-- UP
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_can_read_own_messages" ON public.messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "users_can_insert_messages" ON public.messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- DOWN
DROP POLICY IF EXISTS "users_can_read_own_messages" ON public.messages;
DROP POLICY IF EXISTS "users_can_insert_messages" ON public.messages;
```

## Advanced Usage

### Migration Consolidation

For projects with many migrations (like our 69+ files), you can consolidate them:

```bash
# Dry run to see what would happen
npm run db:migrate:consolidate -- --dry-run

# Actually consolidate (keeps originals by default)
npm run db:migrate:consolidate

# Consolidate and remove originals
npm run db:migrate:consolidate -- --remove-originals
```

### Migration Validation

Before applying migrations in production:

```bash
# Validate all migrations
npm run db:migrate:validate

# Check migration status
npm run db:migrate:status
```

### Rollback Strategies

#### Single Migration Rollback
```bash
npm run db:migrate:rollback 0070_add_feature.sql
```

#### Multiple Migration Rollback
For rolling back multiple migrations, you'll need to rollback in reverse order:

```bash
npm run db:migrate:rollback 0072_latest_migration.sql
npm run db:migrate:rollback 0071_previous_migration.sql
npm run db:migrate:rollback 0070_target_migration.sql
```

## Best Practices

### 1. **Always Use Transactions**
The migration system automatically wraps migrations in transactions, but be aware of operations that can't be rolled back (like `DROP DATABASE`).

### 2. **Test Migrations Locally**
```bash
# Test on local database first
npm run db:migrate:validate
npm run db:migrate
```

### 3. **Use IF EXISTS/IF NOT EXISTS**
Always use conditional statements to make migrations idempotent:

```sql
-- Good
CREATE TABLE IF NOT EXISTS public.new_table (...);
ALTER TABLE public.existing_table ADD COLUMN IF NOT EXISTS new_column text;
DROP INDEX IF EXISTS public.old_index;

-- Bad
CREATE TABLE public.new_table (...);  -- Fails if table exists
ALTER TABLE public.existing_table ADD COLUMN new_column text;  -- Fails if column exists
```

### 4. **Include Proper DOWN Migrations**
Always provide rollback SQL in the DOWN section:

```sql
-- UP
ALTER TABLE public.listings ADD COLUMN featured_until timestamptz;

-- DOWN
ALTER TABLE public.listings DROP COLUMN IF EXISTS featured_until;
```

### 5. **Use Descriptive Names**
Migration names should clearly describe what they do:

```bash
# Good
0070_add_user_verification_status.sql
0071_create_payment_webhooks_table.sql
0072_optimize_listings_search_index.sql

# Bad
0070_update.sql
0071_fix.sql
0072_changes.sql
```

### 6. **Production Safety**
The system warns about dangerous operations in production:
- `DROP TABLE`
- `DROP DATABASE`
- `TRUNCATE`
- `DELETE ... WHERE 1=1`

## Migration Tracking

### Migration Table Structure
```sql
CREATE TABLE public._migrations (
  id serial PRIMARY KEY,
  name text UNIQUE NOT NULL,
  checksum text NOT NULL,
  executed_at timestamptz DEFAULT now(),
  execution_time_ms integer,
  rollback_sql text
);
```

### Migration Status
- **Applied**: Migration has been executed successfully
- **Pending**: Migration file exists but hasn't been applied
- **Modified**: Migration file has been changed after being applied (error)

## Troubleshooting

### Common Issues

#### 1. **Migration Already Applied**
```
Error: Migration 0070_feature.sql has already been applied
```
**Solution**: Check if the migration was actually applied or if there's a naming conflict.

#### 2. **Modified Migration**
```
Error: Migration 0070_feature.sql has been modified after being applied
```
**Solution**: This is a safety check. If you need to modify an applied migration, create a new migration instead.

#### 3. **Missing Rollback SQL**
```
Error: Migration 0070_feature.sql has no rollback SQL defined
```
**Solution**: Add a proper DOWN section to your migration.

#### 4. **Transaction Rollback**
```
Error: Migration failed: syntax error at or near "INVALID"
```
**Solution**: The migration was rolled back automatically. Fix the SQL and try again.

### Recovery Procedures

#### 1. **Restore from Backup**
If consolidation goes wrong:
```bash
node scripts/consolidate-migrations.mjs restore database/migrations-backup/backup-2026-04-24T10-30-00-000Z
```

#### 2. **Manual Migration Fix**
If a migration is stuck:
```sql
-- Check migration status
SELECT * FROM public._migrations ORDER BY executed_at DESC;

-- Manually mark migration as not applied (use with caution)
DELETE FROM public._migrations WHERE name = 'problematic_migration.sql';
```

#### 3. **Reset Migration State**
In development only:
```sql
-- WARNING: This will reset all migration tracking
DROP TABLE IF EXISTS public._migrations;
```

## Integration with Supabase CLI

### Future Migration to Supabase CLI

When ready to migrate to Supabase's native migration system:

1. **Initialize Supabase CLI**:
```bash
supabase init
```

2. **Generate Current Schema**:
```bash
supabase db dump --schema-only > supabase/migrations/0001_initial_schema.sql
```

3. **Sync with Remote**:
```bash
supabase db push
```

### Supabase CLI Commands
```bash
# Create new migration
supabase migration new add_feature

# Apply migrations
supabase db push

# Reset local database
supabase db reset

# Generate types
supabase gen types typescript --local > src/types/supabase.ts
```

## Environment Setup

### Required Environment Variables
```bash
# Database connection
SUPABASE_DB_URL=postgresql://user:pass@host:port/database

# Optional: Custom psql path
PSQL_PATH=/usr/local/bin/psql
```

### Development vs Production

#### Development
- Use `npm run db:migrate` freely
- Test rollbacks regularly
- Use consolidation tools as needed

#### Production
- Always validate migrations first: `npm run db:migrate:validate`
- Test on staging environment
- Have rollback plan ready
- Monitor migration execution times
- Consider maintenance windows for large migrations

## Performance Considerations

### Large Migrations
For migrations that affect many rows:

```sql
-- Use batched updates for large tables
DO $$
DECLARE
    batch_size INTEGER := 10000;
    processed INTEGER := 0;
BEGIN
    LOOP
        UPDATE public.large_table 
        SET new_column = 'default_value'
        WHERE id IN (
            SELECT id FROM public.large_table 
            WHERE new_column IS NULL 
            LIMIT batch_size
        );
        
        GET DIAGNOSTICS processed = ROW_COUNT;
        EXIT WHEN processed = 0;
        
        RAISE NOTICE 'Processed % rows', processed;
        COMMIT;
    END LOOP;
END $$;
```

### Index Creation
For large tables, create indexes concurrently:

```sql
-- UP
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_large_table_column 
ON public.large_table(column_name);

-- DOWN
DROP INDEX IF EXISTS public.idx_large_table_column;
```

## Monitoring and Alerts

### Migration Metrics
Track these metrics in production:
- Migration execution time
- Failed migration count
- Rollback frequency
- Database size changes

### Alerting
Set up alerts for:
- Migration failures
- Long-running migrations (>5 minutes)
- Rollback events
- Schema drift detection

---

## Summary

The enhanced migration system provides:
- ✅ **Robust Migration Management**: Transaction-safe with rollback support
- ✅ **Developer Experience**: Easy creation, validation, and status tracking
- ✅ **Production Safety**: Validation, warnings, and comprehensive logging
- ✅ **Legacy Support**: Handles existing 69+ migrations gracefully
- ✅ **Future-Proof**: Compatible with Supabase CLI migration path

For questions or issues, refer to the troubleshooting section or contact the development team.