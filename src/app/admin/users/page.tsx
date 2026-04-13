import { Users, Search, Plus, MoreVertical, UserCog } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default function AdminUserManagementPage() {
  const mockUsers = [
    { id: "1", name: "Ahmet Yılmaz", email: "ahmet@mail.com", role: "Bireysel", status: "Aktif", joined: new Date("2024-01-15") },
    { id: "2", name: "Mehmet Demir", email: "mehmet@kurumsal.com", role: "Kurumsal", status: "Pasif", joined: new Date("2024-02-20") },
    { id: "3", name: "Selin Ak", email: "selin.k@mail.com", role: "Admin", status: "Aktif", joined: new Date("2023-11-05") },
    { id: "4", name: "Can Öztürk", email: "can.ozturk@mail.com", role: "Bireysel", status: "Aktif", joined: new Date("2024-03-10") },
    { id: "5", name: "Zeynep Kaya", email: "zeynepk@kurumsal.com", role: "Kurumsal", status: "Aktif", joined: new Date("2024-01-28") },
  ];

  const stats = [
    { label: "Tüm Kullanıcılar", value: "1,240", color: "text-slate-900" },
    { label: "Aktif", value: "1,238", color: "text-emerald-600" },
    { label: "Pasif", value: "2", color: "text-slate-400" },
  ];

  return (
    <main className="space-y-6 p-4 lg:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-primary" size={16} />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Admin</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900">
            Kullanıcı Yönetimi
          </h1>
          <p className="mt-1 text-sm text-slate-500 font-medium">Platform genelindeki kullanıcı kayıtlarını yönetin.</p>
        </div>
        <button className="flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
          <Plus size={16} />
          Yeni Kullanıcı Ekle
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-3">
          {/* Stats bar */}
          <div className="flex items-center gap-6 p-4 rounded-xl border border-slate-200 bg-white">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <span className={`text-2xl font-black ${stat.color}`}>{stat.value}</span>
                <span className="text-xs font-medium text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>

          {/* Search bar */}
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="İsim, e-posta veya ID ile ara..."
                className="h-9 w-full rounded-md border-0 bg-slate-50 pl-9 pr-4 text-sm text-slate-900 outline-none transition-all focus:bg-white focus:ring-1 focus:ring-primary/20 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kullanıcı</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">E-posta</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Rol</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Kayıt Tarihi</th>
                  <th className="p-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Durum</th>
                  <th className="p-4 text-right text-[10px] font-bold text-slate-500 uppercase tracking-wider">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mockUsers.map((u) => (
                  <tr key={u.id} className="group transition-colors hover:bg-slate-50/60">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex size-8 items-center justify-center rounded-md bg-slate-100 text-xs font-bold text-slate-500">
                          {u.name[0]}
                        </div>
                        <span className="text-sm font-bold text-slate-900">{u.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-slate-600">{u.email}</span>
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          u.role === "Admin"
                            ? "default"
                            : u.role === "Kurumsal"
                            ? "secondary"
                            : "outline"
                        }
                        className="text-[10px] font-medium"
                      >
                        {u.role}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-500 font-medium">
                        {format(u.joined, "dd MMM yyyy", { locale: tr })}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`size-1.5 rounded-full ${u.status === "Aktif" ? "bg-emerald-500" : "bg-slate-300"}`} />
                        <span className="text-xs font-medium text-slate-700">{u.status}</span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <button className="inline-flex size-8 items-center justify-center rounded-md text-slate-400 transition-all hover:bg-slate-100 hover:text-primary">
                        <MoreVertical size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 mb-4">
              <UserCog size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-slate-900">Hızlı İşlemler</h3>
            </div>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                <Plus size={14} />
                Yeni Kullanıcı Ekle
              </button>
              <button className="w-full flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors">
                <Users size={14} />
                Toplu İçe Aktar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
