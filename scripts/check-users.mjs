import fetch from "node-fetch";

const SUPABASE_URL = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";

async function testAuth() {
  // First, let's see what users exist
  console.log("Checking existing users...");
  
  const listRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    }
  });
  
  const listData = await listRes.json();
  console.log("Total users:", listData.users?.length || 0);
  
  if (listData.users?.length > 0) {
    console.log("\nExisting users:");
    listData.users.forEach(u => {
      console.log(`  - ${u.email} (ID: ${u.id})`);
    });
  }
  
  // Try to get the user by email
  console.log("\nLooking for admin@otoburada.demo...");
  const user = listData.users?.find(u => u.email === "admin@otoburada.demo");
  
  if (user) {
    console.log("Found user:", user.id);
    console.log("Email confirmed:", user.email_confirmed_at);
    console.log("Created at:", user.created_at);
    
    // Try to generate a login directly
    console.log("\nAttempting direct login...");
    
    // Maybe we need to use the generateLink API?
    console.log("\nTrying password login one more time...");
    
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        email: "admin@otoburada.demo",
        password: "Demo123!"
      })
    });
    
    const loginData = await loginRes.json();
    console.log("Login response:", loginData.access_token ? "SUCCESS" : "FAILED");
    
    if (!loginData.access_token) {
      console.log("Full response:", JSON.stringify(loginData, null, 2));
    }
  }
}

testAuth();