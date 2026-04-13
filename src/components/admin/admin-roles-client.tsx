"use client";

import { useState } from "react";
import { Shield, Key, Eye, Edit3, Trash2, Plus, ChevronRight, CheckCircle2, X, Loader2 } from "lucide-react";
import { AdminRole, deleteRole } from "@/services/admin/roles";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AdminRolesClientProps {
  initialRoles: AdminRole[];
}

const roleColors: Record<string, string> = {
  admin: "bg-slate-900",
  moderator: "bg-blue-600",
  support: "bg-indigo-600",
  user: "bg-slate-400",
};

export function AdminRolesClient({ initialRoles }: AdminRolesClientProps) {
  const [roles, setRoles] = useState(initialRoles);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<AdminRole | null>(null);

  const handleDelete = async (role: AdminRole) => {
    if (role.is_system) {
      toast.error("Sistem rolleri silinemez");
      return;
    }

    setIsDeleting(role.id);
    try {
      await deleteRole(role.id);
      setRoles((prev) => prev.filter((r) => r.id !== role.id));
      toast.success(`${role.name} rolü silindi`);
      setDeleteModal(null);
    } catch {
      toast.error("Rol silinemedi");
    } finally {
      setIsDeleting(null);
    }
  };

  const getAccessLabel = (permissions: string[]) => {
    if (permissions.includes("all")) return "Tüm yetkiler";
    const labels = permissions.map((p) => {
      const [module, action] = p.split(".");
      const moduleLabels: Record<string, string> = {
        listings: "İlan",
        reports: "Rapor",
        tickets: "Ticket",
        users: "Kullanıcı",
        settings: "Ayarlar",
      };
      const actionLabels: Record<string, string> = {
        manage: "Yönet",
        approve: "Onayla",
        reject: "Reddet",
        create: "Oluştur",
        view: "Görüntüle",
        update: "Güncelle",
      };
      return `${moduleLabels[module] || module} ${actionLabels[action] || action}`;
    });
    return labels.slice(0, 2).join(", ") + (labels.length > 2 ? "..." : "");
  };

  return (
    <>
      <main className="space-y-6 p-4 lg:p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="text-primary" size={16} />
              <span className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] italic">Erişim kontrolü</span>
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">
              Roller ve <span className="text-blue-600">Yetkiler</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 font-medium italic">Sistem personelinin yetki seviyelerini ve erişim limitlerini tanımlayın.</p>
          </div>
          <Button className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-black uppercase tracking-widest hover:bg-blue-700 transition-all">
            <Plus size={16} />
            Yeni rol tanımla
          </Button>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-200"
            >
              <div className="relative space-y-3 p-6 bg-slate-50 border-b border-slate-100">
                <div className={`size-10 rounded-xl ${roleColors[role.id] || "bg-slate-500"} flex items-center justify-center text-white`}>
                  <Shield size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-black text-slate-900">{role.name}</h3>
                    {role.is_system && (
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">Sistem</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{role.user_count} atanmış kişi</p>
                </div>
              </div>
              <div className="space-y-5 p-6">
                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Erişim Kapsamı</p>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 truncate">{getAccessLabel(role.permissions)}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600">
                    <Eye size={16} />
                  </button>
                  <button className="flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500 transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600">
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => setDeleteModal(role)}
                    disabled={role.is_system}
                    className={`flex h-10 flex-1 items-center justify-center rounded-lg border transition-all ${
                      role.is_system
                        ? "border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed"
                        : "border-slate-200 bg-slate-50 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600"
                    }`}
                  >
                    <Trash2 size={16} />
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
                <h4 className="text-lg font-black text-slate-900">Gelişmiş erişim logları</h4>
                <p className="text-sm text-slate-500">Hangi yetkinin ne zaman ve kim tarafından kullanıldığını inceleyin.</p>
              </div>
            </div>
            <Button variant="outline" className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-all hover:border-blue-300 hover:text-blue-600">
              Logları görüntüle
              <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Rolü Sil</h3>
                <p className="text-sm text-slate-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-slate-600">
              <span className="font-bold text-slate-900">{deleteModal.name}</span> rolünü silmek istediğinizden emin misiniz? 
              Bu role sahip kullanıcılar varsayılan &quot;Kullanıcı&quot; rolüne geçirilecektir.
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 font-bold"
                onClick={() => setDeleteModal(null)}
              >
                İptal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-rose-600 font-bold hover:bg-rose-700"
                onClick={() => handleDelete(deleteModal)}
                disabled={isDeleting === deleteModal.id}
              >
                {isDeleting === deleteModal.id ? (
                  <Loader2 className="animate-spin" size={18} />
                ) : (
                  "Sil"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}