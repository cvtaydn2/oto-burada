import { ClipboardList, Clock, Heart, Zap } from "lucide-react";

interface DashboardStatsProps {
  approvedCount: number;
  pendingCount: number;
  favoriteCount: number;
  credits: number;
}

export function DashboardStats({
  approvedCount,
  pendingCount,
  favoriteCount,
  credits,
}: DashboardStatsProps) {
  const stats = [
    {
      label: "Aktif İlanlarım",
      value: approvedCount,
      icon: ClipboardList,
      hint: "Vitrin fırsatları hazır",
    },
    {
      label: "Bekleyen Onay",
      value: pendingCount,
      icon: Clock,
      hint: "İnceleme devam ediyor",
    },
    {
      label: "Favori Kaydı",
      value: favoriteCount,
      icon: Heart,
      hint: "İlgi düzeyini takip edin",
    },
    {
      label: "Sistem Kredisi",
      value: credits,
      icon: Zap,
      hint: "Premium işlemler için hazır",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="group flex min-h-[176px] flex-col justify-between rounded-[1.35rem] border border-border/70 bg-card/95 p-5 shadow-sm shadow-slate-950/5 transition-all hover:-translate-y-0.5 hover:border-primary/15 hover:bg-card hover:shadow-[0_20px_44px_-24px_rgba(15,23,42,0.28)] sm:p-6"
        >
          <div className="mb-6 flex items-start justify-between gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 text-muted-foreground shadow-sm transition-[background-color,color,border-color] group-hover:border-primary/20 group-hover:bg-primary/5 group-hover:text-primary">
              <stat.icon size={20} strokeWidth={2.25} />
            </div>
            {stat.hint && (
              <span className="rounded-full border border-primary/10 bg-primary/[0.07] px-2.5 py-1 text-[9px] font-semibold tracking-[0.12em] text-primary/80">
                {stat.hint}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {stat.label}
            </div>
            <div className="text-3xl font-bold leading-none tracking-[-0.04em] text-foreground sm:text-[2rem]">
              {stat.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
