"use client";

import {
  Bell,
  DollarSign,
  Heart,
  LayoutGrid,
  ListChecks,
  MessageSquare,
  Search,
  ShieldCheck,
  Store,
  UserCircle2,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib";

const dashboardNavItems = [
  { href: "/dashboard", label: "Özet Panel", icon: LayoutGrid, exact: true },
  { href: "/dashboard/listings", label: "İlanlarım", icon: ListChecks, exact: false },
  { href: "/dashboard/stok", label: "Stok Yönetimi", icon: Store, exact: false },
  { href: "/dashboard/messages", label: "Mesajlar", icon: MessageSquare, exact: false },
  { href: "/dashboard/favorites", label: "Favoriler", icon: Heart, exact: false },
  { href: "/dashboard/notifications", label: "Bildirimler", icon: Bell, exact: false },
  { href: "/dashboard/saved-searches", label: "Kayıtlı Aramalar", icon: Search, exact: false },
  { href: "/dashboard/reservations", label: "Rezervasyonlar", icon: ShieldCheck, exact: false },
  { href: "/dashboard/teklifler", label: "Teklifler", icon: DollarSign, exact: false },
  { href: "/dashboard/pricing", label: "Paketler", icon: Zap, exact: false },
  { href: "/dashboard/profile", label: "Hesap Ayarları", icon: UserCircle2, exact: false },
] as const;

interface DashboardNavigationProps {
  variant?: "tabs" | "sidebar";
}

export function DashboardNavigation({ variant = "tabs" }: DashboardNavigationProps) {
  const pathname = usePathname();

  if (variant === "sidebar") {
    return (
      <div className="overflow-x-auto md:overflow-visible">
        <ul className="flex min-w-max gap-2 px-1 pb-1 md:min-w-0 md:flex-col md:gap-1 md:px-0 md:pb-0">
          {dashboardNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="shrink-0 md:shrink md:[&:not(:last-child)]:mb-0.5">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-11 items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition-all whitespace-nowrap md:min-h-[unset] md:whitespace-normal md:px-3.5",
                    isActive
                      ? "border-primary/20 bg-primary/10 text-primary shadow-sm shadow-primary/10"
                      : "border-transparent bg-background/60 text-muted-foreground hover:border-border/80 hover:bg-muted/40 hover:text-foreground"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl border transition-colors",
                      isActive
                        ? "border-primary/20 bg-primary/10 text-primary"
                        : "border-border/60 bg-background text-muted-foreground"
                    )}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="leading-tight">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // tabs variant (horizontal)
  return (
    <nav aria-label="Dashboard menü" className="overflow-x-auto pb-2 scrollbar-hide">
      <ul className="flex gap-2.5">
        {dashboardNavItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all",
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border-border/70 bg-card text-muted-foreground hover:border-primary/15 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <Icon
                  size={17}
                  className={cn(isActive ? "text-white" : "text-muted-foreground/70")}
                />
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
