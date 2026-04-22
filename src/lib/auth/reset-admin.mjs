import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "../../../scripts/load-local-env.mjs";

// Load environment variables from .env.local or .env
loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const targetEmail = process.env.ADMIN_EMAIL || "admin@otoburada.demo";
const newPassword = process.env.ADMIN_PASSWORD;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables (SUPABASE_URL or SERVICE_ROLE_KEY)");
  process.exit(1);
}

if (!newPassword) {
  console.error("ADMIN_PASSWORD must be provided via environment variable");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  const isProd = process.env.NODE_ENV === "production";
  console.log(`[AUTH] Resetting password for ${targetEmail}...`);
  
  try {
    // 1. Get user by email
    const { data: { users }, error: getError } = await supabase.auth.admin.listUsers();
    if (getError) {
      console.error("[AUTH] ❌ Error listing users:", getError.message);
      return;
    }
    
    const targetUser = users.find(u => u.email === targetEmail);
    if (!targetUser) {
      console.error(`[AUTH] ❌ User ${targetEmail} not found in database.`);
      return;
    }
    
    // 2. Update password
    const { error } = await supabase.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    );
    
    if (error) {
      console.error("[AUTH] ❌ Error updating password:", error.message);
    } else {
      console.log(`[AUTH] ✅ Password successfully reset for ${targetEmail}`);
      if (isProd) {
        console.warn("[SECURITY] ⚠️  Admin password reset in PRODUCTION environment.");
      }
    }
  } catch (err) {
    console.error("[AUTH] ❌ Fatal error during password reset:", err);
  }
}

resetAdminPassword();
