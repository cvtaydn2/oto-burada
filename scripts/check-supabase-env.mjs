import process from "node:process";

import { loadLocalEnv } from "./load-local-env.mjs";

loadLocalEnv();

const requiredKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_STORAGE_BUCKET_LISTINGS",
];

const bootstrapOnlyKeys = ["SUPABASE_DB_URL", "SUPABASE_DEMO_USER_PASSWORD"];

const formatStatus = (key) => `${process.env[key] ? "OK " : "MISS"} ${key}`;

function main() {
  console.log("Checking Supabase environment...");

  requiredKeys.forEach((key) => {
    console.log(formatStatus(key));
  });

  console.log("");
  console.log("Bootstrap helpers:");

  bootstrapOnlyKeys.forEach((key) => {
    console.log(formatStatus(key));
  });

  const missingRequired = requiredKeys.filter((key) => !process.env[key]);

  if (missingRequired.length > 0) {
    console.error("");
    console.error(`Missing required variables: ${missingRequired.join(", ")}`);
    process.exit(1);
  }

  console.log("");
  console.log("Required environment looks ready.");
}

main();
