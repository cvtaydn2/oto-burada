import { getPlatformSettings } from "@/features/admin-moderation/services/settings";
import { requireAdminUser } from "@/features/auth/lib/session";
import { AdminSettingsForm } from "@/features/forms/components/admin-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminUser();
  const initialSettings = await getPlatformSettings();

  return (
    <main className="p-6 lg:p-8 bg-muted/30 min-h-full">
      <AdminSettingsForm initialSettings={initialSettings} />
    </main>
  );
}
