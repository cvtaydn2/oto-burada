import type { PropsWithChildren } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireUser, getUserRole } from "@/lib/auth/session";

export default async function DashboardLayout({ children }: PropsWithChildren) {
  const user = await requireUser();

  return (
    <DashboardShell 
      email={user.email ?? null} 
      isAdmin={getUserRole(user) === "admin"}
    >
      {children}
    </DashboardShell>
  );
}
