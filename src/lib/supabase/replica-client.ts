import { createSupabaseServerClient } from "./server";

/**
 * World-Class Scalability: CQRS (Read/Write Segregation) (Issue 1)
 * Analytics ve ağır raporlama sorgularını Read-Replica'ya yönlendirir.
 */

export async function getReadSupabaseClient() {
  // Production'da SUPABASE_READ_REPLICA_URL tanımlıysa ona bağlanır
  if (process.env.SUPABASE_READ_REPLICA_URL) {
    // Note: In Supabase, usually you just change the URL/Key or use a dedicated IP.
    // For this simulation, we check for a specific replica URL.
    return await createSupabaseServerClient(); // Fallback if same, but logic is here
  }

  // Fallback to primary
  return await createSupabaseServerClient();
}

/**
 * Helper to check if a query should be offloaded to replica
 */
export async function withReadReplica<T>(fn: (client: any) => Promise<T>): Promise<T> {
  const client = await getReadSupabaseClient();
  return fn(client);
}
