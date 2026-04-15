import { requireAdminUser } from "@/lib/auth/session";
import { getUserDetail } from "@/services/admin/users";
import { notFound } from "next/navigation";
import { AdminUserDetailClient } from "@/components/admin/admin-user-detail-client";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  await requireAdminUser();
  const { userId } = await params;
  const detail = await getUserDetail(userId);

  if (!detail) notFound();

  return <AdminUserDetailClient detail={detail} userId={userId} />;
}
