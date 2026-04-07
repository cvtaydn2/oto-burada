import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  console.log("Creating user with admin API...");
  
  // Create user with admin API
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@otoburada.demo",
    password: "demo123",
    email_confirm: true,
    user_metadata: {
      full_name: "Mert Aydın",
      role: "admin",
      phone: "+905321112233",
      city: "İstanbul"
    }
  });

  console.log("Create result:", { data: data?.user?.id, error: error?.message });

  if (data?.user) {
    // Test login immediately
    console.log("\nTesting login...");
    const { data: loginData, error: loginError } = await supabaseAdmin.auth.signInWithPassword({
      email: "admin@otoburada.demo",
      password: "demo123"
    });

    if (loginError) {
      console.log("Login error:", loginError.message);
    } else {
      console.log("✅ Login successful!");
      console.log("User ID:", loginData.user.id);
    }
  }
}

main();