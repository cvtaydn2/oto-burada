import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/features/shared/lib";

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface ListingBreadcrumbProps {
  items: BreadcrumbItem[];
}

export function ListingBreadcrumb({ items }: ListingBreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 flex items-center gap-1.5 overflow-x-auto no-scrollbar"
    >
      {items.map((b, i) => (
        <div key={b.url} className="flex shrink-0 items-center gap-1.5">
          <Link
            href={b.url}
            className={cn(
              "text-[10px] font-bold uppercase tracking-widest transition-colors hover:text-primary",
              i === items.length - 1 ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {b.name}
          </Link>
          {i < items.length - 1 && <ChevronRight size={12} className="text-border" />}
        </div>
      ))}
    </nav>
  );
}
