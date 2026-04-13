import { getAdminRoles } from "@/services/admin/roles";
import { requireAdminUser } from "@/lib/auth/session";
import { AdminRolesClient } from "@/components/admin/admin-roles-client";

export const dynamic = "force-dynamic";

export default async function AdminRolesPage() {
  await requireAdminUser();
  const roles = await getAdminRoles();

  return <AdminRolesClient initialRoles={roles} />;
}