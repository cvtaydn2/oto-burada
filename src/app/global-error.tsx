"use client";

import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { captureClientException } from "@/lib/monitoring/posthog-client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureClientException(error, "global-error", { digest: error.digest });
  }, [error, error.digest]);

  return (
    <html lang="tr">
      <body className="min-h-screen bg-slate-50 font-sans antialiased dark:bg-slate-950">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
          <div className="mx-auto flex w-full max-w-md flex-col items-center text-center">
            <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-500 shadow-sm border border-red-200 dark:border-red-800/30">
              <AlertTriangle className="size-10" />
            </div>

            <h1 className="mb-3 text-2xl font-bold text-slate-900 dark:text-slate-100 sm:text-3xl">
              Kritik Bir Hata Oluştu
            </h1>

            <p className="mb-8 text-base text-slate-600 dark:text-slate-400">
              Sistem genelinde geçici bir sorun yaşanıyor. Lütfen sayfayı yenilemeyi deneyin veya
              ana sayfaya dönün.
            </p>

            {error.digest && (
              <div className="mb-8 rounded-lg bg-slate-200/50 px-4 py-2 text-xs font-mono text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                Hata Kodu: {error.digest}
              </div>
            )}

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
              <Button
                onClick={() => reset()}
                size="lg"
                className="flex w-full items-center gap-2 sm:w-auto"
              >
                <RefreshCcw className="size-4" />
                Yenile ve Tekrar Dene
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="flex w-full items-center gap-2 sm:w-auto"
              >
                <Link href="/">
                  <Home className="size-4" />
                  Ana Sayfaya Dön
                </Link>
              </Button>
            </div>

            <p className="mt-12 text-xs text-slate-500">
              Sorun devam ederse lütfen{" "}
              <Link href="/support" className="text-primary hover:underline">
                destek ekibiyle iletişime geçin
              </Link>
              .
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
