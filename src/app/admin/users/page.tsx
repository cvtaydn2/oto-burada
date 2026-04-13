import { Users, Search, Filter, ShieldCheck, MoreVertical, UserX } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function AdminUserManagementPage() {
  const mockUsers = [
    { id: "1", name: "Ahmet Yılmaz", email: "ahmet@mail.com", role: "Bireysel", status: "Aktif", joined: new Date() },
    { id: "2", name: "Mehmet Demir", email: "mehmet@kurumsal.com", role: "Kurumsal", status: "Onay Bekliyor", joined: new Date() },
    { id: "3", name: "Selin Ak", email: "selin@mail.com", role: "Admin", status: "Aktif", joined: new Date() },
  ];

  return (
    <main className="space-y-6 p-4 lg:p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Users className="text-primary" size={16} />
             <span className="text-xs text-slate-500">Moderasyon paneli</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Kullanıcı yönetimi
          </h1>
          <p className="mt-1 text-sm text-slate-500">Platform genelindeki tüzel ve gerçek kişilerin kayıtlarını denetleyin.</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
         <div className="space-y-4 lg:col-span-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="İsim, e-posta veya ID ile ara..." 
                    className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
               </div>
               <button className="group flex h-10 items-center gap-2 rounded-md bg-slate-900 px-4 text-xs font-medium text-white">
                  <Filter size={14} className="group-hover:rotate-180 transition-transform" />
                  Filtrele
               </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50">
                       <th className="p-4 text-[10px] font-medium tracking-wide text-slate-500">KULLANICI</th>
                       <th className="p-4 text-[10px] font-medium tracking-wide text-slate-500">ÜYELİK TİPİ</th>
                       <th className="p-4 text-[10px] font-medium tracking-wide text-slate-500">DURUM</th>
                       <th className="p-4 text-[10px] font-medium tracking-wide text-slate-500">KATILIM</th>
                       <th className="p-4 text-right text-[10px] font-medium tracking-wide text-slate-500">İŞLEMLER</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                     {mockUsers.map((u) => (
                        <tr key={u.id} className="group transition-colors hover:bg-slate-50/60">
                           <td className="p-4">
                              <div className="flex items-center gap-4">
                                 <div className="flex size-9 items-center justify-center rounded-md bg-slate-100 text-sm font-semibold text-slate-500">
                                    {u.name[0]}
                                 </div>
                                 <div className="space-y-0.5">
                                    <p className="text-sm font-semibold leading-none text-slate-900">{u.name}</p>
                                    <p className="text-[11px] text-slate-500">{u.email}</p>
                                 </div>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className={`rounded-md px-2.5 py-1 text-[10px] font-medium ${u.role === 'Admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                 {u.role}
                              </span>
                           </td>
                           <td className="p-4">
                              <div className="flex items-center gap-2">
                                 <div className={`size-1.5 rounded-full ${u.status === 'Aktif' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                 <span className="text-[11px] font-medium text-slate-700">{u.status}</span>
                              </div>
                           </td>
                           <td className="p-4">
                              <span className="text-[11px] text-slate-500">
                                 {format(u.joined, "dd MMM yyyy", { locale: tr })}
                              </span>
                           </td>
                           <td className="p-4 text-right">
                              <button className="size-8 rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-primary">
                                 <MoreVertical size={16} className="mx-auto" />
                              </button>
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>

         <div className="space-y-4">
            <div className="relative space-y-4 overflow-hidden rounded-xl bg-slate-900 p-5 text-white">
               <ShieldCheck className="text-primary" size={32} />
               <h3 className="text-lg font-semibold">Güvenlik analizi</h3>
               <div className="space-y-4">
                  <SecurityMetric label="Aktif Kullanıcı" value="1,240" />
                  <SecurityMetric label="Son 24s Kayıt" value="+24" />
                  <SecurityMetric label="Kısıtlı Hesap" value="2" />
               </div>
            </div>

            <button className="group flex w-full items-center justify-between rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-600 transition-all hover:bg-rose-100">
               <div className="flex items-center gap-3">
                  <UserX size={20} />
                  <span className="text-xs font-medium">Kara listeyi yönet</span>
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
