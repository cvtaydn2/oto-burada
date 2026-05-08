import { ArrowLeft, Coins, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";

import { logoutAction } from "@/features/auth/lib/actions";
import { DashboardNavigation } from "@/features/layout/components/dashboard-navigation";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";

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
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:py-8">
        {/* Top Header */}
        <section className="mb-6 rounded-[1.5rem] border border-border/70 bg-card/95 p-5 shadow-[0_22px_54px_-36px_rgba(15,23,42,0.3)] sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                aria-label="Ana sayfaya dön"
                className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/35 text-muted-foreground/80 transition hover:border-primary/20 hover:bg-card hover:text-primary hover:shadow-sm"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-primary/80">
                  Satıcı Paneli
                </p>
                <p className="text-xl font-bold leading-none tracking-tight text-foreground sm:text-[1.4rem]">
                  {email ?? "Kullanıcı"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Link href="/dashboard/pricing">
                <Badge
                  variant="secondary"
                  className="flex h-9 cursor-pointer items-center gap-1.5 rounded-xl border border-amber-200/70 bg-amber-50 px-3 text-amber-800 transition-colors hover:bg-amber-100"
                >
                  <Coins size={14} className="text-amber-500" />
                  <span className="font-bold">{balanceCredits} İlan Hakkı</span>
                </Badge>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="h-9 gap-2 rounded-xl border-primary/10 bg-primary/5 text-xs font-bold text-primary shadow-sm hover:bg-primary/10"
                  >
                    <ShieldCheck size={15} />
                    Admin Paneli
                  </Button>
                </Link>
              )}
              <form action={logoutAction}>
                <Button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border/70 bg-background px-4 text-sm font-medium text-muted-foreground transition hover:border-red-200 hover:bg-red-50/70 hover:text-red-600"
                >
                  Çıkış
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col gap-6 md:flex-row lg:gap-8">
          {/* Sidebar Navigation — mobilde yatay scroll */}
          <aside
            aria-label="Kullanıcı paneli navigasyonu"
            className="w-full md:w-56 lg:w-64 shrink-0"
          >
            <nav className="overflow-hidden rounded-[1.35rem] border border-border/70 bg-card/95 shadow-sm shadow-slate-950/5 md:sticky md:top-24">
              <DashboardNavigation variant="sidebar" />
            </nav>
          </aside>

          {/* Main Content */}
          <main id="dashboard-main" className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
