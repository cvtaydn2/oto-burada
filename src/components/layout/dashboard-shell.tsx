import type { PropsWithChildren } from "react";

import { logoutAction } from "@/lib/auth/actions";
import { DashboardNavigation } from "@/components/layout/dashboard-navigation";

interface DashboardShellProps extends PropsWithChildren {
  email: string | null;
}

export function DashboardShell({ children, email }: DashboardShellProps) {
  return (
    <main className="bg-muted/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
        <section className="rounded-[2rem] border border-border/80 bg-background p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium uppercase tracking-[0.18em] text-primary/80">
                Kullanıcı Paneli
              </p>
              <h1 className="text-3xl font-semibold tracking-tight">Hesabını tek yerden yönet</h1>
              <p className="text-sm leading-6 text-muted-foreground sm:text-base">
                {email ?? "Giriş yapan kullanıcı"} hesabı ile bağlı alanları burada görebilir,
                ilanlarını ve favorilerini yönetebilirsin.
              </p>
            </div>

            <form action={logoutAction}>
              <button
                type="submit"
                className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-background px-5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Çıkış Yap
              </button>
            </form>
          </div>
        </section>

        <DashboardNavigation />

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)] xl:items-start">
          <div className="hidden xl:block">
            <DashboardNavigation />
          </div>
          <div>{children}</div>
        </div>
      </div>
    </main>
  );
}
