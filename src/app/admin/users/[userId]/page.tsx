import { notFound } from "next/navigation";

import { AdminUserDetailClient } from "@/features/admin-moderation/components/admin-user-detail-client";
import { getUserDetail } from "@/features/admin-moderation/services/user-details";
import { requireAdminUser } from "@/features/auth/lib/session";

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
