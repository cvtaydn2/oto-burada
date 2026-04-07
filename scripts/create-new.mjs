import fetch from "node-fetch";

const url = "https://yagcxhrhtfhwaxzhyrkj.supabase.co";
const key = "sb_publishable_mCD2p3EALEO77pJH5mqFBw_aIghE08o";

async function main() {
  // Try to create a fresh user
  console.log("Creating new user via public signup...");
  
  const signupRes = await fetch(`${url}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": key,
      "Authorization": `Bearer ${key}`
    },
    body: JSON.stringify({
      email: "newadmin@test.com",
      password: "demo123",
      data: {
        role: "admin",
        full_name: "New Admin"
      }
    })
  });
  
  const signupData = await signupRes.json();
  console.log("Signup:", signupData.id ? "✅ Created" : "❌ Failed", signupData.msg || "");
  
  if (signupData.id) {
    // Try login
    console.log("\nTesting login...");
    const loginRes = await fetch(`${url}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": key,
        "Authorization": `Bearer ${key}`
      },
      body: JSON.stringify({
        email: "newadmin@test.com",
        password: "demo123"
      })
    });
    
    const loginData = await loginRes.json();
    console.log("Login:", loginData.access_token ? "✅ SUCCESS" : "❌ FAILED");
  }
}

main();