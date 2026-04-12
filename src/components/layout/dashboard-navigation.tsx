"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, LayoutGrid, ListChecks, UserCircle2, Zap } from "lucide-react";

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
  {
    href: "/dashboard/pricing",
    label: "Paketler",
    icon: Zap,
  },
] as const;

export function DashboardNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Dashboard menü" className="overflow-x-auto">
      <ul className="flex gap-2">
        {dashboardNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground border border-border",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
