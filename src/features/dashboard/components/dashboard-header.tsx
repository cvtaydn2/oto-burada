"use client";

import { ClipboardList, LayoutDashboard, MessageSquare, Plus, Settings, Star } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboard } from "@/lib/ui-strings";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  userEmail?: string;
}

const dashboardHeaderTabs = [
  { label: dashboard.summary, href: "/dashboard", icon: LayoutDashboard, exact: true },
  { label: dashboard.myListings, href: "/dashboard/listings", icon: ClipboardList, exact: false },
  { label: dashboard.messages, href: "/dashboard/messages", icon: MessageSquare, exact: false },
  { label: dashboard.favorites, href: "/dashboard/favorites", icon: Star, exact: false },
  { label: dashboard.settings, href: "/dashboard/profile", icon: Settings, exact: false },
] as const;

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const pathname = usePathname();
  const displayName = userEmail?.split("@")[0] ?? "Sürücü";

  return (
    <section className="rounded-2xl border border-border/70 bg-card/95 p-4 shadow-sm sm:p-6 lg:p-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary/80">
            <LayoutDashboard size={12} className="text-primary" />
            {dashboard.controlCenter}
          </div>
          <div className="space-y-1">
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              Hoş geldin, <span className="text-primary">{displayName}</span>
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              İlanlarını, mesajlarını ve hesap tercihlerini tek bakışta yönet.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Link
            href="/dashboard/listings?create=true"
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-[0.99] sm:w-auto"
          >
            <Plus size={18} />
            {dashboard.newListing}
          </Link>
        </div>
      </div>

      <div className="mt-5 border-t border-border/70 pt-4 sm:mt-6 sm:pt-5 md:hidden">
        <div className="mb-2 flex items-center justify-between sm:hidden">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
            Sık kullanılanlar
          </p>
          <span className="text-[10px] text-muted-foreground/70">Kaydır</span>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex min-w-max gap-2">
            {dashboardHeaderTabs.map((tab) => {
              const isActive = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
              return (
                <Link
                  key={tab.label}
                  href={tab.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-[11px] font-bold uppercase tracking-[0.14em] whitespace-nowrap transition-all",
                    isActive
                      ? "border-primary/10 bg-primary text-primary-foreground shadow-sm shadow-primary/20"
                      : "border-border/70 bg-background text-muted-foreground hover:border-primary/15 hover:bg-primary/5 hover:text-primary"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
