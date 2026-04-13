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
    <nav aria-label="Dashboard menü" className="overflow-x-auto pb-2 scrollbar-hide">
      <ul className="flex gap-3">
        {dashboardNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center gap-2.5 rounded-xl px-5 py-3 text-sm font-bold transition-all",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "bg-white text-slate-500 hover:text-blue-500 hover:bg-blue-50/50 border border-slate-200"
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
