"use client";

import { Printer } from "lucide-react";

export function ListingPrintAction() {
  const handlePrint = () => {
    window.print();
  };

  return (
    <button
      onClick={handlePrint}
      className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border bg-white text-sm font-bold text-foreground transition-all hover:bg-slate-50 print:hidden"
    >
      <Printer size={18} />
      Yazdır / PDF Olarak Kaydet
    </button>
  );
}
