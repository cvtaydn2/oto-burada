import Link from "next/link";
import { Plus, LayoutDashboard, ClipboardList, MessageSquare, Star, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboard } from "@/lib/constants/ui-strings";

interface DashboardHeaderProps {
  userEmail?: string;
}

export function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const tabs = [
    { label: dashboard.summary, href: "/dashboard", icon: LayoutDashboard, active: true },
    { label: dashboard.myListings, href: "/dashboard/listings", icon: ClipboardList },
    { label: dashboard.messages, href: "/dashboard/messages", icon: MessageSquare },
    { label: dashboard.favorites, href: "/dashboard/favorites", icon: Star },
    { label: dashboard.settings, href: "/dashboard/profile", icon: Settings },
  ];

  return (
    <section className="bg-card border border-border rounded-2xl p-6 lg:p-8 shadow-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-2">
            <LayoutDashboard size={12} className="text-primary" />
            {dashboard.controlCenter}
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Hoş Geldin, <span className="text-primary">{userEmail?.split("@")[0]}</span>
          </h1>
          <p className="text-sm font-medium text-muted-foreground">
            Profilini ve ilanlarını buradan yönetebilirsin.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/listings?create=true"
            className="flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-sm hover:opacity-90 transition-all active:scale-95 uppercase tracking-widest"
          >
            <Plus size={18} />
            {dashboard.newListing}
          </Link>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-1 border-t border-border pt-6 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            href={tab.href}
            className={cn(
              "flex h-10 items-center gap-2 rounded-lg px-4 text-[10px] font-bold uppercase tracking-widest whitespace-nowrap transition-all",
              tab.active 
                ? "bg-primary text-primary-foreground shadow-sm shadow-primary/20" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
