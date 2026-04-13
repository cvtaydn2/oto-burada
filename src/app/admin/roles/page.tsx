import { Shield, Key, Eye, Edit3, Trash2, Plus, ChevronRight, CheckCircle2 } from "lucide-react";

export default function AdminRolesPage() {
  const roles = [
    { name: "SÜPER ADMİN", users: 2, access: "TÜM YETKİLER", color: "bg-slate-950" },
    { name: "MODERATÖR", users: 5, access: "İLAN & RAPOR", color: "bg-primary" },
    { name: "DESTEK EKİBİ", users: 8, access: "SİZİNLE & MESAJ", color: "bg-indigo-600" },
  ];

  return (
    <main className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Key className="text-primary italic" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Erişim Kontrolü</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-tight">
            ROLLER & <span className="text-primary tracking-widest">YETKİLER</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 italic mt-1">Sistem personelinin yetki seviyelerini ve erişim limitlerini tanımlayın.</p>
        </div>
        <button className="h-14 px-8 rounded-2xl bg-slate-900 text-white flex items-center gap-3 text-xs font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-900/10 italic">
           <Plus size={18} />
           YENİ ROL TANIMLA
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
         {roles.map((role, idx) => (
            <div key={idx} className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/30 overflow-hidden group hover:border-primary transition-all">
               <div className={`${role.color} p-10 text-white space-y-4 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[60px] rounded-full -mr-16 -mt-16" />
                  <Shield size={32} />
                  <div>
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">{role.name}</h3>
                    <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest italic">{role.users} Atanmış Kişi</p>
                  </div>
               </div>
               <div className="p-10 space-y-8">
                  <div className="space-y-4">
                     <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">ERİŞİM KAPSAMI</p>
                     <div className="flex items-center gap-2 p-4 rounded-2xl bg-slate-50 border border-slate-100 italic">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-xs font-black uppercase tracking-tighter text-slate-900">{role.access}</span>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <Edit3 size={18} />
                     </button>
                     <button className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-slate-900 hover:text-white transition-all shadow-sm">
                        <Eye size={18} />
                     </button>
                     <button className="flex-1 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                        <Trash2 size={18} />
                     </button>
                  </div>
               </div>
            </div>
         ))}
      </div>

      <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-2xl shadow-slate-200/40 italic">
         <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
               <div className="size-16 rounded-[2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                  <Shield className="fill-indigo-600/10" size={32} />
               </div>
               <div>
                  <h4 className="text-xl font-black italic uppercase tracking-tighter">GELİŞMİŞ ERİŞİM LOGLARI</h4>
                  <p className="text-sm font-medium text-slate-400">Hangi yetkinin ne zaman ve kim tarafından kullanıldığını inceleyin.</p>
               </div>
            </div>
            <button className="h-14 px-8 rounded-2xl bg-white border-2 border-slate-100 text-slate-900 flex items-center gap-3 text-sm font-black uppercase tracking-widest hover:border-primary transition-all">
               LOGLARI GÖRÜNTÜLE
               <ChevronRight size={18} />
            </button>
         </div>
      </div>
    </main>
  );
}
