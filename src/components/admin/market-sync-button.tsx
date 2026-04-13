"use client";

import { useState } from "react";
import { Zap, LoaderCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function MarketSyncButton() {
  const [isSyncing, setIsSyncing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const router = useRouter();

  const handleSync = async () => {
    setIsSyncing(true);
    setResult(null);
    try {
      const response = await fetch("/api/admin/market/sync", {
        method: "POST",
      });
      const data = await response.json();
      
      if (data.success) {
        setResult({ success: true, message: data.message });
        router.refresh();
      } else {
        setResult({ success: false, message: data.error || "Senkronizasyon başarısız." });
      }
    } catch {
      setResult({ success: false, message: "Bağlantı hatası oluştu." });
    } finally {
      setIsSyncing(false);
      // Clear message after 3 seconds
      setTimeout(() => setResult(null), 3000);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <Button 
        onClick={handleSync}
        disabled={isSyncing}
        variant="outline"
        className="rounded-xl border-blue-200 bg-blue-50/50 text-blue-700 hover:bg-blue-100 font-bold px-6 h-12 shadow-sm transition-all flex items-center gap-2 group"
      >
        {isSyncing ? (
          <LoaderCircle size={18} className="animate-spin" />
        ) : result?.success ? (
          <CheckCircle2 size={18} className="text-emerald-500" />
        ) : (
          <Zap size={18} className="group-hover:fill-blue-700 transition-all" />
        )}
        {isSyncing ? "Senkronize Ediliyor..." : "Pazar Verilerini Güncelle"}
      </Button>
      {result && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
          result.success ? "text-emerald-600 bg-emerald-50" : "text-rose-600 bg-rose-50"
        }`}>
          {result.message}
        </span>
      )}
    </div>
  );
}
