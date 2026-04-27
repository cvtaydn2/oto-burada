"use client";

import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
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
    console.error("Global Error Caught:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center bg-slate-50 px-4 py-16 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
        <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500 shadow-sm border border-red-200 dark:border-red-800/30">
          <AlertTriangle className="size-10" />
        </div>

        <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
          Beklenmedik Bir Hata Oluştu
        </h1>

        <p className="mb-8 text-base text-slate-600 dark:text-slate-400">
          İşleminizi gerçekleştirirken sistemsel bir sorunla karşılaştık. Lütfen tekrar deneyin veya
          ana sayfaya dönün.
        </p>

        {error.digest && (
          <div className="mb-8 w-full rounded-lg bg-slate-200/50 px-4 py-3 text-center dark:bg-slate-800/50">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-500">
              Hata Takip Kodu
            </p>
            <code className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">
              {error.digest}
            </code>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400">
              Lütfen bu kodu destek ekibine iletin.
            </p>
          </div>
        )}

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          <Button
            onClick={() => {
              try {
                reset();
              } catch {
                window.location.reload();
              }
            }}
            size="lg"
            className="flex w-full items-center gap-2 sm:w-auto"
          >
            <RefreshCcw className="size-4" />
            Tekrar Dene
          </Button>

          <Button
            onClick={() => (window.location.href = "/")}
            variant="outline"
            size="lg"
            className="flex w-full items-center gap-2 sm:w-auto"
          >
            <Home className="size-4" />
            Ana Sayfaya Dön
          </Button>
        </div>
      </div>
    </div>
  );
}
