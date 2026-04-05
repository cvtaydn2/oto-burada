import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type DashboardMetricTone = "indigo" | "emerald" | "amber" | "slate";

interface DashboardMetricCardProps {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: DashboardMetricTone;
}

const toneClasses: Record<
  DashboardMetricTone,
  { icon: string; panel: string; badge: string }
> = {
  amber: {
    icon: "bg-amber-500/10 text-amber-600",
    panel: "from-amber-50/70 via-background to-background",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
  },
  emerald: {
    icon: "bg-emerald-500/10 text-emerald-600",
    panel: "from-emerald-50/70 via-background to-background",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  indigo: {
    icon: "bg-primary/10 text-primary",
    panel: "from-primary/10 via-background to-background",
    badge: "border-primary/15 bg-primary/10 text-primary",
  },
  slate: {
    icon: "bg-slate-500/10 text-slate-700",
    panel: "from-slate-100/70 via-background to-background",
    badge: "border-slate-200 bg-slate-100 text-slate-700",
  },
};

export function DashboardMetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "indigo",
}: DashboardMetricCardProps) {
  const palette = toneClasses[tone];

  return (
    <div
      className={cn(
        "rounded-[1.75rem] border border-border/80 bg-gradient-to-br p-5 shadow-sm",
        palette.panel,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div
            className={cn(
              "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
              palette.badge,
            )}
          >
            {label}
          </div>
          <p className="mt-4 text-3xl font-semibold tracking-tight text-foreground">{value}</p>
        </div>
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-2xl",
            palette.icon,
          )}
        >
          <Icon className="size-5" />
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{helper}</p>
    </div>
  );
}
