import { ShieldCheck } from "lucide-react";

interface TrustBadgeProps {
  badgeLabel?: string | null;
  score: number;
}

export function TrustBadge({ badgeLabel, score }: TrustBadgeProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-2">
        <div className="text-center">
          <div className="text-2xl font-semibold text-primary">
            {score.toFixed(1)}
          </div>
          <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
            Güven Puanı
          </div>
        </div>
      </div>
      {badgeLabel ? (
        <div className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-[0.75rem] border border-indigo-100 dark:border-indigo-800/50">
          <ShieldCheck size={18} />
          {badgeLabel}
        </div>
      ) : null}
    </div>
  );
}
