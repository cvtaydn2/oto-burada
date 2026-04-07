import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local
const envFile = fs.readFileSync(".env.local", "utf-8");
envFile.split("\n").forEach(line => {
  if (line && !line.startsWith("#")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      process.env[key] = valueParts.join("=").trim();
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Use anon key for regular operations (kept for reference, using fetch below)

async function createUser(email, password, metadata) {
  // Using the public sign up endpoint
  const response = await fetch(`${supabaseUrl}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      data: metadata
    })
  });
  
  const data = await response.json();
  return data;
}

async function signIn(email, password) {
  const response = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey
    },
    body: JSON.stringify({
      email,
      password
    })
  });
  
  const data = await response.json();
  return data;
}

async function main() {
  console.log("Creating demo users via public API...");
  
  const demoUsers = [
    { email: "admin@otoburada.demo", password: "demo123", role: "admin", fullName: "Mert Aydın", phone: "+905321112233", city: "İstanbul" },
    { email: "emre@otoburada.demo", password: "demo123", role: "user", fullName: "Emre Yılmaz", phone: "+905321234567", city: "İstanbul" },
  ];

  for (const user of demoUsers) {
    console.log(`\nTrying ${user.email}...`);
    
    // Try to sign up first
    const signupResult = await createUser(user.email, user.password, {
      full_name: user.fullName,
      role: user.role,
      phone: user.phone,
      city: user.city
    });
    
    console.log("Signup result:", signupResult);
    
    // Try to sign in
    const signinResult = await signIn(user.email, user.password);
    console.log("Signin result:", signinResult.error ? signinResult.error : "✅ Login successful!");
  }
}

main().catch(console.error);