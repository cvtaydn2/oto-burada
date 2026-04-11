import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf-8");
const env = {};
envFile.split("\n").forEach(line => {
  const [key, ...value] = line.split("=");
  if (key && value.length) env[key.trim()] = value.join("=").trim();
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: users, error: getError } = await supabase.auth.admin.listUsers();
  if (getError) throw getError;
  const user = users.users.find(u => u.email === "emre@otoburada.demo");
  if (!user) {
    console.log("User not found, creating...");
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: "emre@otoburada.demo",
      password: "test-123456",
      email_confirm: true
    });
    if (createError) throw createError;
    console.log("Created user:", newUser.user.email);
  } else {
    console.log("Updating password for:", user.email);
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: "test-123456"
    });
    if (updateError) throw updateError;
    console.log("Password updated!");
  }
}

run().catch(console.error);
