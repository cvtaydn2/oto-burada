import type { PropsWithChildren } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { MaintenanceScreen } from "@/components/shared/maintenance-screen";
import { getUserRole, requireUser } from "@/lib/auth/session";
import { shouldShowMaintenanceScreen } from "@/lib/platform/maintenance";
import { getPlatformSettings } from "@/services/admin/settings";
import { getStoredProfileById } from "@/services/profile/profile-records";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await requireUser();
  const settings = await getPlatformSettings();
  const isMaintenanceMode = settings.general_appearance?.maintenance_mode;

  if (shouldShowMaintenanceScreen(isMaintenanceMode) && getUserRole(user) !== "admin") {
    return <MaintenanceScreen />;
  }

  const profile = await getStoredProfileById(user.id);

  return (
    <FavoritesProvider>
      <DashboardShell
        email={user.email ?? null}
        isAdmin={getUserRole(user) === "admin"}
        balanceCredits={profile?.balanceCredits ?? 0}
      >
        {children}
      </DashboardShell>
    </FavoritesProvider>
  );
}
