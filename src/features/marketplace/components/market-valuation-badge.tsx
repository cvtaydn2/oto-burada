import { AlertCircle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/features/shared/lib";

interface MarketValuationBadgeProps {
  status: "good" | "fair" | "high" | "unknown";
  diff?: number;
  className?: string;
}

export function MarketValuationBadge({ status, diff, className }: MarketValuationBadgeProps) {
  if (status === "unknown") return null;

  const configs = {
    good: {
      label: "Fırsat Fiyat",
      icon: CheckCircle2,
      color:
        "text-emerald-700 bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
      description: diff ? `Piyasa ortalamasının %${diff} altında` : "Piyasanın altında",
    },
    fair: {
      label: "Normal Fiyat",
      icon: Info,
      color:
        "text-blue-700 bg-blue-50 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
      description: "Piyasa ortalamasında",
    },
    high: {
      label: "Piyasanın Üstünde",
      icon: AlertCircle,
      color:
        "text-amber-700 bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
      description: diff ? `Piyasa ortalamasının %${diff} üstünde` : "Piyasanın üstünde",
    },
  };

  const config = configs[status as keyof typeof configs];
  const Icon = config.icon;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold w-fit",
          config.color
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {config.label}
      </div>
      <p className="text-[11px] text-muted-foreground font-medium pl-1">{config.description}</p>
    </div>
  );
}
