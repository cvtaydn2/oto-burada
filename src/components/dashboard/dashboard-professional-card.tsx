import Link from "next/link";
import { Eye, ShieldCheck, Zap, LayoutDashboard, ChevronRight } from "lucide-react";

interface DashboardProfessionalCardProps {
  businessName?: string | null;
  businessSlug?: string | null;
  verifiedBusiness?: boolean;
}

export function DashboardProfessionalCard({ businessName, businessSlug, verifiedBusiness }: DashboardProfessionalCardProps) {
  if (!businessSlug || !verifiedBusiness) return null;

  const items = [
    { label: "Durum", value: "Aktif", icon: Eye, sub: "İstatistikler yükleniyor" },
    { label: "Güven Durumu", value: verifiedBusiness ? "Onaylı" : "İnceleniyor", icon: ShieldCheck, sub: verifiedBusiness ? "Güven mührü aktif" : "Belge kontrolü yapılıyor" },
    { label: "Özellikler", value: "Kurumsal", icon: Zap, sub: "Sınırsız İlan & XML" }
  ];

  return (
    <section className="overflow-hidden rounded-2xl bg-card border border-border p-6 lg:p-10 shadow-sm relative group mb-8">
      <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
            <LayoutDashboard size={12} />
            Kurumsal Kontrol Paneli
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground tracking-tight">
              {businessName || "Mağazam"} <span className="text-primary/40 font-medium ml-2">Yayında</span>
            </h2>
            <p className="text-sm font-medium text-muted-foreground max-w-lg mt-2">
              Showroom sayfanız şu anda yayında. Müşterileriniz tüm ilanlarınıza tek bir adresten ulaşabilir.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3">
           <div className="flex items-center h-14 w-full sm:w-auto rounded-xl bg-muted/30 border border-border px-5 transition-all hover:bg-muted/50">
              <div className="flex-1 min-w-0 pr-6">
                <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest block leading-none mb-1">Mağaza URL</span>
                <span className="text-xs font-bold text-muted-foreground truncate block tracking-tight">otoburada.com/gallery/{businessSlug}</span>
              </div>
              <Link 
                href={`/gallery/${businessSlug}`}
                target="_blank"
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground shadow-sm border border-border transition-all hover:bg-foreground hover:text-background"
              >
                <Eye size={14} />
              </Link>
           </div>
           
           <Link
            href={`/gallery/${businessSlug}`}
            target="_blank"
            className="flex h-14 w-full sm:w-auto items-center gap-2 rounded-xl bg-primary px-10 text-[10px] font-bold uppercase tracking-widest text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95"
           >
             Mağazaya Git
             <ChevronRight size={14} strokeWidth={3} />
           </Link>
        </div>
      </div>
      
      <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-10 pt-10 border-t border-border">
         {items.map(i => (
           <div key={i.label} className="flex gap-4">
             <div className="size-12 rounded-2xl bg-muted/50 border border-border flex items-center justify-center text-muted-foreground/40 shrink-0">
                <i.icon size={20} />
             </div>
             <div>
               <div className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest mb-1 leading-none">{i.label}</div>
               <div className="text-base font-bold text-foreground leading-none tracking-tight">{i.value}</div>
               <div className="text-xs font-medium text-muted-foreground/50 mt-1.5 leading-none">{i.sub}</div>
             </div>
           </div>
         ))}
      </div>
    </section>
  );
}
