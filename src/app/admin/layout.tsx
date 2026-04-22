import { AdminMobileNav } from "@/components/layout/admin-mobile-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdminUser } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Global admin check for all subroutes
  await requireAdminUser();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-background">
      {/* Skip navigation */}
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[9999] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-primary-foreground focus:shadow-sm"
      >
        Ana içeriğe geç
      </a>
      <AdminMobileNav />
      <AdminSidebar />
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
        {/* Premium subtle reflection top line */}
        <div
          className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent absolute top-0 z-50"
          aria-hidden="true"
        />

        <main id="admin-main" className="flex-1">
          {children}
        </main>

        <footer className="p-10 text-center flex flex-col items-center gap-2 border-t border-border bg-card shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
          <div
            className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default"
            aria-hidden="true"
          >
            <div className="size-1 rounded-full bg-blue-600" />
            <span className="text-[9px] font-bold text-foreground uppercase tracking-[0.2em]">
              OtoBurada Engine
            </span>
            <div className="size-1 rounded-full bg-blue-600" />
          </div>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest italic">
            Control Center &mdash; MVP
          </p>
        </footer>
      </div>
    </div>
  );
}
