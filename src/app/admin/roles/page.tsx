import { AdminRolesClient } from "@/features/admin-moderation/components/admin-roles-client";
import { getAdminRoles } from "@/features/admin-moderation/services/roles";
import { requireAdminUser } from "@/features/auth/lib/session";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdminUser();
  const roles = await getAdminRoles();

  return <AdminRolesClient initialRoles={roles} />;
}
