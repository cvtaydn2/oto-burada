import { createClient } from "@supabase/supabase-js";
import fs from "fs";

// Load .env.local manually
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
  console.error("Missing required environment variables");
  process.exit(1);
}

// Use service role key directly for admin operations
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createTables() {
  console.log("Creating tables via SQL...");

  // Since we can't execute raw SQL easily, let's use the Supabase JS client directly
  // Insert empty row first to create table
  try {
    // Try to insert - this will fail but might create the table structure
    await supabaseAdmin.from("profiles").select("*").limit(1);
  } catch {
    console.log("Note: Tables need to be created in Supabase dashboard or via SQL runner");
  }
  
  console.log("\n⚠️ Tables need to be created manually in Supabase.");
  console.log("Please run the SQL from database/schema.snapshot.sql in Supabase SQL Editor:");
  console.log("1. Go to Supabase Dashboard -> SQL Editor");
  console.log("2. Copy content from database/schema.snapshot.sql and run");
  console.log("3. Then run this script again to seed data\n");
}

async function seedDemoData() {
  console.log("Seeding demo users...");
  
  const demoUsers = [
    { email: "admin@otoburada.demo", password: "demo123", role: "admin", fullName: "Mert Aydın", phone: "+905321112233", city: "İstanbul" },
    { email: "emre@otoburada.demo", password: "demo123", role: "user", fullName: "Emre Yılmaz", phone: "+905321234567", city: "İstanbul" },
    { email: "ayse@otoburada.demo", password: "demo123", role: "user", fullName: "Ayşe Demir", phone: "+905339876543", city: "Ankara" },
    { email: "burak@otoburada.demo", password: "demo123", role: "user", fullName: "Burak Kaya", phone: "+905359998877", city: "İzmir" },
  ];
  
  for (const user of demoUsers) {
    try {
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
        await supabaseAdmin.from("profiles").insert({
          id: data.user.id,
          email: user.email,
          full_name: user.fullName,
          phone: user.phone,
          city: user.city,
          role: user.role
        });
        console.log(`✅ Created user: ${user.email}`);
      } else if (error?.message?.includes("already been registered")) {
        console.log(`✓ User already exists: ${user.email}`);
      }
    } catch (error) {
      console.log(`Error with ${user.email}:`, error.message || error);
    }
  }

  console.log("\nDone! You can now login with:");
  console.log("Email: admin@otoburada.demo");
  console.log("Password: demo123");
}

async function main() {
  await createTables();
  await seedDemoData();
}

main().catch(console.error);
