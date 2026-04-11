const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error("SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetAdminPassword() {
  console.log("Resetting password for admin@otoburada.demo...");
  
  // 1. Get user by email
  const { data: { users }, error: getError } = await supabase.auth.admin.listUsers();
  if (getError) {
    console.error("Error listing users:", getError);
    return;
  }
  
  const targetUser = users.find(u => u.email === "admin@otoburada.demo");
  if (!targetUser) {
    console.error("User not found");
    return;
  }
  
  // 2. Update password
  const { data, error } = await supabase.auth.admin.updateUserById(
    targetUser.id,
    { password: "password123" }
  );
  
  if (error) {
    console.error("Error updating password:", error);
  } else {
    console.log("Password successfully reset to: password123");
  }
}

resetAdminPassword();
