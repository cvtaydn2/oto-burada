import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import fetch from "node-fetch";

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

async function executePostgres(query) {
  // Use postgrest API to execute SQL through the anon key with service role
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": serviceRoleKey,
      "Authorization": `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ query })
  });
  
  if (!response.ok) {
    const text = await response.text();
    console.log(`SQL: ${query.substring(0, 50)}... Error: ${text}`);
    return false;
  }
  return true;
}

async function createTables() {
  console.log("Creating tables via SQL...");
  
  // Create tables using SQL directly via REST
  const tablesSQL = `
    CREATE TABLE IF NOT EXISTS profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT UNIQUE NOT NULL,
      full_name TEXT,
      phone TEXT,
      city TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS listings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL,
      mileage INTEGER NOT NULL,
      fuel_type TEXT NOT NULL,
      transmission TEXT NOT NULL,
      price INTEGER NOT NULL,
      city TEXT NOT NULL,
      district TEXT,
      description TEXT,
      whatsapp_phone TEXT,
      slug TEXT UNIQUE,
      status TEXT DEFAULT 'pending',
      featured BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS listing_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
      storage_path TEXT NOT NULL,
      url TEXT NOT NULL,
      order_num INTEGER DEFAULT 0,
      is_cover BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
      listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(user_id, listing_id)
    );

    CREATE TABLE IF NOT EXISTS reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
      reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      reason TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'open',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS admin_actions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      admin_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
      target_type TEXT NOT NULL,
      target_id UUID NOT NULL,
      action TEXT NOT NULL,
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  // Since we can't execute raw SQL easily, let's use the Supabase JS client directly
  // Insert empty row first to create table
  try {
    // Try to insert - this will fail but might create the table structure
    await supabaseAdmin.from("profiles").select("*").limit(1);
  } catch (e) {
    console.log("Note: Tables need to be created in Supabase dashboard or via SQL runner");
  }
  
  console.log("\n⚠️ Tables need to be created manually in Supabase.");
  console.log("Please run the SQL from schema.sql in Supabase SQL Editor:");
  console.log("1. Go to Supabase Dashboard -> SQL Editor");
  console.log("2. Copy content from schema.sql and run");
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
    } catch (e) {
      console.log(`Error with ${user.email}:`, e.message || e);
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