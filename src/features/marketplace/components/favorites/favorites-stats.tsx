import { Gauge, Heart, ShieldCheck, TrendingUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatCurrency } from "@/lib/utils/format";

type StatColor = "rose" | "blue" | "emerald" | "amber";

const colorMap: Record<StatColor, { bg: string; text: string; icon: string }> = {
  rose: { bg: "bg-muted/30", text: "text-foreground", icon: "text-rose-500" },
  blue: { bg: "bg-muted/30", text: "text-foreground", icon: "text-blue-500" },
  emerald: { bg: "bg-muted/30", text: "text-foreground", icon: "text-emerald-500" },
  amber: { bg: "bg-muted/30", text: "text-foreground", icon: "text-amber-500" },
};

interface StatCardProps {
  label: string;
  value: string;
  sub: string;
  icon: React.ReactNode;
  color: StatColor;
}

export function StatCard({ label, value, sub, icon, color }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn("rounded-2xl border border-border/50 p-4", c.bg)}>
      <div
        className={cn(
          "mb-2 flex size-8 items-center justify-center rounded-lg bg-card shadow-sm",
          c.icon
        )}
      >
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-bold leading-tight text-foreground">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground/70 truncate">{sub}</p>
    </div>
  );
}

interface FavoritesStatsProps {
  totalCount: number;
  stats: {
    minPrice: number;
    maxPrice: number;
    avgPrice: number;
    withExpert: number;
    lowMileage: number;
  };
}

export function FavoritesStats({ totalCount, stats }: FavoritesStatsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label="Takip Edilen"
        value={String(totalCount)}
        sub="ilan"
        icon={<Heart size={16} />}
        color="rose"
      />
      <StatCard
        label="Ort. Fiyat"
        value={formatCurrency(stats.avgPrice)}
        sub={`${formatCurrency(stats.minPrice)} – ${formatCurrency(stats.maxPrice)}`}
        icon={<TrendingUp size={16} />}
        color="blue"
      />
      <StatCard
        label="Ekspertizli"
        value={String(stats.withExpert)}
        sub={`${totalCount} ilandan`}
        icon={<ShieldCheck size={16} />}
        color="emerald"
      />
      <StatCard
        label="Düşük KM"
        value={String(stats.lowMileage)}
        sub="80.000 km altı"
        icon={<Gauge size={16} />}
        color="amber"
      />
    </div>
  );
}
