/**
 * apply-sql-via-supabase.mjs
 *
 * Supabase service_role key ile SQL dosyasını doğrudan çalıştırır.
 * Supabase'in pg_query RPC endpoint'ini kullanır.
 *
 * Kullanım:
 *   node scripts/apply-sql-via-supabase.mjs database/migrations/0042_listing_quota_atomic_check.sql
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  process.exit(1);
}

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("❌ SQL dosyası belirtilmedi.");
  console.error("Kullanım: node scripts/apply-sql-via-supabase.mjs <dosya.sql>");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), sqlFile);
if (!fs.existsSync(sqlPath)) {
  console.error(`❌ Dosya bulunamadı: ${sqlPath}`);
  process.exit(1);
}

const sql = fs.readFileSync(sqlPath, "utf8");
const filename = path.basename(sqlPath);

console.log(`📄 Dosya: ${filename}`);
console.log(`📡 Supabase: ${SUPABASE_URL}`);
console.log("⏳ SQL çalıştırılıyor...\n");

async function runSqlViaRpc(sqlText) {
  // Supabase'in dahili pg_query endpoint'i
  const endpoint = `${SUPABASE_URL}/rest/v1/rpc/pg_query`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query: sqlText }),
  });

  if (response.ok) {
    return { success: true, data: await response.json().catch(() => null) };
  }

  const errorText = await response.text();
  return { success: false, error: errorText, status: response.status };
}

async function runSqlViaPostgrestRpc(sqlText) {
  // Alternatif: exec_sql RPC (eğer tanımlıysa)
  const endpoint = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ sql_text: sqlText }),
  });

  if (response.ok) {
    return { success: true };
  }

  const errorText = await response.text();
  return { success: false, error: errorText, status: response.status };
}

async function main() {
  // Yöntem 1: pg_query RPC
  let result = await runSqlViaRpc(sql);

  if (!result.success) {
    console.log(`⚠️  pg_query RPC başarısız (${result.status}), exec_sql deneniyor...`);
    // Yöntem 2: exec_sql RPC
    result = await runSqlViaPostgrestRpc(sql);
  }

  if (result.success) {
    console.log(`✅ Migration başarıyla uygulandı: ${filename}`);

    // _migrations tablosuna kaydet
    const { createClient } = await import("@supabase/supabase-js");
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { persistSession: false },
    });

    // _migrations tablosu yoksa oluştur
    await runSqlViaRpc(`
      CREATE TABLE IF NOT EXISTS public._migrations (
        id serial PRIMARY KEY,
        name text UNIQUE NOT NULL,
        executed_at timestamptz DEFAULT now()
      );
    `);

    const { error: insertError } = await admin
      .from("_migrations")
      .upsert({ name: filename }, { onConflict: "name" });

    if (insertError) {
      console.warn(`⚠️  _migrations kaydı eklenemedi: ${insertError.message}`);
    } else {
      console.log(`📝 _migrations tablosuna kaydedildi.`);
    }
  } else {
    console.error(`❌ Migration başarısız: ${filename}`);
    console.error(`   Status: ${result.status}`);
    console.error(`   Hata: ${result.error}`);
    console.error("\n💡 Supabase Dashboard > SQL Editor'dan manuel olarak uygulayın:");
    console.error(`   https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
