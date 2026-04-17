import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const databaseUrl = process.env.SUPABASE_DB_URL;
const migrationsDir = path.resolve(process.cwd(), "database", "migrations");

if (!databaseUrl) {
  console.error("SUPABASE_DB_URL is required.");
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

async function runSql(sql) {
  const result = spawnSync(psqlCommand, [databaseUrl, "-c", sql, "-t", "-A"], { encoding: "utf8" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}

async function runFile(filePath) {
  const result = spawnSync(psqlCommand, [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", filePath], { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Migration failed: ${path.basename(filePath)}`);
}

async function main() {
  console.log("Checking migration tracking table...");
  
  await runSql(`
    CREATE TABLE IF NOT EXISTS public._migrations (
      id serial PRIMARY KEY,
      name text UNIQUE NOT NULL,
      executed_at timestamptz DEFAULT now()
    );
  `);

  const appliedMigrations = (await runSql("SELECT name FROM public._migrations")).split("\n").filter(Boolean);
  
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith(".sql"))
    .sort(); // Alpha-numerical sort

  console.log(`Found ${files.length} migration files.`);

  let runCount = 0;
  for (const file of files) {
    if (appliedMigrations.includes(file)) {
      continue;
    }

    console.log(`\n🚀 Applying migration: ${file}`);
    try {
      await runFile(path.join(migrationsDir, file));
      await runSql(`INSERT INTO public._migrations (name) VALUES ('${file}')`);
      runCount++;
    } catch (err) {
      console.error(`\n❌ Error applying ${file}:`);
      console.error(err.message);
      process.exit(1);
    }
  }

  if (runCount === 0) {
    console.log("No new migrations to apply.");
  } else {
    console.log(`\n✅ Finished! Applied ${runCount} migrations.`);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
