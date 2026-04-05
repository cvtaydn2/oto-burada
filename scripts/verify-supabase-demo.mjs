import process from "node:process";

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET_LISTINGS;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const expectedDemoEmails = [
  "admin@otoburada.demo",
  "emre@otoburada.demo",
  "ayse@otoburada.demo",
  "burak@otoburada.demo",
];

const expectedMinimums = {
  admin_actions: 1,
  favorites: 1,
  listing_images: 9,
  listings: 3,
  profiles: 4,
  reports: 1,
};

async function listAllUsers() {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error) {
      throw error;
    }

    const batch = data?.users ?? [];
    users.push(...batch);

    if (batch.length < 200) {
      return users;
    }

    page += 1;
  }
}

async function countRows(table) {
  const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function verifyStorage() {
  if (!storageBucket) {
    return {
      message: "MISS SUPABASE_STORAGE_BUCKET_LISTINGS",
      ok: false,
    };
  }

  const { data, error } = await supabase.storage.getBucket(storageBucket);

  if (error || !data) {
    return {
      message: `FAIL storage bucket ${storageBucket}: ${error?.message ?? "not found"}`,
      ok: false,
    };
  }

  return {
    message: `OK storage bucket ${storageBucket}`,
    ok: true,
  };
}

async function main() {
  console.log("Verifying Supabase demo state...");

  const users = await listAllUsers();
  const userEmails = new Set(users.map((user) => user.email).filter(Boolean));
  const missingEmails = expectedDemoEmails.filter((email) => !userEmails.has(email));

  if (missingEmails.length > 0) {
    console.error(`FAIL demo auth users missing: ${missingEmails.join(", ")}`);
    process.exit(1);
  }

  console.log(`OK demo auth users: ${expectedDemoEmails.length}`);

  for (const [table, minimum] of Object.entries(expectedMinimums)) {
    const count = await countRows(table);

    if (count < minimum) {
      console.error(`FAIL ${table}: expected at least ${minimum}, got ${count}`);
      process.exit(1);
    }

    console.log(`OK ${table}: ${count}`);
  }

  const storageResult = await verifyStorage();

  if (!storageResult.ok) {
    console.error(storageResult.message);
    process.exit(1);
  }

  console.log(storageResult.message);
  console.log("Supabase demo verification completed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
