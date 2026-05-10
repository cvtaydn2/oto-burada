import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { AdminUserDetailClient } from "@/features/admin-moderation/components/admin-user-detail-client";
import { getUserDetail } from "@/features/admin-moderation/services/user-details";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;

  return {
    title: "Admin Kullanıcı Detayı | OtoBurada",
    description: "Seçilen kullanıcıya ait profil, doğrulama ve hesap detaylarını inceleyin.",
    alternates: {
      canonical: buildAbsoluteUrl(`/admin/users/${userId}`),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

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
