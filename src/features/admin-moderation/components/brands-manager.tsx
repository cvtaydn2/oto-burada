"use client";

import { Plus } from "lucide-react";
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
import { useErrorCapture } from "@/features/shared/hooks/use-error-capture";
import { Button } from "@/features/ui/components/button";

import {
  AddBrandModal,
  AddModelModal,
  DeleteBrandModal,
  EditBrandModal,
} from "./brands/brand-modals";
import { BrandTableRow } from "./brands/brand-table-row";
import { ModelsManager } from "./models-manager";

interface Brand {
  id: string;
  image_url?: string | null;
  is_active: boolean;
  name: string;
  slug: string;
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
  const [addBrandModalOpen, setAddBrandModalOpen] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [addModelModalBrand, setAddModelModalBrand] = useState<Brand | null>(null);
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
      setAddBrandModalOpen(false);
      router.refresh();
    } catch (err) {
      captureError(err, "handleAddBrand");
      toast.error("Marka eklenemedi");
    } finally {
      setIsAdding(false);
    }
  };

  const handleAddModel = async () => {
    if (!addModelModalBrand || !newModelName.trim()) {
      toast.error("Model adı gereklidir");
      return;
    }
    setIsAddingModel(true);
    try {
      await createModel(addModelModalBrand.id, newModelName.trim());
      toast.success(`${newModelName} modeli eklendi`);
      setNewModelName("");
      setAddModelModalBrand(null);
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
              <BrandTableRow
                key={brand.id}
                brand={brand}
                loadingId={loadingId}
                onToggleStatus={handleToggleStatus}
                onEdit={setEditingBrand}
                onAddModel={setAddModelModalBrand}
                onDelete={setDeleteId}
                onSelectModels={setSelectedBrandForModels}
              />
            ))}
          </tbody>
        </table>
      </div>

      {!showTableOnly && (
        <div className="p-6 border-t border-slate-100">
          <Button
            onClick={() => setAddBrandModalOpen(true)}
            className="w-full rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-500 font-bold hover:bg-white hover:border-blue-300 hover:text-blue-600 transition-all py-6"
          >
            <Plus size={18} className="mr-2" /> YENİ MARKA EKLE
          </Button>
        </div>
      )}

      <AddBrandModal
        isOpen={addBrandModalOpen}
        onClose={() => {
          setAddBrandModalOpen(false);
          setNewBrandName("");
        }}
        onAdd={handleAddBrand}
        name={newBrandName}
        setName={setNewBrandName}
        loading={isAdding}
      />
      <EditBrandModal
        brand={editingBrand}
        onClose={() => setEditingBrand(null)}
        onUpdate={handleUpdateBrand}
        onChangeName={(val) => editingBrand && setEditingBrand({ ...editingBrand, name: val })}
        loading={isAdding}
      />
      <DeleteBrandModal
        id={deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDeleteBrandConfirmed}
        loading={isDeleting}
      />
      <AddModelModal
        brand={addModelModalBrand}
        onClose={() => {
          setAddModelModalBrand(null);
          setNewModelName("");
        }}
        onAdd={handleAddModel}
        name={newModelName}
        setName={setNewModelName}
        loading={isAddingModel}
      />

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
    </>
  );
}
