import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const schemaPath = path.resolve(process.cwd(), "database", "schema.snapshot.sql");
const databaseUrl = process.env.SUPABASE_DB_URL;

function resolvePsqlCommand() {
  const configuredPath = process.env.PSQL_PATH;

  if (configuredPath && fs.existsSync(configuredPath)) {
    return configuredPath;
  }

  if (process.platform === "win32") {
    const candidates = [
      "C:\\Program Files\\PostgreSQL\\17\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\16\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\15\\bin\\psql.exe",
      "C:\\Program Files\\PostgreSQL\\14\\bin\\psql.exe",
    ];

    const discovered = candidates.find((candidate) => fs.existsSync(candidate));

    if (discovered) {
      return discovered;
    }
  }

  return "psql";
}

if (!databaseUrl) {
  console.error("SUPABASE_DB_URL is required to apply schema.sql.");
  process.exit(1);
}

console.log(`Applying schema from ${schemaPath}`);
const psqlCommand = resolvePsqlCommand();

const result = spawnSync(
  psqlCommand,
  [databaseUrl, "-v", "ON_ERROR_STOP=1", "-f", schemaPath],
  {
    shell: false,
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
