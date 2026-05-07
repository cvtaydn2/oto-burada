"use client";

import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/features/ui/components/button";

export function UserHeaderActions() {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch("/api/admin/users/export", {
        method: "GET",
        cache: "no-store",
      });

      if (!res.ok) {
        const errorText = await res.text().catch(() => "");
        throw new Error(errorText || "Export başarısız");
      }

      const contentType = res.headers.get("content-type") || "text/csv;charset=utf-8";
      const blob = await res.blob();
      const fileBlob = blob.type ? blob : new Blob([blob], { type: contentType });
      const url = URL.createObjectURL(fileBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kullanicilar-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Kullanıcı listesi indirildi.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export sırasında bir hata oluştu.");
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
