/**
 * apply-migrations-direct.mjs
 * 
 * Applies migrations directly via Supabase client using raw SQL execution.
 * This script bypasses the need for psql by using Supabase's JavaScript client.
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
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
  db: { schema: "public" }
});

async function _executeSql(sql) {
  const { data, error } = await supabase.rpc("exec_sql", { sql_text: sql });
  
  if (error) {
    throw new Error(`SQL execution failed: ${error.message}`);
  }
  
  return data;
}

async function initMigrationTable() {
  console.log("🔧 Initializing migration tracking table...");
  
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS public._migrations (
      id serial PRIMARY KEY,
      name text UNIQUE NOT NULL,
      checksum text NOT NULL,
      executed_at timestamptz DEFAULT now(),
      execution_time_ms integer,
      rollback_sql text
    );
    
    CREATE INDEX IF NOT EXISTS idx_migrations_name ON public._migrations(name);
    CREATE INDEX IF NOT EXISTS idx_migrations_executed_at ON public._migrations(executed_at);
  `;
  
  try {
    // Use direct query since RPC might not exist
    const { error } = await supabase.from("_migrations").select("id").limit(1);
    
    if (error && error.code === "42P01") {
      // Table doesn't exist, create it via SQL Editor approach
      console.log("⚠️  _migrations table doesn't exist. Please create it manually via Supabase Dashboard.");
      console.log("\nSQL to run:");
      console.log(createTableSql);
      return false;
    }
    
    console.log("✅ Migration tracking table exists");
    return true;
  } catch (_err) {
    console.error("❌ Error checking migration table:", _err.message);
    return false;
  }
}

async function checkMigrationApplied(filename) {
  const { data, error } = await supabase
    .from("_migrations")
    .select("name, executed_at")
    .eq("name", filename)
    .single();
  
  if (error && error.code !== "PGRST116") {
    throw new Error(`Error checking migration: ${error.message}`);
  }
  
  return data !== null;
}

async function recordMigration(filename, checksum, executionTime) {
  const { error } = await supabase
    .from("_migrations")
    .insert({
      name: filename,
      checksum,
      execution_time_ms: executionTime,
      rollback_sql: null
    });
  
  if (error) {
    throw new Error(`Error recording migration: ${error.message}`);
  }
}

async function applyMigration(sqlFile) {
  const sqlPath = path.resolve(process.cwd(), sqlFile);
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ File not found: ${sqlPath}`);
    process.exit(1);
  }
  
  const sql = fs.readFileSync(sqlPath, "utf8");
  const filename = path.basename(sqlPath);
  
  console.log(`\n📄 Migration: ${filename}`);
  console.log(`📡 Supabase: ${SUPABASE_URL}`);
  
  // Check if already applied
  const isApplied = await checkMigrationApplied(filename);
  
  if (isApplied) {
    console.log(`⏭️  Migration already applied, skipping...`);
    return { success: true, skipped: true };
  }
  
  console.log("⏳ Applying migration...\n");
  
  const startTime = Date.now();
  
  try {
    // Split SQL into statements and execute them
    // This is a simple approach - for complex migrations, use a proper SQL parser
    const statements = sql
      .split(";")
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith("--"));
    
    for (const statement of statements) {
      if (statement.trim().length === 0) continue;
      
      // Execute via raw SQL query
      const { error } = await supabase.rpc("exec", { 
        sql: statement + ";" 
      }).catch(async (_err) => {
        // Fallback: try direct query if RPC doesn't exist
        console.log("⚠️  RPC not available, using alternative method...");
        
        // For CREATE FUNCTION, CREATE TRIGGER, etc., we need SQL Editor
        console.log("\n❌ This migration requires manual application via Supabase Dashboard.");
        console.log("\nSteps:");
        console.log("1. Go to: https://supabase.com/dashboard/project/yagcxhrhtfhwaxzhyrkj/sql");
        console.log("2. Paste the following SQL:");
        console.log("\n--- BEGIN SQL ---");
        console.log(sql);
        console.log("--- END SQL ---\n");
        console.log("3. Click 'Run' to execute");
        console.log("4. After successful execution, run this script again to record the migration");
        
        throw new Error("Manual migration required");
      });
      
      if (error) {
        throw new Error(`Statement failed: ${error.message}\nStatement: ${statement.substring(0, 100)}...`);
      }
    }
    
    const executionTime = Date.now() - startTime;
    
    // Calculate checksum
    const crypto = await import("node:crypto");
    const checksum = crypto.createHash("sha256").update(sql).digest("hex");
    
    // Record migration
    await recordMigration(filename, checksum, executionTime);
    
    console.log(`✅ Migration applied successfully (${executionTime}ms)`);
    console.log(`📝 Recorded in _migrations table`);
    
    return { success: true, executionTime };
    
  } catch (error) {
    console.error(`❌ Migration failed: ${error.message}`);
    throw error;
  }
}

async function main() {
  const migrationFiles = process.argv.slice(2);
  
  if (migrationFiles.length === 0) {
    console.error("❌ No migration files specified.");
    console.error("Usage: node scripts/apply-migrations-direct.mjs <migration1.sql> [migration2.sql] ...");
    process.exit(1);
  }
  
  console.log("🗃️  OtoBurada Migration Deployer");
  console.log("================================\n");
  
  // Initialize migration table
  const tableExists = await initMigrationTable();
  
  if (!tableExists) {
    console.log("\n⚠️  Please create the _migrations table first, then run this script again.");
    process.exit(1);
  }
  
  // Apply migrations
  let appliedCount = 0;
  let skippedCount = 0;
  
  for (const migrationFile of migrationFiles) {
    try {
      const result = await applyMigration(migrationFile);
      
      if (result.skipped) {
        skippedCount++;
      } else {
        appliedCount++;
      }
    } catch (error) {
      console.error(`\n💥 Migration process stopped due to error`);
      console.error(`   Error: ${error.message}`);
      process.exit(1);
    }
  }
  
  console.log(`\n🎉 Migration deployment completed!`);
  console.log(`📊 Applied: ${appliedCount}, Skipped: ${skippedCount}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
