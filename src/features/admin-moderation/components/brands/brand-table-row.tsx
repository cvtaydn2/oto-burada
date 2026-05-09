import {
  Car,
  CheckCircle2,
  ChevronRight,
  Edit,
  ExternalLink,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Brand {
  id: string;
  image_url?: string | null;
  is_active: boolean;
  name: string;
  slug: string;
}

interface BrandTableRowProps {
  brand: Brand;
  loadingId: string | null;
  onToggleStatus: (brand: Brand) => void;
  onEdit: (brand: Brand) => void;
  onAddModel: (brand: Brand) => void;
  onDelete: (id: string) => void;
  onSelectModels: (brand: Brand) => void;
}

export function BrandTableRow({
  brand,
  loadingId,
  onToggleStatus,
  onEdit,
  onAddModel,
  onDelete,
  onSelectModels,
}: BrandTableRowProps) {
  return (
    <tr className="hover:bg-blue-50/20 transition-colors group">
      <td className="px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="size-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:border-blue-100 transition-all font-bold text-xs">
            {brand.name.substring(0, 2).toUpperCase()}
          </div>
          <span className="text-sm font-bold text-slate-800 tracking-tight">{brand.name}</span>
        </div>
      </td>
      <td className="px-6 py-5 text-xs font-bold text-slate-400 italic">
        <div className="flex items-center gap-2">
          /{brand.slug}
          <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-all" />
        </div>
      </td>
      <td className="px-6 py-5">
        <Button
          onClick={() => onSelectModels(brand)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-all group/btn shadow-sm"
        >
          <Car size={14} className="text-slate-400 group-hover/btn:text-blue-500" />
          <span className="text-[10px] font-bold text-slate-600 uppercase italic group-hover/btn:text-blue-600">
            Föyü Aç
          </span>
          <ChevronRight size={12} className="text-slate-300 group-hover/btn:text-blue-400" />
        </Button>
      </td>
      <td className="px-6 py-5">
        {brand.is_active ? (
          <div className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Yayında</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-slate-400">
            <XCircle size={14} />
            <span className="text-[10px] font-bold uppercase tracking-widest italic">Gizli</span>
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
              Marka Ayarları
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem
              onClick={() => onEdit(brand)}
              className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all"
            >
              <Edit size={14} /> DÜZENLE
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onAddModel(brand)}
              className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all"
            >
              <Plus size={14} /> MODEL EKLE
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem
              onClick={() => onToggleStatus(brand)}
              disabled={loadingId === brand.id}
              className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all"
            >
              {loadingId === brand.id ? (
                <Loader2 className="animate-spin" size={14} />
              ) : brand.is_active ? (
                <XCircle size={14} />
              ) : (
                <CheckCircle2 size={14} />
              )}
              {brand.is_active ? "YAYINDAN KALDIR" : "YAYINA AL"}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50" />
            <DropdownMenuItem
              onClick={() => onDelete(brand.id)}
              className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 text-rose-600 hover:bg-rose-50 transition-all"
            >
              <Trash2 size={14} /> SİL
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}
