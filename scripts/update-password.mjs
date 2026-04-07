import fetch from "node-fetch";

const SUPABASE_URL = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";
const SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZ2N4aHJodGZod2F4emh5cmtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MjA2ODcsImV4cCI6MjA5MDk5NjY4N30.1CVYQ6R5wCT6LG7EyAzD6X-Q3RSbg9dfs55y1LBoZ3c";

// Admin client
const supabaseAdmin = (url, key) => ({
  auth: {
    admin: {
      updateUser: async (userId, data) => {
        const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "apikey": key,
            "Authorization": `Bearer ${key}`
          },
          body: JSON.stringify(data)
        });
        return res.json();
      },
      getUser: async (userId) => {
        const res = await fetch(`${url}/auth/v1/admin/users/${userId}`, {
          headers: {
            "apikey": key,
            "Authorization": `Bearer ${key}`
          }
        });
        return res.json();
      }
    }
  }
});

async function main() {
  const userId = "fde3c732-6bdc-4eb4-9c4c-471040b94e7d";
  
  console.log("Updating password for user:", userId);
  
  // Update password using admin API
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "apikey": SERVICE_KEY,
      "Authorization": `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify({
      password: "demo123"
    })
  });
  
  const data = await res.json();
  
  if (data.id) {
    console.log("✅ Password updated successfully!");
    console.log("User:", data.email);
    
    // Test login
    console.log("\nTesting login...");
    const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify({
        email: "admin@otoburada.demo",
        password: "demo123"
      })
    });
    
    const loginData = await loginRes.json();
    
    if (loginData.access_token) {
      console.log("✅ Login test PASSED!");
    } else {
      console.log("❌ Login test failed:", loginData);
    }
  } else {
    console.log("❌ Failed:", data);
  }
}

main();