import { headers } from "next/headers";
import type { PropsWithChildren } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { MaintenanceScreen } from "@/components/shared/maintenance-screen";
import { getCurrentUser, getUserRole } from "@/lib/auth/session";
import { getPlatformSettings } from "@/services/admin/settings";

export default async function PublicLayout({ children }: PropsWithChildren) {
  const user = await getCurrentUser();
  const settings = await getPlatformSettings();
  const isMaintenanceMode = settings.general_appearance?.maintenance_mode;
  const pathname = (await headers()).get("x-pathname") ?? "";

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/auth");

  if (isMaintenanceMode && !isAuthRoute && (!user || getUserRole(user) !== "admin")) {
    return <MaintenanceScreen />;
  }

  return <PublicShell>{children}</PublicShell>;
}
