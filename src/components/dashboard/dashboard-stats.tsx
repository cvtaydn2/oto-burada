import { ClipboardList, Clock, Heart, Zap } from "lucide-react";

interface DashboardStatsProps {
  approvedCount: number;
  pendingCount: number;
  favoriteCount: number;
  credits: number;
}

export function DashboardStats({ approvedCount, pendingCount, favoriteCount, credits }: DashboardStatsProps) {
  const stats = [
    {
      label: "Aktif İlanlarım",
      value: approvedCount,
      icon: ClipboardList,
      hint: "Daha fazla görünürlük",
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
      hint: "Doğrulanmış +45% daha fazla",
    },
    {
      label: "Sistem Kredisi",
      value: credits,
      icon: Zap,
      hint: "Özellikleri hemen kullan",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="flex flex-col justify-between rounded-xl border border-border bg-card p-6 transition-all hover:bg-muted/30 shadow-sm group">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted border border-border text-muted-foreground group-hover:text-primary transition-colors">
              <stat.icon size={20} strokeWidth={2.5} />
            </div>
            {stat.hint && (
              <span className="text-[8px] font-bold uppercase tracking-widest text-primary/60 bg-primary/5 px-2 py-1 rounded-lg">
                {stat.hint}
              </span>
            )}
          </div>
          
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-1 leading-none">{stat.label}</div>
            <div className="text-3xl font-bold text-foreground tracking-tighter leading-none">{stat.value}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
