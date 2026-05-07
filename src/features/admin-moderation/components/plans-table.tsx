"use client";

import { CheckCircle2, Edit3, Loader2, MoreVertical, Tag, Trash2, XCircle } from "lucide-react";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  deletePricingPlan,
  PricingPlan,
  togglePlanStatus,
} from "@/features/admin-moderation/services/plans";
import { PlanForm } from "@/features/forms/components/plan-form";
import { formatCurrency } from "@/features/shared/lib";
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
import { useErrorCapture } from "@/hooks/use-error-capture";

interface PlansTableProps {
  initialPlans: PricingPlan[];
}

export function PlansTable({ initialPlans }: PlansTableProps) {
  const { captureError } = useErrorCapture("plans-table");
  const [plans, setPlans] = useState(initialPlans);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<PricingPlan | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deleteModal, setDeleteModal] = useState<PricingPlan | null>(null);

  const handleToggleStatus = async (plan: PricingPlan) => {
    setIsLoading(plan.id);
    try {
      await togglePlanStatus(plan.id, plan.is_active);
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, is_active: !p.is_active } : p))
      );
      toast.success(`${plan.name} durumu güncellendi`);
    } catch (err) {
      captureError(err, "handleToggleStatus");
      toast.error("İşlem başarısız oldu");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (plan: PricingPlan) => {
    setIsLoading(plan.id);
    try {
      await deletePricingPlan(plan.id);
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      toast.success(`${plan.name} paketi silindi`);
      setDeleteModal(null);
    } catch (err) {
      captureError(err, "handleDelete");
      toast.error("Paket silinemedi");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <>
      <div className="p-6 border-b border-slate-100 bg-slate-50/10 flex justify-end">
        <Button
          onClick={() => setShowCreateForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold text-[10px] tracking-widest uppercase h-11 px-6 shadow-sm shadow-indigo-100 gap-2"
        >
          <Plus size={16} />
          YENİ PAKET EKLE
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Paket Adı
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Fiyat
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Kredi (İlan)
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Özellikler
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Durum
              </th>
              <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                İşlem
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {plans.map((plan) => (
              <tr key={plan.id} className="hover:bg-indigo-50/20 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500">
                      <Tag size={16} />
                    </div>
                    <span className="text-sm font-bold text-slate-800 uppercase tracking-tight">
                      {plan.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-sm font-bold text-slate-900">
                    {formatCurrency(plan.price)}
                  </span>
                </td>
                <td className="px-6 py-5">
                  <Badge className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] py-1 px-2.5 rounded-lg uppercase italic">
                    {plan.credits} İLAN
                  </Badge>
                </td>
                <td className="px-6 py-5">
                  <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                    {Array.isArray(plan.features)
                      ? plan.features.map((feature) => (
                          <Badge
                            key={feature}
                            className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-bold uppercase tracking-tighter"
                          >
                            {String(feature).replace("_", " ")}
                          </Badge>
                        ))
                      : Object.entries(plan.features as Record<string, boolean>).map(
                          ([key, val]) =>
                            val === true && (
                              <Badge
                                key={key}
                                className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-bold uppercase tracking-tighter"
                              >
                                {key.replace("_", " ")}
                              </Badge>
                            )
                        )}
                  </div>
                </td>
                <td className="px-6 py-5">
                  {plan.is_active ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">
                        Aktif
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <XCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">
                        Pasif
                      </span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-5 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="h-9 w-9 p-0 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-[200px] rounded-2xl p-2 shadow-sm border-slate-100"
                    >
                      <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-3 py-2">
                        Paket Kontrolü
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem
                        onClick={() => setEditModal(plan)}
                        className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50"
                      >
                        <Edit3 size={14} />
                        DÜZENLE
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(plan)}
                        disabled={isLoading === plan.id}
                        className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50"
                      >
                        {isLoading === plan.id ? (
                          <Loader2 className="animate-spin" size={14} />
                        ) : plan.is_active ? (
                          <XCircle size={14} />
                        ) : (
                          <CheckCircle2 size={14} />
                        )}
                        {plan.is_active ? "PASİFE AL" : "AKTİF ET"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem
                        onClick={() => setDeleteModal(plan)}
                        className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 size={14} />
                        SİL
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal / Create Modal */}
      {(editModal || showCreateForm) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-sm max-h-[90vh] overflow-y-auto">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                {editModal ? <Edit3 size={28} /> : <Plus size={28} />}
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900 leading-tight">
                  {editModal ? "Paketi Düzenle" : "Yeni Paket Oluştur"}
                </h3>
                <p className="text-sm text-slate-500 font-medium italic mt-0.5">
                  {editModal
                    ? editModal.name
                    : "İlan paketlerinin detaylarını ve özelliklerini tanımlayın."}
                </p>
              </div>
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

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-rose-100 text-rose-600">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Paketi Sil</h3>
                <p className="text-sm text-slate-500">Bu işlem geri alınamaz</p>
              </div>
            </div>
            <p className="mb-6 text-sm text-slate-600">
              <span className="font-bold text-slate-900">{deleteModal.name}</span> paketini silmek
              istediğinizden emin misiniz? Bu paketi kullanan mevcut kullanıcılar etkilenmeyecektir.
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
                disabled={isLoading === deleteModal.id}
              >
                {isLoading === deleteModal.id ? (
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
