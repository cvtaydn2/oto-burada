"use client";

import {
  CheckCircle2,
  ChevronRight,
  Edit3,
  Eye,
  Key,
  Loader2,
  Plus,
  Shield,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import type { AdminRole } from "@/features/admin-moderation/services/roles";
import { deleteRole } from "@/features/admin-moderation/services/roles";
import { RoleForm } from "@/features/forms/components/role-form";
import { Button } from "@/features/ui/components/button";

interface AdminRolesClientProps {
  initialRoles: AdminRole[];
}

// Stable color map — custom roles get a default color
const ROLE_COLORS: Record<string, string> = {
  "Süper Admin": "bg-slate-900",
  Moderatör: "bg-blue-600",
  "Destek Ekibi": "bg-indigo-600",
  Kullanıcı: "bg-slate-400",
};

function getRoleColor(name: string) {
  return ROLE_COLORS[name] ?? "bg-violet-600";
}

function getAccessLabel(permissions: string[]) {
  if (permissions.includes("all")) return "Tüm yetkiler";
  const moduleLabels: Record<string, string> = {
    listings: "İlan",
    reports: "Rapor",
    tickets: "Ticket",
    users: "Kullanıcı",
    settings: "Ayarlar",
    plans: "Paket",
  };
  const actionLabels: Record<string, string> = {
    manage: "Yönet",
    approve: "Onayla",
    reject: "Reddet",
    create: "Oluştur",
    view: "Görüntüle",
    update: "Güncelle",
  };
  const labels = permissions.map((p) => {
    const [mod, act] = p.split(".");
    return `${moduleLabels[mod] ?? mod} ${actionLabels[act] ?? act}`;
  });
  return labels.slice(0, 2).join(", ") + (labels.length > 2 ? ` +${labels.length - 2}` : "");
}

// ── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl overflow-y-auto max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Shield size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{title}</h3>
              {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <Button
            onClick={onClose}
            className="size-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Kapat"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ── Delete confirmation modal ─────────────────────────────────────────────────
function DeleteModal({
  role,
  onConfirm,
  onCancel,
  isPending,
}: {
  role: AdminRole;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Rolü Sil</h3>
            <p className="text-sm text-slate-500">Bu işlem geri alınamaz</p>
          </div>
        </div>
        <p className="mb-6 text-sm text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-900">{role.name}</span> rolünü silmek istediğinizden
          emin misiniz?
          {role.user_count > 0 && (
            <span className="block mt-2 text-amber-600 font-medium">
              ⚠️ Bu role atanmış {role.user_count} kullanıcı var.
            </span>
          )}
        </p>
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 rounded-xl font-bold"
            onClick={onCancel}
            disabled={isPending}
          >
            İptal
          </Button>
          <Button
            className="flex-1 rounded-xl bg-rose-600 font-bold hover:bg-rose-700"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="animate-spin size-4" /> : "Sil"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function AdminRolesClient({ initialRoles }: AdminRolesClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [editTarget, setEditTarget] = useState<AdminRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewTarget, setViewTarget] = useState<AdminRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRole(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" rolü silindi`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rol silinemedi");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleFormSuccess = () => {
    setEditTarget(null);
    setShowCreate(false);
    startTransition(() => router.refresh());
  };

  return (
    <>
      <main className="space-y-6 p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Key className="text-primary" size={16} />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] italic">
                Erişim kontrolü
              </span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
              Roller ve <span className="text-blue-600">Yetkiler</span>
            </h1>
            <p className="mt-1.5 text-sm text-slate-500 font-medium italic">
              Sistem rolleri değiştirilemez. Özel roller oluşturabilir ve yönetebilirsiniz.
            </p>
          </div>
          <Button
            onClick={() => setShowCreate(true)}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-bold uppercase tracking-widest hover:bg-blue-700 transition-all shadow-sm"
          >
            <Plus size={16} />
            Yeni Rol Tanımla
          </Button>
        </div>

        {/* Role cards */}
        <div className="grid gap-4 lg:grid-cols-3">
          {initialRoles.map((role) => (
            <div
              key={role.id}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all hover:border-blue-200 hover:shadow-sm"
            >
              {/* Card header */}
              <div className="space-y-3 p-6 bg-slate-50 border-b border-slate-100">
                <div
                  className={`size-10 rounded-xl ${getRoleColor(role.name)} flex items-center justify-center text-white`}
                >
                  <Shield size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900">{role.name}</h3>
                    {role.is_system && (
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Sistem
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    {role.user_count} atanmış kişi
                  </p>
                  {role.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-1">{role.description}</p>
                  )}
                </div>
              </div>

              {/* Card body */}
              <div className="space-y-4 p-6">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Erişim Kapsamı
                  </p>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
                    <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium text-slate-900 truncate">
                      {getAccessLabel(role.permissions)}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    onClick={() => setViewTarget(role)}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600"
                  >
                    <Eye size={14} />
                    Detay
                  </Button>
                  <Button
                    onClick={() => setEditTarget(role)}
                    disabled={role.is_system}
                    title={role.is_system ? "Sistem rolleri düzenlenemez" : "Düzenle"}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium transition-all hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Edit3 size={14} />
                    Düzenle
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(role)}
                    disabled={role.is_system}
                    title={role.is_system ? "Sistem rolleri silinemez" : "Sil"}
                    className="flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 text-xs font-medium transition-all hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                    Sil
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Audit logs link */}
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-5">
              <div className="flex size-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                <Shield size={28} />
              </div>
              <div>
                <h4 className="text-lg font-bold text-slate-900">Gelişmiş erişim logları</h4>
                <p className="text-sm text-slate-500">
                  Hangi yetkinin ne zaman ve kim tarafından kullanıldığını inceleyin.
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              className="flex h-10 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-900 transition-all hover:border-blue-300 hover:text-blue-600"
              asChild
            >
              <a href="/admin/audit">
                Logları görüntüle
                <ChevronRight size={18} />
              </a>
            </Button>
          </div>
        </div>
      </main>

      {/* Create modal */}
      {showCreate && (
        <Modal
          title="Yeni Rol Tanımla"
          subtitle="Özel yetki seti oluşturun"
          onClose={() => setShowCreate(false)}
        >
          <RoleForm onSuccess={handleFormSuccess} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}

      {/* Edit modal */}
      {editTarget && (
        <Modal title="Rolü Düzenle" subtitle={editTarget.name} onClose={() => setEditTarget(null)}>
          <RoleForm
            initialData={editTarget}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      )}

      {/* View modal */}
      {viewTarget && (
        <Modal
          title={viewTarget.name}
          subtitle={viewTarget.description ?? undefined}
          onClose={() => setViewTarget(null)}
        >
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                Yetkiler
              </p>
              <div className="space-y-2">
                {viewTarget.permissions.map((p) => (
                  <div
                    key={p}
                    className="flex items-center gap-2 rounded-lg bg-slate-50 border border-slate-200 px-3 py-2"
                  >
                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium text-slate-700">{p}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Atanmış Kullanıcı
                </p>
                <p className="text-lg font-bold text-slate-900 mt-1">{viewTarget.user_count}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Tür
                </p>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {viewTarget.is_system ? "Sistem Rolü" : "Özel Rol"}
                </p>
              </div>
            </div>
            <Button
              className="w-full rounded-xl"
              variant="outline"
              onClick={() => setViewTarget(null)}
            >
              Kapat
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <DeleteModal
          role={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      )}
    </>
  );
}
