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
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkAndCreateUsers() {
  console.log("Checking if tables exist...");
  
  // Try to select from profiles
  try {
    const { error } = await supabaseAdmin.from("profiles").select("*").limit(1);
    console.log("Profiles table exists, error:", error?.message || "none");
  } catch (e) {
    console.log("Profiles table doesn't exist or error:", e.message);
  }

  console.log("\nCreating demo users...");
  
  const demoUsers = [
    { email: "admin@otoburada.demo", password: "demo123", role: "admin", fullName: "Mert Aydın", phone: "+905321112233", city: "İstanbul" },
    { email: "emre@otoburada.demo", password: "demo123", role: "user", fullName: "Emre Yılmaz", phone: "+905321234567", city: "İstanbul" },
    { email: "ayse@otoburada.demo", password: "demo123", role: "user", fullName: "Ayşe Demir", phone: "+905339876543", city: "Ankara" },
    { email: "burak@otoburada.demo", password: "demo123", role: "user", fullName: "Burak Kaya", phone: "+905359998877", city: "İzmir" },
  ];

  for (const user of demoUsers) {
    try {
      // First check if user exists by trying to get them
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
      const existingUser = existingUsers?.users?.find(u => u.email === user.email);
      
      if (existingUser) {
        console.log(`✓ User exists: ${user.email} (ID: ${existingUser.id})`);
        
        // Try to insert profile if not exists
        try {
          await supabaseAdmin.from("profiles").upsert({
            id: existingUser.id,
            email: user.email,
            full_name: user.fullName,
            phone: user.phone,
            city: user.city,
            role: user.role
          }, { onConflict: 'id' });
          console.log(`  → Profile synced`);
        } catch (profileError) {
          console.log(`  → Profile sync error (may be RLS):`, profileError.message);
        }
      } else {
        // Create new user
        const { data, error } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { 
            full_name: user.fullName,
            role: user.role,
            phone: user.phone,
            city: user.city
          }
        });
        
        if (data?.user && !error) {
          console.log(`✅ Created user: ${user.email} (ID: ${data.user.id})`);
          
          // Create profile
          try {
            await supabaseAdmin.from("profiles").insert({
              id: data.user.id,
              email: user.email,
              full_name: user.fullName,
              phone: user.phone,
              city: user.city,
              role: user.role
            });
          } catch (e) {
            console.log(`  → Profile creation error:`, e.message);
          }
        } else if (error?.message?.includes("already been registered")) {
          console.log(`⚠ User says exists but not in list: ${user.email}`);
        } else {
          console.log(`❌ Error creating ${user.email}:`, error?.message || "unknown error");
        }
      }
    } catch (e) {
      console.log(`❌ Exception for ${user.email}:`, e.message);
    }
  }

  // Test login
  console.log("\nTesting login...");
  const { data: testAuth, error: testError } = await supabaseAdmin.auth.signInWithPassword({
    email: "admin@otoburada.demo",
    password: "demo123"
  });
  
  if (testError) {
    console.log("❌ Login test failed:", testError.message);
  } else {
    console.log("✅ Login test passed! User ID:", testAuth.user?.id);
  }
}

checkAndCreateUsers().catch(console.error);
