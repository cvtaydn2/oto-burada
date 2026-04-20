import Link from "next/link";
import { Zap, Sparkles } from "lucide-react";

interface DashboardCreditsCardProps {
  credits: number;
}

export function DashboardCreditsCard({ credits }: DashboardCreditsCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm">
      <h3 className="text-xl font-bold tracking-tight mb-1 text-foreground">Doping Kredileri</h3>
      <p className="text-xs font-medium text-muted-foreground mb-8">İlanlarını öne çıkarmak için kredi kullan.</p>
      
      <div className="flex items-center justify-between rounded-2xl bg-muted/30 border border-border p-6 mb-8">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2 leading-none">MEVCUT BAKİYE</div>
          <div className="flex items-center gap-3">
            <Zap size={24} className="text-primary fill-primary/10" />
            <span className="text-4xl font-bold tracking-tighter text-foreground leading-none">{credits}</span>
          </div>
        </div>
        <div className="flex size-14 items-center justify-center rounded-2xl bg-muted border border-border">
          <Sparkles size={24} className="text-primary/20" />
        </div>
      </div>

      <Link
        href="/dashboard/pricing"
        className="flex h-12 items-center justify-center rounded-xl bg-primary text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm hover:opacity-90 transition-all w-full active:scale-95"
      >
        KREDİ SATIN AL
      </Link>
    </div>
  );
}
