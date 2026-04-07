import fetch from "node-fetch";

const SUPABASE_URL = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";

async function main() {
  console.log("=== Creating users properly ===\n");

  // Step 1: Create admin user
  console.log("1. Creating admin user...");
  const adminSignup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY
    },
    body: JSON.stringify({
      email: "admin@otoburada.demo",
      password: "Demo123!",
      data: { full_name: "Admin User", role: "admin" }
    })
  });
  
  const adminData = await adminSignup.json();
  console.log("Admin signup:", adminData.id ? "✅ Created" : "❌", adminData);

  // Step 2: Create regular user
  console.log("\n2. Creating regular user...");
  const userSignup = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY
    },
    body: JSON.stringify({
      email: "user@otoburada.demo",
      password: "Demo123!",
      data: { full_name: "Test User", role: "user" }
    })
  });
  
  const userData = await userSignup.json();
  console.log("User signup:", userData.id ? "✅ Created" : "❌", userData);

  // Step 3: Test login with new password
  console.log("\n3. Testing login with password 'Demo123!'...");
  
  const adminLogin = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY
    },
    body: JSON.stringify({
      email: "admin@otoburada.demo",
      password: "Demo123!"
    })
  });
  
  const adminLoginData = await adminLogin.json();
  
  if (adminLoginData.access_token) {
    console.log("✅ Login successful with new password!");
    console.log("Token:", adminLoginData.access_token.substring(0, 50) + "...");
  } else {
    console.log("❌ Login failed:", adminLoginData);
  }
}

main();