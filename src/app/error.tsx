"use client";

import { AlertCircle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center bg-background">
      <div className="mb-6 flex size-24 items-center justify-center rounded-full bg-rose-50">
        <AlertCircle className="size-12 text-rose-500" />
      </div>
      <h1 className="mb-3 text-3xl font-bold text-foreground tracking-tight">
        Bir Şeyler Yanlış Gitti
      </h1>
      <p className="mb-8 max-w-md text-muted-foreground font-medium">
        Uygulama çalışırken beklenmedik bir hata oluştu. Sorunu çözmek için sayfayı yenilemeyi
        deneyebilirsiniz.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          onClick={() => reset()}
          className="rounded-xl px-8 h-12 font-bold flex items-center gap-2"
        >
          <RotateCcw size={18} />
          Tekrar Dene
        </Button>
        <Button
          variant="outline"
          onClick={() => (window.location.href = "/")}
          className="rounded-xl px-8 h-12 font-bold"
        >
          Ana Sayfaya Dön
        </Button>
      </div>
      {error.digest && (
        <p className="mt-12 text-[10px] font-mono text-muted-foreground/40">
          Hata Kodu: {error.digest}
        </p>
      )}
    </div>
  );
}
