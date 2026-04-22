"use client";

import { Loader2 } from "lucide-react";

export default function PublicLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] w-full bg-background">
      <div className="relative flex items-center justify-center">
        <div className="absolute size-16 rounded-full border-4 border-primary/10 animate-ping" />
        <Loader2 className="size-8 text-primary animate-spin" />
      </div>
      <p className="mt-6 text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] animate-pulse">
        OtoBurada Yükleniyor...
      </p>
    </div>
  );
}
