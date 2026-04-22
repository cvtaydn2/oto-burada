import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardMetricTone = "indigo" | "emerald" | "amber" | "slate" | "blue" | "rose";

interface DashboardMetricCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: DashboardMetricTone;
  trend?: number;
  trendLabel?: string;
}

const toneClasses: Record<
  DashboardMetricTone,
  { icon: string; panel: string; badge: string; text: string }
> = {
  amber: {
    icon: "bg-amber-100 text-amber-600",
    panel: "bg-card border-border",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    text: "text-foreground",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-600",
    panel: "bg-card border-border",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    text: "text-foreground",
  },
  indigo: {
    icon: "bg-blue-100 text-blue-600",
    panel: "bg-card border-border",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    text: "text-foreground",
  },
  slate: {
    icon: "bg-muted text-muted-foreground",
    panel: "bg-card border-border",
    badge: "bg-muted text-foreground/90 border-border",
    text: "text-foreground",
  },
  blue: {
    icon: "bg-blue-100 text-blue-600",
    panel: "bg-card border-border",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    text: "text-foreground",
  },
  rose: {
    icon: "bg-rose-100 text-rose-600",
    panel: "bg-card border-border",
    badge: "bg-rose-50 text-rose-700 border-rose-100",
    text: "text-foreground",
  },
};

export function DashboardMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "indigo",
  trend,
  trendLabel,
}: DashboardMetricCardProps) {
  const palette = toneClasses[tone];

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200 group bg-card",
        palette.panel,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div
              className={cn(
                "inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
                palette.badge,
              )}
            >
              {label}
            </div>
            {trend !== undefined && (
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1",
                trend >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
              )}>
                {trend >= 0 ? "+" : ""}{trend}%
                {trendLabel && <span className="opacity-60">{trendLabel}</span>}
              </span>
            )}
          </div>
          <p className={cn("mt-4 text-3xl font-bold tracking-tight", palette.text)}>{value}</p>
          <p className="mt-2 text-xs font-medium text-muted-foreground/70 line-clamp-1">{helper}</p>
        </div>
        <div
          className={cn(
        "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform",
            palette.icon,
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}
