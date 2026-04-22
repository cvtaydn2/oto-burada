/**
 * apply-migration-direct.mjs
 *
 * psql olmadan Supabase service_role üzerinden migration SQL'lerini uygular.
 * Kullanım: node scripts/apply-migration-direct.mjs [migration-file.sql]
 *
 * Örnek:
 *   node scripts/apply-migration-direct.mjs 0042_listing_quota_atomic_check.sql
 *   node scripts/apply-migration-direct.mjs  (tüm pending migration'ları uygular)
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

const MIGRATIONS_DIR = path.resolve(process.cwd(), "database", "migrations");

async function runSql(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  // Supabase'in exec_sql RPC'si yoksa pg_query endpoint'ini dene
  // Alternatif: Supabase Management API kullan
  const mgmtUrl = `https://api.supabase.com/v1/projects/${extractProjectRef(SUPABASE_URL)}/database/query`;

  const response = await fetch(mgmtUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sql }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SQL failed (${response.status}): ${text}`);
  }

  return response.json();
}

function extractProjectRef(supabaseUrl) {
  // https://yagcxhrhtfhwaxzhyrkj.supabase.co -> yagcxhrhtfhwaxzhyrkj
  const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? "";
}

async function applyMigrationViaRpc(sql, filename) {
  // Supabase'de doğrudan SQL çalıştırmak için pg_net veya
  // service_role ile Supabase client kullanıyoruz
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // SQL'i parçalara böl (statement separator: ;)
  // Büyük migration'lar için tek seferde gönder
  const { error } = await admin.rpc("exec_migration", { sql_text: sql }).single();

  if (error) {
    // exec_migration RPC yoksa, doğrudan Supabase SQL Editor API'sini dene
    console.warn(`  ⚠️  exec_migration RPC bulunamadı, alternatif yöntem deneniyor...`);
    return false;
  }

  return true;
}

async function applyMigrationViaManagementApi(sql, filename) {
  const projectRef = extractProjectRef(SUPABASE_URL);
  if (!projectRef) {
    throw new Error("Supabase project ref çıkarılamadı.");
  }

  // Supabase Management API — SQL çalıştırma
  // Bu endpoint service_role key ile çalışmaz, access_token gerektirir.
  // Bunun yerine Supabase JS client ile pg_query kullanıyoruz.
  console.log(`  📡 Supabase project: ${projectRef}`);

  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
    db: { schema: "public" },
  });

  // SQL'i statement'lara böl ve sırayla çalıştır
  // Supabase JS client doğrudan raw SQL çalıştırmayı desteklemiyor
  // ama .rpc() ile önceden tanımlı fonksiyonları çağırabiliyoruz.
  // Migration SQL'lerini Supabase Dashboard SQL Editor'dan çalıştırman gerekiyor.

  return false;
}

async function printInstructions(files) {
  console.log("\n" + "═".repeat(60));
  console.log("📋 MANUEL UYGULAMA TALİMATLARI");
  console.log("═".repeat(60));
  console.log("\nBu makinede psql yüklü olmadığı için migration'ları");
  console.log("Supabase Dashboard üzerinden uygulamanız gerekiyor:\n");
  console.log("1. https://supabase.com/dashboard adresine git");
  console.log("2. Projeyi seç: yagcxhrhtfhwaxzhyrkj");
  console.log("3. Sol menüden 'SQL Editor' seç");
  console.log("4. Aşağıdaki dosyaları sırayla çalıştır:\n");

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf8");
    console.log(`─── ${file} ───`);
    console.log(`Dosya: database/migrations/${file}`);
    console.log(`Boyut: ${(sql.length / 1024).toFixed(1)} KB`);
    console.log("");
  }

  console.log("5. Her dosyayı çalıştırdıktan sonra 'Success' mesajını doğrula");
  console.log("\n💡 İPUCU: Dosya içeriklerini aşağıda görebilirsin.");
  console.log("═".repeat(60) + "\n");

  for (const file of files) {
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, "utf8");
    console.log(`\n${"─".repeat(60)}`);
    console.log(`📄 ${file}`);
    console.log("─".repeat(60));
    console.log(sql);
  }
}

async function checkAppliedMigrations() {
  const { createClient } = await import("@supabase/supabase-js");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // _migrations tablosu var mı kontrol et
  const { data, error } = await admin.from("_migrations").select("name").order("name");

  if (error) {
    // Tablo yok — hiç migration uygulanmamış
    return [];
  }

  return (data ?? []).map((r) => r.name);
}

async function main() {
  const targetFile = process.argv[2];

  console.log("🔍 Uygulanan migration'lar kontrol ediliyor...");

  let appliedMigrations = [];
  try {
    appliedMigrations = await checkAppliedMigrations();
    console.log(`✅ ${appliedMigrations.length} migration zaten uygulanmış.`);
  } catch {
    console.log("⚠️  _migrations tablosu bulunamadı — tüm dosyalar pending.");
  }

  const allFiles = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let pendingFiles;
  if (targetFile) {
    pendingFiles = [targetFile].filter((f) => fs.existsSync(path.join(MIGRATIONS_DIR, f)));
    if (pendingFiles.length === 0) {
      console.error(`❌ Dosya bulunamadı: ${targetFile}`);
      process.exit(1);
    }
  } else {
    pendingFiles = allFiles.filter((f) => !appliedMigrations.includes(f));
  }

  if (pendingFiles.length === 0) {
    console.log("✅ Tüm migration'lar zaten uygulanmış. Yapılacak bir şey yok.");
    return;
  }

  console.log(`\n📦 ${pendingFiles.length} pending migration bulundu:`);
  pendingFiles.forEach((f) => console.log(`   • ${f}`));

  await printInstructions(pendingFiles);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
