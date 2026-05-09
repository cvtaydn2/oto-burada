import { ArrowLeft, Coins, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/lib/actions";

interface DashboardShellProps extends PropsWithChildren {
  email: string | null;
  isAdmin?: boolean;
  balanceCredits?: number;
}

export function DashboardShell({
  children,
  email,
  isAdmin,
  balanceCredits = 0,
}: DashboardShellProps) {
  return (
    <div className="min-h-screen bg-muted/25">
      {/* Skip navigation */}
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-sm"
      >
        Ana içeriğe geç
      </a>
      <div className="mx-auto w-full max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6">
        <section className="mb-4 rounded-[1.5rem] border border-border/70 bg-card/95 p-4 shadow-[0_22px_54px_-36px_rgba(15,23,42,0.3)] sm:mb-6 sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3 sm:items-center sm:gap-4">
              <Link
                href="/"
                aria-label="Ana sayfaya dön"
                className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-muted/35 text-muted-foreground/80 transition hover:border-primary/20 hover:bg-card hover:text-primary hover:shadow-sm sm:mt-0 sm:size-11"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              <div className="min-w-0">
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  Satıcı Paneli
                </p>
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
                  <p className="truncate text-lg font-bold leading-none tracking-tight text-foreground sm:text-[1.35rem]">
                    {email ?? "Kullanıcı"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    İlanlarını, mesajlarını ve paketlerini tek yerden yönet.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                <Link href="/dashboard/pricing" className="min-w-0">
                  <Badge
                    variant="secondary"
                    className="flex h-auto min-h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2 text-center text-amber-800 transition-colors hover:bg-amber-100 sm:h-9 sm:w-auto sm:justify-start sm:py-0"
                  >
                    <Coins size={14} className="shrink-0 text-amber-500" />
                    <span className="font-bold">{balanceCredits} İlan Hakkı</span>
                  </Badge>
                </Link>
                {isAdmin && (
                  <Link href="/admin" className="sm:shrink-0">
                    <Button
                      variant="outline"
                      className="h-10 w-full gap-2 rounded-xl border-primary/10 bg-primary/5 px-4 text-xs font-bold text-primary shadow-sm hover:bg-primary/10 sm:h-9 sm:w-auto"
                    >
                      <ShieldCheck size={15} />
                      Admin Paneli
                    </Button>
                  </Link>
                )}
              </div>
              <form action={logoutAction} className="sm:shrink-0">
                <Button
                  type="submit"
                  className="inline-flex h-10 w-full items-center justify-center rounded-xl border border-border/70 bg-background px-4 text-sm font-medium text-muted-foreground transition hover:border-red-200 hover:bg-red-50/70 hover:text-red-600 sm:h-9 sm:w-auto"
                >
                  Çıkış
                </Button>
              </form>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-4 md:flex-row lg:gap-6">
          <aside
            aria-label="Kullanıcı paneli navigasyonu"
            className="w-full shrink-0 md:w-60 lg:w-64"
          >
            <div className="rounded-[1.35rem] border border-border/70 bg-card/95 p-2 shadow-sm shadow-slate-950/5 md:sticky md:top-24">
              <div className="mb-2 flex items-center justify-between px-2 pt-1 md:hidden">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                  Hızlı Geçişler
                </p>
                <span className="text-[10px] font-medium text-muted-foreground/70">Kaydır</span>
              </div>
              <nav className="overflow-hidden">
                <DashboardNavigation variant="sidebar" />
              </nav>
            </div>
          </aside>

          <main id="dashboard-main" className="min-w-0 flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
