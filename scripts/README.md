# Scripts Security Guidelines

## ⚠️ SECURITY WARNING

**NEVER commit hardcoded passwords or credentials to version control.**

All scripts in this directory follow strict security guidelines.

---

## Password Handling

### ❌ WRONG (Hardcoded)

```javascript
const password = "demo123"; // NEVER DO THIS
```

### ✅ CORRECT (Environment Variable)

```javascript
const password = process.env.DEMO_USER_PASSWORD || crypto.randomBytes(16).toString("hex");
```

---

## Required Environment Variables

Add these to your `.env.local` file:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Demo Users (Optional - will generate random if not set)
DEMO_USER_PASSWORD=your_secure_password_here
```

---

## Available Scripts

### Quick Bootstrap (Recommended)

Creates demo users with secure passwords:

```bash
node scripts/quick-bootstrap.mjs
```

**Features**:

- ✅ Reads password from `DEMO_USER_PASSWORD` env var
- ✅ Generates random password if not set
- ✅ Stores role in `app_metadata` (trusted)
- ✅ Never hardcodes credentials

### Other Utility Scripts

- `seed-marketplace-references.mjs` - Seeds reference data (brands, models, cities)
- `run-migrations.mjs` - Applies database migrations
- `apply-schema-rpc.mjs` - Applies RPC functions
- `check-supabase-env.mjs` - Validates environment configuration

---

## Security Checklist

Before committing any script:

- [ ] No hardcoded passwords
- [ ] No hardcoded API keys
- [ ] No hardcoded URLs (use `NEXT_PUBLIC_APP_URL`)
- [ ] Credentials from environment variables
- [ ] Random generation as fallback
- [ ] Fail-closed error handling

---

## Removed Scripts (Security Cleanup)

The following scripts have been **permanently deleted** due to hardcoded credentials:

- ❌ `create-users.mjs` (hardcoded demo123)
- ❌ `verify-users.mjs` (hardcoded demo123)
- ❌ `test-login.mjs` (hardcoded demo123)
- ❌ `debug-auth.mjs` (hardcoded demo123)
- ❌ `create-user-admin.mjs` (hardcoded demo123)
- ❌ `create-new.mjs` (hardcoded demo123)
- ❌ `update-password.mjs` (hardcoded demo123)
- ❌ `create-fresh.mjs` (hardcoded Demo123! + exposed keys)
- ❌ `check-users.mjs` (hardcoded Demo123!)

**Use `quick-bootstrap.mjs` instead** - it's secure and follows best practices.

---

## Production Deployment

**NEVER run development scripts in production!**

For production user creation:

1. Use Supabase Dashboard
2. Use secure admin API with proper authentication
3. Generate strong random passwords
4. Send passwords via secure channel (not email)

---

## Questions?

See `SECURITY.md` in the project root for more security guidelines.
