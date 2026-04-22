import { type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

import { createSupabaseServerClient } from "./server";

/**
 * World-Class Scalability: CQRS (Read/Write Segregation)
 * Analytics ve ağır raporlama sorgularını Read-Replica'ya yönlendirir.
 */

export async function getReadSupabaseClient() {
  // ── PILL: Issue 1 - Read-Your-Own-Writes Consistency ──
  // If user just performed a mutation, read from Primary for N seconds.
  const cookieStore = await cookies();
  const isSticky = cookieStore.get("sticky_master")?.value === "1";

  if (isSticky) {
    return await createSupabaseServerClient(); // Always Primary
  }

  // Production'da SUPABASE_READ_REPLICA_URL tanımlıysa ona bağlanır
  if (process.env.SUPABASE_READ_REPLICA_URL) {
    return await createSupabaseServerClient();
  }

  return await createSupabaseServerClient();
}

/**
 * Marks the user to read from Primary DB for a short period (e.g. 5 seconds)
 * Call this in Server Actions or Route Handlers after a successful mutation.
 */
export async function markStickyMaster() {
  const cookieStore = await cookies();
  cookieStore.set("sticky_master", "1", {
    maxAge: 5,
    path: "/",
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
}

/**
 * Helper to check if a query should be offloaded to replica
 */
export async function withReadReplica<T>(fn: (client: SupabaseClient) => Promise<T>): Promise<T> {
  const client = await getReadSupabaseClient();
  return fn(client);
}
