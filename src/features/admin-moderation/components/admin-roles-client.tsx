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
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { RoleForm } from "@/components/forms/role-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AdminRole } from "@/features/admin-moderation/services/roles";
import { deleteRole } from "@/features/admin-moderation/services/roles";
import {} from "@/lib";
import { cn } from "@/lib/utils";

interface AdminRolesClientProps {
  initialRoles: AdminRole[];
}

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
  if (permissions.includes("all")) {
    return "Tüm yetkiler";
  }

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

  const labels = permissions.map((permission) => {
    const [moduleName, actionName] = permission.split(".");
    return `${moduleLabels[moduleName] ?? moduleName} ${actionLabels[actionName] ?? actionName}`;
  });

  return `${labels.slice(0, 2).join(", ")}${labels.length > 2 ? ` +${labels.length - 2}` : ""}`;
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border/70 bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border/70 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-blue-100 bg-blue-50 text-blue-600">
              <Shield size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">{title}</h3>
              {subtitle ? <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="size-9 rounded-xl"
            aria-label="Kapat"
          >
            <X size={18} />
          </Button>
        </div>
        <div className="p-5 sm:p-6">{children}</div>
      </div>
    </div>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl border border-border/70 bg-background p-5 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <Trash2 size={22} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Rolü sil</h3>
            <p className="mt-1 text-sm text-muted-foreground">Bu işlem geri alınamaz.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm leading-6 text-rose-900">
          <p>
            <span className="font-bold">{role.name}</span> rolünü kalıcı olarak kaldırmak
            üzeresiniz.
          </p>
          <p className="mt-2 text-xs text-rose-800">
            Rol silme kararı audit izine yazılır; bu yüzden önce role atanmış kullanıcı sayısını
            doğrulayın.
          </p>
          {role.user_count > 0 ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
              Bu role atanmış {role.user_count} kullanıcı bulunuyor. Silmeden önce alternatif rol
              planı yapın.
            </p>
          ) : null}
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1 rounded-xl"
            onClick={onCancel}
            disabled={isPending}
          >
            Vazgeç
          </Button>
          <Button
            className="flex-1 rounded-xl bg-rose-600 font-semibold hover:bg-rose-700"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : "Rolü Sil"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function AdminRolesClient({ initialRoles }: AdminRolesClientProps) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [editTarget, setEditTarget] = useState<AdminRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminRole | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [viewTarget, setViewTarget] = useState<AdminRole | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const roleSummary = useMemo(
    () => ({
      total: initialRoles.length,
      system: initialRoles.filter((role) => role.is_system).length,
      custom: initialRoles.filter((role) => !role.is_system).length,
      assignedUsers: initialRoles.reduce((total, role) => total + role.user_count, 0),
    }),
    [initialRoles]
  );

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteRole(deleteTarget.id);
      toast.success(`"${deleteTarget.name}" rolü silindi`);
      setDeleteTarget(null);
      startTransition(() => router.refresh());
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Rol silinemedi");
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
      <div className="min-h-full space-y-6 bg-muted/30 p-4 sm:p-6 lg:space-y-8 lg:p-8">
        <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Key className="size-4 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Erişim kontrolü
              </span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Roller ve <span className="text-blue-600">Yetkiler</span>
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm font-medium italic text-muted-foreground">
              Sistem rolleri korunur. Özel roller için görünür kapsam, kullanıcı etkisi ve audit
              yönü bu yüzeyde netleştirilir.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 xl:w-auto xl:min-w-[320px] xl:items-end">
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">
              <p className="font-semibold">Operasyon uyarısı</p>
              <p className="mt-1 text-amber-800">
                Sistem rolleri düzenlenmez veya silinmez. Özel rollerde değişiklik yapmadan önce
                kullanıcı atama etkisini gözden geçirin.
              </p>
            </div>
            <Button
              onClick={() => setShowCreate(true)}
              className="h-11 w-full gap-2 rounded-xl bg-blue-600 px-5 text-sm font-semibold hover:bg-blue-700 xl:w-auto"
            >
              <Plus size={16} />
              Yeni Rol Tanımla
            </Button>
          </div>
        </section>

        <section className="rounded-3xl border border-border/70 bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Auditability özeti
              </p>
              <h2 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
                Rol envanteri ve atama yoğunluğu tek bakışta görünür.
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Bu kartlar aksiyon öncesi bağlam üretir; hangi rolün sistemde sabit olduğunu ve kaç
                kullanıcıyı etkilediğini hızla anlamanızı sağlar.
              </p>
            </div>
            <Button variant="outline" className="rounded-xl" asChild>
              <a href="/admin/audit">
                Audit kayıtlarını aç
                <ChevronRight className="ml-2 size-4" />
              </a>
            </Button>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Toplam rol" value={roleSummary.total} tone="default" />
            <SummaryCard label="Sistem rolü" value={roleSummary.system} tone="info" />
            <SummaryCard label="Özel rol" value={roleSummary.custom} tone="success" />
            <SummaryCard
              label="Atanmış kullanıcı"
              value={roleSummary.assignedUsers}
              tone="warning"
            />
          </div>
        </section>

        <section className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
          {initialRoles.map((role) => (
            <article
              key={role.id}
              className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-sm transition-colors hover:border-border"
            >
              <div className="border-b border-border/60 bg-muted/20 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div
                      className={cn(
                        "flex size-11 items-center justify-center rounded-2xl text-white shadow-sm",
                        getRoleColor(role.name)
                      )}
                    >
                      <Shield size={20} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-bold text-foreground">{role.name}</h3>
                        {role.is_system ? (
                          <Badge className="bg-slate-100 text-slate-700">Sistem</Badge>
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {role.user_count} atanmış kullanıcı
                      </p>
                      {role.description ? (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground break-words">
                          {role.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">Açıklama girilmemiş.</p>
                      )}
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className={cn(
                      "self-start border text-[11px] font-semibold",
                      role.is_system
                        ? "border-slate-200 bg-slate-50 text-slate-700"
                        : "border-blue-200 bg-blue-50 text-blue-700"
                    )}
                  >
                    {role.is_system ? "Korunan rol" : "Düzenlenebilir"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-4 p-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <InfoPanel label="Erişim kapsamı" value={getAccessLabel(role.permissions)} />
                  <InfoPanel
                    label="İşlem güvenliği"
                    value={role.is_system ? "Yalnız görüntülenir" : "Düzenleme ve silme açık"}
                  />
                </div>

                <div className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                    Yetki sinyali
                  </p>
                  <div className="mt-3 flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
                    <p className="text-sm leading-6 text-foreground break-words">
                      {getAccessLabel(role.permissions)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Button
                    onClick={() => setViewTarget(role)}
                    variant="outline"
                    className="h-10 flex-1 rounded-xl text-sm font-semibold"
                  >
                    <Eye className="mr-2 size-4" />
                    Detay
                  </Button>
                  <Button
                    onClick={() => setEditTarget(role)}
                    disabled={role.is_system}
                    variant="outline"
                    title={role.is_system ? "Sistem rolleri düzenlenemez" : "Düzenle"}
                    className="h-10 flex-1 rounded-xl border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 hover:text-blue-800 disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                  >
                    <Edit3 className="mr-2 size-4" />
                    Düzenle
                  </Button>
                  <Button
                    onClick={() => setDeleteTarget(role)}
                    disabled={role.is_system}
                    variant="outline"
                    title={role.is_system ? "Sistem rolleri silinemez" : "Sil"}
                    className="h-10 flex-1 rounded-xl border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Sil
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>

      {showCreate ? (
        <Modal
          title="Yeni rol tanımla"
          subtitle="Özel yetki seti oluşturun"
          onClose={() => setShowCreate(false)}
        >
          <RoleForm onSuccess={handleFormSuccess} onCancel={() => setShowCreate(false)} />
        </Modal>
      ) : null}

      {editTarget ? (
        <Modal title="Rolü düzenle" subtitle={editTarget.name} onClose={() => setEditTarget(null)}>
          <RoleForm
            initialData={editTarget}
            onSuccess={handleFormSuccess}
            onCancel={() => setEditTarget(null)}
          />
        </Modal>
      ) : null}

      {viewTarget ? (
        <Modal
          title={viewTarget.name}
          subtitle={viewTarget.description ?? "Rol açıklaması bulunmuyor."}
          onClose={() => setViewTarget(null)}
        >
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
                Yetki listesi
              </p>
              <div className="space-y-2">
                {viewTarget.permissions.map((permission) => (
                  <div
                    key={permission}
                    className="flex items-center gap-2 rounded-2xl border border-border/70 bg-muted/20 px-3 py-3"
                  >
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600" />
                    <span className="text-sm font-medium text-foreground break-words">
                      {permission}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 border-t border-border/70 pt-4 sm:grid-cols-2">
              <InfoPanel label="Atanmış kullanıcı" value={String(viewTarget.user_count)} />
              <InfoPanel label="Tür" value={viewTarget.is_system ? "Sistem rolü" : "Özel rol"} />
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              Audit görünürlüğü için izinler ham anahtar olarak da gösterilir. Böylece policy ve UI
              kararları arasında eşleştirme yapmak kolaylaşır.
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
      ) : null}

      {deleteTarget ? (
        <DeleteModal
          role={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          isPending={isDeleting}
        />
      ) : null}
    </>
  );
}

function SummaryCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "info" | "success" | "warning";
}) {
  const toneClassName = {
    default: "border-border/70 bg-background text-foreground",
    info: "border-blue-200 bg-blue-50 text-blue-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  }[tone];

  return (
    <div className={cn("rounded-2xl border px-4 py-4", toneClassName)}>
      <p className="text-[10px] font-bold uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function InfoPanel({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/30 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-foreground break-words">{value}</p>
    </div>
  );
}
