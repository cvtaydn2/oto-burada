"use client";

import { useState, useEffect } from "react";
import { 
  X, 
  Plus, 
  Trash2, 
  Loader2, 
  ChevronRight,
  Car
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getModelsByBrand, createModel, deleteModel } from "@/services/admin/reference";
import { toast } from "sonner";

interface Model {
  id: string;
  name: string;
  slug: string;
}

interface ModelsManagerProps {
  brand: { id: string; name: string };
  onClose: () => void;
}

export function ModelsManager({ brand, onClose }: ModelsManagerProps) {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingModel, setAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const data = await getModelsByBrand(brand.id);
        setModels(data as Model[]);
      } catch {
        toast.error("Modeller yüklenemedi");
      } finally {
        setLoading(false);
      }
    };
    fetchModels();
  }, [brand.id]);

  const handleAddModel = async () => {
    if (!newModelName.trim()) return;
    setAddingModel(true);
    try {
      await createModel(brand.id, newModelName.trim());
      toast.success(`${newModelName} modeli eklendi`);
      setNewModelName("");
      // Refresh list
      const data = await getModelsByBrand(brand.id);
      setModels(data as Model[]);
    } catch {
      toast.error("Model eklenemedi");
    } finally {
      setAddingModel(false);
    }
  };

  const handleDeleteModel = async (id: string) => {
    try {
      await deleteModel(id);
      setModels(prev => prev.filter(m => m.id !== id));
      toast.success("Model silindi");
    } catch {
      toast.error("Model silinemedi");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in slide-in-from-right duration-300 shadow-2xl border-l border-slate-200">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-blue-600 shadow-sm font-black text-xs">
            {brand.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 tracking-tight">{brand.name}</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest italic">Model Kütüphanesi</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="size-10 rounded-xl hover:bg-white hover:border-slate-200 border border-transparent flex items-center justify-center text-slate-400 transition-all"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-6 border-b border-slate-100 pb-8">
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center text-slate-400">
            <Plus size={18} />
          </div>
          <Input 
            value={newModelName}
            onChange={(e) => setNewModelName(e.target.value)}
            disabled={addingModel}
            onKeyDown={(e) => e.key === 'Enter' && handleAddModel()}
            placeholder="Yeni model adı (Örn: Model 3)"
            className="pl-12 h-14 rounded-2xl border-slate-200 bg-white shadow-sm focus:border-blue-400 focus:ring-blue-100 transition-all font-bold placeholder:text-slate-300"
          />
          <Button 
            onClick={handleAddModel}
            disabled={addingModel || !newModelName.trim()}
            className="absolute right-2 top-2 h-10 rounded-xl bg-blue-600 font-black text-[10px] tracking-widest uppercase hover:bg-blue-700 disabled:opacity-50"
          >
            {addingModel ? <Loader2 size={16} className="animate-spin" /> : "EKLE"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-slate-50/10">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-slate-400 gap-3">
            <Loader2 size={24} className="animate-spin" />
            <span className="text-xs font-bold uppercase tracking-widest italic">Modeller Yükleniyor...</span>
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-3xl gap-4 bg-white">
            <Car size={32} className="opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-widest italic">Hiç model bulunamadı</p>
          </div>
        ) : (
          models.map((model) => (
            <div 
              key={model.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md hover:shadow-blue-50/50 transition-all group"
            >
              <div className="flex items-center gap-3">
                 <div className="size-8 rounded-lg bg-slate-50 text-slate-300 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <ChevronRight size={14} />
                 </div>
                 <div>
                    <span className="text-sm font-black text-slate-700 tracking-tight">{model.name}</span>
                    <p className="text-[9px] text-slate-400 font-bold italic">/{model.slug}</p>
                 </div>
              </div>
              <button 
                onClick={() => handleDeleteModel(model.id)}
                className="size-8 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-slate-300 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="p-6 border-t border-slate-100 bg-slate-50/30">
        <div className="flex items-center gap-3">
           <div className="size-2 rounded-full bg-emerald-500" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] italic">Toplam {models.length} model aktif</p>
        </div>
      </div>
    </div>
  );
}
