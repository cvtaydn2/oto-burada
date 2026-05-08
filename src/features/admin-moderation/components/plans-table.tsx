"use client";

import {
  CheckCircle2,
  Edit3,
  Loader2,
  MoreVertical,
  Plus,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  deletePricingPlan,
  PricingPlan,
  togglePlanStatus,
} from "@/features/admin-moderation/services/plans";
import { PlanForm } from "@/features/forms/components/plan-form";
import { useErrorCapture } from "@/features/shared/hooks/use-error-capture";
import { Badge } from "@/features/ui/components/badge";
import { Button } from "@/features/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/ui/components/dropdown-menu";
import { cn, formatCurrency } from "@/lib";

interface PlansTableProps {
  initialPlans: PricingPlan[];
}

function getFeatureEntries(plan: PricingPlan) {
  if (Array.isArray(plan.features)) {
    return plan.features.map((feature) => String(feature).replaceAll("_", " "));
  }

  return Object.entries(plan.features as Record<string, boolean>)
    .filter(([, value]) => value === true)
    .map(([key]) => key.replaceAll("_", " "));
}

export function PlansTable({ initialPlans }: PlansTableProps) {
  const { captureError } = useErrorCapture("plans-table");
  const [plans, setPlans] = useState(initialPlans);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<PricingPlan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<PricingPlan | null>(null);

  const planSummary = useMemo(
    () => ({
      total: plans.length,
      active: plans.filter((plan) => plan.is_active).length,
      inactive: plans.filter((plan) => !plan.is_active).length,
    }),
    [plans]
  );

  const handleToggleStatus = async (plan: PricingPlan) => {
    setIsLoading(plan.id);

    try {
      await togglePlanStatus(plan.id, plan.is_active);
      setPlans((prev) =>
        prev.map((item) => (item.id === plan.id ? { ...item, is_active: !item.is_active } : item))
      );
      toast.success(`${plan.name} durumu güncellendi`);
    } catch (error) {
      captureError(error, "handleToggleStatus");
      toast.error("İşlem başarısız oldu");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (plan: PricingPlan) => {
    setIsLoading(plan.id);

    try {
      await deletePricingPlan(plan.id);
      setPlans((prev) => prev.filter((item) => item.id !== plan.id));
      toast.success(`${plan.name} paketi silindi`);
      setDeleteModal(null);
    } catch (error) {
      captureError(error, "handleDelete");
      toast.error("Paket silinemedi");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <div className="border-b border-border/70 bg-muted/20 p-4 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground/70">
              Paket kontrol yüzeyi
            </p>
            <h4 className="mt-1 text-base font-semibold text-foreground sm:text-lg">
              Plan durumu, içerik kapsamı ve aksiyonlar daha okunabilir hale getirildi.
            </h4>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Aktivasyon ve silme kararları ayrı tonlarda gösterilir. Mobilde her plan kendi
              kartında aksiyon netliğiyle açılır.
            </p>
          </div>

          <Button
            onClick={() => setShowCreateForm(true)}
            className="h-11 w-full gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-semibold hover:bg-indigo-700 sm:w-auto"
          >
            <Plus size={16} />
            Yeni Paket Ekle
          </Button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <SummaryBadge label="Toplam" value={planSummary.total} tone="default" />
          <SummaryBadge label="Aktif" value={planSummary.active} tone="success" />
          <SummaryBadge label="Pasif" value={planSummary.inactive} tone="warning" />
        </div>
      </div>

      <div className="space-y-3 p-4 sm:hidden">
        {plans.map((plan) => {
          const features = getFeatureEntries(plan);
          const isBusy = isLoading === plan.id;

          return (
            <article
              key={plan.id}
              className="rounded-2xl border border-border/70 bg-card p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                    <Tag size={16} />
                  </div>
                  <div className="min-w-0">
                    <h4 className="break-words text-base font-semibold text-foreground">
                      {plan.name}
                    </h4>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {formatCurrency(plan.price)}
                    </p>
                  </div>
                </div>
                <PlanStatusBadge isActive={plan.is_active} />
              </div>

              <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <InfoCell label="İlan kredisi" value={`${plan.credits} ilan`} />
                <InfoCell
                  label="İşlem notu"
                  value={plan.is_active ? "Satışa açık" : "Gizli / pasif"}
                />
              </div>

              <div className="mt-4 rounded-2xl border border-border/70 bg-muted/20 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                  Özellikler
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {features.length > 0 ? (
                    features.map((feature) => (
                      <Badge
                        key={feature}
                        className="border-emerald-100 bg-emerald-50 text-[10px] font-semibold text-emerald-700"
                      >
                        {feature}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground">Özellik tanımlanmamış.</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditModal(plan)}
                  className="h-10 rounded-xl text-sm font-semibold"
                >
                  <Edit3 className="mr-2 size-4" />
                  Düzenle
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleToggleStatus(plan)}
                  disabled={isBusy}
                  className={cn(
                    "h-10 rounded-xl text-sm font-semibold",
                    plan.is_active
                      ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  )}
                >
                  {isBusy ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : plan.is_active ? (
                    <XCircle className="mr-2 size-4" />
                  ) : (
                    <CheckCircle2 className="mr-2 size-4" />
                  )}
                  {plan.is_active ? "Pasife Al" : "Aktif Et"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDeleteModal(plan)}
                  className="h-10 rounded-xl border-rose-200 bg-rose-50 text-sm font-semibold text-rose-700 hover:bg-rose-100"
                >
                  <Trash2 className="mr-2 size-4" />
                  Paketi Sil
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70 bg-muted/20">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Paket Adı
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Fiyat
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Kredi
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Özellikler
              </th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                Durum
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {plans.map((plan) => {
              const features = getFeatureEntries(plan);

              return (
                <tr key={plan.id} className="transition-colors hover:bg-indigo-50/20">
                  <td className="px-6 py-5 align-top">
                    <div className="flex items-start gap-3">
                      <div className="flex size-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-500">
                        <Tag size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{plan.name}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {plan.is_active ? "Yayında ve satın alınabilir" : "Şu anda görünmüyor"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top text-sm font-semibold text-foreground">
                    {formatCurrency(plan.price)}
                  </td>
                  <td className="px-6 py-5 align-top">
                    <Badge className="bg-slate-100 text-slate-700">{plan.credits} ilan</Badge>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <div className="flex max-w-[260px] flex-wrap gap-1.5">
                      {features.length > 0 ? (
                        features.map((feature) => (
                          <Badge
                            key={feature}
                            className="border-emerald-100 bg-emerald-50 text-[10px] font-semibold text-emerald-700"
                          >
                            {feature}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          Özellik tanımlanmamış.
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-5 align-top">
                    <PlanStatusBadge isActive={plan.is_active} />
                  </td>
                  <td className="px-6 py-5 text-right align-top">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="size-9 rounded-xl border border-transparent p-0 hover:border-border/70 hover:bg-background"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-2xl border-border/70 p-2"
                      >
                        <DropdownMenuLabel className="px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                          Paket kontrolü
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setEditModal(plan)}
                          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium"
                        >
                          <Edit3 className="mr-2 size-4" />
                          Düzenle
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleStatus(plan)}
                          disabled={isLoading === plan.id}
                          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium"
                        >
                          {isLoading === plan.id ? (
                            <Loader2 className="mr-2 size-4 animate-spin" />
                          ) : plan.is_active ? (
                            <XCircle className="mr-2 size-4" />
                          ) : (
                            <CheckCircle2 className="mr-2 size-4" />
                          )}
                          {plan.is_active ? "Pasife al" : "Aktif et"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteModal(plan)}
                          className="cursor-pointer rounded-xl px-3 py-2.5 text-sm font-medium text-rose-600"
                        >
                          <Trash2 className="mr-2 size-4" />
                          Sil
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(editModal || showCreateForm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-border/70 bg-background p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-indigo-100 bg-indigo-50 text-indigo-600">
                {editModal ? <Edit3 size={26} /> : <Plus size={26} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground">
                  {editModal ? "Paketi düzenle" : "Yeni paket oluştur"}
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {editModal
                    ? `${editModal.name} için fiyat, kredi ve özellik ayarlarını güncelleyin.`
                    : "İlan paketinin fiyatını, kredi miktarını ve görünür avantajlarını tanımlayın."}
                </p>
              </div>
            </div>

            <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 p-4 text-xs leading-5 text-blue-900">
              Form kaydı plan verisini günceller. Aktivasyon kararı ise tablo kartındaki ayrı
              aksiyon üzerinden kontrol edilir.
            </div>

            <PlanForm
              initialData={editModal}
              onSuccess={() => {
                setEditModal(null);
                setShowCreateForm(false);
              }}
              onCancel={() => {
                setEditModal(null);
                setShowCreateForm(false);
              }}
            />
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-border/70 bg-background p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start gap-4">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
                <Trash2 size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Paketi sil</h3>
                <p className="mt-1 text-sm text-muted-foreground">Bu işlem geri alınamaz.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-rose-100 bg-rose-50/70 p-4 text-sm leading-6 text-rose-900">
              <p>
                <span className="font-bold">{deleteModal.name}</span> paketini kaldırmak üzeresiniz.
              </p>
              <p className="mt-2 text-xs text-rose-800">
                Mevcut kullanıcı geçmişi korunur, ancak yeni satış akışı bu paketi artık sunmaz.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setDeleteModal(null)}
              >
                Vazgeç
              </Button>
              <Button
                className="flex-1 rounded-xl bg-rose-600 font-semibold hover:bg-rose-700"
                onClick={() => handleDelete(deleteModal)}
                disabled={isLoading === deleteModal.id}
              >
                {isLoading === deleteModal.id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Paketi Sil"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PlanStatusBadge({ isActive }: { isActive: boolean }) {
  return isActive ? (
    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Aktif</Badge>
  ) : (
    <Badge className="border-slate-200 bg-slate-50 text-slate-600">Pasif</Badge>
  );
}

function SummaryBadge({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "default" | "success" | "warning";
}) {
  const toneClassName = {
    default: "border-border/70 bg-background text-foreground",
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

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-muted/30 px-3 py-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
        {label}
      </p>
      <p className="mt-2 text-sm font-medium leading-6 text-foreground break-words">{value}</p>
    </div>
  );
}
