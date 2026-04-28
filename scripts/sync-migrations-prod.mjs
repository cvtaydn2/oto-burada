/**
 * Sync Script for OtoBurada Production Migrations
 * 
 * Purpose: Populates the `public._migrations` table with existing local migrations
 * without actually running them. This is needed when the production tracking table 
 * is empty but the schema is already partially or fully applied.
 */

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");
const migrationsDir = path.join(rootDir, "database", "migrations");

// Load env vars
import dotenv from "dotenv";
dotenv.config({ path: path.join(rootDir, ".env.local") });

const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error("❌ SUPABASE_DB_URL is missing in .env.local");
  process.exit(1);
}

function resolvePsqlCommand() {
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
    ];
    const discovered = candidates.find((candidate) => fs.existsSync(candidate));
    if (discovered) return discovered;
  }
  return "psql";
}

const psqlCommand = resolvePsqlCommand();

async function sync() {
  console.log("🚀 Starting Production Migration Sync...");

  // 1. Ensure table exists
  console.log("Checking for _migrations table...");
  const initSql = `
    CREATE TABLE IF NOT EXISTS public._migrations (
      id serial PRIMARY KEY,
      name text UNIQUE NOT NULL,
      checksum text NOT NULL,
      executed_at timestamptz DEFAULT now(),
      execution_time_ms integer DEFAULT 0,
      rollback_sql text
    );
  `;
  
  spawnSync(psqlCommand, [databaseUrl, "-c", initSql], { stdio: "inherit" });

  // 2. Read local migrations
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort();

  console.log(`Found ${files.length} local migrations.`);

  // 3. Insert each one if not already there
  for (const filename of files) {
    const content = fs.readFileSync(path.join(migrationsDir, filename), "utf8");
    const checksum = crypto.createHash("sha256").update(content).digest("hex");

    const checkSql = `SELECT count(*) FROM public._migrations WHERE name = '${filename}'`;
    const checkResult = spawnSync(psqlCommand, [databaseUrl, "-c", checkSql, "-t", "-A"], { encoding: "utf8" });
    
    if (checkResult.error) {
      throw new Error(`Failed to execute psql: ${checkResult.error.message}`);
    }
    
    if (checkResult.status !== 0) {
      throw new Error(`psql returned error: ${checkResult.stderr}`);
    }

    const output = checkResult.stdout ? checkResult.stdout.trim() : "";
    
    if (output === "0") {
      console.log(`Inserting: ${filename}`);
      const insertSql = `INSERT INTO public._migrations (name, checksum) VALUES ('${filename}', '${checksum}')`;
      const insertResult = spawnSync(psqlCommand, [databaseUrl, "-c", insertSql], { stdio: "inherit" });
      if (insertResult.status !== 0) {
        throw new Error(`Failed to insert migration record: ${filename}`);
      }
    } else {
      console.log(`Skipping (already exists): ${filename}`);
    }
  }

  console.log("✅ Sync completed successfully.");
}

sync().catch(err => {
  console.error("❌ Sync failed:", err);
  process.exit(1);
});
