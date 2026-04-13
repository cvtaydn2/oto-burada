"use client";

import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { toast } from "sonner";

export function UserHeaderActions() {
  const handleExport = () => {
    toast.success("Kullanıcı listesi CSV formatında hazırlanıyor...");
  };

  const handleAddUser = () => {
    toast.info("Yeni üye kayıt formu yakında eklenecek. Şimdilik sistem otomatik kayıtları desteklemektedir.");
  };

  return (
    <div className="flex items-center gap-3">
      <Button 
        variant="outline" 
        className="rounded-xl border-slate-200 text-slate-600 font-bold h-12 px-6 flex items-center gap-2"
        onClick={handleExport}
      >
        <Download size={18} />
        Dışa Aktar
      </Button>
      <Button 
        className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-black h-12 px-8 flex items-center gap-2"
        onClick={handleAddUser}
      >
        <Plus size={18} strokeWidth={3} />
        YENİ ÜYE EKLE
      </Button>
    </div>
  );
}
