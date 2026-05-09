"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {} from "@/lib";
import { cn } from "@/lib/utils";

interface FooterNavLinkProps {
  href: string;
  label: string;
}

export function FooterNavLink({ href, label }: FooterNavLinkProps) {
  const pathname = usePathname();
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={cn(
        "text-sm transition-colors hover:text-primary",
        isActive ? "text-primary font-semibold" : "text-muted-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}
