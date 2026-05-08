"use client";

import { Printer } from "lucide-react";
import { toast } from "sonner";

import { MarketSyncButton } from "@/features/admin-moderation/components/market-sync-button";
import { Button } from "@/features/ui/components/button";

export function AdminHeaderActions() {
  const handlePrint = () => {
    window.print();
    toast.success("Rapor yazdırma görünümü hazırlandı.");
  };

  return (
    <div className="flex items-center gap-3">
      <MarketSyncButton />
      <Button
        variant="default"
        className="rounded-xl bg-slate-900 border-none hover:bg-black text-white shadow-sm shadow-slate-200 font-bold px-6 h-12 transition-all hover:-translate-y-0.5 flex items-center gap-2"
        onClick={handlePrint}
      >
        <Printer size={18} />
        Rapor Çıktısı Al
      </Button>
    </div>
  );
}
