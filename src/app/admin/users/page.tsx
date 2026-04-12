import { Users, ShieldCheck, ShieldAlert, UserCircle, CheckCircle2 } from "lucide-react";
import { requireAdminUser } from "@/lib/auth/session";
import { getAllUsers } from "@/services/admin/users";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserActions } from "@/components/admin/user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdminUser();
  const users = await getAllUsers();

  return (
    <main className="p-8 space-y-8">
      <section className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Users className="text-indigo-500" size={16} />
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Üye Yönetimi</span>
          </div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
            Kullanıcı <span className="text-indigo-500 italic">Veritabanı</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">Sistemdeki tüm üyeleri görüntüleyin, rollerini ve hesap durumlarını yönetin.</p>
        </div>
      </section>

      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="text-lg font-black italic uppercase tracking-tighter">Tüm Üyeler ({users.length})</h2>
            <div className="flex gap-2">
               <Button variant="outline" size="sm" className="rounded-xl font-bold bg-white">CSV İndir</Button>
               <Button size="sm" className="rounded-xl font-bold">Yeni Kullanıcı</Button>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/30">
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kullanıcı</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Hesap Tipi</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Doğrulama</th>
                <th className="px-6 py-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Kayıt Tarihi</th>
                <th className="px-6 py-4 text-right text-[11px] font-black text-slate-400 uppercase tracking-widest">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                       <div className="size-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 shadow-sm relative group-hover:border-indigo-200 transition-colors">
                          {user.avatarUrl ? (
                            <img src={user.avatarUrl} alt={user.fullName || ""} className="w-full h-full object-cover" />
                          ) : (
                            <UserCircle className="text-slate-300" size={24} />
                          )}
                          {!user.avatarUrl && user.fullName && (
                            <div className="absolute inset-0 flex items-center justify-center bg-indigo-50 text-indigo-400 font-black text-xs">
                              {user.fullName.substring(0, 1).toUpperCase()}
                            </div>
                          )}
                       </div>
                       <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-black text-slate-900 truncate">
                                {user.fullName || "İsimsiz Kullanıcı"}
                              </span>
                              {user.isBanned && (
                                <Badge className="bg-rose-500 text-white rounded-md text-[8px] px-1.5 py-0 hover:bg-rose-500 border-none h-4 font-black">YASAKLI</Badge>
                              )}
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 font-mono tracking-tight uppercase">
                            ID: {user.id.substring(0, 8)}...
                          </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.userType === "professional" ? (
                      <div className="flex flex-col gap-1">
<Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-transparent rounded-lg font-black uppercase text-[10px] tracking-tighter w-fit">Galeri</Badge>
                          {user.verifiedBusiness && (
                             <div className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
                                <CheckCircle2 size={10} />
                                DOĞRULANMIŞ
                             </div>
                          )}
                      </div>
                    ) : user.role === "admin" ? (
                      <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-transparent rounded-lg font-black uppercase text-[10px] tracking-tighter flex w-fit gap-1 items-center">
                         <ShieldCheck size={10} />
                         Admin
                      </Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-transparent rounded-lg font-black uppercase text-[10px] tracking-tighter w-fit">Bireysel</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5 flex-wrap">
                       {user.emailVerified && <Badge variant="outline" className="border-emerald-100 bg-emerald-50 text-emerald-600 rounded-md font-bold text-[9px]">E-POSTA</Badge>}
                       {user.phoneVerified && <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-600 rounded-md font-bold text-[9px]">TEL</Badge>}
                       {!user.emailVerified && !user.phoneVerified && <span className="text-xs font-medium text-slate-300 italic">Doğrulanmadı</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td className="px-6 py-4 text-right">
<UserActions 
                       userId={user.id} 
                       userName={user.fullName || "İsimsiz Kullanıcı"} 
                       userType={user.userType || "individual"}
                       isBanned={user.isBanned}
                       isVerified={user.verifiedBusiness}
                     />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Security Notice */}
      <div className="p-4 bg-slate-900 rounded-2xl flex items-center gap-4 text-white">
         <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
            <ShieldAlert className="text-primary" size={24} />
         </div>
         <p className="text-xs font-medium opacity-80 leading-relaxed">
            <strong>GÜVENLİK NOTU:</strong> Kullanıcı verilerine erişim Log katmanı tarafından kayıt altına alınmaktadır. Yetkisiz veri paylaşımı ve KVKK ihlalleri doğrudan sistem yöneticisine bildirilir.
         </p>
      </div>
    </main>
  );
}
