/**
 * Migration Consolidation Tool for OtoBurada
 * 
 * Helps consolidate the existing 69+ migrations into a cleaner baseline
 * while preserving the ability to rollback and maintain data integrity.
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const databaseUrl = process.env.SUPABASE_DB_URL;
const migrationsDir = path.resolve(process.cwd(), "database", "migrations");
const backupDir = path.resolve(process.cwd(), "database", "migrations-backup");

function resolvePsqlCommand() {
  const configuredPath = process.env.PSQL_PATH;
  if (configuredPath && fs.existsSync(configuredPath)) return configuredPath;
  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe",
    ];
    const discovered = candidates.find((candidate) => fs.existsSync(candidate));
    if (discovered) return discovered;
  }
  return "psql";
}

const psqlCommand = resolvePsqlCommand();

class MigrationConsolidator {
  constructor() {
    this.migrationFiles = [];
    this.appliedMigrations = new Set();
  }

  async runSql(sql) {
    const result = spawnSync(psqlCommand, [databaseUrl, "-c", sql, "-t", "-A"], { encoding: "utf8" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  }

  async loadMigrationFiles() {
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    this.migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort()
      .map(filename => ({
        filename,
        filePath: path.join(migrationsDir, filename),
        content: fs.readFileSync(path.join(migrationsDir, filename), "utf8")
      }));

    console.log(`📁 Found ${this.migrationFiles.length} migration files`);
  }

  async loadAppliedMigrations() {
    try {
      const result = await this.runSql("SELECT name FROM public._migrations ORDER BY executed_at");
      if (result) {
        result.split("\n").forEach(line => {
          if (line.trim()) {
            this.appliedMigrations.add(line.trim());
          }
        });
      }
      console.log(`✅ ${this.appliedMigrations.size} migrations already applied`);
    } catch (error) {
      console.log("ℹ️  No migration tracking table found (this is normal for first-time setup)");
    }
  }

  async generateCurrentSchema() {
    console.log("📊 Generating current database schema...");
    
    const schemaResult = spawnSync("pg_dump", [
      databaseUrl,
      "--schema-only",
      "--no-owner",
      "--no-privileges",
      "--no-comments",
      "--exclude-schema=information_schema",
      "--exclude-schema=pg_*"
    ], { encoding: "utf8" });

    if (schemaResult.error) throw schemaResult.error;
    if (schemaResult.status !== 0) throw new Error(schemaResult.stderr);

    return schemaResult.stdout;
  }

  async createConsolidatedBaseline() {
    console.log("🔧 Creating consolidated baseline migration...");

    // Generate current schema
    const currentSchema = await this.generateCurrentSchema();
    
    // Create baseline migration
    const baselineContent = `-- Consolidated Baseline Migration
-- This migration represents the consolidated state of all migrations up to ${new Date().toISOString()}
-- Generated from ${this.migrationFiles.length} individual migration files

-- UP
${currentSchema}

-- DOWN
-- WARNING: This will drop all tables and data!
-- Only use in development environments
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;
    
    -- Drop all functions in public schema
    FOR r IN (SELECT proname, oidvectortypes(proargtypes) as argtypes 
              FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid 
              WHERE n.nspname = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.proname) || '(' || r.argtypes || ') CASCADE';
    END LOOP;
    
    -- Drop all types in public schema
    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON t.typnamespace = n.oid 
              WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'DROP TYPE IF EXISTS public.' || quote_ident(r.typname) || ' CASCADE';
    END LOOP;
END $$;`;

    const baselineFilename = "0001_consolidated_baseline.sql";
    const baselineFilePath = path.join(migrationsDir, baselineFilename);

    return { content: baselineContent, filename: baselineFilename, filePath: baselineFilePath };
  }

  async backupExistingMigrations() {
    console.log("💾 Backing up existing migrations...");

    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupSubDir = path.join(backupDir, `backup-${timestamp}`);
    fs.mkdirSync(backupSubDir, { recursive: true });

    // Copy all existing migrations to backup
    for (const migration of this.migrationFiles) {
      const backupPath = path.join(backupSubDir, migration.filename);
      fs.copyFileSync(migration.filePath, backupPath);
    }

    // Create backup manifest
    const manifest = {
      timestamp,
      totalMigrations: this.migrationFiles.length,
      appliedMigrations: Array.from(this.appliedMigrations),
      files: this.migrationFiles.map(m => m.filename)
    };

    fs.writeFileSync(
      path.join(backupSubDir, "manifest.json"),
      JSON.stringify(manifest, null, 2)
    );

    console.log(`✅ Backup created: ${backupSubDir}`);
    return backupSubDir;
  }

  async consolidate(options = {}) {
    const { dryRun = false, keepOriginals = true } = options;

    console.log("🗃️  OtoBurada Migration Consolidator");
    console.log("===================================");

    if (dryRun) {
      console.log("🔍 DRY RUN MODE - No changes will be made");
    }

    await this.loadMigrationFiles();
    await this.loadAppliedMigrations();

    if (this.migrationFiles.length === 0) {
      console.log("ℹ️  No migrations found to consolidate");
      return;
    }

    // Check if database is in sync
    const unappliedMigrations = this.migrationFiles.filter(
      m => !this.appliedMigrations.has(m.filename)
    );

    if (unappliedMigrations.length > 0) {
      console.error("❌ Cannot consolidate: There are unapplied migrations");
      console.error("   Please apply all migrations first using: npm run db:migrate");
      console.error("   Unapplied migrations:");
      unappliedMigrations.forEach(m => console.error(`   - ${m.filename}`));
      process.exit(1);
    }

    // Create backup
    const backupPath = await this.backupExistingMigrations();

    // Generate consolidated baseline
    const baseline = await this.createConsolidatedBaseline();

    if (dryRun) {
      console.log("\n📋 Consolidation Plan:");
      console.log(`   - Backup ${this.migrationFiles.length} migrations to: ${backupPath}`);
      console.log(`   - Create baseline migration: ${baseline.filename}`);
      console.log(`   - ${keepOriginals ? "Keep" : "Remove"} original migration files`);
      console.log("\n📄 Baseline migration preview (first 500 chars):");
      console.log(baseline.content.substring(0, 500) + "...");
      return;
    }

    // Write baseline migration
    fs.writeFileSync(baseline.filePath, baseline.content);
    console.log(`✅ Created baseline migration: ${baseline.filename}`);

    if (!keepOriginals) {
      // Move original migrations to backup (don't delete, just move)
      console.log("📦 Moving original migrations to backup...");
      for (const migration of this.migrationFiles) {
        fs.unlinkSync(migration.filePath);
      }
      console.log(`✅ Moved ${this.migrationFiles.length} original migrations to backup`);
    }

    // Update migration tracking table
    console.log("🔄 Updating migration tracking...");
    
    // Clear existing migration records
    await this.runSql("DELETE FROM public._migrations");
    
    // Add baseline migration record
    await this.runSql(`
      INSERT INTO public._migrations (name, checksum, execution_time_ms) 
      VALUES ('${baseline.filename}', 'consolidated-baseline', 0)
    `);

    console.log("\n🎉 Migration consolidation completed successfully!");
    console.log(`📊 Consolidated ${this.migrationFiles.length} migrations into 1 baseline`);
    console.log(`💾 Backup available at: ${backupPath}`);
    console.log("\n📝 Next steps:");
    console.log("1. Test your application to ensure everything works");
    console.log("2. Create new migrations using: node scripts/create-migration.mjs");
    console.log("3. Apply new migrations using: node scripts/migration-manager.mjs migrate");
  }

  async restore(backupPath) {
    console.log(`🔄 Restoring migrations from backup: ${backupPath}`);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup directory not found: ${backupPath}`);
    }

    const manifestPath = path.join(backupPath, "manifest.json");
    if (!fs.existsSync(manifestPath)) {
      throw new Error(`Backup manifest not found: ${manifestPath}`);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    console.log(`📋 Restoring ${manifest.totalMigrations} migrations from ${manifest.timestamp}`);

    // Clear current migrations directory
    if (fs.existsSync(migrationsDir)) {
      fs.rmSync(migrationsDir, { recursive: true });
    }
    fs.mkdirSync(migrationsDir, { recursive: true });

    // Copy migrations from backup
    for (const filename of manifest.files) {
      const sourcePath = path.join(backupPath, filename);
      const targetPath = path.join(migrationsDir, filename);
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, targetPath);
      }
    }

    console.log(`✅ Restored ${manifest.files.length} migration files`);
    console.log("⚠️  Note: You may need to update the migration tracking table manually");
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || "help";
  const consolidator = new MigrationConsolidator();

  try {
    switch (command) {
      case "consolidate":
        const dryRun = process.argv.includes("--dry-run");
        const keepOriginals = !process.argv.includes("--remove-originals");
        await consolidator.consolidate({ dryRun, keepOriginals });
        break;

      case "restore":
        const backupPath = process.argv[3];
        if (!backupPath) {
          console.error("❌ Backup path required");
          console.log("Usage: node consolidate-migrations.mjs restore <backup-path>");
          process.exit(1);
        }
        await consolidator.restore(backupPath);
        break;

      case "status":
        await consolidator.loadMigrationFiles();
        await consolidator.loadAppliedMigrations();
        console.log("📊 Migration Status");
        console.log("==================");
        console.log(`Total migration files: ${consolidator.migrationFiles.length}`);
        console.log(`Applied migrations: ${consolidator.appliedMigrations.size}`);
        
        const unapplied = consolidator.migrationFiles.filter(
          m => !consolidator.appliedMigrations.has(m.filename)
        );
        console.log(`Unapplied migrations: ${unapplied.length}`);
        
        if (unapplied.length > 0) {
          console.log("\n⏳ Unapplied migrations:");
          unapplied.forEach(m => console.log(`  - ${m.filename}`));
        }
        break;

      default:
        console.log("🗃️  OtoBurada Migration Consolidator");
        console.log("Usage:");
        console.log("  node consolidate-migrations.mjs consolidate [--dry-run] [--remove-originals]");
        console.log("  node consolidate-migrations.mjs restore <backup-path>");
        console.log("  node consolidate-migrations.mjs status");
        console.log("\nOptions:");
        console.log("  --dry-run           Show what would be done without making changes");
        console.log("  --remove-originals  Remove original migration files (default: keep)");
        console.log("\nExamples:");
        console.log("  node consolidate-migrations.mjs consolidate --dry-run");
        console.log("  node consolidate-migrations.mjs consolidate --remove-originals");
        break;
    }
  } catch (error) {
    console.error(`💥 Error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationConsolidator };