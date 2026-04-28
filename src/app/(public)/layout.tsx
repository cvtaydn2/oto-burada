import type { PropsWithChildren } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { MaintenanceScreen } from "@/components/shared/maintenance-screen";
import { getAuthContext } from "@/lib/auth/session";
import { shouldShowMaintenanceScreen } from "@/lib/platform/maintenance";
import { getPlatformSettings } from "@/services/admin/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSafeAuthContext() {
  try {
    return await getAuthContext();
  } catch {
    return { dbProfile: null };
  }
}

async function getSafePlatformSettings() {
  try {
    return await getPlatformSettings();
  } catch {
    return { general_appearance: { maintenance_mode: false } };
  }
}

export default async function PublicLayout({ children }: PropsWithChildren) {
  const [{ dbProfile }, settings] = await Promise.all([
    getSafeAuthContext(),
    getSafePlatformSettings(),
  ]);

  const isMaintenanceMode = settings.general_appearance?.maintenance_mode;
  const isAdmin = dbProfile?.role === "admin" && !dbProfile.isBanned;

  if (shouldShowMaintenanceScreen(isMaintenanceMode) && !isAdmin) {
    return <MaintenanceScreen />;
  }

  return <PublicShell>{children}</PublicShell>;
}
