import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";

const scriptPaths = [
  "scripts/check-supabase-env.mjs",
  "scripts/apply-supabase-schema.mjs",
  "scripts/seed-supabase-demo.mjs",
  "scripts/verify-supabase-demo.mjs",
];

for (const relativePath of scriptPaths) {
  const absolutePath = path.resolve(process.cwd(), relativePath);

  console.log(`Running ${relativePath}`);

  const result = spawnSync(process.execPath, [absolutePath], {
    env: process.env,
    stdio: "inherit",
  });

  if (result.error) {
    console.error(result.error.message);
    process.exit(1);
  }

  if (typeof result.status === "number" && result.status !== 0) {
    process.exit(result.status);
  }
}

console.log("Supabase demo bootstrap completed.");
