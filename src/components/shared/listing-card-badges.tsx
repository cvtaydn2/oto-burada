import { type LucideIcon, ShieldCheck, Sparkles, Zap } from "lucide-react";

import { cn } from "@/lib/utils";

interface ListingBadgeProps {
  icon: LucideIcon;
  label: string;
  className?: string;
}

export function ListingBadge({ icon: Icon, label, className }: ListingBadgeProps) {
  return (
    <div
      className={cn(
        "flex h-8 items-center gap-2 rounded-xl border border-white/20 px-4 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-xl",
        className
      )}
    >
      <Icon size={14} strokeWidth={2.5} />
      {label}
    </div>
  );
}

interface DopingBadgeGroupProps {
  items: Array<{ type: string; label: string }>;
  isPremiumVisible: boolean;
}

export function DopingBadgeGroup({ items, isPremiumVisible }: DopingBadgeGroupProps) {
  if (!isPremiumVisible) return null;

  return (
    <>
      {items.slice(0, 2).map((item) => (
        <ListingBadge
          key={item.type}
          icon={item.type === "urgent" ? Zap : Sparkles}
          label={item.label}
          className={
            item.type === "urgent"
              ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
              : "bg-primary text-white shadow-lg shadow-primary/20"
          }
        />
      ))}
    </>
  );
}

interface InspectionBadgeProps {
  hasInspection: boolean;
  isPremiumVisible: boolean;
}

export function InspectionBadge({ hasInspection, isPremiumVisible }: InspectionBadgeProps) {
  if (!isPremiumVisible || !hasInspection) return null;

  return (
    <ListingBadge
      icon={ShieldCheck}
      label="EKSPERTİZ"
      className="bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-2xl"
    />
  );
}
