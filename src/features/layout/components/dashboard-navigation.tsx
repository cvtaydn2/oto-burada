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

import { cn } from "@/features/shared/lib";

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
      // Mobilde yatay scroll, md'de dikey liste
      <div className="overflow-x-auto md:overflow-visible">
        <ul className="flex md:flex-col gap-0.5 px-2 py-1 min-w-max md:min-w-0">
          {dashboardNavItems.map((item) => {
            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <li key={item.href} className="shrink-0 md:shrink">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal",
                    isActive
                      ? "bg-primary/10 text-primary md:border-l-4 md:border-primary md:rounded-l-none"
                      : "text-gray-600 hover:bg-gray-50 md:border-l-4 md:border-transparent hover:text-gray-800"
                  )}
                >
                  <Icon size={17} className={cn(isActive ? "text-primary" : "text-gray-400")} />
                  <span>{item.label}</span>
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
      <ul className="flex gap-3">
        {dashboardNavItems.map((item) => {
          const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "bg-white text-slate-500 hover:text-primary hover:bg-primary/5 border border-slate-200"
                )}
              >
                <Icon size={18} className={cn(isActive ? "text-white" : "text-slate-400")} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
