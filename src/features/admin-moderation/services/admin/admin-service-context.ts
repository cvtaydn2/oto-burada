import { requireAdminUser } from "@/features/auth/lib/session";
import { createSupabaseAdminClient } from "@/lib/admin";
import { hasSupabaseAdminEnv } from "@/lib/env";

export async function requireAdminServiceContext(options?: { requireServiceRole?: boolean }) {
  const adminUser = await requireAdminUser();

  if (options?.requireServiceRole !== false && !hasSupabaseAdminEnv()) {
    throw new Error(
      "Admin servis işlemi için SUPABASE_SERVICE_ROLE_KEY gerekli. Yapılandırma eksik olduğu için işlem fail-closed durduruldu."
    );
  }

  return {
    adminUser,
    admin: createSupabaseAdminClient(),
  };
}
