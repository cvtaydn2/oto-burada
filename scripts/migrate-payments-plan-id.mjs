/**
 * Migration: payments tablosuna plan_id ve plan_name kolonları ekle
 *
 * Çalıştır: node scripts/migrate-payments-plan-id.mjs
 *
 * Bu script Supabase REST API üzerinden çalışır, psql gerekmez.
 */

import { createClient } from "@supabase/supabase-js";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL veya SUPABASE_SERVICE_ROLE_KEY eksik");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runMigration() {
  console.log("🔄 payments tablosuna plan_id ve plan_name kolonları ekleniyor...\n");

  // Supabase REST API ile DDL çalıştırmak için rpc kullanıyoruz
  // Eğer exec_sql RPC yoksa Supabase Dashboard > SQL Editor'dan çalıştırın
  const sql = `
    ALTER TABLE payments
      ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES pricing_plans(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS plan_name TEXT;

    COMMENT ON COLUMN payments.plan_id IS 'Satın alınan paket ID (ödeme sistemi aktif olduğunda doldurulur)';
    COMMENT ON COLUMN payments.plan_name IS 'Satın alınan paket adı (snapshot)';
  `;

  // exec_sql RPC dene
  const { error } = await admin.rpc("exec_sql", { sql });

  if (error) {
    console.log("⚠️  exec_sql RPC bulunamadı. Aşağıdaki SQL'i Supabase Dashboard > SQL Editor'da çalıştırın:\n");
    console.log("─".repeat(60));
    console.log(sql);
    console.log("─".repeat(60));
    console.log("\nYa da SUPABASE_DB_URL ile psql kullanın:");
    console.log("psql $SUPABASE_DB_URL -c \"ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_id UUID REFERENCES pricing_plans(id) ON DELETE SET NULL, ADD COLUMN IF NOT EXISTS plan_name TEXT;\"");
    process.exit(0);
  }

  console.log("✅ Migration başarıyla uygulandı.");
  console.log("   - payments.plan_id (UUID, nullable, FK → pricing_plans)");
  console.log("   - payments.plan_name (TEXT, nullable)");
}

runMigration().catch((err) => {
  console.error("❌ Migration hatası:", err);
  process.exit(1);
});
