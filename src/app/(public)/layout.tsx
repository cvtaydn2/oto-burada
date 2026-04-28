import type { PropsWithChildren } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { MaintenanceScreen } from "@/components/shared/maintenance-screen";
import { getAuthContext } from "@/lib/auth/session";
import { shouldShowMaintenanceScreen } from "@/lib/platform/maintenance";
import { getPlatformSettings } from "@/services/admin/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PublicLayout({ children }: PropsWithChildren) {
  const { dbProfile } = await getAuthContext();
  const settings = await getPlatformSettings();
  const isMaintenanceMode = settings.general_appearance?.maintenance_mode;
  const isAdmin = dbProfile?.role === "admin" && !dbProfile.isBanned;

  if (shouldShowMaintenanceScreen(isMaintenanceMode) && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return <PublicShell>{children}</PublicShell>;
}
