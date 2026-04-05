"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, ListChecks, UserCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

const dashboardNavItems = [
  {
    href: "/dashboard",
    label: "Genel Bakış",
    icon: LayoutGrid,
  },
  {
    href: "/dashboard/listings",
    label: "İlanlarım",
    icon: ListChecks,
  },
  {
    href: "/dashboard/favorites",
    label: "Favoriler",
    icon: Heart,
  },
  {
    href: "/dashboard/profile",
    label: "Profil",
    icon: UserCircle2,
  },
] as const;

export function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <>
      <nav aria-label="Dashboard menü" className="hidden xl:block">
        <div className="rounded-[1.75rem] border border-border/80 bg-background p-4 shadow-sm">
          <ul className="space-y-2">
            {dashboardNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <nav aria-label="Dashboard mobil menü" className="xl:hidden">
        <div className="overflow-x-auto pb-1">
          <ul className="flex gap-2">
            {dashboardNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="size-4" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>
    </>
  );
}
