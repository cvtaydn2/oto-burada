import { requireAdminUser } from "@/lib/auth/session";
import { getPlatformSettings } from "@/services/admin/settings";
import { AdminSettingsForm } from "@/components/forms/admin-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireAdminUser();
  const initialSettings = await getPlatformSettings();

  return (
    <main className="p-6 lg:p-8 bg-slate-50/30 min-h-full">
      <AdminSettingsForm initialSettings={initialSettings} />
      
      <div className="flex justify-center pt-10">
         <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm opacity-60 transition-all hover:opacity-100 italic">
            <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Developer Debug Mode:</span>
            <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Disabled</span>
         </div>
      </div>
    </main>
  );
}
