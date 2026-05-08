"use client";

import { cn } from "@/lib";

interface UserStatItem {
  label: string;
  value: string;
  color: string;
}

interface UserStatsBarProps {
  stats: UserStatItem[];
  currentPage: number;
  totalPages: number;
}

export function UserStatsBar({ stats, currentPage, totalPages }: UserStatsBarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {stats.map((stat, idx) => (
        <div
          key={stat.label}
          className="flex flex-col p-6 rounded-2xl border border-border/50 bg-card shadow-sm hover:border-blue-100 transition-all group relative overflow-hidden"
        >
          <div className="absolute -right-2 -top-2 size-16 bg-blue-50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="text-[10px] font-bold text-muted-foreground/70 uppercase tracking-widest mb-2">
            {stat.label}
          </span>
          <div className="flex items-baseline gap-2">
            <span className={cn("text-3xl font-bold tracking-tighter", stat.color)}>
              {stat.value}
            </span>
            {idx === 0 && (
              <span className="text-[10px] font-bold text-muted-foreground/70 bg-muted/30 px-2 py-0.5 rounded-md">
                Sayfa {currentPage}/{totalPages}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
