import type { PropsWithChildren } from "react";

import { getAuthContext, requireUser } from "@/features/auth/lib/session";
import { DashboardShell } from "@/features/layout/components/dashboard-shell";
import { getStoredProfileById } from "@/features/profile/services/profile-records";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await requireUser();
  const { dbProfile } = await getAuthContext();
  const isAdmin = dbProfile?.role === "admin" && !dbProfile.isBanned;

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
