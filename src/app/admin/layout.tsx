import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requireAdminUser } from "@/lib/auth/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Global admin check for all subroutes
  await requireAdminUser();

  return (
    <div className="flex min-h-screen bg-slate-50/50">
      <AdminSidebar />
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
         {/* Top glass reflection line for premium feel */}
         <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent absolute top-0" />
         
         <div className="flex-1">
            {children}
         </div>
         
         <footer className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 bg-white">
            OtoBurada Control Center &mdash; v1.2.0 (Production)
         </footer>
      </div>
    </div>
  );
}
