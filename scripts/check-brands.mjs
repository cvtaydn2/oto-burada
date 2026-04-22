import process from "node:process";

import { createClient } from "@supabase/supabase-js";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function main() {
  console.log("Checking brands data...\n");

  const { data, error } = await supabase
    .from("brands")
    .select("name, image_url")
    .order("name")
    .limit(10);

  if (error) {
    console.log("Error:", error.message);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

main();
