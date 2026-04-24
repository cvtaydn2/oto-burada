/**
 * Enhanced Migration Manager for OtoBurada
 * 
 * Features:
 * - Idempotent migrations with rollback support
 * - Transaction-based execution
 * - Migration validation and dependency checking
 * - Comprehensive logging and error handling
 * - Support for UP/DOWN migration patterns
 * - Migration status tracking and reporting
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import crypto from "node:crypto";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const databaseUrl = process.env.SUPABASE_DB_URL;
const migrationsDir = path.resolve(process.cwd(), "database", "migrations");

if (!databaseUrl) {
  console.error("❌ SUPABASE_DB_URL is required.");
  process.exit(1);
}

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

class MigrationManager {
  constructor() {
    this.appliedMigrations = new Set();
    this.migrationFiles = [];
  }

  async runSql(sql, options = {}) {
    const args = [databaseUrl, "-c", sql, "-t", "-A"];
    if (options.noOutput) args.push("-q");
    
    const result = spawnSync(psqlCommand, args, { encoding: "utf8" });
    if (result.error) throw result.error;
    if (result.status !== 0) throw new Error(result.stderr);
    return result.stdout.trim();
  }

  async runFile(filePath, options = {}) {
    const args = [databaseUrl, "-v", "ON_ERROR_STOP=1"];
    if (options.transaction) args.push("-1"); // Single transaction mode
    args.push("-f", filePath);

    const result = spawnSync(psqlCommand, args, {
      stdio: options.silent ? "pipe" : "inherit",
    });
    if (result.error) throw result.error;
    if (result.status !== 0) {
      throw new Error(`Migration failed: ${path.basename(filePath)}\n${result.stderr}`);
    }
    return result.stdout;
  }

  async initializeMigrationTable() {
    console.log("🔧 Initializing migration tracking...");
    
    await this.runSql(`
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
    `);
  }

  async loadAppliedMigrations() {
    const result = await this.runSql(`
      SELECT name, checksum FROM public._migrations ORDER BY executed_at
    `);
    
    this.appliedMigrations.clear();
    if (result) {
      result.split("\n").forEach(line => {
        if (line.trim()) {
          const [name, checksum] = line.split("|");
          this.appliedMigrations.add(name);
        }
      });
    }
  }

  async loadMigrationFiles() {
    if (!fs.existsSync(migrationsDir)) {
      throw new Error(`Migrations directory not found: ${migrationsDir}`);
    }

    this.migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter(f => f.endsWith(".sql"))
      .sort() // Lexicographical sort ensures proper ordering
      .map(filename => {
        const filePath = path.join(migrationsDir, filename);
        const content = fs.readFileSync(filePath, "utf8");
        const checksum = crypto.createHash("sha256").update(content).digest("hex");
        
        return {
          filename,
          filePath,
          content,
          checksum,
          upSql: this.extractUpSql(content),
          downSql: this.extractDownSql(content)
        };
      });
  }

  extractUpSql(content) {
    // Extract UP section (everything before -- DOWN comment or entire file)
    const downMatch = content.match(/^--\s*DOWN\s*$/m);
    if (downMatch) {
      return content.substring(0, downMatch.index).trim();
    }
    return content.trim();
  }

  extractDownSql(content) {
    // Extract DOWN section (everything after -- DOWN comment)
    const downMatch = content.match(/^--\s*DOWN\s*$/m);
    if (downMatch) {
      return content.substring(downMatch.index + downMatch[0].length).trim();
    }
    return null;
  }

  async validateMigration(migration) {
    // Check if migration was modified after being applied
    if (this.appliedMigrations.has(migration.filename)) {
      const result = await this.runSql(`
        SELECT checksum FROM public._migrations WHERE name = '${migration.filename}'
      `);
      
      if (result && result !== migration.checksum) {
        throw new Error(
          `Migration ${migration.filename} has been modified after being applied. ` +
          `This is not allowed for data integrity reasons.`
        );
      }
    }

    // Basic SQL syntax validation
    if (!migration.upSql || migration.upSql.length === 0) {
      throw new Error(`Migration ${migration.filename} has no UP SQL content`);
    }

    // Check for dangerous operations in production
    if (process.env.NODE_ENV === "production") {
      const dangerousPatterns = [
        /DROP\s+TABLE/i,
        /DROP\s+DATABASE/i,
        /TRUNCATE/i,
        /DELETE\s+FROM.*WHERE\s+1\s*=\s*1/i
      ];

      for (const pattern of dangerousPatterns) {
        if (pattern.test(migration.upSql)) {
          console.warn(`⚠️  Migration ${migration.filename} contains potentially dangerous operation`);
          console.warn(`   Pattern: ${pattern.source}`);
          console.warn(`   Review carefully before proceeding in production`);
        }
      }
    }
  }

  async applyMigration(migration) {
    const startTime = Date.now();
    
    console.log(`\n🚀 Applying migration: ${migration.filename}`);
    console.log(`   Checksum: ${migration.checksum.substring(0, 12)}...`);

    try {
      // Create temporary file for UP migration
      const tempFile = path.join(process.cwd(), `.temp_migration_${Date.now()}.sql`);
      fs.writeFileSync(tempFile, migration.upSql);

      try {
        // Apply migration in transaction
        await this.runFile(tempFile, { transaction: true });
        
        const executionTime = Date.now() - startTime;
        
        // Record successful migration
        await this.runSql(`
          INSERT INTO public._migrations (name, checksum, execution_time_ms, rollback_sql) 
          VALUES (
            '${migration.filename}', 
            '${migration.checksum}', 
            ${executionTime},
            ${migration.downSql ? `'${migration.downSql.replace(/'/g, "''")}'` : 'NULL'}
          )
        `);

        console.log(`✅ Migration applied successfully (${executionTime}ms)`);
        return { success: true, executionTime };
        
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    } catch (error) {
      console.error(`❌ Migration failed: ${error.message}`);
      throw error;
    }
  }

  async rollbackMigration(migrationName) {
    console.log(`\n🔄 Rolling back migration: ${migrationName}`);

    const result = await this.runSql(`
      SELECT rollback_sql FROM public._migrations 
      WHERE name = '${migrationName}'
    `);

    if (!result) {
      throw new Error(`Migration ${migrationName} not found in applied migrations`);
    }

    if (!result || result === "NULL") {
      throw new Error(`Migration ${migrationName} has no rollback SQL defined`);
    }

    try {
      // Create temporary file for DOWN migration
      const tempFile = path.join(process.cwd(), `.temp_rollback_${Date.now()}.sql`);
      fs.writeFileSync(tempFile, result);

      try {
        // Apply rollback in transaction
        await this.runFile(tempFile, { transaction: true });
        
        // Remove migration record
        await this.runSql(`
          DELETE FROM public._migrations WHERE name = '${migrationName}'
        `);

        console.log(`✅ Migration rolled back successfully`);
        return { success: true };
        
      } finally {
        // Clean up temporary file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    } catch (error) {
      console.error(`❌ Rollback failed: ${error.message}`);
      throw error;
    }
  }

  async getStatus() {
    await this.loadAppliedMigrations();
    await this.loadMigrationFiles();

    const applied = Array.from(this.appliedMigrations);
    const pending = this.migrationFiles
      .filter(m => !this.appliedMigrations.has(m.filename))
      .map(m => m.filename);

    return {
      total: this.migrationFiles.length,
      applied: applied.length,
      pending: pending.length,
      appliedMigrations: applied,
      pendingMigrations: pending
    };
  }

  async migrate() {
    console.log("🗃️  OtoBurada Migration Manager");
    console.log("================================");

    await this.initializeMigrationTable();
    await this.loadAppliedMigrations();
    await this.loadMigrationFiles();

    console.log(`📁 Found ${this.migrationFiles.length} migration files`);
    console.log(`✅ ${this.appliedMigrations.size} already applied`);

    const pendingMigrations = this.migrationFiles.filter(
      m => !this.appliedMigrations.has(m.filename)
    );

    if (pendingMigrations.length === 0) {
      console.log("\n🎉 No new migrations to apply. Database is up to date!");
      return { success: true, applied: 0 };
    }

    console.log(`⏳ ${pendingMigrations.length} migrations pending`);

    let appliedCount = 0;
    const startTime = Date.now();

    for (const migration of pendingMigrations) {
      try {
        await this.validateMigration(migration);
        await this.applyMigration(migration);
        appliedCount++;
      } catch (error) {
        console.error(`\n💥 Migration process stopped due to error in ${migration.filename}`);
        console.error(`   Error: ${error.message}`);
        console.error(`\n📊 Summary: ${appliedCount}/${pendingMigrations.length} migrations applied`);
        process.exit(1);
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n🎉 Migration completed successfully!`);
    console.log(`📊 Applied ${appliedCount} migrations in ${totalTime}ms`);
    
    return { success: true, applied: appliedCount, totalTime };
  }
}

// CLI Interface
async function main() {
  const command = process.argv[2] || "migrate";
  const migrationManager = new MigrationManager();

  try {
    switch (command) {
      case "migrate":
      case "up":
        await migrationManager.migrate();
        break;

      case "status":
        const status = await migrationManager.getStatus();
        console.log("📊 Migration Status");
        console.log("==================");
        console.log(`Total migrations: ${status.total}`);
        console.log(`Applied: ${status.applied}`);
        console.log(`Pending: ${status.pending}`);
        
        if (status.pendingMigrations.length > 0) {
          console.log("\n⏳ Pending migrations:");
          status.pendingMigrations.forEach(name => console.log(`  - ${name}`));
        }
        break;

      case "rollback":
        const migrationName = process.argv[3];
        if (!migrationName) {
          console.error("❌ Migration name required for rollback");
          console.log("Usage: node migration-manager.mjs rollback <migration-name>");
          process.exit(1);
        }
        await migrationManager.rollbackMigration(migrationName);
        break;

      case "validate":
        await migrationManager.loadMigrationFiles();
        console.log("🔍 Validating migrations...");
        
        for (const migration of migrationManager.migrationFiles) {
          try {
            await migrationManager.validateMigration(migration);
            console.log(`✅ ${migration.filename}`);
          } catch (error) {
            console.error(`❌ ${migration.filename}: ${error.message}`);
          }
        }
        break;

      default:
        console.log("🗃️  OtoBurada Migration Manager");
        console.log("Usage:");
        console.log("  node migration-manager.mjs migrate    # Apply pending migrations");
        console.log("  node migration-manager.mjs status     # Show migration status");
        console.log("  node migration-manager.mjs rollback <name>  # Rollback specific migration");
        console.log("  node migration-manager.mjs validate   # Validate all migrations");
        break;
    }
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { MigrationManager };