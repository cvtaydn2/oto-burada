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
  { icon: string; panel: string; badge: string; text: string }
> = {
  amber: {
    icon: "bg-amber-100 text-amber-600",
    panel: "bg-white border-slate-200",
    badge: "bg-amber-50 text-amber-700 border-amber-100",
    text: "text-slate-900",
  },
  emerald: {
    icon: "bg-emerald-100 text-emerald-600",
    panel: "bg-white border-slate-200",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
    text: "text-slate-900",
  },
  indigo: {
    icon: "bg-blue-100 text-blue-600",
    panel: "bg-white border-slate-200",
    badge: "bg-blue-50 text-blue-700 border-blue-100",
    text: "text-slate-900",
  },
  slate: {
    icon: "bg-slate-100 text-slate-600",
    panel: "bg-white border-slate-200",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    text: "text-slate-900",
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
        "rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md hover:border-blue-200 group bg-white",
        palette.panel,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div
            className={cn(
              "inline-flex items-center rounded-lg border px-2 py-1 text-[10px] font-bold uppercase tracking-wider",
              palette.badge,
            )}
          >
            {label}
          </div>
          <p className={cn("mt-4 text-3xl font-black tracking-tight", palette.text)}>{value}</p>
          <p className="mt-2 text-xs font-medium text-slate-400 line-clamp-1">{helper}</p>
        </div>
        <div
          className={cn(
            "flex size-12 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
            palette.icon,
          )}
        >
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}
