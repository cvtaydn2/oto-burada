import type { PropsWithChildren } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAuthContext, requireUser } from "@/lib/auth/session";
import { getStoredProfileById } from "@/services/profile/profile-records";

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
