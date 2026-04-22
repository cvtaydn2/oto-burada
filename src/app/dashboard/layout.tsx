import type { PropsWithChildren } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { getUserRole, requireUser } from "@/lib/auth/session";
import { getStoredProfileById } from "@/services/profile/profile-records";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await requireUser();
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
