"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";

export function UserHeaderActions() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/users/export", { method: "GET" });
      if (!res.ok) throw new Error("Export başarısız");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kullanicilar-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Kullanıcı listesi indirildi.");
    } catch {
      toast.error("Export sırasında bir hata oluştu.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        className="rounded-xl border-slate-200 text-slate-600 font-bold h-12 px-6 flex items-center gap-2"
        onClick={handleExport}
        disabled={isExporting}
      >
        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        {isExporting ? "Hazırlanıyor..." : "CSV İndir"}
      </Button>
    </div>
  );
}
