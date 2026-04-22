import { AdminSettingsForm } from "@/components/forms/admin-settings-form";
import { requireAdminUser } from "@/lib/auth/session";
import { getPlatformSettings } from "@/services/admin/settings";

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
