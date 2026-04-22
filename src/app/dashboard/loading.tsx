"use client";

import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full">
      <Loader2 className="size-8 text-primary animate-spin" />
      <p className="mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        Dashboard Hazırlanıyor
      </p>
    </div>
  );
}
