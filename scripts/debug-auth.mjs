import { createClient } from "@supabase/supabase-js";
import fetch from "node-fetch";

const SUPABASE_URL = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";

async function testLogin(email, password) {
  console.log(`Testing login for: ${email}`);
  
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (data.access_token) {
    console.log("✅ Login successful!");
    console.log("User ID:", data.user?.id);
    console.log("Email:", data.user?.email);
    return data;
  } else {
    console.log("❌ Login failed:");
    console.log(data);
    return null;
  }
}

async function checkUserExists(email) {
  // Use the auth API to check if user exists
  const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "GET",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`
    }
  });
  
  const data = await response.json();
  const users = data.users || [];
  const user = users.find(u => u.email === email);
  
  if (user) {
    console.log(`User exists: ${email}, ID: ${user.id}`);
    console.log("User metadata:", user.user_metadata);
    console.log("App metadata:", user.app_metadata);
  } else {
    console.log(`User NOT found: ${email}`);
  }
  
  return user;
}

async function main() {
  console.log("=== Checking users in Supabase ===\n");
  
  await checkUserExists("admin@otoburada.demo");
  await checkUserExists("emre@otoburada.demo");
  
  console.log("\n=== Testing login ===\n");
  
  const result = await testLogin("admin@otoburada.demo", "demo123");
  
  if (!result) {
    console.log("\n⚠️ Login failed. Trying to create user again...");
    
    // Create user via public signup
    const signupResponse = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        email: "admin@otoburada.demo",
        password: "demo123",
        data: {
          full_name: "Mert Aydın",
          role: "admin",
          phone: "+905321112233",
          city: "İstanbul"
        }
      })
    });
    
    const signupData = await signupResponse.json();
    console.log("Signup response:", signupData);
  }
}

main();