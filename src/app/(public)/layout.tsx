import type { PropsWithChildren } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { getAuthContext } from "@/lib/auth/session";
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

  // We intentionally do not block rendering here for maintenance mode.
  // The middleware.ts is responsible for redirecting non-admins to /maintenance
  // while explicitly allowing access to the /login page.

  return <PublicShell>{children}</PublicShell>;
}
