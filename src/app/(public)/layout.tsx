import type { PropsWithChildren } from "react";

import { PublicShell } from "@/features/layout/components/public-shell";

export const revalidate = 60;

export default async function PublicLayout({ children }: PropsWithChildren) {
  // We intentionally do not block rendering here for maintenance mode.
  // The middleware.ts is responsible for redirecting non-admins to /maintenance
  // while explicitly allowing access to the /login page.

  return <PublicShell>{children}</PublicShell>;
}
