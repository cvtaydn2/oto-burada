import { ArrowLeft, Coins, ShieldCheck } from "lucide-react";
import Link from "next/link";
import type { PropsWithChildren } from "react";

import { DashboardNavigation } from "@/components/layout/dashboard-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/lib/auth/actions";

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
    <div className="min-h-screen bg-muted/30">
      {/* Skip navigation */}
      <a
        href="#dashboard-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-sm"
      >
        Ana içeriğe geç
      </a>
      <div className="mx-auto max-w-[1400px] w-full px-4 py-8">
        {/* Top Header */}
        <section className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                aria-label="Ana sayfaya dön"
                className="flex size-10 items-center justify-center rounded-xl bg-muted/30 text-muted-foreground/70 border border-border/50 transition hover:bg-card hover:text-primary hover:border-primary/20 hover:shadow-sm"
              >
                <ArrowLeft size={18} aria-hidden="true" />
              </Link>
              <div>
                <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                  Satıcı Paneli
                </p>
                <p className="text-xl font-bold text-foreground leading-none">
                  {email ?? "Kullanıcı"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/dashboard/pricing">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <Coins size={14} className="text-amber-500" />
                  <span className="font-bold">{balanceCredits} İlan Hakkı</span>
                </Badge>
              </Link>
              {isAdmin && (
                <Link href="/admin">
                  <Button
                    variant="outline"
                    className="h-9 border-primary/10 bg-primary/5 text-primary hover:bg-primary/10 gap-2 font-bold rounded-xl shadow-sm text-xs"
                  >
                    <ShieldCheck size={15} />
                    Admin Paneli
                  </Button>
                </Link>
              )}
              <form action={logoutAction}>
                <Button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-medium text-muted-foreground transition hover:bg-muted/30 hover:text-red-500 hover:border-red-100"
                >
                  Çıkış
                </Button>
              </form>
            </div>
          </div>
        </section>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex flex-col md:flex-row gap-6 lg:gap-8">
          {/* Sidebar Navigation — mobilde yatay scroll */}
          <aside
            aria-label="Kullanıcı paneli navigasyonu"
            className="w-full md:w-56 lg:w-64 shrink-0"
          >
            <nav className="rounded-xl border border-border bg-card overflow-hidden md:sticky md:top-24 shadow-sm">
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
