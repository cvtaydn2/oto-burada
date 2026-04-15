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
    <div className="flex min-h-screen bg-slate-50/20">
      <AdminSidebar />
      <div className="flex-1 md:ml-72 flex flex-col min-h-screen">
         {/* Premium subtle reflection top line */}
         <div className="h-px w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent absolute top-0 z-50" />
         
         <div className="flex-1">
            {children}
         </div>
         
         <footer className="p-10 text-center flex flex-col items-center gap-2 border-t border-slate-100 bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
            <div className="flex items-center gap-2 opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
               <div className="size-1 rounded-full bg-blue-600" />
               <span className="text-[9px] font-black text-slate-800 uppercase tracking-[0.2em]">OtoBurada Engine</span>
               <div className="size-1 rounded-full bg-blue-600" />
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">
               Control Center &mdash; MVP
            </p>
         </footer>
      </div>
    </div>
  );
}
