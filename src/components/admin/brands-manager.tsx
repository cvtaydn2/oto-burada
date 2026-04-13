"use client";

import { useState } from "react";
import { 
  MoreVertical, 
  ExternalLink, 
  Settings2, 
  CheckCircle2, 
  XCircle,
  Car
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
import { toast } from "sonner";
import { toggleBrandStatus } from "@/services/admin/reference";

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface BrandsManagerProps {
  initialBrands: Brand[];
}

export function BrandsManager({ initialBrands }: BrandsManagerProps) {
  const [brands, setBrands] = useState(initialBrands);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleToggleStatus = async (brand: Brand) => {
    setLoadingId(brand.id);
    try {
      await toggleBrandStatus(brand.id, brand.is_active);
      setBrands(prev => prev.map(b => 
        b.id === brand.id ? { ...b, is_active: !b.is_active } : b
      ));
      toast.success(`${brand.name} durumu güncellendi`);
    } catch {
      toast.error("İşlem başarısız oldu");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Marka</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">URL (Slug)</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Koleksiyon</th>
            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Durum</th>
            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">İşlem</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {brands.map((brand) => (
            <tr key={brand.id} className="hover:bg-blue-50/20 transition-colors group">
              <td className="px-6 py-5">
                <div className="flex items-center gap-3">
                   <div className="size-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:border-blue-100 transition-all font-black text-xs">
                      {brand.name.substring(0, 2).toUpperCase()}
                   </div>
                   <span className="text-sm font-black text-slate-800 tracking-tight">{brand.name}</span>
                </div>
              </td>
              <td className="px-6 py-5">
                 <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                    /{brand.slug}
                    <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
                 </div>
              </td>
              <td className="px-6 py-5">
                 <div className="flex items-center gap-2">
                    <Car size={14} className="text-slate-300" />
                    <span className="text-[10px] font-black text-slate-500 uppercase italic">Modelleri Gör</span>
                 </div>
              </td>
              <td className="px-6 py-5">
                 {brand.is_active ? (
                   <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Yayında</span>
                   </div>
                 ) : (
                   <div className="flex items-center gap-1.5 text-slate-400">
                      <XCircle size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Gizli</span>
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
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">Marka Ayarları</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-50" />
                    <DropdownMenuItem className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all">
                      <Settings2 size={14} />
                      DÜZENLE
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => handleToggleStatus(brand)}
                      disabled={loadingId === brand.id}
                      className="cursor-pointer gap-2 font-black text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all"
                    >
                      {brand.is_active ? <XCircle size={14} /> : <CheckCircle2 size={14} />}
                      {brand.is_active ? "YAYINDAN KALDIR" : "YAYINA AL"}
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
