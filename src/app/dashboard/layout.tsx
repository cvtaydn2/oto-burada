import type { PropsWithChildren } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { MaintenanceScreen } from "@/components/shared/maintenance-screen";
import { getAuthContext, requireUser } from "@/lib/auth/session";
import { shouldShowMaintenanceScreen } from "@/lib/platform/maintenance";
import { getPlatformSettings } from "@/services/admin/settings";
import { getStoredProfileById } from "@/services/profile/profile-records";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await requireUser();
  const { dbProfile } = await getAuthContext();
  const settings = await getPlatformSettings();
  const isMaintenanceMode = settings.general_appearance?.maintenance_mode;
  const isAdmin = dbProfile?.role === "admin" && !dbProfile.isBanned;

  if (shouldShowMaintenanceScreen(isMaintenanceMode) && !isAdmin) {
    return <MaintenanceScreen />;
  }

  const profile = await getStoredProfileById(user.id);

  return (
    <DashboardShell
      email={user.email ?? null}
      isAdmin={isAdmin}
      balanceCredits={profile?.balanceCredits ?? 0}
    >
      {children}
    </DashboardShell>
  );
}
