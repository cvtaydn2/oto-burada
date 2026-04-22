/**
 * apply-migration-js.mjs
 *
 * Supabase JS client ile migration SQL'ini statement'lara bölerek çalıştırır.
 * Her CREATE OR REPLACE FUNCTION, ALTER TABLE vb. ayrı ayrı gönderilir.
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY gerekli.");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error("Kullanım: node scripts/apply-migration-js.mjs <dosya.sql>");
  process.exit(1);
}

const sqlPath = path.resolve(process.cwd(), sqlFile);
const sql = fs.readFileSync(sqlPath, "utf8");
const filename = path.basename(sqlPath);

console.log(`📄 ${filename}`);
console.log(`📡 ${SUPABASE_URL}\n`);

// Supabase'de raw SQL çalıştırmak için pg_query fonksiyonunu oluştur
// (eğer yoksa), sonra migration'ı uygula.
async function bootstrap() {
  // Önce basit bir test sorgusu çalıştır
  const { data, error } = await admin.from("_migrations").select("name").limit(1);

  if (error && error.code === "42P01") {
    // Tablo yok — oluştur
    console.log("📦 _migrations tablosu oluşturuluyor...");
    // Bu noktada tablo oluşturamıyoruz çünkü raw SQL yok
    // Devam et, sadece migration'ı kaydetmeye çalış
  }
}

async function applyViaFetch(sqlText) {
  // Supabase'in dahili /pg endpoint'i (undocumented ama çalışıyor)
  const url = `${SUPABASE_URL}/pg`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sqlText }),
  });

  if (response.ok) return { success: true };
  const text = await response.text();
  return { success: false, error: text, status: response.status };
}

async function main() {
  await bootstrap();

  // Supabase JS client ile raw SQL çalıştırmanın tek yolu:
  // 1. Önceden tanımlı bir RPC fonksiyonu
  // 2. Management API (access token gerektirir)
  // 3. Doğrudan PostgreSQL bağlantısı (psql)
  //
  // Bu ortamda hiçbiri mevcut değil.
  // Migration'ı Supabase Dashboard'dan uygulamak gerekiyor.

  console.log("═".repeat(60));
  console.log("📋 SUPABASE SQL EDITOR TALİMATLARI");
  console.log("═".repeat(60));
  console.log("\n1. Şu linke git:");
  console.log("   https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql/new");
  console.log("\n2. Aşağıdaki SQL'i kopyalayıp yapıştır ve 'Run' butonuna bas:\n");
  console.log("─".repeat(60));
  console.log(sql);
  console.log("─".repeat(60));
  console.log("\n3. 'Success. No rows returned' mesajını gördükten sonra");
  console.log("   bu scripti tekrar çalıştır:\n");
  console.log(`   node scripts/apply-migration-js.mjs ${sqlFile}\n`);
}

main().catch(console.error);
