import type { Metadata } from "next";

import { AdminSettingsForm } from "@/components/forms/admin-settings-form";
import { getPlatformSettings } from "@/features/admin-moderation/services/settings";
import { requireAdminUser } from "@/features/auth/lib/session";
import { buildAbsoluteUrl } from "@/features/seo/lib";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin Sistem Ayarları | OtoBurada",
  description: "Platform ayarlarını ve yönetim konfigürasyonlarını güvenli şekilde yönetin.",
  alternates: {
    canonical: buildAbsoluteUrl("/admin/settings"),
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AdminSettingsPage() {
  await requireAdminUser();
  const initialSettings = await getPlatformSettings();

  return (
    <main className="p-6 lg:p-8 bg-muted/30 min-h-full">
      <AdminSettingsForm initialSettings={initialSettings} />
    </main>
  );
}
