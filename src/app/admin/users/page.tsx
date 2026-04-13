import { Users, Search, Filter, ShieldCheck, Mail, Calendar, MoreVertical, UserX } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminUserManagementPage() {
  const mockUsers = [
    { id: "1", name: "Ahmet Yılmaz", email: "ahmet@mail.com", role: "Bireysel", status: "Aktif", joined: new Date() },
    { id: "2", name: "Mehmet Demir", email: "mehmet@kurumsal.com", role: "Kurumsal", status: "Onay Bekliyor", joined: new Date() },
    { id: "3", name: "Selin Ak", email: "selin@mail.com", role: "Admin", status: "Aktif", joined: new Date() },
  ];

  return (
    <main className="p-8 space-y-10 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Users className="text-primary italic" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Moderasyon Paneli</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            KULLANICI <span className="text-primary">YÖNETİMİ</span>
          </h1>
          <p className="text-sm font-medium text-slate-400 italic mt-1">Platform genelindeki tüzel ve gerçek kişilerin kayıtlarını denetleyin.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
         <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="İsim, e-posta veya ID ile ara..." 
                    className="h-12 w-full pl-12 pr-4 bg-slate-50 border-none rounded-xl outline-none font-bold italic text-sm text-slate-900 focus:bg-white focus:ring-2 focus:ring-primary/20 transition-all"
                  />
               </div>
               <button className="h-12 px-6 bg-slate-900 text-white rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic group">
                  <Filter size={14} className="group-hover:rotate-180 transition-transform" />
                  FİLTRELE
               </button>
            </div>

            <div className="bg-white rounded-[3rem] border border-slate-100 shadow-2xl shadow-slate-200/40 overflow-hidden">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">KULLANICI</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">ÜYELİK TİPİ</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">DURUM</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">KATILIM</th>
                       <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-right">İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                     {mockUsers.map((u) => (
                        <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
                           <td className="p-6">
                              <div className="flex items-center gap-4">
                                 <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center italic font-black text-slate-400 shadow-inner">
                                    {u.name[0]}
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-black italic uppercase text-slate-900 leading-none">{u.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400 italic lowercase">{u.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-6">
                              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase italic ${u.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-600'}`}>
                                 {u.role}
                              </span>
                           </td>
                           <td className="p-6">
                              <div className="flex items-center gap-2">
                                 <div className={`size-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                 <span className="text-[10px] font-bold text-slate-700 italic uppercase underline decoration-primary/30 underline-offset-4">{u.status}</span>
                              </div>
                           </td>
                           <td className="p-6">
                              <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                                 {format(u.joined, "dd MMM yyyy", { locale: tr })}
                              </span>
                           </td>
                           <td className="p-6 text-right">
                              <button className="size-8 rounded-lg text-slate-300 hover:text-primary hover:bg-white transition-all shadow-sm">
                                 <MoreVertical size={16} className="mx-auto" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-8">
            <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-slate-900/10 italic relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[80px] -mr-16 -mt-16" />
               <ShieldCheck className="text-primary" size={32} />
               <h3 className="text-xl font-black italic uppercase tracking-tighter">GÜVENLİK ANALİZİ</h3>
               <div className="space-y-4">
                  <SecurityMetric label="Aktif Kullanıcı" value="1,240" />
                  <SecurityMetric label="Son 24s Kayıt" value="+24" />
                  <SecurityMetric label="Kısıtlı Hesap" value="2" />
               </div>
            </div>

            <button className="w-full flex items-center justify-between p-6 rounded-3xl border-2 border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all group">
               <div className="flex items-center gap-3 italic">
                  <UserX size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">KARA LİSTEYİ YÖNET</span>
               </div>
               <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
         </div>
      </div>
    </main>
  );
}

function SecurityMetric({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
       <span className="text-[10px] font-bold text-slate-400 uppercase">{label}</span>
       <span className="text-lg font-black">{value}</span>
    </div>
  );
}

function ChevronRight({ size = 24, ...props }: React.SVGProps<SVGSVGElement> & { size?: number }) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
