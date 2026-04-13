import { Shield, Key, Eye, Edit3, Trash2, Plus, ChevronRight, CheckCircle2 } from "lucide-react";

export default function AdminRolesPage() {
  const roles = [
    { name: "Süper Admin", users: 2, access: "Tüm yetkiler", color: "bg-slate-900" },
    { name: "Moderatör", users: 5, access: "İlan & rapor", color: "bg-primary" },
    { name: "Destek Ekibi", users: 8, access: "Mesaj & destek", color: "bg-indigo-600" },
  ];

  return (
    <main className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Key className="text-primary" size={16} />
             <span className="text-xs text-slate-500">Erişim kontrolü</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Roller ve yetkiler
          </h1>
          <p className="mt-1 text-sm text-slate-500">Sistem personelinin yetki seviyelerini ve erişim limitlerini tanımlayın.</p>
        </div>
        <button className="flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-sm font-medium text-white transition-all hover:bg-black">
           <Plus size={18} />
           Yeni rol tanımla
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
         {roles.map((role, idx) => (
            <div key={idx} className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-primary">
               <div className={`${role.color} relative space-y-3 p-6 text-white`}>
                  <Shield size={32} />
                  <div>
                    <h3 className="text-2xl font-semibold tracking-tight">{role.name}</h3>
                    <p className="text-xs text-white/70">{role.users} atanmış kişi</p>
                  </div>
               </div>
               <div className="space-y-5 p-6">
                  <div className="space-y-3">
                     <p className="text-[10px] font-medium tracking-wide text-slate-500">ERİŞİM KAPSAMI</p>
                     <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-xs font-medium text-slate-900">{role.access}</span>
                     </div>
                  </div>

                  <div className="flex gap-2">
                     <button className="flex h-10 flex-1 items-center justify-center rounded-md bg-slate-50 text-slate-500 transition-all hover:bg-slate-900 hover:text-white">
                        <Edit3 size={18} />
                     </button>
                     <button className="flex h-10 flex-1 items-center justify-center rounded-md bg-slate-50 text-slate-500 transition-all hover:bg-slate-900 hover:text-white">
                        <Eye size={18} />
                     </button>
                     <button className="flex h-10 flex-1 items-center justify-center rounded-md bg-slate-50 text-slate-500 transition-all hover:bg-rose-500 hover:text-white">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </div>
         ))}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6">
         <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-6">
               <div className="flex size-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                  <Shield className="fill-indigo-600/10" size={32} />
               </div>
               <div>
                  <h4 className="text-lg font-semibold text-slate-900">Gelişmiş erişim logları</h4>
                  <p className="text-sm text-slate-500">Hangi yetkinin ne zaman ve kim tarafından kullanıldığını inceleyin.</p>
               </div>
            </div>
            <button className="flex h-10 items-center gap-2 rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-all hover:border-primary">
               Logları görüntüle
               <ChevronRight size={18} />
            </button>
         </div>
      </div>
    </main>
  );
}
