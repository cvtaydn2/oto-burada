"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib";

const navItems = [{ href: "/listings", label: "İlanlar" }];

export function DesktopNav() {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
      {navItems.map((item) => {
        const isActive =
          item.href === "/"
            ? pathname === "/"
            : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            className={cn(
              "transition-colors hover:text-primary",
              isActive && "text-primary font-bold"
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
