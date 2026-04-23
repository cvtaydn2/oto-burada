import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

// Load environment variables from .env.local or .env
loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.ADMIN_EMAIL;
const newPassword = process.env.ADMIN_PASSWORD;
const confirmFlag = process.env.CONFIRM_RESET; // Must be "yes" to proceed

if (!targetEmail) {
  console.error("ADMIN_EMAIL must be provided via environment variable");
  process.exit(1);
}

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables (SUPABASE_URL or SERVICE_ROLE_KEY)");
  process.exit(1);
}

if (!newPassword) {
  console.error("ADMIN_PASSWORD must be provided via environment variable");
  process.exit(1);
}

if (newPassword.length < 12) {
  console.error("ADMIN_PASSWORD must be at least 12 characters for security.");
  process.exit(1);
}

// Production guard: require explicit confirmation flag
const isProd =
  process.env.NODE_ENV === "production" ||
  process.env.VERCEL_ENV === "production" ||
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

if (isProd && confirmFlag !== "yes") {
  console.error(
    "[SECURITY] ❌ Production reset requires CONFIRM_RESET=yes to be set explicitly.\n" +
      "  This prevents accidental execution in production environments."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function resetAdminPassword() {
  console.log(`[AUTH] Resetting password for ${targetEmail}...`);
  if (isProd) {
    console.warn(
      "[SECURITY] ⚠️  Running in PRODUCTION environment. Proceeding with explicit confirmation."
    );
  }

  try {
    // 1. Get user by email — use paginated search to avoid loading all users
    const {
      data: { users },
      error: getError,
    } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    if (getError) {
      console.error("[AUTH] ❌ Error listing users:", getError.message);
      return;
    }

    const targetUser = users.find((u) => u.email === targetEmail);
    if (!targetUser) {
      console.error(`[AUTH] ❌ User ${targetEmail} not found in database.`);
      return;
    }

    // 2. Verify the target user has admin role before resetting
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", targetUser.id)
      .single();

    if (!profile || profile.role !== "admin") {
      console.error(
        `[AUTH] ❌ User ${targetEmail} does not have admin role. Aborting to prevent accidental reset.`
      );
      process.exit(1);
    }

    // 3. Update password
    const { error } = await supabase.auth.admin.updateUserById(targetUser.id, {
      password: newPassword,
    });

    if (error) {
      console.error("[AUTH] ❌ Error updating password:", error.message);
    } else {
      console.log(`[AUTH] ✅ Password successfully reset for ${targetEmail} (role: admin)`);
    }
  } catch (err) {
    console.error("[AUTH] ❌ Fatal error during password reset:", err);
  }
}

resetAdminPassword();
