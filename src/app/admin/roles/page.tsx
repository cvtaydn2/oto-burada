import type { Metadata } from "next";

import { AdminRolesClient } from "@/features/admin-moderation/components/admin-roles-client";
import { getAdminRoles } from "@/features/admin-moderation/services/roles";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Roller ve Yetkiler | OtoBurada",
  description: "Platform rol ve yetki matrisini yönetim panelinden görüntüleyin ve yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/roles"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminRolesPage() {
  await requireAdminUser();
  const roles = await getAdminRoles();

  return <AdminRolesClient initialRoles={roles} />;
}
