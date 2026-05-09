import { ShieldCheck } from "lucide-react";

import {} from "@/lib";
import { cn } from "@/lib/utils";

interface TrustBadgeProps {
  badgeLabel?: string | null;
  score: number;
  tone?: "emerald" | "amber" | "blue" | "slate" | "rose";
}

export function TrustBadge({ badgeLabel, score, tone = "amber" }: TrustBadgeProps) {
  const themes = {
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
    amber: "text-amber-600 bg-amber-50 border-amber-100",
    blue: "text-blue-600 bg-blue-50 border-blue-100",
    slate: "text-slate-600 bg-slate-50 border-slate-100",
    rose: "text-rose-600 bg-rose-50 border-rose-100",
  };

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="text-2xl font-semibold text-foreground">{score.toFixed(0)}</div>
          <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
            Güven Puanı
          </div>
        </div>
      </div>
      {badgeLabel ? (
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border uppercase tracking-tight",
            themes[tone || "amber"]
          )}
        >
          <ShieldCheck size={16} />
          {badgeLabel}
        </div>
      ) : null}
    </div>
  );
}
