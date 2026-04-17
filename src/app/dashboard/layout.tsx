import type { PropsWithChildren } from "react";

import { FavoritesProvider } from "@/components/shared/favorites-provider";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser, getUserRole } from "@/lib/auth/session";
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
