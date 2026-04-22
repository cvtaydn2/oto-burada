import { AdminRolesClient } from "@/components/admin/admin-roles-client";
import { requireAdminUser } from "@/lib/auth/session";
import { getAdminRoles } from "@/services/admin/roles";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdminUser();
  const roles = await getAdminRoles();

  return <AdminRolesClient initialRoles={roles} />;
}
