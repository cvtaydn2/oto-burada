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
  console.log(`Resetting password for ${targetEmail}...`);
  
  // 1. Get user by email
  const { data: { users }, error: getError } = await supabase.auth.admin.listUsers();
  if (getError) {
    console.error("Error listing users:", getError);
    return;
  }
  
  const targetUser = users.find(u => u.email === targetEmail);
  if (!targetUser) {
    console.error(`User ${targetEmail} not found`);
    return;
  }
  
  // 2. Update password
  const { error } = await supabase.auth.admin.updateUserById(
    targetUser.id,
    { password: newPassword }
  );
  
  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log(`Password successfully reset for ${targetEmail}`);
  }
}

resetAdminPassword();
