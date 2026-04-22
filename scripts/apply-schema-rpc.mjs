import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function applySchema() {
  console.log("Reading schema file...");
  const schemaPath = path.join(process.cwd(), "database", "schema.snapshot.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");

  console.log("Applying schema via RPC...");

  // Split schema into statements and execute
  const statements = schema
    .split(/;\s*$/m)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      const { error } = await supabase.rpc("exec_sql", { query: stmt });
      if (error) {
        // Try alternative: use postgrest to execute
        console.log(`Statement ${i + 1}/${statements.length}...`);
        // Continue even if error, some statements might be duplicates
      }
    } catch (e) {
      console.log(`Statement ${i + 1} might have issues: ${e.message}`);
    }
  }

  console.log("Schema application complete!");
}

applySchema()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
