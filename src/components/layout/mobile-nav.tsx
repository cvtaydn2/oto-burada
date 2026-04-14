"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";

import { getMobileNavigationItems } from "@/components/layout/public-navigation";
import { cn } from "@/lib/utils";

interface MobileNavProps {
  userId?: string | null;
}

export function MobileNav({ userId }: MobileNavProps) {
  const pathname = usePathname();
  const mobileNavigationItems = getMobileNavigationItems(Boolean(userId));

  return (
    <div className="lg:hidden">
      {/* Mobile FAB */}
      <Link
        href="/dashboard/listings/create"
        className="fixed bottom-28 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white shadow-2xl shadow-indigo-500/40 transition-transform active:scale-95"
        aria-label="İlan Ver"
      >
        <Plus className="size-6" />
      </Link>

      <nav
        aria-label="Mobil alt navigasyon"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-background/95 px-2 py-2 pb-6 shadow-[0_-12px_32px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden"
      >
        <ul className="mx-auto grid max-w-2xl grid-cols-4 gap-1">
          {mobileNavigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[12px] font-black transition-all focus-visible:outline-none",
                    isActive
                      ? "text-indigo-600"
                      : "text-slate-400 hover:text-slate-600",
                  )}
                >
                  <Icon className={cn("size-5", isActive ? "text-indigo-600" : "text-slate-400")} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
