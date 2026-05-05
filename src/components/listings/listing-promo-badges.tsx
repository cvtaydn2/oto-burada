import { Sparkles, Zap } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DopingType } from "@/types/payment";

export interface ListingPromoBadgeItem {
  type: DopingType;
  label: string;
  expiresAt: string | null;
}

interface ListingPromoBadgesProps {
  items: ListingPromoBadgeItem[];
  className?: string;
  limit?: number;
  size?: "sm" | "md";
  variant?: "solid" | "soft" | "glass";
}

function getPromoTone(type: DopingType) {
  if (type === "urgent") {
    return {
      solid: "bg-rose-600 text-white shadow-lg shadow-rose-600/20",
      soft: "bg-rose-500/10 text-rose-700 border-rose-200",
      glass: "bg-rose-600/90 text-white border-white/20 shadow-lg shadow-rose-600/20",
      icon: Zap,
    };
  }

  return {
    solid: "bg-primary text-white shadow-lg shadow-primary/20",
    soft: "bg-primary/10 text-primary border-primary/20",
    glass: "bg-primary/90 text-white border-white/20 shadow-lg shadow-primary/20",
    icon: Sparkles,
  };
}

export function ListingPromoBadges({
  items,
  className,
  limit,
  size = "sm",
  variant = "solid",
}: ListingPromoBadgesProps) {
  const visibleItems = typeof limit === "number" ? items.slice(0, limit) : items;

  if (visibleItems.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      {visibleItems.map((item) => {
        const tone = getPromoTone(item.type);
        const Icon = tone.icon;

        return (
          <span
            key={`${item.type}-${item.label}`}
            className={cn(
              "inline-flex items-center rounded-full border font-bold uppercase tracking-widest",
              size === "sm" ? "gap-1 px-2.5 py-1 text-[10px]" : "gap-2 px-4 py-2 text-[10px]",
              tone[variant]
            )}
          >
            <Icon size={size === "sm" ? 10 : 14} />
            {item.label}
          </span>
        );
      })}
    </div>
  );
}
