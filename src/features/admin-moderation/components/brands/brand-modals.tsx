import { AlertTriangle, Car, Edit, Loader2, Plus } from "lucide-react";

import { Button } from "@/features/ui/components/button";
import { Input } from "@/features/ui/components/input";
import { Label } from "@/features/ui/components/label";

interface Brand {
  id: string;
  image_url?: string | null;
  is_active: boolean;
  name: string;
  slug: string;
}

interface AddBrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: () => void;
  name: string;
  setName: (name: string) => void;
  loading: boolean;
}

export function AddBrandModal({
  isOpen,
  onClose,
  onAdd,
  name,
  setName,
  loading,
}: AddBrandModalProps) {
  if (!isOpen) return null;
  return (
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Tesla"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-slate-200 font-bold"
            onClick={onClose}
          >
            İptal
          </Button>
          <Button
            className="flex-1 rounded-xl bg-blue-600 font-bold hover:bg-blue-700 text-white"
            onClick={onAdd}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface EditBrandModalProps {
  brand: Brand | null;
  onClose: () => void;
  onUpdate: () => void;
  onChangeName: (name: string) => void;
  loading: boolean;
}

export function EditBrandModal({
  brand,
  onClose,
  onUpdate,
  onChangeName,
  loading,
}: EditBrandModalProps) {
  if (!brand) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Edit size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Markayı Düzenle</h3>
            <p className="text-sm text-slate-500">{brand.name} bilgilerini güncelleyin</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Marka Adı
            </Label>
            <Input
              value={brand.name}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="Marka adı"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-slate-200 font-bold"
            onClick={onClose}
          >
            İptal
          </Button>
          <Button
            className="flex-1 rounded-xl bg-blue-600 font-bold hover:bg-blue-700 text-white"
            onClick={onUpdate}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Güncelle"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface DeleteBrandModalProps {
  id: string | null;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

export function DeleteBrandModal({ id, onClose, onConfirm, loading }: DeleteBrandModalProps) {
  if (!id) return null;
  return (
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
            onClick={onClose}
          >
            İptal
          </Button>
          <Button
            className="flex-1 rounded-xl bg-rose-600 font-bold hover:bg-rose-700 text-white"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "SİL"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface AddModelModalProps {
  brand: Brand | null;
  onClose: () => void;
  onAdd: () => void;
  name: string;
  setName: (name: string) => void;
  loading: boolean;
}

export function AddModelModal({
  brand,
  onClose,
  onAdd,
  name,
  setName,
  loading,
}: AddModelModalProps) {
  if (!brand) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
            <Car size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Yeni Model Ekle</h3>
            <p className="text-sm text-slate-500">{brand.name} için yeni model</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Model Adı
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Örn: Model S"
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            className="flex-1 rounded-xl border-slate-200 font-bold"
            onClick={onClose}
          >
            İptal
          </Button>
          <Button
            className="flex-1 rounded-xl bg-blue-600 font-bold hover:bg-blue-700 text-white"
            onClick={onAdd}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : "Ekle"}
          </Button>
        </div>
      </div>
    </div>
  );
}
