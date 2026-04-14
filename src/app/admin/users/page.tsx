import { Users, Plus, UserCog, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { UserHeaderActions } from "@/components/admin/user-header-actions";
import { UserSearch } from "@/components/admin/user-search";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { UserActionMenu } from "@/components/admin/user_action_menu";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

import { getAllUsers } from "@/services/admin/users";

export default async function AdminUserManagementPage({ 
  searchParams 
}: { 
  searchParams: Promise<{ q?: string }> 
}) {
  const { q } = await searchParams;
  const users = await getAllUsers(q);

  const stats = [
    { label: "Tüm Kullanıcılar", value: users.length.toLocaleString("tr-TR"), color: "text-slate-900" },
    { label: "Aktif", value: users.filter(u => !u.isBanned).length.toLocaleString("tr-TR"), color: "text-emerald-600" },
    { label: "Kurumsal", value: users.filter(u => u.userType === "professional").length.toLocaleString("tr-TR"), color: "text-blue-600" },
  ];

  return (
    <main className="space-y-8 p-6 lg:p-8 max-w-full bg-slate-50/30 min-h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="size-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Admin Çözüm Merkezi</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">
            Kullanıcı <span className="text-blue-600">Yönetimi</span>
          </h1>
          <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Platform genelindeki üye kayıtlarını ve yetkilerini buradan kontrol edin.</p>
        </div>
        <UserHeaderActions />
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <div className="space-y-8 lg:col-span-3">
          {/* Stats bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, idx) => (
              <div key={stat.label} className="flex flex-col p-6 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-blue-100 transition-all group relative overflow-hidden">
                <div className="absolute -right-2 -top-2 size-16 bg-blue-50 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{stat.label}</span>
                <div className="flex items-baseline gap-2">
                  <span className={cn("text-3xl font-black tracking-tighter", stat.color)}>{stat.value}</span>
                  {idx === 0 && <span className="text-[10px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-md">+5%</span>}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Search and Filters */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex flex-col md:flex-row md:items-center gap-4">
              <UserSearch defaultValue={q} />
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-500">Sırala</Button>
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-slate-500">Filtrele</Button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100">
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Profil</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">İletişim</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Rol / Yetki</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kayıt Tarihi</th>
                    <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Durum</th>
                    <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Yönetim</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {users.map((u) => (
                    <tr key={u.id} className="group transition-colors hover:bg-blue-50/20">
                      <td className="p-6">
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            "flex size-11 items-center justify-center rounded-xl text-sm font-black transition-all group-hover:scale-110",
                            u.role === "admin" ? "bg-blue-600 text-white shadow-md shadow-blue-100" : "bg-slate-100 text-slate-500"
                          )}>
                            {(u.fullName || "U")[0].toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-800 block leading-none mb-1 group-hover:text-blue-600 transition-colors uppercase">{u.fullName || "İsimsiz Kullanıcı"}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter italic">ID: #{u.id.substring(0, 8)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="p-6">
                        <span className="text-sm font-medium text-slate-500 italic lowercase">{u.phone || "Telefon Yok"}</span>
                      </td>
                      <td className="p-6">
                        <Badge
                          variant={
                            u.role === "admin"
                              ? "default"
                              : u.userType === "professional"
                              ? "secondary"
                              : "outline"
                          }
                          className={cn(
                             "text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-wider",
                             u.role === "admin" ? "bg-blue-600 text-white" : ""
                          )}
                        >
                          {u.role === "admin" ? "Admin" : u.userType === "professional" ? "Kurumsal" : "Bireysel"}
                        </Badge>
                      </td>
                      <td className="p-6">
                        <span className="text-xs font-bold text-slate-500">
                          {u.createdAt ? format(new Date(u.createdAt), "dd MMM yyyy", { locale: tr }) : "-"}
                        </span>
                      </td>
                      <td className="p-6">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "size-2 rounded-full",
                            !u.isBanned ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                          )} />
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest",
                            !u.isBanned ? "text-emerald-600" : "text-slate-400"
                          )}>{!u.isBanned ? "Aktif" : "Yasaklı"}</span>
                        </div>
                      </td>
                      <td className="p-6 text-right">
                        <UserActionMenu 
                          userId={u.id}
                          isBanned={!!u.isBanned}
                          isAdmin={u.role === "admin"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination Placeholder */}
            <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-center">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] py-2">Sonraki adımlar için kaydırın</span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                 <UserCog size={18} />
              </div>
              <h3 className="text-base font-black text-slate-800 tracking-tight">Hızlı İşlemler</h3>
            </div>
            <div className="space-y-3">
              <Button className="w-full rounded-xl bg-blue-50 text-blue-600 border border-blue-100 hover:bg-blue-600 hover:text-white font-bold text-xs h-11 flex items-center gap-2 justify-start px-4 transition-all">
                <Plus size={16} />
                Yeni Üye Ekle
              </Button>
              <Button variant="outline" className="w-full rounded-xl border-slate-100 text-slate-600 font-bold text-xs h-11 flex items-center gap-2 justify-start px-4 hover:bg-slate-50 transition-all">
                <Users size={16} />
                Toplu İçe Aktar
              </Button>
              <Link href="/admin/roles">
                <Button variant="outline" className="w-full rounded-xl border-slate-100 text-slate-600 font-bold text-xs h-11 flex items-center gap-2 justify-start px-4 hover:bg-slate-50 transition-all">
                  <ShieldCheck size={16} />
                  Yetki Matrisi
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="rounded-3xl border border-blue-600 bg-blue-600 p-6 shadow-lg shadow-blue-100 relative overflow-hidden group">
             <div className="absolute -right-8 -bottom-8 size-32 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform" />
             <h4 className="text-white font-black text-lg leading-tight mb-2">Güvenlik<br/>Kontrolü</h4>
             <p className="text-blue-100 text-xs font-medium mb-6 leading-relaxed">Şüpheli girişleri ve bekleyen onayları periyodik olarak kontrol etmeyi unutmayın.</p>
             <Button className="w-full bg-white text-blue-600 hover:bg-blue-50 rounded-xl font-black text-[10px] tracking-widest uppercase h-10">
                SİSTEMİ TARA
             </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
