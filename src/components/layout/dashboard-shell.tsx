import type { PropsWithChildren } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";

interface DashboardShellProps extends PropsWithChildren {
  email: string | null;
}

export function DashboardShell({ children, email }: DashboardShellProps) {
  return (
    <main className="bg-muted/40 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="rounded-2xl border border-border/80 bg-background p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-primary/80">
                Kullanıcı Paneli
              </p>
              <h1 className="text-2xl font-semibold tracking-tight">Hesabını yönet</h1>
              <p className="text-sm leading-5 text-muted-foreground">
                {email ?? "Giriş yapan kullanıcı"}
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-background px-4 text-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                Çıkış
              </button>
            </form>
          </div>
        </section>

        <DashboardNavigation />

        <div>{children}</div>
      </div>
    </main>
  );
}
