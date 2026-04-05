import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const schemaPath = path.resolve(process.cwd(), "schema.sql");
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error("SUPABASE_DB_URL is required to apply schema.sql.");
  process.exit(1);
}

console.log(`Applying schema from ${schemaPath}`);

const result = spawnSync(
  "psql",
  [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", schemaPath],
  {
    shell: process.platform === "win32",
    stdio: "inherit",
  },
);

if (result.error) {
  console.error("Failed to execute psql. Make sure PostgreSQL client tools are installed and on PATH.");
  console.error(result.error.message);
  process.exit(1);
}

if (typeof result.status === "number" && result.status !== 0) {
  process.exit(result.status);
}

console.log("schema.sql applied successfully.");
