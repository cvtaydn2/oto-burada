"use client";

import { RefreshCcw } from "lucide-react";

import { Button } from "@/features/ui/components/button";

export default function ListingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-red-50 text-red-500">
        <RefreshCcw className="size-7" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-foreground">İlanlar yüklenemedi</h2>
      <p className="mb-6 max-w-md text-sm text-muted-foreground">
        {error.message || "Listeleme sayfası yüklenirken beklenmeyen bir sorun oluştu."}
      </p>
      <Button
        onClick={reset}
        className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground transition hover:bg-primary/90"
      >
        Tekrar Dene
      </Button>
    </div>
  );
}
