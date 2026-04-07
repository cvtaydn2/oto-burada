import fetch from "node-fetch";

const SUPABASE_URL = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";

async function main() {
  console.log("=== Testing Auth Flow ===\n");
  
  // Step 1: Register a new user
  console.log("1. Registering new user...");
  const signupRes = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      email: "otoburada@test.com",
      password: "Test123456",
      data: { name: "Test User" }
    })
  });
  
  const signupData = await signupRes.json();
  console.log("Signup response:", signupData.id ? "✅ User created" : "❌ Failed");
  console.log("User ID:", signupData.id);
  
  if (!signupData.id) {
    console.log("Error:", signupData);
    return;
  }

  // Wait a moment
  await new Promise(r => setTimeout(r, 500));
  
  // Step 2: Try to login
  console.log("\n2. Testing login...");
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      email: "otoburada@test.com",
      password: "Test123456"
    })
  });
  
  const loginData = await loginRes.json();
  
  if (loginData.access_token) {
    console.log("✅ Login successful!");
    console.log("Token:", loginData.access_token.substring(0, 30) + "...");
    
    // Verify the token works
    console.log("\n3. Verifying session...");
    const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${loginData.access_token}`
      }
    });
    
    const verifyData = await verifyRes.json();
    console.log("Session valid for:", verifyData.email);
  } else {
    console.log("❌ Login failed");
    console.log("Response:", JSON.stringify(loginData, null, 2));
  }
}

main();