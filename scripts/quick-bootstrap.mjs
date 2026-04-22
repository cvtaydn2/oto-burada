import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import fs from "fs";

// Load .env.local manually
const envFile = fs.readFileSync(".env.local", "utf-8");
envFile.split("\n").forEach((line) => {
  if (line && !line.startsWith("#")) {
    const [key, ...valueParts] = line.split("=");
    if (key && valueParts.length) {
      process.env[key] = valueParts.join("=").trim();
    }
  }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// SECURITY: Get demo password from environment or generate random
const demoPassword = process.env.DEMO_USER_PASSWORD || crypto.randomBytes(16).toString("hex");

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Missing required environment variables:");
  console.error("  - NEXT_PUBLIC_SUPABASE_URL");
  console.error("  - SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

// Use service role key directly for admin operations
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function createTables() {
  console.log("📋 Checking database schema...");

  try {
    // Try to query profiles table to check if it exists
    await supabaseAdmin.from("profiles").select("*").limit(1);
    console.log("✅ Database schema exists");
  } catch {
    console.log("\n⚠️  Database schema not found!");
    console.log("\nPlease create the schema first:");
    console.log("1. Go to Supabase Dashboard -> SQL Editor");
    console.log("2. Copy content from database/schema.snapshot.sql");
    console.log("3. Run the SQL");
    console.log("4. Then run this script again\n");
    process.exit(1);
  }
}

async function seedDemoData() {
  console.log("\n👥 Creating demo users...");

  // SECURITY: Password from environment or randomly generated
  const demoUsers = [
    {
      email: "admin@otoburada.demo",
      role: "admin",
      fullName: "Mert Aydın",
      phone: "+905321112233",
      city: "İstanbul",
    },
    {
      email: "emre@otoburada.demo",
      role: "user",
      fullName: "Emre Yılmaz",
      phone: "+905321234567",
      city: "İstanbul",
    },
    {
      email: "ayse@otoburada.demo",
      role: "user",
      fullName: "Ayşe Demir",
      phone: "+905339876543",
      city: "Ankara",
    },
    {
      email: "burak@otoburada.demo",
      role: "user",
      fullName: "Burak Kaya",
      phone: "+905359998877",
      city: "İzmir",
    },
  ];

  for (const user of demoUsers) {
    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: demoPassword,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          phone: user.phone,
          city: user.city,
        },
        app_metadata: {
          role: user.role, // SECURITY: Role in app_metadata (trusted)
        },
      });

      if (data?.user && !error) {
        await supabaseAdmin.from("profiles").insert({
          id: data.user.id,
          full_name: user.fullName,
          phone: user.phone,
          city: user.city,
          role: user.role,
        });
        console.log(`✅ Created user: ${user.email}`);
      } else if (error?.message?.includes("already been registered")) {
        console.log(`✓  User already exists: ${user.email}`);
      } else if (error) {
        console.log(`❌ Error creating ${user.email}:`, error.message);
      }
    } catch (error) {
      console.log(`❌ Error with ${user.email}:`, error.message || error);
    }
  }

  console.log("\n✅ Demo users created!");
  console.log("\n📧 Login credentials:");
  console.log("   Email: admin@otoburada.demo");
  console.log(`   Password: ${demoPassword}`);

  if (!process.env.DEMO_USER_PASSWORD) {
    console.log("\n⚠️  IMPORTANT: Save this password! It was randomly generated.");
    console.log("   To use a custom password, set DEMO_USER_PASSWORD in .env.local");
  }
}

async function main() {
  console.log("🚀 Quick Bootstrap Script");
  console.log("========================\n");

  await createTables();
  await seedDemoData();

  console.log("\n✅ Bootstrap complete!");
}

main().catch((error) => {
  console.error("\n❌ Bootstrap failed:", error.message || error);
  process.exit(1);
});
