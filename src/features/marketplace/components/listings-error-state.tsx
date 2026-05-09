"use client";

import { RefreshCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ListingsErrorStateProps {
  error: unknown;
  refetch: () => Promise<unknown> | void;
}

export function ListingsErrorState({ error, refetch }: ListingsErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card px-4 py-16 sm:py-24"
    >
      <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-red-50 sm:size-16">
        <RefreshCcw size={28} className="text-red-500" />
      </div>
      <h3 className="mb-2 text-base font-bold tracking-tight text-foreground sm:text-lg">
        İlanlar yüklenirken hata oluştu
      </h3>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground sm:mb-8">
        {error instanceof Error ? error.message : "Bağlantı sırasında bir sorun oluştu."}
      </p>
      <Button
        onClick={() => {
          void refetch();
        }}
        className="flex h-10 items-center gap-2 rounded-xl bg-primary px-8 text-sm font-bold text-primary-foreground shadow-sm transition-all hover:opacity-90 sm:h-12 sm:px-10"
      >
        <RefreshCcw size={14} />
        Tekrar Dene
      </Button>
    </div>
  );
}
