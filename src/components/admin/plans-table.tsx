"use client";

import { useState } from "react";
import { 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  MoreVertical,
  Zap,
  Tag
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";
import { PricingPlan, togglePlanStatus } from "@/services/admin/plans";

interface PlansTableProps {
  initialPlans: PricingPlan[];
}

export function PlansTable({ initialPlans }: PlansTableProps) {
  const [plans, setPlans] = useState(initialPlans);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleToggleStatus = async (plan: PricingPlan) => {
    setIsLoading(plan.id);
    try {
      await togglePlanStatus(plan.id, plan.is_active);
      setPlans(prev => prev.map(p => 
        p.id === plan.id ? { ...p, is_active: !p.is_active } : p
      ));
      toast.success(`${plan.name} durumu güncellendi`);
    } catch (error) {
      toast.error("İşlem başarısız oldu");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Paket Adı</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fiyat</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Kredi (İlan)</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Özellikler</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Durum</th>
            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">İşlem</th>
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
                   <span className="text-sm font-black text-slate-800 uppercase tracking-tight">{plan.name}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                <span className="text-sm font-black text-slate-900">{formatCurrency(plan.price)}</span>
              </td>
              <td className="px-6 py-5">
                 <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[10px] py-1 px-2.5 rounded-lg uppercase italic">
                    {plan.credits} İLAN
                 </Badge>
              </td>
              <td className="px-6 py-5">
                 <div className="flex gap-1.5 flex-wrap max-w-[200px]">
                    {Object.entries(plan.features).map(([key, val]) => (
                      val === true && (
                        <Badge key={key} className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black uppercase tracking-tighter">
                           {key.replace('_', ' ')}
                        </Badge>
                      )
                    ))}
                 </div>
              </td>
              <td className="px-6 py-5">
                 {plan.is_active ? (
                   <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Aktif</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 text-slate-400">
                      <XCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Pasif</span>
                   </div>
                 )}
              </td>
              <td className="px-6 py-5 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl hover:bg-white border border-transparent hover:border-slate-200 transition-all">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px] rounded-2xl p-2 shadow-xl border-slate-100">
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Paket Kontrolü</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50">
                      <Edit3 size={14} />
                      DÜZENLE
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(plan)}
                      disabled={isLoading === plan.id}
                      className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50"
                    >
                      {plan.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      {plan.is_active ? "PASİFE AL" : "AKTİF ET"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 text-rose-600 hover:bg-rose-50">
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
  );
}
