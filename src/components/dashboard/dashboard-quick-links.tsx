import Link from "next/link";
import { Zap, Heart, User, MessageSquare, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardQuickLinks() {
  const links = [
    { label: "İlan Yayınla", href: "/dashboard/listings?create=true", icon: Zap, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Favorilerim", href: "/dashboard/favorites", icon: Heart, color: "text-rose-600", bg: "bg-rose-50" },
    { label: "Profil Ayarları", href: "/dashboard/profile", icon: User, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Mesajlar", href: "/dashboard/messages", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest whitespace-nowrap leading-none">HIZLI ERİŞİM</span>
        <div className="h-px w-full bg-border" />
      </div>
      
      <div className="grid gap-3">
        {links.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-center justify-between rounded-xl border border-border bg-card p-4 shadow-sm transition-all hover:bg-muted/50 hover:border-foreground/10"
          >
            <div className="flex items-center gap-4">
              <div className={cn("flex size-10 items-center justify-center rounded-xl transition-colors", item.bg)}>
                <item.icon size={18} className={item.color} />
              </div>
              <span className="text-sm font-bold text-foreground tracking-tight">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-muted-foreground/40 transition-all group-hover:translate-x-1 group-hover:text-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
