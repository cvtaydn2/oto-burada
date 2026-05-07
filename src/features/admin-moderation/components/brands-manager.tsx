"use client";

import {
  AlertTriangle,
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
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  addBrand,
  createModel,
  deleteBrand,
  toggleBrandStatus,
  updateBrand,
} from "@/features/admin-moderation/services/reference";
import { Button } from "@/features/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/features/ui/components/dropdown-menu";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";
import { useErrorCapture } from "@/hooks/use-error-capture";

import { ModelsManager } from "./models-manager";

interface Brand {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

interface BrandsManagerProps {
  initialBrands: Brand[];
  showTableOnly?: boolean;
}

export function BrandsManager({ initialBrands, showTableOnly }: BrandsManagerProps) {
  const { captureError } = useErrorCapture("brands-manager");
  const router = useRouter();
  const [brands, setBrands] = useState(initialBrands);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [addBrandModal, setAddBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addModelModal, setAddModelModal] = useState<Brand | null>(null);
  const [newModelName, setNewModelName] = useState("");
  const [isAddingModel, setIsAddingModel] = useState(false);
  const [selectedBrandForModels, setSelectedBrandForModels] = useState<Brand | null>(null);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleToggleStatus = async (brand: Brand) => {
    setLoadingId(brand.id);
    try {
      await toggleBrandStatus(brand.id, brand.is_active);
      setBrands((prev) =>
        prev.map((b) => (b.id === brand.id ? { ...b, is_active: !b.is_active } : b))
      );
      toast.success(`${brand.name} durumu güncellendi`);
    } catch (err) {
      captureError(err, "handleToggleStatus");
      toast.error("İşlem başarısız oldu");
    } finally {
      setLoadingId(null);
    }
  };

  const handleUpdateBrand = async () => {
    if (!editingBrand || !editingBrand.name.trim()) return;
    setIsAdding(true);
    try {
      await updateBrand(editingBrand.id, editingBrand.name.trim());
      setBrands((prev) =>
        prev.map((b) => (b.id === editingBrand.id ? { ...b, name: editingBrand.name.trim() } : b))
      );
      toast.success("Marka güncellendi");
      setEditingBrand(null);
    } catch (err) {
      captureError(err, "handleUpdateBrand");
      toast.error("Marka güncellenemedi");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteBrandConfirmed = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await deleteBrand(deleteId);
      setBrands((prev) => prev.filter((b) => b.id !== deleteId));
      toast.success("Marka silindi");
      setDeleteId(null);
    } catch (err) {
      captureError(err, "handleDeleteBrand");
      toast.error("Marka silinemedi (bağlı modeller olabilir)");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) {
      toast.error("Marka adı gereklidir");
      return;
    }

    setIsAdding(true);
    try {
      await addBrand(newBrandName.trim());
      toast.success(`${newBrandName} markası eklendi`);
      setNewBrandName("");
      setAddBrandModal(false);
      router.refresh();
    } catch (err) {
      captureError(err, "handleAddBrand");
      toast.error("Marka eklenemedi");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddModel = async (brand: Brand) => {
    if (!newModelName.trim()) {
      toast.error("Model adı gereklidir");
      return;
    }

    setIsAddingModel(true);
    try {
      await createModel(brand.id, newModelName.trim());
      toast.success(`${newModelName} modeli eklendi`);
      setNewModelName("");
      setAddModelModal(null);
    } catch (err) {
      captureError(err, "handleAddModel");
      toast.error("Model eklenemedi");
    } finally {
      setIsAddingModel(false);
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Marka
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                URL (Slug)
              </th>
              <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                Koleksiyon
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
            {brands.map((brand) => (
              <tr key={brand.id} className="hover:bg-blue-50/20 transition-colors group">
                <td className="px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:bg-white group-hover:text-blue-600 group-hover:border-blue-100 transition-all font-bold text-xs">
                      {brand.name.substring(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-bold text-slate-800 tracking-tight">
                      {brand.name}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400 italic">
                    /{brand.slug}
                    <ExternalLink
                      size={12}
                      className="opacity-0 group-hover:opacity-100 transition-all"
                    />
                  </div>
                </td>
                <td className="px-6 py-5">
                  <Button
                    onClick={() => setSelectedBrandForModels(brand)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:border-blue-300 hover:text-blue-600 transition-all group/btn shadow-sm"
                  >
                    <Car size={14} className="text-slate-400 group-hover/btn:text-blue-500" />
                    <span className="text-[10px] font-bold text-slate-600 uppercase italic group-hover/btn:text-blue-600">
                      Föyü Aç
                    </span>
                    <ChevronRight
                      size={12}
                      className="text-slate-300 group-hover/btn:text-blue-400"
                    />
                  </Button>
                </td>
                <td className="px-6 py-5">
                  {brand.is_active ? (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">
                        Yayında
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <XCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest italic">
                        Gizli
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
                        Marka Ayarları
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem
                        onClick={() => setEditingBrand(brand)}
                        className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all"
                      >
                        <Edit size={14} />
                        DÜZENLE
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => setAddModelModal(brand)}
                        className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 hover:bg-slate-50 transition-all"
                      >
                        <Plus size={14} />
                        MODEL EKLE
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-50" />
                      <DropdownMenuItem
                        onClick={() => handleToggleStatus(brand)}
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
                        onClick={() => setDeleteId(brand.id)}
                        className="cursor-pointer gap-2 font-bold text-[10px] uppercase tracking-widest rounded-xl px-3 py-2.5 text-rose-600 hover:bg-rose-50 transition-all font-bold"
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

      {/* Add Brand Button - Only show when not in table-only mode */}
      {!showTableOnly && (
        <div className="p-6 border-t border-slate-100">
          <Button
            onClick={() => setAddBrandModal(true)}
            className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all py-6"
          >
            <Plus size={18} className="mr-2" />
            YENİ MARKA EKLE
          </Button>
        </div>
      )}

      {/* Add Brand Modal */}
      {addBrandModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Plus size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Yeni Marka Ekle</h3>
                <p className="text-sm text-slate-500">Araç veritabanına yeni marka ekleyin</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Marka Adı
                </Label>
                <Input
                  value={newBrandName}
                  onChange={(e) => setNewBrandName(e.target.value)}
                  placeholder="Örn: Tesla"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 font-bold"
                onClick={() => {
                  setAddBrandModal(false);
                  setNewBrandName("");
                }}
              >
                İptal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-blue-600 font-bold hover:bg-blue-700"
                onClick={handleAddBrand}
                disabled={isAdding}
              >
                {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Ekle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add Model Modal */}
      {addModelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Car size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Yeni Model Ekle</h3>
                <p className="text-sm text-slate-500">{addModelModal.name} için yeni model</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Model Adı
                </Label>
                <Input
                  value={newModelName}
                  onChange={(e) => setNewModelName(e.target.value)}
                  placeholder="Örn: Model S"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 font-bold"
                onClick={() => {
                  setAddModelModal(null);
                  setNewModelName("");
                }}
              >
                İptal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-blue-600 font-bold hover:bg-blue-700"
                onClick={() => handleAddModel(addModelModal)}
                disabled={isAddingModel}
              >
                {isAddingModel ? <Loader2 className="animate-spin" size={18} /> : "Ekle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Models Slide Panel Overlay */}
      {selectedBrandForModels && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300"
            onClick={() => setSelectedBrandForModels(null)}
          />
          <div className="relative w-full max-w-lg h-full">
            <ModelsManager
              brand={selectedBrandForModels}
              onClose={() => setSelectedBrandForModels(null)}
            />
          </div>
        </div>
      )}
      {/* Edit Brand Modal */}
      {editingBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Edit size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Markayı Düzenle</h3>
                <p className="text-sm text-slate-500">
                  {editingBrand.name} bilgilerini güncelleyin
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Marka Adı
                </Label>
                <Input
                  value={editingBrand.name}
                  onChange={(e) => setEditingBrand({ ...editingBrand, name: e.target.value })}
                  placeholder="Marka adı"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 font-bold"
                onClick={() => setEditingBrand(null)}
              >
                İptal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-blue-600 font-bold hover:bg-blue-700 text-white"
                onClick={handleUpdateBrand}
                disabled={isAdding}
              >
                {isAdding ? <Loader2 className="animate-spin" size={18} /> : "Güncelle"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
            <div className="mb-6 flex items-center gap-4 text-rose-600">
              <div className="flex size-12 items-center justify-center rounded-xl bg-rose-100">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold">Markayı Sil?</h3>
                <p className="text-sm text-slate-500">
                  Bu işlem geri alınamaz ve markaya bağlı her şey (modeller vb.) etkilenebilir.
                </p>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                className="flex-1 rounded-xl border-slate-200 font-bold"
                onClick={() => setDeleteId(null)}
              >
                İptal
              </Button>
              <Button
                className="flex-1 rounded-xl bg-rose-600 font-bold hover:bg-rose-700 text-white"
                onClick={handleDeleteBrandConfirmed}
                disabled={isDeleting}
              >
                {isDeleting ? <Loader2 className="animate-spin" size={18} /> : "SİL"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
